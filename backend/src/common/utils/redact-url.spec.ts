import { redactQueryObject, redactQueryValue, redactUrlForLog } from './redact-url';

describe('redactUrlForLog', () => {
  it('maskiert Reset-/Verify-Tokens im Query-String', () => {
    expect(redactUrlForLog('/api/auth/verify?token=super-geheimes-token')).toBe(
      '/api/auth/verify?token=[REDACTED]',
    );
    expect(redactUrlForLog('/api/auth/reset?token=abc123')).toBe(
      '/api/auth/reset?token=[REDACTED]',
    );
  });

  it('kuerzt GPS-Koordinaten auf 2 Dezimalstellen (~1,1 km Raster)', () => {
    expect(redactUrlForLog('/api/stations/search?lat=50.938361&lng=6.959974&radius=5')).toBe(
      '/api/stations/search?lat=50.94&lng=6.96&radius=5',
    );
  });

  it('maskiert freie Such-/Adresstexte (q), unkritische Parameter bleiben', () => {
    expect(redactUrlForLog('/api/geo/search?q=Musterstrasse%201%20Koeln&limit=5')).toBe(
      '/api/geo/search?q=[REDACTED]&limit=5',
    );
  });

  it('maskiert nicht-numerische Koordinaten-Werte komplett', () => {
    expect(redactUrlForLog('/api/geo/reverse?lat=keine-zahl')).toBe(
      '/api/geo/reverse?lat=[REDACTED]',
    );
  });

  it('laesst URLs ohne Query-String unveraendert', () => {
    expect(redactUrlForLog('/api/stations/abc-123/prices')).toBe('/api/stations/abc-123/prices');
    expect(redactUrlForLog('')).toBe('');
  });
});

describe('redactQueryValue', () => {
  it('ist case-insensitive bei Parameternamen', () => {
    expect(redactQueryValue('Token', 'geheim')).toBe('[REDACTED]');
    expect(redactQueryValue('LAT', '50.938361')).toBe('50.94');
  });

  it('reicht unkritische Werte unveraendert durch', () => {
    expect(redactQueryValue('radius', '5')).toBe('5');
    expect(redactQueryValue('fuelType', 'diesel')).toBe('diesel');
  });
});

describe('redactQueryObject', () => {
  it('redaktiert sensible Keys und laesst das Original unveraendert', () => {
    const query = { token: 'geheim', lat: '50.938361', radius: '5' };
    const result = redactQueryObject(query);
    expect(result).toEqual({ token: '[REDACTED]', lat: '50.94', radius: '5' });
    // Kopie, keine Mutation des Express-Query-Objekts:
    expect(query.token).toBe('geheim');
  });

  it('redaktiert auch Array-Werte', () => {
    expect(redactQueryObject({ token: ['a', 'b'] })).toEqual({
      token: ['[REDACTED]', '[REDACTED]'],
    });
  });
});
