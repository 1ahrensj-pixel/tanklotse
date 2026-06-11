import { GeoService } from './geo.service';
import { MockGeocoderProvider } from './mock-geocoder.provider';

describe('GeoService (Mock)', () => {
  const svc = new GeoService(new MockGeocoderProvider());

  it('findet Koeln per Substring', async () => {
    const res = await svc.search('Köln');
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].label).toContain('Köln');
    expect(res[0].countryCode).toBe('de');
  });

  it('findet Postleitzahl 50996', async () => {
    const res = await svc.search('50996');
    expect(res.some((r) => r.type === 'postcode')).toBe(true);
  });

  it('reverse liefert naechstgelegenen Ort', async () => {
    const r = await svc.reverse(50.93, 6.95);
    expect(r).not.toBeNull();
    expect(r!.label).toContain('Köln');
  });

  it('leerer Query liefert leere Liste', async () => {
    expect(await svc.search('')).toEqual([]);
  });
});
