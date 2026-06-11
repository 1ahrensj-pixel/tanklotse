import { MockRoutingDistanceService } from './mock-routing-distance.service';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11):
 *   Mock-Routing darf NIEMALS `precise: true` zurueckgeben — auch nicht,
 *   wenn die Eingabe „normal" aussieht. Das ist die Wahrheits-Garantie.
 */
describe('MockRoutingDistanceService — Audit §22 Phase 8', () => {
  it('isPreciseRoutingAvailable() ist immer false', () => {
    const svc = new MockRoutingDistanceService();
    expect(svc.isPreciseRoutingAvailable()).toBe(false);
  });

  it('point_to_station: precise=false, reason=mock_provider, source=mock_fixture, mit Distanzwert', async () => {
    const svc = new MockRoutingDistanceService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.8913, lng: 6.9946 },
      station: { lat: 50.9, lng: 7.0 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('mock_provider');
    expect(r.provider).toBe('mock');
    expect(r.source).toBe('mock_fixture');
    expect(typeof r.extraDistanceKm).toBe('number');
    expect(r.extraDistanceKm!).toBeGreaterThan(0);
  });

  it('route_via_station: precise=false, mit nicht-negativem Umweg', async () => {
    const svc = new MockRoutingDistanceService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'route_via_station',
      origin: { lat: 50.8913, lng: 6.9946 },
      station: { lat: 50.9, lng: 7.0 },
      destination: { lat: 50.9413, lng: 6.9583 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('mock_provider');
    expect(r.extraDistanceKm).toBeGreaterThanOrEqual(0);
  });

  it('route_via_station ohne destination: invalid_input', async () => {
    const svc = new MockRoutingDistanceService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'route_via_station',
      origin: { lat: 50.8913, lng: 6.9946 },
      station: { lat: 50.9, lng: 7.0 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('Production-Guard: ohne ALLOW_MOCK_PROVIDERS_IN_PRODUCTION wirft Error', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalAllow = process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      expect(() => new MockRoutingDistanceService()).toThrow(
        /ROUTING_PROVIDER_MODE=mock.*nicht erlaubt/,
      );
    } finally {
      if (originalEnv == null) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnv;
      if (originalAllow == null) delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      else process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = originalAllow;
    }
  });

  it('Production + ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true erlaubt Construct', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalAllow = process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
    try {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = 'true';
      const svc = new MockRoutingDistanceService();
      expect(svc.isPreciseRoutingAvailable()).toBe(false);
    } finally {
      if (originalEnv == null) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnv;
      if (originalAllow == null) delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      else process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = originalAllow;
    }
  });
});
