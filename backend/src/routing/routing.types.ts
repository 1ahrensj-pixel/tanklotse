/**
 * Audit 2026-05-06 §17 (Phase 3 Aufgabe 7): Routing-Distance-Input
 * unterscheidet zwei Use-Cases:
 *
 * - `point_to_station`: lokale Suche. Berechnet Distanz vom Suchpunkt
 *   (origin) zur Tankstelle. Reicht z.B. fuer „Tankstellen in meiner Naehe"
 *   ohne festes Reiseziel.
 *
 * - `route_via_station`: Heimweg-/Arbeitsweg-Modus. Berechnet, wieviel
 *   Mehrweg eine Tankstelle bedeutet. Formel:
 *     extraDistanceKm = distance(origin → station → destination)
 *                     - distance(origin → destination)
 *
 *   Ein echter Routing-Provider laedt zwei Routen, vergleicht sie, gibt
 *   die Differenz als Umweg zurueck.
 */
export type RoutingDistanceMode = 'point_to_station' | 'route_via_station';

export interface RoutingDistanceInput {
  mode: RoutingDistanceMode;
  /** Startpunkt (z.B. aktueller Standort oder „Buero"). */
  origin: { lat: number; lng: number };
  /** Tankstellen-Standort. */
  station: { lat: number; lng: number };
  /** Optional: Reiseziel. Pflicht fuer `route_via_station`. */
  destination?: { lat: number; lng: number };
}

export type RoutingNonPreciseReason =
  | 'noop_provider'
  | 'mock_provider'
  | 'provider_unavailable'
  | 'provider_timeout'
  | 'provider_rate_limited'
  | 'provider_error'
  | 'invalid_input';

export interface RoutingDistanceResult {
  /** `true` nur bei tatsaechlichem Routing-Provider-Erfolg. */
  precise: boolean;
  /** Optional: errechneter (Umweg-)Wert in km. Nur wenn `precise=true` aussagekraeftig. */
  extraDistanceKm?: number;
  /** Welcher konkrete Provider hat geliefert? (`mapbox`, `graphhopper`, etc.) */
  provider?: string;
  /** Wenn `precise=false`: warum? (Fuer Logs + ehrliche Fallback-Doku.) */
  reason?: RoutingNonPreciseReason;
  /**
   * Audit §22 Phase 8 (PR #11): Datenquelle hinter dem Wert.
   *   `live_api`     = HTTP-Antwort eines echten Providers
   *   `mock_fixture` = MockRoutingDistanceService (deterministisch, lokal)
   *   `cache`        = aus Redis-Cache geliefert
   */
  source?: 'live_api' | 'mock_fixture' | 'cache';
}

/**
 * Audit 2026-05-06 §17 Phase 2 Aufgabe 4+5:
 * `mixed` ist erlaubt, wenn das Gesamtergebnis aus Empfehlungen mit
 * unterschiedlichen Modes besteht (z.B. Station A precise, Station B
 * Fallback haversine).
 */
export type DistanceEstimateMode =
  | 'haversine_approximation'
  | 'route_sampling'
  | 'precise_routing'
  | 'mixed';
