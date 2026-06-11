import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ComplaintsController } from './complaints.controller';

describe('ComplaintsController', () => {
  let controller: ComplaintsController;
  let prisma: { complaint: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { complaint: { findMany: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      controllers: [ComplaintsController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = moduleRef.get(ComplaintsController);
  });

  it('listet bis zu 100 eigene Beschwerden, neueste zuerst', async () => {
    const data = [
      { id: 'c1', userId: 'u-1', type: 'WRONG_PRICE_E5', createdAt: new Date('2026-05-14T10:00:00Z') },
    ];
    prisma.complaint.findMany.mockResolvedValue(data);

    const result = await controller.list({ sub: 'u-1', email: 'u@x', role: 'USER' } as never);

    expect(prisma.complaint.findMany).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    expect(result).toEqual(data);
  });
});
