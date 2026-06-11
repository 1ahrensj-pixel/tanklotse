import { Injectable } from '@nestjs/common';
import { GeocoderProvider, GeoResult } from './geo.provider';

/**
 * Mock-Geocoder fuer Tests.
 * Kennt nur Koeln, Berlin, Muenchen + ein paar PLZ.
 * Wird nur in NODE_ENV=test geladen (siehe GeoModule-Factory).
 */
@Injectable()
export class MockGeocoderProvider implements GeocoderProvider {
  readonly name = 'mock';

  private static readonly cities: GeoResult[] = [
    { label: 'Köln, Nordrhein-Westfalen, Deutschland', lat: 50.9375, lng: 6.9603, type: 'city', countryCode: 'de' },
    { label: 'Berlin, Deutschland', lat: 52.52, lng: 13.405, type: 'city', countryCode: 'de' },
    { label: 'München, Bayern, Deutschland', lat: 48.1351, lng: 11.582, type: 'city', countryCode: 'de' },
    { label: 'Köln-Rodenkirchen, Nordrhein-Westfalen, Deutschland', lat: 50.8946, lng: 6.9981, type: 'town', countryCode: 'de' },
    { label: '50996, Köln-Rodenkirchen, Nordrhein-Westfalen, Deutschland', lat: 50.8946, lng: 6.9981, type: 'postcode', countryCode: 'de' },
  ];

  async search(query: string, limit = 5): Promise<GeoResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MockGeocoderProvider.cities
      .filter((c) => c.label.toLowerCase().includes(q))
      .slice(0, limit);
  }

  async reverse(lat: number, _lng: number): Promise<GeoResult | null> {
    // Dummy: gib das raeumlich naechstliegende zurueck.
    return MockGeocoderProvider.cities.reduce<GeoResult | null>((best, c) => {
      const d = Math.abs(c.lat - lat);
      if (!best || d < Math.abs(best.lat - lat)) return c;
      return best;
    }, null);
  }
}
