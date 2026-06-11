import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Mapbox-Directions-Vertrag.
 *
 * Verifiziert, dass die abgelegten Mapbox-Antwort-Fixtures mit unserer
 * Erwartung in `MapboxRoutingDistanceService` zusammenpassen.
 */
const fixtureDir = join(__dirname, '..', 'fixtures', 'mapbox');
const ptp = JSON.parse(readFileSync(join(fixtureDir, 'directions.point-to-station.json'), 'utf8'));
const rvs = JSON.parse(readFileSync(join(fixtureDir, 'directions.route-via-station.json'), 'utf8'));

describe('Contract: Mapbox /directions/v5/mapbox/driving (point_to_station)', () => {
  it('Top-Level: code="Ok" + routes=Array mit mind. 1 Eintrag', () => {
    expect(ptp.code).toBe('Ok');
    expect(Array.isArray(ptp.routes)).toBe(true);
    expect(ptp.routes.length).toBeGreaterThan(0);
  });

  it('routes[0].distance ist Meter als number', () => {
    const distance = ptp.routes[0].distance;
    expect(typeof distance).toBe('number');
    expect(distance).toBeGreaterThan(0);
  });

  it('waypoints sind als [lng, lat]-Array gespeichert (Mapbox-Konvention)', () => {
    for (const wp of ptp.waypoints) {
      expect(Array.isArray(wp.location)).toBe(true);
      expect(wp.location).toHaveLength(2);
      const [lng, lat] = wp.location;
      expect(lng).toBeGreaterThan(-180);
      expect(lng).toBeLessThan(180);
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
    }
  });
});

describe('Contract: Mapbox /directions (route_via_station)', () => {
  it('viaStation- und direct-Routen liegen vor', () => {
    expect(ptp.code).toBe('Ok');
    expect(rvs.viaStation.code).toBe('Ok');
    expect(rvs.direct.code).toBe('Ok');
    expect(rvs.viaStation.routes[0].distance).toBeGreaterThan(0);
    expect(rvs.direct.routes[0].distance).toBeGreaterThan(0);
  });

  it('Differenz viaStation - direct (in km) entspricht erwartetem Umweg', () => {
    const viaKm = rvs.viaStation.routes[0].distance / 1000;
    const directKm = rvs.direct.routes[0].distance / 1000;
    const extra = Math.round((viaKm - directKm) * 100) / 100;
    expect(extra).toBeCloseTo(rvs._expectedExtraDistanceKm, 2);
  });
});

describe('Contract: Mapbox-Fehlerformen (Auftrag §7.2)', () => {
  it('rate-limit-Fixture hat HTTP 429 + erwartet provider_rate_limited', () => {
    const f = JSON.parse(readFileSync(join(fixtureDir, 'error.rate-limit.json'), 'utf8'));
    expect(f.httpStatus).toBe(429);
    expect(f._expectedReason).toBe('provider_rate_limited');
    expect(f.headers['x-rate-limit-remaining']).toBe('0');
  });

  it('server-error-Fixture hat HTTP 500 + erwartet provider_error', () => {
    const f = JSON.parse(readFileSync(join(fixtureDir, 'error.server-error.json'), 'utf8'));
    expect(f.httpStatus).toBe(500);
    expect(f._expectedReason).toBe('provider_error');
  });

  it('timeout-Fixture hat axiosCode=ECONNABORTED + erwartet provider_timeout', () => {
    const f = JSON.parse(readFileSync(join(fixtureDir, 'error.timeout.json'), 'utf8'));
    expect(f.axiosCode).toBe('ECONNABORTED');
    expect(f._expectedReason).toBe('provider_timeout');
  });
});
