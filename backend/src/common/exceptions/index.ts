/**
 * Audit-Auftrag §4.3 — Domain-Exception-Hierarchie.
 *
 * Statt generische `throw new Error(...)`-Aufrufe nutzen Services und
 * Controller hier definierte Domain-spezifische `HttpException`-
 * Subklassen. Der `GlobalExceptionFilter` setzt sie in eine einheitliche
 * JSON-Form mit `statusCode` + `error` + `message` um.
 *
 * Wahrheits-Garantie:
 *   - Keine Domain-Exception leakt jemals einen Secret-Wert. Nur ID-
 *     Fragmente oder Feldnamen tauchen in der Message auf.
 *   - Jede Subklasse traegt ein eindeutiges `error`-String fuer
 *     Frontend-Switches (z.B. `STATION_NOT_FOUND`).
 */
export * from './station-not-found.exception';
export * from './insufficient-premium.exception';
export * from './provider-unavailable.exception';
export * from './invalid-coordinates.exception';
export * from './duplicate-resource.exception';
