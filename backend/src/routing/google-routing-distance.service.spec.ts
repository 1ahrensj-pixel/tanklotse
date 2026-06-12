import {
  GoogleRoutingDistanceService,
  isMeaningfulGoogleKey,
  redactGoogleKey,
} from './google-routing-distance.service';

/**
 * Vertragstests analog zum Mapbox-Service:
 *  - precise=true NUR bei echtem HTTP-200 mit plausibler Distanz
 *  - niemals werfen — jeder Fehler wird zu precise=false + reason
 *  - route_via_station = via − direkt (nie negativ)
 *  - Platzhalter-/fehlende Keys → isPreciseRoutingAvailable()=false
 */
describe('GoogleRoutingDistanceService', () => {
  const realFetch = global.fetch;
  const VALID_KEY = 'AIzaSyTESTKEY1234567890abcdefghijklmn';

  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.GOOGLE_ROUTING_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  // `null` = bewusst ohne Key (NICHT `undefined` — das wuerde den
  // Default-Parameter aktivieren und doch einen Key setzen).
  function makeService(key: string | null = VALID_KEY): GoogleRoutingDistanceService {
    // Beide Quellen explizit raeumen — die Test-Umgebung kann ein echtes
    // GOOGLE_MAPS_API_KEY aus der .env mitbringen (Fallback-Quelle!).
    delete process.env.GOOGLE_ROUTING_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
    if (key != null) process.env.GOOGLE_ROUTING_API_KEY = key;
    return new GoogleRoutingDistanceService();
  }

  function mockFetchDistances(metersByCall: Array<number | null>, status = 200) {
    let call = 0;
    global.fetch = jest.fn(async () => {
      const meters = metersByCall[call++];
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () =>
          meters == null ? {} : { routes: [{ distanceMeters: meters }] },
      } as unknown as Response;
    }) as unknown as typeof fetch;
  }

  it('point_to_station: HTTP 200 → precise=true mit km aus distanceMeters', async () => {
    mockFetchDistances([5492]);
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.89276, lng: 6.99015 },
      station: { lat: 50.898493, lng: 6.951905 },
    });
    expect(r.precise).toBe(true);
    expect(r.extraDistanceKm).toBeCloseTo(5.5, 1);
    expect(r.provider).toBe('google');
  });

  it('route_via_station: extra = via − direkt, nie negativ', async () => {
    // Promise.all ruft direct (index 0) und via (index 1) — Reihenfolge der
    // fetch-Calls entspricht der Code-Reihenfolge im Service.
    mockFetchDistances([10000, 12500]);
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'route_via_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
      destination: { lat: 51.0, lng: 7.0 },
    });
    expect(r.precise).toBe(true);
    expect(r.extraDistanceKm).toBeCloseTo(2.5, 1);
  });

  it('route_via_station: via kuerzer als direkt → extra=0 (kein negativer Umweg)', async () => {
    mockFetchDistances([10000, 9000]);
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'route_via_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
      destination: { lat: 51.0, lng: 7.0 },
    });
    expect(r.precise).toBe(true);
    expect(r.extraDistanceKm).toBe(0);
  });

  it('route_via_station ohne destination → precise=false invalid_input, kein fetch', async () => {
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'route_via_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('invalid_input');
    expect(spy).not.toHaveBeenCalled();
  });

  it('HTTP 429 → precise=false provider_rate_limited (kein Throw)', async () => {
    mockFetchDistances([null], 429);
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('provider_rate_limited');
  });

  it('HTTP 500 → precise=false provider_unavailable', async () => {
    mockFetchDistances([null], 500);
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('provider_unavailable');
  });

  it('HTTP 403 (Key ohne Routes-API-Freigabe) → precise=false provider_error', async () => {
    mockFetchDistances([null], 403);
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('provider_error');
  });

  it('Timeout (AbortError) → precise=false provider_timeout', async () => {
    global.fetch = jest.fn(async () => {
      const err = new Error('aborted');
      (err as Error & { name: string }).name = 'AbortError';
      throw err;
    }) as unknown as typeof fetch;
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('provider_timeout');
  });

  it('Antwort ohne routes/distanceMeters → precise=false provider_error', async () => {
    mockFetchDistances([null]);
    const svc = makeService();
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
    });
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('provider_error');
  });

  it('fehlender Key → isPreciseRoutingAvailable()=false und invalid_input ohne fetch', async () => {
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;
    const svc = makeService(null);
    expect(svc.isPreciseRoutingAvailable()).toBe(false);
    const r = await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.9, lng: 6.9 },
      station: { lat: 50.95, lng: 6.95 },
    });
    expect(r.precise).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('GOOGLE_MAPS_API_KEY als Fallback, wenn GOOGLE_ROUTING_API_KEY fehlt', () => {
    delete process.env.GOOGLE_ROUTING_API_KEY;
    process.env.GOOGLE_MAPS_API_KEY = VALID_KEY;
    const svc = new GoogleRoutingDistanceService();
    expect(svc.isPreciseRoutingAvailable()).toBe(true);
  });

  describe('isMeaningfulGoogleKey', () => {
    it.each([
      [undefined, false],
      ['', false],
      ['AIza-kurz', false],
      ['kein-google-key-aber-lang-genug-1234567890', false],
      ['AIzaSyYOUR_GOOGLE_MAPS_API_KEY_PLACEHOLDER', false],
      ['AIzaSyREPLACE-me-with-real-key-1234567890', false],
      [VALID_KEY, true],
    ])('%s → %s', (value, expected) => {
      expect(isMeaningfulGoogleKey(value as string | undefined)).toBe(expected);
    });
  });

  describe('redactGoogleKey', () => {
    it('ersetzt Key-Muster in Fehlertexten', () => {
      const msg = `Request failed: key AIzaSyDq0TabcdefghijklmnopqrstuvwxyZ123 invalid`;
      expect(redactGoogleKey(msg)).not.toContain('AIzaSyDq0T');
      expect(redactGoogleKey(msg)).toContain('[REDACTED]');
    });
  });
});
