import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';

import { FUEL_PROVIDER, FuelPriceProvider, ProviderStation } from '../providers/fuel-price.interface';
import { NoopRoutingDistanceService } from '../routing/noop-routing-distance.service';
import {
  ROUTING_DISTANCE_SERVICE,
  RoutingDistanceService,
} from '../routing/routing-distance.service';
import {
  DistanceEstimateMode,
  RoutingDistanceMode,
} from '../routing/routing.types';
import { SavingsService, SavingCalculationResult } from '../savings/savings.service';
import { DetourService } from './detour.service';

// Re-export fuer existing Konsumenten/Tests, die DistanceEstimateMode aus
// `recommendations.service.ts` importieren. Single-Source-of-Truth ist
// `backend/src/routing/routing.types.ts`.
export { DistanceEstimateMode };

export type RecommendationBasis =
  | 'NEAREST_OPEN'
  | 'AVG_IN_AREA'
  | 'USER_REFERENCE_STATION';

export interface BestStationInput {
  lat: number;
  lng: number;
  radius: number;
  fuelType: 'E5' | 'E10' | 'DIESEL';
  consumptionLPer100Km: number;
  tankLiters: number;
  hourlyValueEur?: number;
  /** Vergleichsmodus. Default: AVG_IN_AREA. */
  basis?: RecommendationBasis;
  /** Bei basis=USER_REFERENCE_STATION: ID der Referenz-Tankstelle. */
  referenceStationId?: string;
}

export interface RouteInput {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  fuelType: 'E5' | 'E10' | 'DIESEL';
  consumptionLPer100Km: number;
  tankLiters: number;
  maxOffsetKm?: number;
}

export interface RealSavingRecommendation {
  stationId: string;
  stationName: string;
  brand: string;
  fuelType: 'E5' | 'E10' | 'DIESEL';
  targetPrice: number;
  referencePrice: number;
  priceDeltaPerLiter: number;
  tankLiters: number;
  consumptionLitersPer100Km: number;
  extraDistanceKm: number;
  grossSavingEuro: number;
  detourCostEuro: number;
  timeCostEuro: number;
  realSavingEuro: number;
  breakEvenLiters: number | null;
  recommendation: SavingCalculationResult['recommendation'];
  explanation: string;
  /**
   * Audit 2026-05-06 §17 Phase 2: pro Empfehlung. Ein Ergebnis kann eine
   * Mischung aus precise (Routing-Call erfolgreich) und haversine
   * (Fallback) enthalten — Mobile-UI zeigt das pro Karte korrekt.
   */
  distanceEstimateMode: DistanceEstimateMode;
  /**
   * Audit 2026-05-06 §13 Aufgabe 4: Welche Strecken-Semantik liegt der
   * Empfehlung zugrunde?
   *  - `point_to_station`: Strecke vom Suchpunkt zur Tankstelle.
   *    Bei `precise_routing` ist das die echte Fahrstrecke — aber kein
   *    vollstaendiger Umweg, weil ohne Reiseziel.
   *  - `route_via_station`: Zusatzumweg auf einer Route Start→Ziel.
   *    Bei `precise_routing` ist das der echte zusaetzliche Fahrweg.
   *
   * Mobile entscheidet anhand dieser Kombination, welcher Label-Text
   * angezeigt wird (z.B. „Exakte Strecke zur Tankstelle" vs. „Exakter
   * Zusatzumweg" vs. „Geschaetzte Entfernung").
   */
  routingMode: RoutingDistanceMode;
  /** Pro-Empfehlung-Disclaimer. `null` nur bei `precise_routing`. */
  disclaimer: string | null;
  // Stations-Detail fuer Mobile-UI
  station: ProviderStation;
}

export interface BestStationResult {
  attribution: string;
  basis: RecommendationBasis;
  referencePrice: number | null;
  referenceStationId: string | null;
  recommendations: RealSavingRecommendation[];
  /**
   * Wie wurde `extraDistanceKm` in den Empfehlungen ermittelt? Mobile-/Web-
   * UIs muessen das verwenden, um „geschaetzter Umweg" oder „Umweg" anzuzeigen.
   * Audit 2026-05-06 §14 Aufgabe 6.
   */
  distanceEstimateMode: DistanceEstimateMode;
  /**
   * Menschenlesbarer Hinweis-Text, wenn die Werte naehrungsweise berechnet
   * wurden. Mobile-Apps koennen das direkt rendern.
   */
  disclaimer: string | null;
}

@Injectable()
export class RecommendationsService {
  /**
   * Audit 2026-05-06 §15 P1: einzige Quelle der Wahrheit, ob diese
   * Empfehlung wirklich routing-praezise berechnet wurde. Default
   * ist `Noop` — gibt immer `precise=false` zurueck.
   */
  private readonly routingDistance: RoutingDistanceService;

  constructor(
    @Inject(FUEL_PROVIDER) private readonly provider: FuelPriceProvider,
    private readonly detour: DetourService,
    private readonly savings: SavingsService,
    @Optional()
    @Inject(ROUTING_DISTANCE_SERVICE)
    routingDistance?: RoutingDistanceService,
  ) {
    this.routingDistance = routingDistance ?? new NoopRoutingDistanceService();
  }

  async bestStation(input: BestStationInput): Promise<BestStationResult> {
    const stations = await this.provider.search({
      lat: input.lat,
      lng: input.lng,
      radius: input.radius,
      fuelType: input.fuelType,
      sort: 'price',
    });
    // Spotsuche: jede Empfehlung wird per `point_to_station` geroutet
    // (Routing-Provider: origin → station). Fallback: Haversine.
    return this.rankStations(stations, input, {
      requestedMode: 'haversine_approximation',
      routingMode: 'point_to_station',
      origin: { lat: input.lat, lng: input.lng },
    });
  }

  async stationsAlongRoute(input: RouteInput): Promise<BestStationResult> {
    const offset = input.maxOffsetKm ?? 2;
    const samplePoints = this.sampleRoute(input.start, input.end, 5);
    const seen = new Map<string, ProviderStation>();
    for (const point of samplePoints) {
      const list = await this.provider.search({
        lat: point.lat,
        lng: point.lng,
        radius: offset + 1,
        fuelType: input.fuelType,
        sort: 'price',
      });
      for (const s of list) {
        // Wenn dieselbe Station an mehreren Sample-Punkten gefunden wird,
        // behalten wir die Variante mit der kleinsten distanceKm.
        const existing = seen.get(s.id);
        const existingDist = existing?.distanceKm ?? Number.POSITIVE_INFINITY;
        const currentDist = s.distanceKm ?? Number.POSITIVE_INFINITY;
        if (!existing || currentDist < existingDist) {
          seen.set(s.id, s);
        }
      }
    }
    // Saved-Routes-Pfad: jede Empfehlung wird per `route_via_station`
    // geroutet (origin → station → destination minus origin → destination).
    // Fallback: Sample-basierte distanceKm vom Provider.
    return this.rankStations(
      [...seen.values()],
      {
        lat: input.start.lat,
        lng: input.start.lng,
        radius: offset + 1,
        fuelType: input.fuelType,
        consumptionLPer100Km: input.consumptionLPer100Km,
        tankLiters: input.tankLiters,
        basis: 'AVG_IN_AREA',
      },
      {
        requestedMode: 'route_sampling',
        routingMode: 'route_via_station',
        origin: input.start,
        destination: input.end,
      },
    );
  }

  /**
   * Pro-Empfehlung-Disclaimer. `null` nur bei `precise_routing`.
   * Audit §17 Phase 2 Aufgabe 4+5.
   */
  private buildDisclaimer(mode: DistanceEstimateMode): string | null {
    if (mode === 'precise_routing') return null;
    if (mode === 'route_sampling') {
      return (
        'Hinweis: Die angezeigte Entfernung ist eine Schaetzung basierend auf ' +
        'Stichprobenpunkten entlang der Route. Fuer exakte Fahrwege bitte einen ' +
        'Routing-Provider (Mapbox/GraphHopper) konfigurieren.'
      );
    }
    if (mode === 'mixed') {
      return (
        'Hinweis: Einige Empfehlungen wurden mit echter Route berechnet, andere ' +
        'sind eine Schaetzung — Details an jeder einzelnen Empfehlung.'
      );
    }
    return (
      'Hinweis: Die angezeigte Entfernung ist eine Luftlinien-Schaetzung. ' +
      'Realer Fahrweg kann groesser sein. Fuer exakte Fahrwege bitte einen ' +
      'Routing-Provider (Mapbox/GraphHopper) konfigurieren.'
    );
  }

  /**
   * Audit §17 Phase 2 Aufgabe 5: Summary aus den per-Empfehlung-Modes.
   * - alle gleich → der gemeinsame Mode
   * - gemischt → 'mixed'
   * - leer → der angeforderte Fallback-Mode
   */
  private summarizeMode(
    modes: DistanceEstimateMode[],
    fallback: DistanceEstimateMode,
  ): DistanceEstimateMode {
    if (modes.length === 0) return fallback;
    const first = modes[0];
    return modes.every((m) => m === first) ? first : 'mixed';
  }

  private async rankStations(
    stations: ProviderStation[],
    input: BestStationInput,
    ctx: {
      requestedMode: DistanceEstimateMode;
      routingMode: RoutingDistanceMode;
      origin: { lat: number; lng: number };
      destination?: { lat: number; lng: number };
    },
  ): Promise<BestStationResult> {
    const fuelKey = input.fuelType.toLowerCase() as 'e5' | 'e10' | 'diesel';
    const candidates = stations
      .map((s) => ({
        station: s,
        price: s.prices[fuelKey],
        distance: s.distanceKm ?? haversineKm(input.lat, input.lng, s.lat, s.lng),
      }))
      .filter((c) => c.price != null && c.station.isOpen) as Array<{
        station: ProviderStation;
        price: number;
        distance: number;
      }>;

    const basis: RecommendationBasis = input.basis ?? 'AVG_IN_AREA';

    if (candidates.length === 0) {
      const summaryMode = this.summarizeMode([], ctx.requestedMode);
      return {
        attribution: this.provider.attribution,
        basis,
        referencePrice: null,
        referenceStationId: null,
        recommendations: [],
        distanceEstimateMode: summaryMode,
        disclaimer: this.buildDisclaimer(summaryMode),
      };
    }

    let referencePrice: number;
    let referenceStationId: string | null = null;

    switch (basis) {
      case 'NEAREST_OPEN': {
        const sortedByDist = [...candidates].sort((a, b) => a.distance - b.distance);
        referencePrice = sortedByDist[0].price;
        referenceStationId = sortedByDist[0].station.id;
        break;
      }
      case 'USER_REFERENCE_STATION': {
        const ref = candidates.find((c) => c.station.id === input.referenceStationId);
        if (!ref) {
          throw new NotFoundException(
            `Referenz-Tankstelle ${input.referenceStationId} nicht im Suchgebiet/geoeffnet.`,
          );
        }
        referencePrice = ref.price;
        referenceStationId = ref.station.id;
        break;
      }
      case 'AVG_IN_AREA':
      default: {
        referencePrice = candidates.reduce((sum, c) => sum + c.price, 0) / candidates.length;
        break;
      }
    }

    // Audit §13 Aufgabe 2 + 3: Mapbox-Calls kosten Geld + haben Rate-Limits.
    //  1. Pre-Sort: jede Station bekommt grobe `realSavingEuro` mit der
    //     approximativen Distanz. Damit landen die teuersten Tankstellen
    //     unten.
    //  2. Top-N: nur die ersten `ROUTING_MAX_CANDIDATES` (Default 10) werden
    //     geroutet. Restliche Kandidaten behalten den approximativen Wert.
    //  3. Concurrency: hoechstens `ROUTING_CONCURRENCY` (Default 4) parallele
    //     Mapbox-Calls.
    const maxCandidates = parsePositiveInt(process.env.ROUTING_MAX_CANDIDATES, 10);
    const concurrency = parsePositiveInt(process.env.ROUTING_CONCURRENCY, 4);

    type Cand = (typeof candidates)[number];
    type Scored = { c: Cand; preliminaryRealSaving: number };

    // Pre-Sort mit approximativen Werten, damit die wahrscheinlich besten
    // Kandidaten die wenigen Routing-Slots bekommen.
    const scored: Scored[] = candidates.map((c) => {
      const r = this.savings.calculate({
        referencePrice,
        targetPrice: c.price,
        extraDistanceKm: c.distance,
        consumptionLPer100Km: input.consumptionLPer100Km,
        tankLiters: input.tankLiters,
        additionalMinutes: input.hourlyValueEur ? estimateMinutes(c.distance) : undefined,
        hourlyValueEur: input.hourlyValueEur,
        dataConfidence: c.station.isOpen ? 'high' : 'low',
      });
      return { c, preliminaryRealSaving: r.realSavingEuro };
    });
    scored.sort((a, b) => b.preliminaryRealSaving - a.preliminaryRealSaving);

    const willRoute = this.routingDistance.isPreciseRoutingAvailable();
    const indexedRouted = new Set<number>();
    if (willRoute) {
      for (let i = 0; i < Math.min(maxCandidates, scored.length); i++) {
        indexedRouted.add(i);
      }
    }

    const ranked: RealSavingRecommendation[] = await mapWithConcurrency(
      scored,
      concurrency,
      async ({ c }, idx) => {
        const shouldRoute = indexedRouted.has(idx);
        const routeResult = shouldRoute
          ? await this.routingDistance.calculateExtraDistanceKm({
              mode: ctx.routingMode,
              origin: ctx.origin,
              station: { lat: c.station.lat, lng: c.station.lng },
              destination: ctx.destination,
            })
          : { precise: false as const };

        const isPrecise =
          routeResult.precise && typeof routeResult.extraDistanceKm === 'number';
        const extraDistanceKm = isPrecise ? routeResult.extraDistanceKm! : c.distance;
        const recoMode: DistanceEstimateMode = isPrecise
          ? 'precise_routing'
          : ctx.requestedMode;

        const result = this.savings.calculate({
          referencePrice,
          targetPrice: c.price,
          extraDistanceKm,
          consumptionLPer100Km: input.consumptionLPer100Km,
          tankLiters: input.tankLiters,
          additionalMinutes: input.hourlyValueEur ? estimateMinutes(extraDistanceKm) : undefined,
          hourlyValueEur: input.hourlyValueEur,
          dataConfidence: c.station.isOpen ? 'high' : 'low',
        });
        return {
          stationId: c.station.id,
          stationName: c.station.name,
          brand: c.station.brand,
          fuelType: input.fuelType,
          targetPrice: c.price,
          referencePrice,
          priceDeltaPerLiter: result.priceDeltaPerLiter,
          tankLiters: input.tankLiters,
          consumptionLitersPer100Km: input.consumptionLPer100Km,
          extraDistanceKm,
          grossSavingEuro: result.grossSavingEuro,
          detourCostEuro: result.detourCostEuro,
          timeCostEuro: result.timeCostEuro,
          realSavingEuro: result.realSavingEuro,
          breakEvenLiters: result.breakEvenLiters,
          recommendation: result.recommendation,
          explanation: result.explanation,
          distanceEstimateMode: recoMode,
          routingMode: ctx.routingMode,
          disclaimer: this.buildDisclaimer(recoMode),
          station: c.station,
        };
      },
    );

    ranked.sort((a, b) => b.realSavingEuro - a.realSavingEuro);

    const summaryMode = this.summarizeMode(
      ranked.map((r) => r.distanceEstimateMode),
      ctx.requestedMode,
    );

    return {
      attribution: this.provider.attribution,
      basis,
      referencePrice,
      referenceStationId,
      recommendations: ranked,
      distanceEstimateMode: summaryMode,
      disclaimer: this.buildDisclaimer(summaryMode),
    };
  }

  /** Hilfsmethode fuer Detour-Wrapper-Konsumenten — bleibt erhalten. */
  detourCalculation = (input: Parameters<DetourService['calculate']>[0]) =>
    this.detour.calculate(input);

  private sampleRoute(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
    samples: number,
  ): Array<{ lat: number; lng: number }> {
    const out: Array<{ lat: number; lng: number }> = [];
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      out.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      });
    }
    return out;
  }
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Audit 2026-05-06 §13 Aufgabe 3: Concurrency-begrenzter map.
 *
 * Worker-Pool: hoechstens `limit` parallele `fn`-Calls. Verhindert das
 * Anschlagen von Mapbox-Rate-Limits und runaway-Kosten bei vielen Kandidaten.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const safeLimit = Math.max(1, Math.min(limit, items.length));

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: safeLimit }, () => worker()));
  return results;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value == null) return fallback;
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function estimateMinutes(distanceKm: number): number {
  return distanceKm * 1.7 + 2;
}
