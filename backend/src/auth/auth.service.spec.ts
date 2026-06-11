import * as argon2 from 'argon2';

import { AuthService, AuthTokens, TotpChallenge } from './auth.service';

describe('AuthService.login (2FA-Step-up)', () => {
  const PASSWORD = 'korrektes-passwort-123';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
  });

  function makeSvc(user: Record<string, unknown>) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const jwt = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };
    // Oauth/Mailer werden im Login-Pfad nicht angefasst.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AuthService(prisma as any, jwt as any, null as any, null as any);
    return { svc, prisma, jwt };
  }

  const baseUser = () => ({
    id: 'u1',
    email: 'admin@tanklotse.de',
    role: 'ADMIN',
    failedLogins: 0,
    lockedUntil: null,
    passwordHash,
  });

  it('gibt bei totpEnabled KEINEN vollen Token aus, sondern eine TotpChallenge', async () => {
    const { svc, prisma, jwt } = makeSvc({ ...baseUser(), totpEnabled: true });

    const res = (await svc.login('admin@tanklotse.de', PASSWORD)) as TotpChallenge;

    expect(res.totpRequired).toBe(true);
    expect(res.preAuthToken).toBe('signed-jwt');
    expect(res).not.toHaveProperty('accessToken');
    expect(res).not.toHaveProperty('refreshToken');
    // Pre-Auth-Token traegt den totpPending-Claim und ist kurzlebig.
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'u1', totpPending: true }),
      expect.objectContaining({ expiresIn: '300s' }),
    );
    // Kein Refresh-Token vor abgeschlossenem Step-up.
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('bleibt ohne totpEnabled abwaertskompatibel: voller Token + Refresh-Token', async () => {
    const { svc, prisma, jwt } = makeSvc({ ...baseUser(), totpEnabled: false });

    const res = (await svc.login('admin@tanklotse.de', PASSWORD)) as AuthTokens;

    expect(res.accessToken).toBe('signed-jwt');
    expect(typeof res.refreshToken).toBe('string');
    expect(res).not.toHaveProperty('totpRequired');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.not.objectContaining({ totpPending: true }),
      expect.anything(),
    );
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('lehnt falsches Passwort auch bei totpEnabled ab (keine Challenge als Oracle)', async () => {
    const { svc, jwt } = makeSvc({ ...baseUser(), totpEnabled: true });

    await expect(svc.login('admin@tanklotse.de', 'falsches-passwort-123')).rejects.toThrow(
      'Login fehlgeschlagen.',
    );
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});

describe('AuthService.exportData', () => {
  function makeSvc(userPayload: Record<string, unknown> | null) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(userPayload),
      },
    };
    // Andere Konstruktor-Deps werden in dieser Methode nicht angefasst.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new AuthService(prisma as any, null as any, null as any, null as any);
  }

  it('liefert null fuer unbekannten User', async () => {
    const svc = makeSvc(null);
    expect(await svc.exportData('u1')).toBeNull();
  });

  it('entfernt passwordHash und totpSecret aus Export (DSGVO)', async () => {
    const svc = makeSvc({
      id: 'u1',
      email: 'x@y.de',
      passwordHash: 'argon2-hash-do-not-leak',
      totpSecret: 'secret-do-not-leak',
      consents: [],
      vehicles: [],
      favorites: [],
      alerts: [],
      pushTokens: [],
      complaints: [],
      subscriptions: [],
      savedRoutes: [],
    });
    const exp = (await svc.exportData('u1')) as Record<string, unknown>;
    expect(exp).not.toHaveProperty('passwordHash');
    expect(exp).not.toHaveProperty('totpSecret');
    expect(exp.email).toBe('x@y.de');
  });

  it('enthaelt savedRoutes (USP-Auflage §7.7)', async () => {
    const svc = makeSvc({
      id: 'u1',
      email: 'x@y.de',
      passwordHash: 'h',
      totpSecret: 's',
      consents: [],
      vehicles: [],
      favorites: [],
      alerts: [],
      pushTokens: [],
      complaints: [],
      subscriptions: [],
      savedRoutes: [
        { id: 'r1', name: 'Heimweg', startLabel: 'Köln', endLabel: 'Bonn' },
      ],
    });
    const exp = (await svc.exportData('u1')) as Record<string, unknown>;
    expect(exp).toHaveProperty('savedRoutes');
    expect((exp.savedRoutes as unknown[]).length).toBe(1);
  });
});
