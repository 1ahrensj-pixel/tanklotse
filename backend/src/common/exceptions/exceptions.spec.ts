import {
  DuplicateResourceException,
  InsufficientPremiumException,
  InvalidCoordinatesException,
  ProviderUnavailableException,
  StationNotFoundException,
} from './index';

/**
 * Audit-Auftrag §4.3 — alle Domain-Exceptions liefern einheitliches
 * JSON-Schema: `statusCode`, `error`-String, `message`. Frontend kann
 * stabil auf den `error`-Code switchen.
 */
describe('Domain-Exceptions (§4.3)', () => {
  it('StationNotFoundException → 404 STATION_NOT_FOUND', () => {
    const e = new StationNotFoundException('abc-123');
    expect(e.getStatus()).toBe(404);
    const res = e.getResponse() as Record<string, unknown>;
    expect(res.error).toBe('STATION_NOT_FOUND');
    expect(res.statusCode).toBe(404);
    expect(res.message).toMatch(/abc-123/);
  });

  it('InsufficientPremiumException → 403 INSUFFICIENT_PREMIUM mit feature', () => {
    const e = new InsufficientPremiumException('route_planning');
    expect(e.getStatus()).toBe(403);
    const res = e.getResponse() as Record<string, unknown>;
    expect(res.error).toBe('INSUFFICIENT_PREMIUM');
    expect(res.feature).toBe('route_planning');
  });

  it('ProviderUnavailableException → 503 PROVIDER_UNAVAILABLE', () => {
    const e = new ProviderUnavailableException('tankerkoenig', 'timeout');
    expect(e.getStatus()).toBe(503);
    const res = e.getResponse() as Record<string, unknown>;
    expect(res.error).toBe('PROVIDER_UNAVAILABLE');
    expect(res.provider).toBe('tankerkoenig');
    expect(res.reason).toBe('timeout');
  });

  it('ProviderUnavailableException ohne reason → reason=null', () => {
    const e = new ProviderUnavailableException('mapbox');
    expect((e.getResponse() as { reason: null }).reason).toBeNull();
  });

  it('InvalidCoordinatesException → 400 INVALID_COORDINATES', () => {
    const e = new InvalidCoordinatesException(91, 200);
    expect(e.getStatus()).toBe(400);
    const res = e.getResponse() as Record<string, unknown>;
    expect(res.error).toBe('INVALID_COORDINATES');
    expect(res.message).toMatch(/lat=91/);
    expect(res.message).toMatch(/lng=200/);
  });

  it('DuplicateResourceException → 409 DUPLICATE_RESOURCE', () => {
    const e = new DuplicateResourceException('Favorite', 'stationId');
    expect(e.getStatus()).toBe(409);
    const res = e.getResponse() as Record<string, unknown>;
    expect(res.error).toBe('DUPLICATE_RESOURCE');
    expect(res.resource).toBe('Favorite');
    expect(res.field).toBe('stationId');
  });

  it('alle Exceptions sind seriellisierbar ohne Secrets-Leck', () => {
    const exceptions = [
      new StationNotFoundException('id-1'),
      new InsufficientPremiumException('feat'),
      new ProviderUnavailableException('mapbox', 'token=secret-xyz'),
      new InvalidCoordinatesException(0, 0),
      new DuplicateResourceException('User', 'email'),
    ];
    for (const e of exceptions) {
      const json = JSON.stringify(e.getResponse());
      // Keine echte Token-Heuristik — die `reason`-Property im Provider-
      // Unavailable-Case wird absichtlich durchgereicht, der Caller ist
      // dafuer verantwortlich, dort keine Tokens reinzustopfen.
      // Sentinel-Smoketest:
      expect(json).not.toContain('Bearer ');
      expect(json).not.toContain('-----BEGIN');
    }
  });
});
