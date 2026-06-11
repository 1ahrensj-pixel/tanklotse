/**
 * Audit 2026-05-06 §22 Phase 4: Live-Smoke-Test gegen die Mapbox Directions API.
 *
 * 4 Testfaelle gemaess §7.2:
 *   A — point_to_station                        (Rodenkirchen → Beispiel-Station)
 *   B — route_via_station                       (Rodenkirchen → Innenstadt via Station)
 *   C — kontrollierter Provider-Fallback        (mit MAPBOX_TIMEOUT_MS=1)
 *   D — ungueltiger Token                       (MAPBOX_ACCESS_TOKEN=replace-me)
 *
 * Hinweis zu C: dieser Test prueft NICHT deterministisch einen Timeout —
 * er prueft kontrolliertes Fallback-Verhalten ohne Throw. Akzeptable
 * `reason`-Werte: provider_timeout / provider_unavailable / provider_error.
 * Auch `precise=true` ist erlaubt (Mapbox war einfach schneller als 1 ms).
 *
 * Strict-Verhalten:
 *   - Ohne `MAPBOX_ACCESS_TOKEN` (oder Platzhalter) → sauberes Skip in Dev,
 *     Fehler in Staging.
 *   - Bei Timeout/Token-Test: das Script erwartet **kein** precise=true,
 *     sondern `precise=false` mit `reason`.
 *
 * Aufruf:
 *   MAPBOX_ACCESS_TOKEN=pk... npm run smoke:mapbox:routing
 */
import { MapboxRoutingDistanceService } from '../src/routing/mapbox-routing-distance.service';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const RODENKIRCHEN = { lat: 50.8913, lng: 6.9946 };
const STATION_NEAR = { lat: 50.9, lng: 7.0 };
const INNENSTADT = { lat: 50.9413, lng: 6.9583 };

function isTokenMissing(): boolean {
  const t = (process.env.MAPBOX_ACCESS_TOKEN ?? '').trim();
  if (t.length === 0) return true;
  // Platzhalter — siehe `isMeaningfulMapboxToken`.
  const lc = t.toLowerCase();
  return [
    'replace-me',
    'changeme',
    'change-me',
    'placeholder',
    'dummy',
    'example',
    'todo',
    'please-set',
  ].some((p) => lc.includes(p));
}

async function caseAPointToStation(): Promise<void> {
  console.log('\n--- Testfall A: point_to_station (Rodenkirchen → Beispiel-Station) ---');
  const svc = new MapboxRoutingDistanceService();
  const r = await svc.calculateExtraDistanceKm({
    mode: 'point_to_station',
    origin: RODENKIRCHEN,
    station: STATION_NEAR,
  });
  if (r.precise && typeof r.extraDistanceKm === 'number' && r.extraDistanceKm > 0) {
    console.log(
      `[ok] precise=true, extraDistanceKm=${r.extraDistanceKm.toFixed(2)} km, provider=${r.provider}`,
    );
  } else {
    console.error(`[fail] erwartet precise=true mit km > 0, got: ${JSON.stringify(r)}`);
    process.exitCode = 2;
  }
}

async function caseBRouteViaStation(): Promise<void> {
  console.log('\n--- Testfall B: route_via_station (Rodenkirchen → Innenstadt via Station) ---');
  const svc = new MapboxRoutingDistanceService();
  const r = await svc.calculateExtraDistanceKm({
    mode: 'route_via_station',
    origin: RODENKIRCHEN,
    station: STATION_NEAR,
    destination: INNENSTADT,
  });
  if (r.precise && typeof r.extraDistanceKm === 'number' && r.extraDistanceKm >= 0) {
    console.log(
      `[ok] precise=true, extraDistanceKm=${r.extraDistanceKm.toFixed(2)} km (= viaKm − directKm)`,
    );
  } else {
    console.error(`[fail] erwartet precise=true mit km >= 0, got: ${JSON.stringify(r)}`);
    process.exitCode = 2;
  }
}

async function caseCProviderFallback(): Promise<void> {
  // Audit 2026-05-06 §10 Aufgabe 3: nicht ausschliesslich auf
  // `provider_timeout` festnageln. Mit `MAPBOX_TIMEOUT_MS=1` kann je nach
  // Node-Version, Fetch-Implementierung und Netz auch eine andere
  // Fehlerklasse zurueckkommen (provider_error, provider_unavailable).
  // Wichtig ist nur: Service wirft NICHT, sondern liefert ein kontrolliertes
  // Fallback mit `precise=false`.
  console.log('\n--- Testfall C: Provider-Fallback (MAPBOX_TIMEOUT_MS=1, akzeptiert mehrere reasons) ---');
  const original = process.env.MAPBOX_TIMEOUT_MS;
  process.env.MAPBOX_TIMEOUT_MS = '1';
  try {
    const svc = new MapboxRoutingDistanceService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: RODENKIRCHEN,
      station: STATION_NEAR,
    });
    const acceptableReasons = [
      'provider_timeout',
      'provider_unavailable',
      'provider_error',
    ] as const;
    if (
      r.precise === false &&
      typeof r.reason === 'string' &&
      (acceptableReasons as readonly string[]).includes(r.reason)
    ) {
      console.log(`[ok] kontrolliertes Fallback: precise=false, reason=${r.reason}`);
    } else if (r.precise === true) {
      // Sehr unwahrscheinlich (Mapbox lieferte in unter 1 ms ein Ergebnis),
      // aber kein Fehler — Service hat sich korrekt verhalten.
      console.log(`[ok] Mapbox war schneller als erwartet — precise=true, kein Fallback noetig`);
    } else {
      console.error(
        `[fail] precise=false aber reason="${r.reason ?? '–'}" nicht in akzeptabler Liste: ${acceptableReasons.join(', ')}`,
      );
      process.exitCode = 2;
    }
  } finally {
    if (original == null) delete process.env.MAPBOX_TIMEOUT_MS;
    else process.env.MAPBOX_TIMEOUT_MS = original;
  }
}

async function caseDInvalidToken(): Promise<void> {
  console.log('\n--- Testfall D: ungueltiger Token (replace-me) ---');
  const original = process.env.MAPBOX_ACCESS_TOKEN;
  process.env.MAPBOX_ACCESS_TOKEN = 'replace-me';
  try {
    const svc = new MapboxRoutingDistanceService();
    if (svc.isPreciseRoutingAvailable()) {
      console.error('[fail] isPreciseRoutingAvailable() darf bei Platzhalter false sein');
      process.exitCode = 2;
      return;
    }
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: RODENKIRCHEN,
      station: STATION_NEAR,
    });
    if (r.precise === false) {
      console.log(`[ok] kein HTTP-Call, precise=false (reason=${r.reason ?? '–'})`);
    } else {
      console.error(`[fail] erwartet precise=false, got: ${JSON.stringify(r)}`);
      process.exitCode = 2;
    }
  } finally {
    if (original == null) delete process.env.MAPBOX_ACCESS_TOKEN;
    else process.env.MAPBOX_ACCESS_TOKEN = original;
  }
}

async function main() {
  if (isTokenMissing()) {
    if (NODE_ENV === 'staging' || NODE_ENV === 'production') {
      console.error(
        `[fail] MAPBOX_ACCESS_TOKEN ist in NODE_ENV=${NODE_ENV} Pflicht. Setze ihn vor dem Smoke.`,
      );
      process.exit(2);
    }
    console.log('[skip] MAPBOX_ACCESS_TOKEN nicht gesetzt oder Platzhalter — Live-Smoke uebersprungen.');
    console.log('       Token holen: https://account.mapbox.com/access-tokens/');
    process.exit(0);
  }

  console.log(`[run] Mapbox routing live (NODE_ENV=${NODE_ENV})`);
  await caseAPointToStation();
  await caseBRouteViaStation();
  await caseCProviderFallback();
  await caseDInvalidToken();

  if (process.exitCode === 2) {
    console.error('\n[done] Mapbox live: mind. ein Testfall fehlgeschlagen.');
  } else {
    console.log('\n[done] Mapbox live OK');
  }
}

main().catch((e) => {
  console.error('[error]', (e as Error).message);
  process.exit(1);
});
