import type { CacheService } from '../cache/cache.service';
import {
  MapboxRoutingDistanceService,
  redactMapboxToken,
} from './mapbox-routing-distance.service';
import { RoutingDistanceInput } from './routing.types';

/**
 * Audit 2026-05-06 §17 Phase 4: Mapbox-HTTP, Cache + Fallback.
 *
 * Tests laufen ohne echtes Network — `global.fetch` wird gemockt.
 */
describe('MapboxRoutingDistanceService', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    // Realistisch aussehender Test-Token (>= 20 Zeichen, kein Placeholder).
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.realistic-test-token-1234567890abcdef';
    process.env.MAPBOX_DIRECTIONS_BASE_URL = 'https://api.mapbox.com/directions/v5';
    delete process.env.MAPBOX_TIMEOUT_MS;
    delete process.env.MAPBOX_CACHE_TTL_S;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.MAPBOX_ACCESS_TOKEN;
  });

  const point: RoutingDistanceInput = {
    mode: 'point_to_station',
    origin: { lat: 50.93, lng: 6.95 },
    station: { lat: 50.94, lng: 6.96 },
  };

  const route: RoutingDistanceInput = {
    mode: 'route_via_station',
    origin: { lat: 50.93, lng: 6.95 },
    station: { lat: 50.945, lng: 6.95 },
    destination: { lat: 50.96, lng: 6.95 },
  };

  function mockFetchOnce(impl: (url: string) => Promise<Response>) {
    globalThis.fetch = jest.fn(impl as unknown as typeof globalThis.fetch);
  }

  function jsonResponse(body: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() { return body; },
    } as unknown as Response;
  }

  describe('isPreciseRoutingAvailable', () => {
    it('true wenn MAPBOX_ACCESS_TOKEN realistisch gesetzt', () => {
      const svc = new MapboxRoutingDistanceService();
      expect(svc.isPreciseRoutingAvailable()).toBe(true);
    });

    it('false wenn Token fehlt', () => {
      delete process.env.MAPBOX_ACCESS_TOKEN;
      const svc = new MapboxRoutingDistanceService();
      expect(svc.isPreciseRoutingAvailable()).toBe(false);
    });

    // Audit 2026-05-06 §13 Aufgabe 5: Platzhalter-Tokens duerfen nicht als
    // gueltig gelten — sonst macht der Service garantiert 401-HTTP-Calls.
    it.each([
      'replace-me',
      'CHANGEME',
      'change-me',
      'placeholder',
      'dummy',
      'example',
      'todo',
      'please-set-real-mapbox-token',
      'your-mapbox-token-here',
      'pk.replace-me-with-real-token',
      'short', // < 20 Zeichen
    ])('false fuer Platzhalter-Token "%s"', (placeholder) => {
      process.env.MAPBOX_ACCESS_TOKEN = placeholder;
      const svc = new MapboxRoutingDistanceService();
      expect(svc.isPreciseRoutingAvailable()).toBe(false);
    });

    it('true fuer realistisch aussehenden Test-Token', () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'pk.realistic-test-token-1234567890abcdef';
      const svc = new MapboxRoutingDistanceService();
      expect(svc.isPreciseRoutingAvailable()).toBe(true);
    });
  });

  describe('point_to_station', () => {
    it('liefert precise=true mit km bei HTTP 200', async () => {
      mockFetchOnce(async () =>
        jsonResponse({ routes: [{ distance: 1234 /* m */ }] }),
      );
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm(point);
      expect(r.precise).toBe(true);
      expect(r.extraDistanceKm).toBeCloseTo(1.2, 1);
      expect(r.provider).toBe('mapbox');
    });
  });

  describe('route_via_station (Audit §17 Phase 3 Aufgabe 7)', () => {
    it('extraDistanceKm = max(0, viaKm - directKm)', async () => {
      let call = 0;
      mockFetchOnce(async () => {
        call++;
        // 1. Call: direct origin→destination = 3 km
        // 2. Call: via origin→station→destination = 5 km
        const meters = call === 1 ? 3000 : 5000;
        return jsonResponse({ routes: [{ distance: meters }] });
      });
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm(route);
      expect(r.precise).toBe(true);
      expect(r.extraDistanceKm).toBeCloseTo(2.0, 1);
    });

    it('clampt extraDistanceKm auf 0, wenn via-Route kuerzer als direct ist', async () => {
      let call = 0;
      mockFetchOnce(async () => {
        call++;
        const meters = call === 1 ? 5000 : 4000; // direct > via
        return jsonResponse({ routes: [{ distance: meters }] });
      });
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm(route);
      expect(r.precise).toBe(true);
      expect(r.extraDistanceKm).toBe(0);
    });

    it('precise=false wenn destination fehlt', async () => {
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm({
        ...route,
        destination: undefined,
      });
      expect(r.precise).toBe(false);
      expect(r.reason).toBe('invalid_input');
    });
  });

  describe('Fallback bei Mapbox-Ausfall (Audit §17 Phase 4 Aufgabe 10)', () => {
    it('Timeout (AbortError) → precise=false, reason=provider_timeout, kein Throw', async () => {
      globalThis.fetch = jest.fn(async () => {
        const e: Error & { name?: string } = new Error('aborted');
        e.name = 'AbortError';
        throw e;
      }) as unknown as typeof globalThis.fetch;
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm(point);
      expect(r.precise).toBe(false);
      expect(r.reason).toBe('provider_timeout');
    });

    it('429 Rate Limit → precise=false, reason=provider_rate_limited', async () => {
      mockFetchOnce(async () => jsonResponse({}, 429));
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm(point);
      expect(r.precise).toBe(false);
      expect(r.reason).toBe('provider_rate_limited');
    });

    it('500 Server Error → precise=false, reason=provider_unavailable', async () => {
      mockFetchOnce(async () => jsonResponse({}, 500));
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm(point);
      expect(r.precise).toBe(false);
      expect(r.reason).toBe('provider_unavailable');
    });

    it('Mapbox antwortet ohne routes-Array → precise=false', async () => {
      mockFetchOnce(async () => jsonResponse({ routes: [] }));
      const svc = new MapboxRoutingDistanceService();
      const r = await svc.calculateExtraDistanceKm(point);
      expect(r.precise).toBe(false);
    });
  });

  describe('Cache (Audit §17 Phase 4 Aufgabe 9 + §13 Aufgabe 6)', () => {
    function makeCache() {
      const cacheStore = new Map<string, number>();
      const cache: CacheService = {
        get: jest.fn(async (k: string) => (cacheStore.has(k) ? cacheStore.get(k)! : null)),
        set: jest.fn(async (k: string, v: number) => {
          cacheStore.set(k, v);
        }),
      } as unknown as CacheService;
      return { cache, cacheStore };
    }

    it('zweite Anfrage triggert keinen zweiten HTTP-Call (Cache-Hit)', async () => {
      const { cache } = makeCache();
      const fetchSpy = jest.fn(async () =>
        jsonResponse({ routes: [{ distance: 800 }] }),
      );
      globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

      const svc = new MapboxRoutingDistanceService(cache);
      const a = await svc.calculateExtraDistanceKm(point);
      const b = await svc.calculateExtraDistanceKm(point);

      expect(a.precise).toBe(true);
      expect(b.precise).toBe(true);
      expect(a.extraDistanceKm).toBeCloseTo(0.8, 1);
      expect(b.extraDistanceKm).toBeCloseTo(0.8, 1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    // Audit 2026-05-06 §13 Aufgabe 6: Cache-Key ist `v1`-versioniert UND
    // enthaelt den routeKind. Identische Punkte mit unterschiedlichem
    // RouteKind muessen separate HTTP-Calls erzeugen.
    it('Cache-Key trennt point_to_station vs route_direct vs route_via', async () => {
      const { cache, cacheStore } = makeCache();
      const fetchSpy = jest.fn(async () =>
        jsonResponse({ routes: [{ distance: 1000 }] }),
      );
      globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

      const svc = new MapboxRoutingDistanceService(cache);
      // Erste Anfrage: point_to_station mit Punkt-Paar A,B
      await svc.calculateExtraDistanceKm({
        mode: 'point_to_station',
        origin: { lat: 50.93, lng: 6.95 },
        station: { lat: 50.94, lng: 6.96 },
      });
      // Zweite Anfrage: route_via_station mit denselben Endpunkten + extra
      // station — erzeugt 2 separate Cache-Entries (route_direct und route_via)
      // beide unterschiedlich zum point_to_station-Eintrag.
      await svc.calculateExtraDistanceKm({
        mode: 'route_via_station',
        origin: { lat: 50.93, lng: 6.95 },
        station: { lat: 50.945, lng: 6.95 },
        destination: { lat: 50.94, lng: 6.96 },
      });

      const keys = Array.from(cacheStore.keys());
      expect(keys.every((k) => k.startsWith('routing:mapbox:v1:driving:'))).toBe(true);
      expect(keys.some((k) => k.includes(':point_to_station:'))).toBe(true);
      expect(keys.some((k) => k.includes(':route_direct:'))).toBe(true);
      expect(keys.some((k) => k.includes(':route_via:'))).toBe(true);
      // Drei eindeutige Cache-Entries → drei HTTP-Calls (1 fuer point, 1 fuer
      // direct, 1 fuer via).
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Mapbox-Koordinaten-Reihenfolge', () => {
    it('URL enthaelt lng,lat (nicht lat,lng)', async () => {
      let capturedUrl = '';
      globalThis.fetch = jest.fn(async (url: unknown) => {
        capturedUrl = String(url);
        return jsonResponse({ routes: [{ distance: 100 }] });
      }) as unknown as typeof globalThis.fetch;
      const svc = new MapboxRoutingDistanceService();
      await svc.calculateExtraDistanceKm(point);
      // origin lat=50.93 lng=6.95 → URL muss "6.95,50.93" enthalten, NICHT "50.93,6.95"
      expect(capturedUrl).toContain('6.95,50.93');
      expect(capturedUrl).not.toContain('50.93,6.95');
    });
  });

  // Audit §10 Aufgabe 4: keine vollstaendige Mapbox-URL mit access_token
  // im Log.
  describe('redactMapboxToken (Audit §10 Aufgabe 4)', () => {
    it('ersetzt access_token=... durch [REDACTED]', () => {
      const url = 'https://api.mapbox.com/directions/v5/mapbox/driving/6.95,50.93;7.0,50.94?overview=false&access_token=pk.real-secret-token-1234567890';
      const r = redactMapboxToken(url);
      expect(r).toContain('access_token=[REDACTED]');
      expect(r).not.toContain('pk.real-secret-token-1234567890');
    });

    it('redactiert Token am Ende der URL', () => {
      const url = 'https://example.com/api?access_token=secrettoken123456';
      expect(redactMapboxToken(url)).toBe('https://example.com/api?access_token=[REDACTED]');
    });

    it('redactiert Token vor weiteren Query-Parametern', () => {
      const url = 'https://example.com/api?access_token=secrettoken&foo=bar';
      expect(redactMapboxToken(url)).toBe('https://example.com/api?access_token=[REDACTED]&foo=bar');
    });

    it('laesst andere Strings unveraendert', () => {
      const text = 'normaler error message ohne URL';
      expect(redactMapboxToken(text)).toBe(text);
    });

    it('redactiert mehrere access_token-Vorkommen', () => {
      const text = 'a access_token=t1 b access_token=t2';
      expect(redactMapboxToken(text)).toBe('a access_token=[REDACTED] b access_token=[REDACTED]');
    });
  });
});
