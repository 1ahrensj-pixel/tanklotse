import { Module, Provider } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';
import {
  assertMockAllowed,
  parseProviderMode,
} from '../common/providers/provider-mode.types';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GEOCODER_PROVIDER, GeocoderProvider } from './geo.provider';
import { MockGeocoderProvider } from './mock-geocoder.provider';
import { NominatimProvider } from './nominatim.provider';

const geocoderFactory: Provider = {
  provide: GEOCODER_PROVIDER,
  inject: [CacheService],
  useFactory: (cache: CacheService): GeocoderProvider => {
    // Audit 2026-05-06 §22 Phase 8 (PR #11) — siehe ProvidersModule.
    const mode = parseProviderMode(
      process.env.GEOCODER_PROVIDER_MODE,
      'live',
      'GEOCODER_PROVIDER_MODE',
    );

    if (mode === 'mock' || mode === 'contract') {
      assertMockAllowed('geocoder');
      return new MockGeocoderProvider();
    }

    const name = (process.env.GEOCODER_PROVIDER ?? 'nominatim').toLowerCase();
    if (name === 'mock') {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error(
          'MockGeocoderProvider darf nur in NODE_ENV=test geladen werden — alternativ ' +
            'GEOCODER_PROVIDER_MODE=mock mit ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true.',
        );
      }
      return new MockGeocoderProvider();
    }
    // Default: Nominatim. Zukuenftig: 'mapbox' fuer Production-Volumen.
    return new NominatimProvider(cache);
  },
};

@Module({
  controllers: [GeoController],
  providers: [GeoService, geocoderFactory],
  exports: [GeoService],
})
export class GeoModule {}
