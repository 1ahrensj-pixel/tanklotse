import { Module, Provider } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';
import {
  assertMockAllowed,
  parseProviderMode,
} from '../common/providers/provider-mode.types';
import { PrismaService } from '../prisma/prisma.service';
import { FUEL_PROVIDER, FuelPriceProvider } from './fuel-price.interface';
import { TankerkoenigProvider } from './tankerkoenig.provider';
import { FutureMtskProvider } from './future-mtsk.provider';
import { MockProvider } from './mock.provider';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11): Factory-Logik als named export,
 * damit Unit-Tests sie ohne NestJS-Kontext aufrufen koennen.
 *
 * Zwei Achsen:
 *   FUEL_PROVIDER       — welche Implementierung (tankerkoenig / mtsk / mock)
 *   FUEL_PROVIDER_MODE  — wie sie laeuft (live / sandbox / mock / contract / disabled)
 *
 * Backwards-kompatibel: ohne FUEL_PROVIDER_MODE bleibt das Verhalten wie
 * bisher (FUEL_PROVIDER=mock funktioniert weiter via NODE_ENV=test).
 */
export function createFuelProvider(
  cache: CacheService,
  prisma: PrismaService,
  env: NodeJS.ProcessEnv = process.env,
): FuelPriceProvider {
  const mode = parseProviderMode(
    env.FUEL_PROVIDER_MODE,
    'live',
    'FUEL_PROVIDER_MODE',
  );

  if (mode === 'mock' || mode === 'contract') {
    assertMockAllowed('fuel', env);
    return new MockProvider();
  }

  const name = (env.FUEL_PROVIDER ?? 'tankerkoenig').toLowerCase();
  if (name === 'mock') {
    if (env.NODE_ENV !== 'test') {
      throw new Error(
        'MockProvider darf nur in NODE_ENV=test geladen werden — alternativ ' +
          'FUEL_PROVIDER_MODE=mock mit ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true.',
      );
    }
    return new MockProvider();
  }
  if (name === 'mtsk') {
    return new FutureMtskProvider();
  }
  return new TankerkoenigProvider(cache, prisma);
}

const fuelProviderFactory: Provider = {
  provide: FUEL_PROVIDER,
  inject: [CacheService, PrismaService],
  useFactory: (cache: CacheService, prisma: PrismaService): FuelPriceProvider =>
    createFuelProvider(cache, prisma, process.env),
};

@Module({
  providers: [fuelProviderFactory],
  exports: [fuelProviderFactory],
})
export class ProvidersModule {}
