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
 * Audit 2026-05-06 §17 Phase 4 Aufgabe 8-10:
 *
 * Echter HTTP-Client gegen die Mapbox Directions API. Beachtet:
 *
 * - Wahrheits-Garantie: `precise=true` nur bei erfolgreichem HTTP 200 mit
 *   plausibler Distanz im Response. Jeder Fehler/Timeout/Rate-Limit fuehrt
 *   zu `precise=false` mit `reason` — niemals werfen.
 * - Fuer `route_via_station` werden zwei Anfragen verglichen:
 *     directKm  = origin → destination
 *     viaKm     = origin → station → destination
 *     extraKm   = max(0, viaKm - directKm)
 * - Fuer `point_to_station` reicht eine Anfrage origin → station.
 * - Cache via Redis-`CacheService` (Audit §17 Aufgabe 9). TTL 30 min,
 *   Koordinaten auf 5 Dezimalstellen gerundet — Strassen aendern sich nicht
 *   im Sekundentakt, Preise schon. Mapbox-Anfragen kosten Geld + haben
 *   Rate-Limits — Cache reduziert beides drastisch.
 * - Mapbox-Koordinaten-Reihenfolge ist `lng,lat` (nicht `lat,lng`).
 * - Default-Timeout: 4 Sekunden — schneller als der typische Backend-
 *   Recommendation-Loop, damit ein Fallback-Pfad noch in der Antwort-Zeit liegt.
 */
@Injectable()
export class MapboxRoutingDistanceService implements RoutingDistanceService {
  private readonly logger = new Logger(MapboxRoutingDistanceService.name);
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly cacheTtlSeconds: number;

  constructor(
    @Optional() private readonly cache?: CacheService,
    @Optional() private readonly metrics?: RoutingMetricsService,
  ) {
    this.accessToken = process.env.MAPBOX_ACCESS_TOKEN ?? '';
    this.baseUrl =
      process.env.MAPBOX_DIRECTIONS_BASE_URL ??
      'https://api.mapbox.com/directions/v5';
    this.timeoutMs = Number(process.env.MAPBOX_TIMEOUT_MS ?? 4000);
    this.cacheTtlSeconds = Number(process.env.MAPBOX_CACHE_TTL_S ?? 1800);
  }

  isPreciseRoutingAvailable(): boolean {
    // Audit 2026-05-06 §13 Aufgabe 5: Platzhalter-Tokens duerfen nicht als
    // gueltig gelten — sonst „funktioniert" der Service scheinbar mit
    // `MAPBOX_ACCESS_TOKEN=replace-me` und macht HTTP-Calls, die garantiert
    // 401 liefern. Stattdessen Placeholder erkennen und sauber `false`
    // zurueckgeben.
    return isMeaningfulMapboxToken(this.accessToken);
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
      // Audit 2026-05-06 §10 Aufgabe 4: NIE die volle Mapbox-URL mit
      // access_token loggen. Defensive: Token-Pattern aus dem Error-Text
      // strippen, falls fetch die URL ins Error mitgibt.
      const safeMessage = redactMapboxToken((err as Error).message ?? String(err));
      this.logger.warn(`Mapbox-Routing-Fallback (${reason}): ${safeMessage}`);
      return { precise: false, reason };
    }
  }

  // ---- Modes --------------------------------------------------------------

  private async callPointToStation(input: RoutingDistanceInput): Promise<RoutingDistanceResult> {
    const km = await this.distanceKm([input.origin, input.station], 'point_to_station');
    if (km == null) return { precise: false, reason: 'provider_error' };
    return {
      precise: true,
      extraDistanceKm: round1(km),
      provider: 'mapbox',
    };
  }

  private async callRouteViaStation(input: RoutingDistanceInput): Promise<RoutingDistanceResult> {
    const dest = input.destination!;
    const [directKm, viaKm] = await Promise.all([
      this.distanceKm([input.origin, dest], 'route_direct'),
      this.distanceKm([input.origin, input.station, dest], 'route_via'),
    ]);
    if (directKm == null || viaKm == null) {
      return { precise: false, reason: 'provider_error' };
    }
    const extraKm = Math.max(0, viaKm - directKm);
    return {
      precise: true,
      extraDistanceKm: round1(extraKm),
      provider: 'mapbox',
    };
  }

  // ---- HTTP + Cache -------------------------------------------------------

  private async distanceKm(
    points: Array<{ lat: number; lng: number }>,
    routeKind: 'point_to_station' | 'route_direct' | 'route_via',
  ): Promise<number | null> {
    const cacheKey = this.cacheKeyFor(points, routeKind);
    const cached = await this.cache?.get<number>(cacheKey);
    if (typeof cached === 'number' && Number.isFinite(cached)) {
      this.metrics?.recordCacheHit();
      return cached;
    }
    this.metrics?.recordCacheMiss();
    this.metrics?.recordRequest();

    const url = this.buildUrl(points);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let resp: Response;
    try {
      resp = await fetch(url, { signal: controller.signal });
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

    const body = (await resp.json()) as MapboxDirectionsResponse;
    const meters = body?.routes?.[0]?.distance;
    if (typeof meters !== 'number' || !Number.isFinite(meters)) {
      return null;
    }
    const km = meters / 1000;
    await this.cache?.set(cacheKey, km, this.cacheTtlSeconds);
    return km;
  }

  private buildUrl(points: Array<{ lat: number; lng: number }>): string {
    const path = points
      .map((p) => `${roundCoord(p.lng)},${roundCoord(p.lat)}`)
      .join(';');
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/mapbox/driving/${path}`);
    url.searchParams.set('overview', 'false');
    url.searchParams.set('access_token', this.accessToken);
    return url.toString();
  }

  /**
   * Audit 2026-05-06 §13 Aufgabe 6: Versionierter, modus-bewusster Cache-Key.
   * Format: `routing:mapbox:v1:driving:<routeKind>:<lat,lng|lat,lng|...>`
   *
   * Das `v1`-Praefix erlaubt zukuenftige Cache-Schema-Aenderungen ohne
   * stale-Hits. Der `routeKind` ist Teil des Schluessels, weil
   * `point_to_station(A,B)` semantisch eine andere Antwort ist als
   * `route_direct(A,B)`, auch wenn die Punkte identisch sind.
   */
  private cacheKeyFor(
    points: Array<{ lat: number; lng: number }>,
    routeKind: 'point_to_station' | 'route_direct' | 'route_via',
  ): string {
    const segs = points
      .map((p) => `${roundCoord(p.lat)},${roundCoord(p.lng)}`)
      .join('|');
    return `routing:mapbox:v1:driving:${routeKind}:${segs}`;
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

interface MapboxDirectionsResponse {
  routes?: Array<{ distance: number }>;
}

class RoutingError extends Error {
  constructor(public readonly kind: 'rate_limited' | 'server_error' | string) {
    super(`Mapbox routing failed: ${kind}`);
  }
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function roundCoord(v: number): number {
  return Math.round(v * 1e5) / 1e5; // 5 Dezimalstellen ≈ 1.1 m
}

/**
 * Audit 2026-05-06 §10 Aufgabe 4: ersetzt `access_token=...` in beliebigen
 * Strings durch `access_token=[REDACTED]`. Schuetzt Logs vor versehentlichem
 * Token-Leak, falls eine fetch-Implementierung die volle Request-URL ins
 * Error wirft.
 */
export function redactMapboxToken(text: string): string {
  return text.replace(/access_token=[^&\s"'`)]+/gi, 'access_token=[REDACTED]');
}

/**
 * Audit 2026-05-06 §13 Aufgabe 5: prueft, ob `MAPBOX_ACCESS_TOKEN` ein
 * realistischer Wert ist und kein Default-/Platzhalter-String aus den
 * `.env.example`-Vorlagen oder sonstigen Hinweis-Texten.
 *
 * Ein echter Mapbox-Token ist ein langer Base64-aehnlicher String mit
 * Praefix `pk.` (public) oder `sk.` (secret) — Laenge typischerweise > 60.
 * Hier nehmen wir konservativ >= 20 als Mindestlaenge.
 */
export function isMeaningfulMapboxToken(value: string | undefined): boolean {
  if (value == null) return false;
  const v = value.trim().toLowerCase();
  if (v.length < 20) return false;
  const placeholders = [
    'replace-me',
    'replace-with',
    'changeme',
    'change-me',
    'placeholder',
    'dummy',
    'example',
    'todo',
    'please-set',
    'your-mapbox-token',
    'your_mapbox_token',
  ];
  return !placeholders.some((p) => v.includes(p));
}
