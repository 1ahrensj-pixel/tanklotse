import { Injectable, Logger, Optional } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';
import { RoutingDistanceService } from './routing-distance.service';
import { RoutingMetricsService } from './routing-metrics.service';
import {
  RoutingDistanceInput,
  RoutingDistanceResult,
  RoutingNonPreciseReason,
} from './routing.types';

/**
 * Echter HTTP-Client gegen die Google Routes API (computeRoutes v2).
 *
 * Gleiches Vertragsmodell wie `MapboxRoutingDistanceService`:
 *
 * - Wahrheits-Garantie: `precise=true` nur bei erfolgreichem HTTP 200 mit
 *   plausibler Distanz im Response. Jeder Fehler/Timeout/Rate-Limit fuehrt
 *   zu `precise=false` mit `reason` — niemals werfen.
 * - `route_via_station` vergleicht zwei Anfragen:
 *     directKm = origin → destination
 *     viaKm    = origin → station → destination (Station als `intermediates`)
 *     extraKm  = max(0, viaKm - directKm)
 * - `point_to_station` ist eine Anfrage origin → station.
 * - Cache via Redis-`CacheService`, TTL 30 min, Koordinaten auf 5
 *   Dezimalstellen gerundet — Strassen aendern sich nicht im Sekundentakt.
 * - Kostenkontrolle: FieldMask `routes.distanceMeters` haelt den Call im
 *   guenstigsten Abrechnungs-Tier; `TRAFFIC_UNAWARE` ist deterministisch und
 *   am billigsten (Distanz haengt nicht vom Verkehr ab).
 * - Key kommt aus `GOOGLE_ROUTING_API_KEY` (Fallback `GOOGLE_MAPS_API_KEY`).
 *   Der Key wandert in den `X-Goog-Api-Key`-Header, nie in die URL — und wird
 *   defensiv aus Fehlermeldungen redigiert.
 */
@Injectable()
export class GoogleRoutingDistanceService implements RoutingDistanceService {
  private readonly logger = new Logger(GoogleRoutingDistanceService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly cacheTtlSeconds: number;

  constructor(
    @Optional() private readonly cache?: CacheService,
    @Optional() private readonly metrics?: RoutingMetricsService,
  ) {
    this.apiKey =
      process.env.GOOGLE_ROUTING_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? '';
    this.baseUrl =
      process.env.GOOGLE_ROUTES_BASE_URL ?? 'https://routes.googleapis.com';
    this.timeoutMs = Number(process.env.GOOGLE_ROUTING_TIMEOUT_MS ?? 4000);
    this.cacheTtlSeconds = Number(process.env.GOOGLE_ROUTING_CACHE_TTL_S ?? 1800);
  }

  isPreciseRoutingAvailable(): boolean {
    return isMeaningfulGoogleKey(this.apiKey);
  }

  async calculateExtraDistanceKm(input: RoutingDistanceInput): Promise<RoutingDistanceResult> {
    if (!this.isPreciseRoutingAvailable()) {
      return { precise: false, reason: 'invalid_input' };
    }
    if (input.mode === 'route_via_station' && !input.destination) {
      return { precise: false, reason: 'invalid_input' };
    }

    try {
      if (input.mode === 'point_to_station') {
        return await this.callPointToStation(input);
      }
      return await this.callRouteViaStation(input);
    } catch (err) {
      // Sicherheitsnetz: kein Throw nach aussen, immer kontrolliertes Fallback.
      const reason = this.classifyError(err);
      if (reason === 'provider_timeout') this.metrics?.recordTimeout();
      else if (reason === 'provider_rate_limited') this.metrics?.recordRateLimit();
      else this.metrics?.recordProviderError();
      const safeMessage = redactGoogleKey((err as Error).message ?? String(err));
      this.logger.warn(`Google-Routing-Fallback (${reason}): ${safeMessage}`);
      return { precise: false, reason };
    }
  }

  // ---- Modes --------------------------------------------------------------

  private async callPointToStation(input: RoutingDistanceInput): Promise<RoutingDistanceResult> {
    const km = await this.distanceKm(input.origin, input.station, [], 'point_to_station');
    if (km == null) return { precise: false, reason: 'provider_error' };
    return {
      precise: true,
      extraDistanceKm: round1(km),
      provider: 'google',
    };
  }

  private async callRouteViaStation(input: RoutingDistanceInput): Promise<RoutingDistanceResult> {
    const dest = input.destination!;
    const [directKm, viaKm] = await Promise.all([
      this.distanceKm(input.origin, dest, [], 'route_direct'),
      this.distanceKm(input.origin, dest, [input.station], 'route_via'),
    ]);
    if (directKm == null || viaKm == null) {
      return { precise: false, reason: 'provider_error' };
    }
    const extraKm = Math.max(0, viaKm - directKm);
    return {
      precise: true,
      extraDistanceKm: round1(extraKm),
      provider: 'google',
    };
  }

  // ---- HTTP + Cache -------------------------------------------------------

  private async distanceKm(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    intermediates: Array<{ lat: number; lng: number }>,
    routeKind: 'point_to_station' | 'route_direct' | 'route_via',
  ): Promise<number | null> {
    const cacheKey = this.cacheKeyFor([origin, ...intermediates, destination], routeKind);
    const cached = await this.cache?.get<number>(cacheKey);
    if (typeof cached === 'number' && Number.isFinite(cached)) {
      this.metrics?.recordCacheHit();
      return cached;
    }
    this.metrics?.recordCacheMiss();
    this.metrics?.recordRequest();

    const body = JSON.stringify({
      origin: toWaypoint(origin),
      destination: toWaypoint(destination),
      ...(intermediates.length > 0
        ? { intermediates: intermediates.map(toWaypoint) }
        : {}),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
    });

    const url = `${this.baseUrl.replace(/\/$/, '')}/directions/v2:computeRoutes`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          // Nur Distanz anfragen → guenstigster Abrechnungs-Tier.
          'X-Goog-FieldMask': 'routes.distanceMeters',
        },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (resp.status === 429) {
      throw new RoutingError('rate_limited');
    }
    if (resp.status >= 500) {
      throw new RoutingError('server_error');
    }
    if (!resp.ok) {
      throw new RoutingError('http_' + String(resp.status));
    }

    const data = (await resp.json()) as GoogleRoutesResponse;
    const meters = data?.routes?.[0]?.distanceMeters;
    if (typeof meters !== 'number' || !Number.isFinite(meters)) {
      return null;
    }
    const km = meters / 1000;
    await this.cache?.set(cacheKey, km, this.cacheTtlSeconds);
    return km;
  }

  /**
   * Versionierter, modus-bewusster Cache-Key (Schema wie Mapbox-Service):
   * `routing:google:v1:drive:<routeKind>:<lat,lng|lat,lng|...>`
   */
  private cacheKeyFor(
    points: Array<{ lat: number; lng: number }>,
    routeKind: 'point_to_station' | 'route_direct' | 'route_via',
  ): string {
    const segs = points
      .map((p) => `${roundCoord(p.lat)},${roundCoord(p.lng)}`)
      .join('|');
    return `routing:google:v1:drive:${routeKind}:${segs}`;
  }

  private classifyError(err: unknown): RoutingNonPreciseReason {
    if (err instanceof RoutingError) {
      if (err.kind === 'rate_limited') return 'provider_rate_limited';
      if (err.kind === 'server_error') return 'provider_unavailable';
      return 'provider_error';
    }
    if ((err as { name?: string })?.name === 'AbortError') {
      return 'provider_timeout';
    }
    return 'provider_error';
  }
}

interface GoogleRoutesResponse {
  routes?: Array<{ distanceMeters: number }>;
}

class RoutingError extends Error {
  constructor(public readonly kind: 'rate_limited' | 'server_error' | string) {
    super(`Google routing failed: ${kind}`);
  }
}

function toWaypoint(p: { lat: number; lng: number }) {
  return {
    location: { latLng: { latitude: roundCoord(p.lat), longitude: roundCoord(p.lng) } },
  };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function roundCoord(v: number): number {
  return Math.round(v * 1e5) / 1e5; // 5 Dezimalstellen ≈ 1.1 m
}

/**
 * Ersetzt Google-API-Key-Muster (`AIza...`) in beliebigen Strings durch
 * `[REDACTED]`. Der Key steht zwar im Header (nicht in der URL), aber falls
 * eine fetch-Implementierung Header in Fehlertexte mitgibt, bleibt das Log
 * sauber.
 */
export function redactGoogleKey(text: string): string {
  return text.replace(/AIza[A-Za-z0-9_-]{10,}/g, '[REDACTED]');
}

/**
 * Prueft, ob der Key ein realistischer Google-API-Key ist und kein
 * Platzhalter aus `.env.example`-Vorlagen. Echte Keys beginnen mit `AIza`
 * und sind 39 Zeichen lang — wir pruefen konservativ Praefix + Mindestlaenge.
 */
export function isMeaningfulGoogleKey(value: string | undefined): boolean {
  if (value == null) return false;
  const v = value.trim();
  if (v.length < 30) return false;
  if (!v.startsWith('AIza')) return false;
  const lower = v.toLowerCase();
  const placeholders = [
    'replace',
    'changeme',
    'change-me',
    'placeholder',
    'dummy',
    'example',
    'todo',
    'your_google',
    'your-google',
  ];
  return !placeholders.some((p) => lower.includes(p));
}
