import { Inject, Injectable } from '@nestjs/common';
import { GEOCODER_PROVIDER, GeocoderProvider, GeoResult } from './geo.provider';

@Injectable()
export class GeoService {
  constructor(@Inject(GEOCODER_PROVIDER) private readonly provider: GeocoderProvider) {}

  search(q: string, limit = 5): Promise<GeoResult[]> {
    return this.provider.search(q, limit);
  }

  reverse(lat: number, lng: number): Promise<GeoResult | null> {
    return this.provider.reverse(lat, lng);
  }
}
