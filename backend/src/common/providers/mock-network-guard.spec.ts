import http from 'node:http';
import https from 'node:https';

import { MockGeocoderProvider } from '../../geo/mock-geocoder.provider';
import { MockProvider as MockFuelProvider } from '../../providers/mock.provider';
import { MockRoutingDistanceService } from '../../routing/mock-routing-distance.service';
import { MockAuthProvider } from './mock-auth.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { MockPushProvider } from './mock-push.provider';

/**
 * Audit §22 Phase 8 (PR #12 §11) — Netzwerk-Guard.
 *
 * Wahrheits-Garantie: Mock-/Contract-Adapter machen NIE echte HTTP-Calls.
 * Falls einer das versuchen wuerde, faellt dieser Test sofort. Wir
 * ueberschreiben sowohl `global.fetch` als auch `http.request` /
 * `https.request` mit Sabotage-Funktionen.
 */
describe('Mock-Adapter machen keine echten Netzwerk-Calls — PR #12 §11', () => {
  let networkAttempts: string[] = [];
  let originalFetch: typeof globalThis.fetch | undefined;
  let originalHttpRequest: typeof http.request;
  let originalHttpsRequest: typeof https.request;

  beforeEach(() => {
    networkAttempts = [];
    originalFetch = globalThis.fetch;
    originalHttpRequest = http.request;
    originalHttpsRequest = https.request;

    globalThis.fetch = (input: RequestInfo | URL) => {
      networkAttempts.push(`fetch ${String(input)}`);
      throw new Error('Unexpected network call in mock mode');
    };
    (http.request as unknown) = (...args: unknown[]) => {
      networkAttempts.push(`http.request ${JSON.stringify(args[0] ?? null)}`);
      throw new Error('Unexpected http.request in mock mode');
    };
    (https.request as unknown) = (...args: unknown[]) => {
      networkAttempts.push(`https.request ${JSON.stringify(args[0] ?? null)}`);
      throw new Error('Unexpected https.request in mock mode');
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch as typeof globalThis.fetch;
    (http.request as unknown) = originalHttpRequest;
    (https.request as unknown) = originalHttpsRequest;
  });

  it('MockFuelProvider — kein HTTP zu Tankerkoenig', async () => {
    const svc = new MockFuelProvider();
    const stations = await svc.search({
      lat: 50.9375,
      lng: 6.9603,
      radius: 5,
      fuelType: 'DIESEL',
      sort: 'distance',
    } as never);
    expect(stations.length).toBeGreaterThan(0);
    await svc.getDetail(stations[0].id);
    await svc.getPrices(stations.map((s) => s.id));
    expect(networkAttempts).toEqual([]);
  });

  it('MockRoutingDistanceService — kein HTTP zu Mapbox', async () => {
    const svc = new MockRoutingDistanceService();
    await svc.calculateExtraDistanceKm({
      mode: 'point_to_station',
      origin: { lat: 50.8913, lng: 6.9946 },
      station: { lat: 50.9, lng: 7.0 },
    });
    await svc.calculateExtraDistanceKm({
      mode: 'route_via_station',
      origin: { lat: 50.8913, lng: 6.9946 },
      station: { lat: 50.9, lng: 7.0 },
      destination: { lat: 50.9413, lng: 6.9583 },
    });
    expect(networkAttempts).toEqual([]);
  });

  it('MockGeocoderProvider — kein HTTP zu Nominatim', async () => {
    const svc = new MockGeocoderProvider();
    await svc.search('Köln Rodenkirchen');
    await svc.reverse(50.89, 6.99);
    expect(networkAttempts).toEqual([]);
  });

  it('MockPushProvider — kein HTTP zu Firebase', async () => {
    const svc = new MockPushProvider();
    await svc.sendToToken({
      token: 'mock-device-token',
      title: 'Test',
      body: 'Body',
    });
    expect(networkAttempts).toEqual([]);
  });

  it('MockAuthProvider — kein HTTP zu Apple/Google', async () => {
    const svc = new MockAuthProvider();
    await svc.verifyAppleIdToken('mock-apple-alice');
    await svc.verifyGoogleIdToken('mock-google-bob');
    expect(networkAttempts).toEqual([]);
  });

  it('MockPaymentProvider — kein HTTP zu Stripe/Apple/Google', async () => {
    const svc = new MockPaymentProvider();
    await svc.createTestSubscription({
      customerId: 'cus_test_1',
      productId: 'premium_monthly',
      status: 'active',
    });
    await svc.getStatus('cus_test_1');
    await svc.cancel('cus_test_1');
    expect(networkAttempts).toEqual([]);
  });
});
