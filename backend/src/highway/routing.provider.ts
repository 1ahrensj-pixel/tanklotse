/**
 * Routing-Provider-Schnittstelle.
 * Wird vom Highway-/SavedRoutes-Modul genutzt, um Abfahrts-Empfehlungen zu
 * berechnen.
 *
 * Implementierungen:
 *  - NoOpRoutingProvider — Default in Production. Liefert immer
 *    `{ status: 'PREPARED' }`. Ehrlich: ohne kommerzielles Routing
 *    (Mapbox Directions, Graphhopper, OSRM-Server) gibt es keine echten
 *    Polylines, also nicht so tun als ginge das.
 *  - MockRoutingProvider — nur in Tests. Einfache Heuristik mit Luftlinie.
 */

export type RoutingStatus = 'PREPARED' | 'OK' | 'NOT_FOUND';

export interface ExitCheckInput {
  currentLat: number;
  currentLng: number;
  /** Optional: Polyline der Route. */
  routePolyline?: string;
  fuelType: 'E5' | 'E10' | 'DIESEL';
  tankLiters: number;
  consumptionLPer100Km: number;
  /** Maximaler Abfahr-Umweg in km. */
  maxExitDetourKm: number;
}

export interface ExitCandidate {
  stationId: string;
  stationName: string;
  brand: string;
  pricePerLiter: number;
  exitDetourKm: number;
}

export interface ExitCheckResult {
  status: RoutingStatus;
  message: string;
  motorwayStationPrice?: number;
  candidates?: ExitCandidate[];
}

export interface RoutingProvider {
  readonly name: string;
  exitCheck(input: ExitCheckInput): Promise<ExitCheckResult>;
}

export const ROUTING_PROVIDER = Symbol('ROUTING_PROVIDER');
