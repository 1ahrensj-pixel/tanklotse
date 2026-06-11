import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AllowTotpPending, JwtAuthGuard } from './jwt-auth.guard';

// Testziel: Pre-Auth-Tokens (Claim totpPending) duerfen NUR Endpunkte mit
// @AllowTotpPending() erreichen — alle anderen antworten 401 TOTP_REQUIRED.
class DummyController {
  @AllowTotpPending()
  verify() {
    return null;
  }

  metrics() {
    return null;
  }
}

function makeContext(user: Record<string, unknown>, handlerName: 'verify' | 'metrics') {
  return {
    getHandler: () => DummyController.prototype[handlerName],
    getClass: () => DummyController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard (2FA-Step-up-Enforcement)', () => {
  const guard = new JwtAuthGuard(new Reflector());
  // Passport-Teil (Signatur/TTL-Pruefung) stubben — hier geht es nur um
  // die totpPending-Logik NACH erfolgreicher JWT-Validierung.
  const baseProto = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
    canActivate: (context: ExecutionContext) => Promise<boolean>;
  };

  beforeEach(() => {
    jest.spyOn(baseProto, 'canActivate').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lehnt totpPending-Token auf normalen Endpunkten mit 401 TOTP_REQUIRED ab', async () => {
    const ctx = makeContext({ sub: 'u1', role: 'ADMIN', totpPending: true }, 'metrics');

    const err = await guard.canActivate(ctx).then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect((err as UnauthorizedException).getResponse()).toMatchObject({
      error: 'TOTP_REQUIRED',
    });
  });

  it('laesst totpPending-Token auf @AllowTotpPending()-Endpunkten durch', async () => {
    const ctx = makeContext({ sub: 'u1', role: 'ADMIN', totpPending: true }, 'verify');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('laesst vollwertige Tokens (ohne totpPending) unveraendert durch', async () => {
    const ctx = makeContext({ sub: 'u1', role: 'ADMIN' }, 'metrics');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
