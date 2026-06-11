import { BadRequestException } from '@nestjs/common';
import { authenticator } from 'otplib';

import { AdminService } from './admin.service';

describe('AdminService.verifyTotp (2FA-Step-up)', () => {
  const secret = authenticator.generateSecret();

  function makeSvc(user: Record<string, unknown> | null) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
    };
    const auth = {
      issueTokensFor: jest.fn().mockResolvedValue({
        accessToken: 'voller-access-token',
        refreshToken: 'voller-refresh-token',
      }),
    };
    // Andere Konstruktor-Deps werden in dieser Methode nicht angefasst.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AdminService(prisma as any, auth as any);
    return { svc, auth };
  }

  it('stellt bei gueltigem Code vollwertige Tokens aus (issueTokens-Pfad)', async () => {
    const { svc, auth } = makeSvc({ id: 'u1', totpEnabled: true, totpSecret: secret });

    const res = await svc.verifyTotp('u1', authenticator.generate(secret));

    expect(auth.issueTokensFor).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
    );
    expect(res).toMatchObject({
      ok: true,
      accessToken: 'voller-access-token',
      refreshToken: 'voller-refresh-token',
    });
  });

  it('stellt bei ungueltigem Code KEINE Tokens aus', async () => {
    const { svc, auth } = makeSvc({ id: 'u1', totpEnabled: true, totpSecret: secret });

    await expect(svc.verifyTotp('u1', '000000')).rejects.toThrow(BadRequestException);
    expect(auth.issueTokensFor).not.toHaveBeenCalled();
  });

  it('lehnt Verify ab, wenn 2FA nicht aktiviert ist', async () => {
    const { svc, auth } = makeSvc({ id: 'u1', totpEnabled: false, totpSecret: secret });

    await expect(svc.verifyTotp('u1', '123456')).rejects.toThrow('2FA nicht aktiv.');
    expect(auth.issueTokensFor).not.toHaveBeenCalled();
  });
});
