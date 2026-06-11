import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { LoggingInterceptor } from './logging.interceptor';

function makeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

const next: CallHandler = { handle: () => of(null) };

describe('LoggingInterceptor', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('maskiert Tokens im Query-String und anonymisiert die IP', async () => {
    const interceptor = new LoggingInterceptor();
    const context = makeContext({
      method: 'GET',
      originalUrl: '/api/auth/verify?token=super-geheimes-token',
      ip: '192.168.1.42',
    });

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logSpy).toHaveBeenCalledTimes(1);
    const message = String(logSpy.mock.calls[0][0]);
    expect(message).toContain('GET /api/auth/verify?token=[REDACTED]');
    expect(message).not.toContain('super-geheimes-token');
    expect(message).toContain('ip=192.168.1.0');
  });

  it('kuerzt GPS-Koordinaten auf 2 Dezimalstellen', async () => {
    const interceptor = new LoggingInterceptor();
    const context = makeContext({
      method: 'GET',
      originalUrl: '/api/stations/search?lat=50.938361&lng=6.959974&radius=5',
      ip: '10.0.0.7',
    });

    await lastValueFrom(interceptor.intercept(context, next));

    const message = String(logSpy.mock.calls[0][0]);
    expect(message).toContain('lat=50.94&lng=6.96&radius=5');
    expect(message).not.toContain('50.938361');
  });
});
