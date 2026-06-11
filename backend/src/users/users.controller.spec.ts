import { Test } from '@nestjs/testing';
import { ConsentType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let prisma: { userConsent: { findMany: jest.Mock; create: jest.Mock } };
  const user = { sub: 'u-1', email: 'u@x', role: 'USER' } as never;

  beforeEach(async () => {
    prisma = {
      userConsent: { findMany: jest.fn(), create: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = moduleRef.get(UsersController);
  });

  describe('GET /me/consents', () => {
    it('liefert eigene Consents (neueste zuerst)', async () => {
      const data = [
        { id: 'c1', userId: 'u-1', type: ConsentType.PRIVACY, accepted: true, version: 'v1.0', createdAt: new Date() },
      ];
      prisma.userConsent.findMany.mockResolvedValue(data);
      const result = await controller.list(user);
      expect(prisma.userConsent.findMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(data);
    });
  });

  describe('POST /me/consents', () => {
    it('legt Consent unter eigener userId an', async () => {
      const created = { id: 'c2', userId: 'u-1', type: ConsentType.TERMS, accepted: true, version: 'v1' };
      prisma.userConsent.create.mockResolvedValue(created);
      const result = await controller.set(user, {
        type: ConsentType.TERMS,
        accepted: true,
        version: 'v1',
      } as never);
      expect(prisma.userConsent.create).toHaveBeenCalledWith({
        data: { userId: 'u-1', type: ConsentType.TERMS, accepted: true, version: 'v1' },
      });
      expect(result).toBe(created);
    });
  });
});
