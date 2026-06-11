import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

describe('PushService', () => {
  let service: PushService;
  let prismaMock: { pushToken: { upsert: jest.Mock; updateMany: jest.Mock } };

  beforeEach(async () => {
    // Sicherstellen, dass FCM-Path leer ist — kein echter Service-Account-Lookup.
    delete process.env.FCM_SERVICE_ACCOUNT_PATH;

    prismaMock = {
      pushToken: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [PushService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(PushService);
  });

  describe('registerToken()', () => {
    it('upsertet Push-Token mit revokedAt=null', async () => {
      prismaMock.pushToken.upsert.mockResolvedValue({ id: 'tok-1' });
      const result = await service.registerToken('user-1', 'device-1', 'IOS', 'fcm-token-abc');

      expect(prismaMock.pushToken.upsert).toHaveBeenCalledWith({
        where: { userId_deviceId: { userId: 'user-1', deviceId: 'device-1' } },
        update: { fcmToken: 'fcm-token-abc', platform: 'IOS', revokedAt: null },
        create: { userId: 'user-1', deviceId: 'device-1', platform: 'IOS', fcmToken: 'fcm-token-abc' },
      });
      expect(result).toEqual({ id: 'tok-1' });
    });
  });

  describe('revoke()', () => {
    it('setzt revokedAt=now fuer den gegebenen Token', async () => {
      prismaMock.pushToken.updateMany.mockResolvedValue({ count: 1 });
      await service.revoke('user-1', 'fcm-token-abc');
      const call = prismaMock.pushToken.updateMany.mock.calls[0][0];
      expect(call.where).toEqual({ userId: 'user-1', fcmToken: 'fcm-token-abc' });
      expect(call.data.revokedAt).toBeInstanceOf(Date);
    });
  });

  describe('sendToTokens()', () => {
    it('ist no-op bei leerer Token-Liste', async () => {
      await expect(service.sendToTokens([], { title: 'x', body: 'y' })).resolves.toBeUndefined();
    });

    it('faellt auf Mock-Log zurueck, wenn FCM nicht konfiguriert ist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logger = (service as any).logger as { warn: (msg: string) => void };
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      await service.sendToTokens(['tok-1'], { title: 'Preisalarm', body: 'unter 1,70 €' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Push (mock'));
      warnSpy.mockRestore();
    });
  });
});
