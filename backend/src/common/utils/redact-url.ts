/**
 * URL-/Query-Redaction für HTTP-Logs (DSGVO-konform).
 *
 * Hintergrund (Audit-Befund "HTTP-Log protokolliert volle URLs"):
 * `req.originalUrl` enthält den vollen Query-String — darin landen
 * präzise GPS-Koordinaten (/stations/search?lat=&lng=, /geo/reverse)
 * und geheime Reset-/Verify-Tokens aus Mail-Links (/auth/verify?token=,
 * /auth/reset?token=). Beides darf nicht im Klartext in Server-Logs.
 *
 * Regeln:
 *   - Token-artige Parameter und freie Such-/Adresstexte (q) werden
 *     hart als `[REDACTED]` maskiert.
 *   - Koordinaten (lat/lng) werden auf 2 Dezimalstellen gekürzt
 *     (~1,1 km Raster) — genug für Debugging, zu grob für Tracking.
 */

const CENSOR = '[REDACTED]';

/** Query-Parameter, deren Wert komplett maskiert wird. */
const SECRET_PARAMS = new Set([
  'token',
  'refreshtoken',
  'refresh_token',
  'identitytoken',
  'identity_token',
  'idtoken',
  'id_token',
  'code',
  'password',
  'email',
  'q',
]);

/** Koordinaten-Parameter: Wert wird auf 2 Dezimalstellen gekürzt. */
const COORDINATE_PARAMS = new Set(['lat', 'lng', 'lon', 'latitude', 'longitude']);

/**
 * Redaktiert einen einzelnen Query-Parameter-Wert.
 * Nicht-sensible Parameter werden unverändert zurückgegeben.
 */
export function redactQueryValue(name: string, value: string): string {
  const key = name.toLowerCase();
  if (SECRET_PARAMS.has(key)) return CENSOR;
  if (COORDINATE_PARAMS.has(key)) {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : CENSOR;
  }
  return value;
}

/**
 * Redaktiert sensible Query-Parameter einer URL für Log-Ausgaben.
 * Pfad und unkritische Parameter bleiben erhalten.
 */
export function redactUrlForLog(url: string): string {
  if (!url) return url;
  const qIndex = url.indexOf('?');
  if (qIndex === -1) return url;
  const path = url.slice(0, qIndex);
  try {
    const params = new URLSearchParams(url.slice(qIndex + 1));
    const parts: string[] = [];
    for (const [name, value] of params) {
      const redacted = redactQueryValue(name, value);
      parts.push(`${name}=${redacted === value ? encodeURIComponent(value) : redacted}`);
    }
    return parts.length > 0 ? `${path}?${parts.join('&')}` : path;
  } catch {
    // Defensive: nicht parsebarer Query-String → komplett maskieren.
    return `${path}?${CENSOR}`;
  }
}

/**
 * Redaktiert ein bereits geparstes Query-Objekt (z. B. `req.query` aus
 * Express) für Log-Ausgaben. Liefert eine Kopie — das Original bleibt
 * unverändert, damit die Request-Verarbeitung nicht beeinflusst wird.
 */
export function redactQueryObject(query: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      result[name] = redactQueryValue(name, value);
    } else if (Array.isArray(value)) {
      result[name] = value.map((v) => (typeof v === 'string' ? redactQueryValue(name, v) : CENSOR));
    } else if (SECRET_PARAMS.has(name.toLowerCase()) || COORDINATE_PARAMS.has(name.toLowerCase())) {
      // Verschachtelte Objekte unter sensiblem Namen: komplett maskieren.
      result[name] = CENSOR;
    } else {
      result[name] = value;
    }
  }
  return result;
}
