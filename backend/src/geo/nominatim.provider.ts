import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { CacheService } from '../cache/cache.service';
import { GeocoderProvider, GeoResult } from './geo.provider';

/**
 * OpenStreetMap Nominatim Provider.
 *
 * Lizenz / Nutzung: https://operations.osmfoundation.org/policies/nominatim/
 *  - Pflicht: User-Agent mit Kontaktinfo
 *  - Fair-Use: max. 1 req/s im Average
 *  - Fuer Production-Volumen kommerziellen Anbieter nutzen (siehe MapboxGeocoderProvider).
 */
interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: { country_code?: string };
}

@Injectable()
export class NominatimProvider implements GeocoderProvider {
  readonly name = 'nominatim';
  private readonly logger = new Logger(NominatimProvider.name);
  private readonly http: AxiosInstance;

  constructor(private readonly cache: CacheService) {
    const baseURL = process.env.GEOCODER_BASE_URL ?? 'https://nominatim.openstreetmap.org';
    const userAgent = process.env.GEOCODER_USER_AGENT ?? 'TankLotse/1.0 (+https://tanklotse.de)';
    this.http = axios.create({
      baseURL,
      timeout: 8_000,
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
    });
  }

  async search(query: string, limit = 5): Promise<GeoResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const cacheKey = `geo:search:${trimmed.toLowerCase()}:${limit}`;
    const cached = await this.cache.get<GeoResult[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await this.http.get<NominatimItem[]>('/search', {
        params: {
          q: trimmed,
          format: 'json',
          addressdetails: 1,
          limit,
          countrycodes: 'de,at,ch',
          'accept-language': 'de',
        },
      });
      const results = res.data.map((it) => this.toResult(it));
      await this.cache.set(cacheKey, results, 24 * 3600);
      return results;
    } catch (e) {
      this.logger.warn(`Nominatim search fehlgeschlagen: ${(e as Error).message}`);
      throw new ServiceUnavailableException('Geocoder nicht erreichbar.');
    }
  }

  async reverse(lat: number, lng: number): Promise<GeoResult | null> {
    const cacheKey = `geo:reverse:${lat.toFixed(4)}:${lng.toFixed(4)}`;
    const cached = await this.cache.get<GeoResult | null>(cacheKey);
    if (cached !== null) return cached;
    try {
      const res = await this.http.get<NominatimItem>('/reverse', {
        params: { lat, lon: lng, format: 'json', 'accept-language': 'de' },
      });
      const result = res.data ? this.toResult(res.data) : null;
      await this.cache.set(cacheKey, result, 24 * 3600);
      return result;
    } catch (e) {
      this.logger.warn(`Nominatim reverse fehlgeschlagen: ${(e as Error).message}`);
      throw new ServiceUnavailableException('Geocoder nicht erreichbar.');
    }
  }

  private toResult(it: NominatimItem): GeoResult {
    const lat = Number(it.lat);
    const lng = Number(it.lon);
    const cls = (it.class ?? '').toLowerCase();
    const type = (it.type ?? '').toLowerCase();
    return {
      label: it.display_name,
      lat,
      lng,
      type: this.mapType(cls, type),
      countryCode: it.address?.country_code ?? null,
    };
  }

  private mapType(cls: string, type: string): GeoResult['type'] {
    if (type === 'postcode' || cls === 'postcode') return 'postcode';
    if (type === 'city' || type === 'town' || type === 'village') return type;
    if (cls === 'highway') return 'street';
    if (cls === 'place') return 'place';
    return 'address';
  }
}
