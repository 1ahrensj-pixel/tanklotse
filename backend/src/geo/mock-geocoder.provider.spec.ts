import { MockGeocoderProvider } from './mock-geocoder.provider';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) §16 Aufgabe 7 — Nominatim-Mock
 * liefert Koordinaten fuer Koeln Rodenkirchen.
 */
describe('MockGeocoderProvider — §16 Aufgabe 7', () => {
  it('search("Köln Rodenkirchen") liefert Treffer mit Koordinaten in NRW', async () => {
    const svc = new MockGeocoderProvider();
    const r = await svc.search('Rodenkirchen');
    expect(r.length).toBeGreaterThan(0);
    const hit = r[0];
    expect(hit.lat).toBeGreaterThan(50);
    expect(hit.lat).toBeLessThan(51);
    expect(hit.lng).toBeGreaterThan(6);
    expect(hit.lng).toBeLessThan(8);
    expect(hit.countryCode).toBe('de');
  });

  it('search("50996") liefert das Postcode-Ergebnis fuer Rodenkirchen', async () => {
    const svc = new MockGeocoderProvider();
    const r = await svc.search('50996');
    expect(r.length).toBeGreaterThan(0);
    const postcode = r.find((x) => x.type === 'postcode');
    expect(postcode).toBeDefined();
    expect(postcode!.lat).toBeCloseTo(50.8946, 2);
    expect(postcode!.lng).toBeCloseTo(6.9981, 2);
  });

  it('reverse(50.89, 6.99) liefert einen plausiblen NRW-Treffer', async () => {
    const svc = new MockGeocoderProvider();
    const r = await svc.reverse(50.89, 6.99);
    expect(r).not.toBeNull();
    expect(r!.label).toMatch(/Rodenkirchen|Köln/);
  });
});
