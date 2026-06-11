import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { MockProvider } from './mock.provider';
import { FutureMtskProvider } from './future-mtsk.provider';
import { TankerkoenigProvider } from './tankerkoenig.provider';
import { createFuelProvider } from './providers.module';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) §16 Aufgabe 1+2+3 — Factory-Verhalten.
 */
describe('createFuelProvider — Provider-Factory (§16 Aufgaben 1-3)', () => {
  // Cache + Prisma sind nur fuer den TankerkoenigProvider-Constructor noetig
  // — wir uebergeben minimal notwendige Stubs.
  const cacheStub = {} as CacheService;
  const prismaStub = {} as PrismaService;

  it('FUEL_PROVIDER_MODE=mock → MockProvider aktiv (§16 Aufgabe 1)', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'test',
      FUEL_PROVIDER_MODE: 'mock',
    } as NodeJS.ProcessEnv;
    const p = createFuelProvider(cacheStub, prismaStub, env);
    expect(p).toBeInstanceOf(MockProvider);
    expect(p.name).toBe('mock');
  });

  it('FUEL_PROVIDER_MODE=contract → ebenfalls MockProvider mit Fixture-Daten', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'test',
      FUEL_PROVIDER_MODE: 'contract',
    } as NodeJS.ProcessEnv;
    const p = createFuelProvider(cacheStub, prismaStub, env);
    expect(p).toBeInstanceOf(MockProvider);
  });

  it('FUEL_PROVIDER_MODE=live mit TANKERKOENIG_API_KEY → TankerkoenigProvider', () => {
    const original = process.env.TANKERKOENIG_API_KEY;
    process.env.TANKERKOENIG_API_KEY = 'real-test-key';
    try {
      const env: NodeJS.ProcessEnv = {
        NODE_ENV: 'test',
        FUEL_PROVIDER: 'tankerkoenig',
        FUEL_PROVIDER_MODE: 'live',
        TANKERKOENIG_API_KEY: 'real-test-key',
      } as NodeJS.ProcessEnv;
      const p = createFuelProvider(cacheStub, prismaStub, env);
      expect(p).toBeInstanceOf(TankerkoenigProvider);
    } finally {
      if (original == null) delete process.env.TANKERKOENIG_API_KEY;
      else process.env.TANKERKOENIG_API_KEY = original;
    }
  });

  it('FUEL_PROVIDER=mtsk → FutureMtskProvider (Stub)', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'test',
      FUEL_PROVIDER: 'mtsk',
    } as NodeJS.ProcessEnv;
    const p = createFuelProvider(cacheStub, prismaStub, env);
    expect(p).toBeInstanceOf(FutureMtskProvider);
  });

  it('FUEL_PROVIDER_MODE=mock + NODE_ENV=production ohne Allow-Flag → wirft (§16 Aufgabe 3)', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      FUEL_PROVIDER_MODE: 'mock',
    } as NodeJS.ProcessEnv;
    expect(() => createFuelProvider(cacheStub, prismaStub, env)).toThrow(
      /FUEL_PROVIDER_MODE=mock.*production/,
    );
  });

  it('FUEL_PROVIDER_MODE=mock + Production + ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true → erlaubt', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      FUEL_PROVIDER_MODE: 'mock',
      ALLOW_MOCK_PROVIDERS_IN_PRODUCTION: 'true',
    } as NodeJS.ProcessEnv;
    const p = createFuelProvider(cacheStub, prismaStub, env);
    expect(p).toBeInstanceOf(MockProvider);
  });

  it('Legacy-Pfad: FUEL_PROVIDER=mock + NODE_ENV != test ohne Mode-Variable → wirft', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      FUEL_PROVIDER: 'mock',
    } as NodeJS.ProcessEnv;
    expect(() => createFuelProvider(cacheStub, prismaStub, env)).toThrow(
      /MockProvider darf nur in NODE_ENV=test geladen werden/,
    );
  });
});
