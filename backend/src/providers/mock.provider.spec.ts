import { MockProvider } from './mock.provider';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) §6.1 + §16 Aufgabe 1 — der
 * MockFuelProvider liefert reproduzierbare Koeln-Stationen.
 */
describe('MockProvider — §6.1 (Koeln-Fixtures)', () => {
  it('search liefert vier namentliche Koeln-Standorte (Rodenkirchen/Kalk/Marsdorf/Innenstadt)', async () => {
    const svc = new MockProvider();
    const stations = await svc.search({
      lat: 50.9375,
      lng: 6.9603,
      radius: 5,
      fuelType: 'DIESEL',
      sort: 'distance',
    } as never);
    const ids = stations.map((s) => s.id).sort();
    expect(ids).toEqual([
      'mock-innenstadt-1',
      'mock-kalk-1',
      'mock-marsdorf-1',
      'mock-rodenkirchen-1',
    ]);
    for (const s of stations) {
      expect(s.brand).toBe('MOCK');
      expect(s.lat).toBeGreaterThan(50);
      expect(s.lat).toBeLessThan(51);
      expect(s.lng).toBeGreaterThan(6);
      expect(s.lng).toBeLessThan(8);
      expect(typeof s.prices.diesel).toBe('number');
      expect(typeof s.distanceKm).toBe('number');
    }
  });

  it('getDetail liefert openingTimes + state + Preis-Felder fuer Rodenkirchen', async () => {
    const svc = new MockProvider();
    const detail = await svc.getDetail('mock-rodenkirchen-1');
    expect(detail.id).toBe('mock-rodenkirchen-1');
    expect(detail.state).toBe('NW');
    expect(detail.openingTimes.length).toBeGreaterThan(0);
    expect(detail.prices.diesel).toBeCloseTo(1.659, 3);
  });

  it('getPrices liefert isOpen + Preise fuer mehrere IDs', async () => {
    const svc = new MockProvider();
    const out = await svc.getPrices(['mock-rodenkirchen-1', 'mock-innenstadt-1']);
    expect(Object.keys(out).sort()).toEqual([
      'mock-innenstadt-1',
      'mock-rodenkirchen-1',
    ]);
    expect(out['mock-innenstadt-1'].isOpen).toBe(false);
    expect(out['mock-rodenkirchen-1'].isOpen).toBe(true);
  });

  it('attribution macht Mock-Status klar (kein Tankerkoenig-Live)', () => {
    const svc = new MockProvider();
    expect(svc.attribution).toMatch(/Mock|Kein Tankerkoenig-Live/);
  });
});
