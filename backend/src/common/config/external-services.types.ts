/**
 * Zentrale Typen fuer den Status externer Dienste (TankLotse §17).
 *
 * Wichtig: ExternalServiceStatus enthaelt NIEMALS Secret-Werte.
 * `missingKeys` und `invalidKeys` listen ausschliesslich Variablennamen,
 * keine Werte. Damit ist die Struktur sicher fuer Admin-UI, Logs und API.
 */

export type ServiceStatus =
  | 'configured' // Feature aktiv, alle Pflichtwerte gesetzt
  | 'missing' // Feature aktiv, Pflichtwerte fehlen
  | 'invalid' // Feature aktiv, Werte gesetzt aber ungueltig
  | 'optional' // Feature aktiv, optionaler Dienst nicht konfiguriert (kein Pflichtfehler)
  | 'disabled'; // Feature ausgeschaltet (Feature-Flag false)

export interface ExternalServiceStatus {
  /** Stabiler Identifier, z.B. "fuel-prices", "routing", "push", "stripe". */
  service: string;
  /** Konkreter Anbieter (tankerkoenig | mapbox | graphhopper | apple | google | stripe ...). */
  provider?: string;
  /** Feature-Flag-Stand. true = der Dienst soll genutzt werden. */
  enabled: boolean;
  /** true, wenn alle Pflichtwerte fuer den aktuellen provider/flag gesetzt sind. */
  configured: boolean;
  /** Wird in NODE_ENV=production hart geprueft? */
  requiredInProduction: boolean;
  /** Aggregierter Status. */
  status: ServiceStatus;
  /** Fehlende Pflicht-ENV-Variablen (NUR Namen, nie Werte). */
  missingKeys: string[];
  /** Vorhandene aber ungueltige ENV-Variablen (NUR Namen, nie Werte). */
  invalidKeys: string[];
  /** Erklaerende Hinweise (z.B. „MTS-K Provider vorbereitet, kein produktiver Zugang"). */
  notes?: string[];
}

/**
 * Service-Identifier-Konstanten — verhindern Tippfehler in der UI/Tests.
 */
export const ServiceIds = {
  fuelPrices: 'fuel-prices',
  geocoder: 'geocoder',
  routing: 'routing',
  push: 'push',
  googleLogin: 'google-login',
  appleLogin: 'apple-login',
  subscriptions: 'subscriptions',
  sentry: 'sentry',
  smtp: 'smtp',
  mapPublicToken: 'map-public-token',
} as const;

export type ServiceId = (typeof ServiceIds)[keyof typeof ServiceIds];
