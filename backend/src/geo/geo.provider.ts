/**
 * Geocoder-Provider-Schnittstelle.
 *
 * Implementierungen:
 *  - NominatimProvider (OSM-Nominatim, kein API-Key, Fair-Use)
 *  - MapboxGeocoderProvider (kommerziell, fuer Production-Volumen)
 *  - MockGeocoderProvider (nur Tests)
 */
export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
  type: 'city' | 'town' | 'village' | 'street' | 'postcode' | 'address' | 'place';
  countryCode: string | null;
}

export interface GeocoderProvider {
  readonly name: string;
  search(query: string, limit?: number): Promise<GeoResult[]>;
  reverse(lat: number, lng: number): Promise<GeoResult | null>;
}

export const GEOCODER_PROVIDER = Symbol('GEOCODER_PROVIDER');
