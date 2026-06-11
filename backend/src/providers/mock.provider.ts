import { Injectable } from '@nestjs/common';

import {
  ComplaintPayload,
  FuelPriceProvider,
  ProviderStation,
  ProviderStationDetail,
  SearchParams,
} from './fuel-price.interface';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — MockFuelProvider mit den vier
 * namentlichen Koelner Standorten aus dem Auftrag (§6.1):
 *   Koeln Rodenkirchen, Koeln-Kalk, Koeln-Marsdorf, Koeln Innenstadt.
 *
 * Die Provider-Factory verhindert das Laden in NODE_ENV=production ohne
 * `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true`.
 */
@Injectable()
export class MockProvider implements FuelPriceProvider {
  readonly name = 'mock';
  readonly attribution =
    'MockProvider — interne Testdaten. Kein Tankerkoenig-Live-Test.';

  // Vier reproduzierbare Koeln-Stationen (Auftrag §6.1).
  private static readonly FIXTURES: Array<Omit<ProviderStation, 'distanceKm'>> = [
    {
      id: 'mock-rodenkirchen-1',
      name: 'Mock Tankstelle Rodenkirchen',
      brand: 'MOCK',
      street: 'Hauptstrasse',
      houseNumber: '1',
      postCode: '50996',
      place: 'Köln',
      lat: 50.8913,
      lng: 6.9946,
      isOpen: true,
      prices: { e5: 1.789, e10: 1.729, diesel: 1.659 },
    },
    {
      id: 'mock-kalk-1',
      name: 'Mock Tankstelle Kalk',
      brand: 'MOCK',
      street: 'Kalker Hauptstrasse',
      houseNumber: '12',
      postCode: '51103',
      place: 'Köln',
      lat: 50.9386,
      lng: 7.0047,
      isOpen: true,
      prices: { e5: 1.769, e10: 1.709, diesel: 1.629 },
    },
    {
      id: 'mock-marsdorf-1',
      name: 'Mock Tankstelle Marsdorf',
      brand: 'MOCK',
      street: 'Toyota-Allee',
      houseNumber: '3',
      postCode: '50858',
      place: 'Köln',
      lat: 50.9244,
      lng: 6.8498,
      isOpen: true,
      prices: { e5: 1.799, e10: 1.739, diesel: 1.669 },
    },
    {
      id: 'mock-innenstadt-1',
      name: 'Mock Tankstelle Innenstadt',
      brand: 'MOCK',
      street: 'Hohenzollernring',
      houseNumber: '50',
      postCode: '50672',
      place: 'Köln',
      lat: 50.9413,
      lng: 6.9583,
      isOpen: false,
      prices: { e5: 1.819, e10: 1.759, diesel: 1.689 },
    },
  ];

  async search(params: SearchParams): Promise<ProviderStation[]> {
    const origin =
      params && typeof params.lat === 'number' && typeof params.lng === 'number'
        ? { lat: params.lat, lng: params.lng }
        : { lat: 50.9375, lng: 6.9603 };
    return MockProvider.FIXTURES.map((s) => ({
      ...s,
      distanceKm: round2(haversineKm(origin, { lat: s.lat, lng: s.lng })),
    }));
  }

  async getDetail(stationId: string): Promise<ProviderStationDetail> {
    const base = MockProvider.FIXTURES.find((s) => s.id === stationId);
    if (!base) throw new Error('Station nicht im Mock');
    return {
      ...base,
      distanceKm: null,
      openingTimes: [
        { text: 'Mo-Sa', start: '06:00:00', end: '22:00:00' },
        { text: 'So', start: '08:00:00', end: '20:00:00' },
      ],
      overrides: [],
      wholeDay: false,
      state: 'NW',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getPrices(stationIds: string[]) {
    const out: Record<
      string,
      ProviderStation['prices'] & { isOpen: boolean }
    > = {};
    for (const id of stationIds) {
      const s = MockProvider.FIXTURES.find((x) => x.id === id);
      if (s) out[id] = { ...s.prices, isOpen: s.isOpen };
    }
    return out;
  }

  async submitComplaint(_p: ComplaintPayload) {
    return { ok: true, forwarded: false };
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
