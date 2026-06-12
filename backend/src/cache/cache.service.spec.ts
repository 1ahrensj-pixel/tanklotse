import { CacheService } from './cache.service';

// Härtung (Launch-Befund): Ein Redis-Ausfall darf NIE den Request killen.
// get() → Cache-Miss (null), set()/del() → best-effort, kein Throw.
describe('CacheService — graceful degradation bei Redis-Ausfall', () => {
  function withFakeRedis(redis: Record<string, unknown>) {
    const svc = new CacheService();
    // private redis-Feld direkt setzen (onModuleInit baut sonst echte Verbindung)
    (svc as unknown as { redis: unknown }).redis = redis;
    return svc;
  }

  it('get() liefert null statt zu werfen, wenn Redis ausfaellt', async () => {
    const svc = withFakeRedis({
      get: jest.fn().mockRejectedValue(new Error('Client IP not in allowlist')),
    });
    await expect(svc.get('stations:x')).resolves.toBeNull();
  });

  it('set() schluckt Redis-Fehler (best-effort)', async () => {
    const svc = withFakeRedis({
      set: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    });
    await expect(svc.set('k', { a: 1 }, 60)).resolves.toBeUndefined();
  });

  it('del() schluckt Redis-Fehler (best-effort)', async () => {
    const svc = withFakeRedis({
      del: jest.fn().mockRejectedValue(new Error('timeout')),
    });
    await expect(svc.del('k')).resolves.toBeUndefined();
  });

  it('get() liefert geparste Daten im Normalfall', async () => {
    const svc = withFakeRedis({
      get: jest.fn().mockResolvedValue(JSON.stringify({ hit: true })),
    });
    await expect(svc.get<{ hit: boolean }>('k')).resolves.toEqual({ hit: true });
  });

  it('get() liefert null bei kaputtem JSON', async () => {
    const svc = withFakeRedis({
      get: jest.fn().mockResolvedValue('{nicht-json'),
    });
    await expect(svc.get('k')).resolves.toBeNull();
  });
});
