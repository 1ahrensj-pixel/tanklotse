import { RoutingDistanceInput, RoutingDistanceResult } from './routing.types';

/**
 * Audit 2026-05-06 §15 + §17:
 *
 * Single-Source-of-Truth fuer die Frage „Wurde diese Distanz wirklich von
 * einem echten Routing-Provider berechnet?".
 *
 * Wichtig:
 *   `ROUTING_ENABLED=true` + `ROUTING_PROVIDER=mapbox` bedeutet NUR, dass ein
 *   Provider _konfiguriert_ ist. Es bedeutet NICHT, dass eine konkrete
 *   Empfehlung tatsaechlich ueber HTTP zur Mapbox-Directions-API gegangen ist.
 *
 * `precise=true` darf nur dann zurueckgegeben werden, wenn ein konkreter
 * HTTP-Call erfolgreich war.
 *
 * Fallback-Vertrag (Audit §17 Phase 4 Aufgabe 10):
 *   Bei jedem Fehler — Timeout, 429, 500, ungueltige Eingabe, kein Token —
 *   muss die Implementierung `precise=false` mit einem `reason` zurueckgeben.
 *   Sie darf NIEMALS werfen oder die App crashen.
 */
export const ROUTING_DISTANCE_SERVICE = Symbol('ROUTING_DISTANCE_SERVICE');

export interface RoutingDistanceService {
  /**
   * `true` ist nur erlaubt, wenn die konkrete Implementierung wirklich
   * Routen abrufen kann — nicht, weil eine ENV-Variable gesetzt ist.
   */
  isPreciseRoutingAvailable(): boolean;

  /**
   * Berechnet Umweg-Distanz fuer eine konkrete Tankstellen-Empfehlung.
   * Garantiert: niemals werfen, immer ein Result-Objekt.
   */
  calculateExtraDistanceKm(input: RoutingDistanceInput): Promise<RoutingDistanceResult>;
}
