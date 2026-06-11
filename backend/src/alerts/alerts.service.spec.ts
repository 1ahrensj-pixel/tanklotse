import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAlertDto } from './dto';

// Sweep-2-Befund: PUT /alerts/:id mit syntaktisch valider, aber unbekannter
// stationId lief als Prisma-FK-Verletzung (P2003) in einen 500er.
describe('AlertsService.update — FK-Behandlung', () => {
  const prisma = {
    priceAlert: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService & {
    priceAlert: { findFirst: jest.Mock; update: jest.Mock };
  };

  const service = new AlertsService(prisma);
  const userId = '00000000-0000-0000-0000-000000000001';
  const alertId = '00000000-0000-0000-0000-000000000002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unbekannte stationId (FK-Verletzung P2003) → BadRequest statt 500', async () => {
    prisma.priceAlert.findFirst.mockResolvedValue({ id: alertId, userId });
    prisma.priceAlert.update.mockRejectedValue(
      Object.assign(new Error('FK violation'), { code: 'P2003' }),
    );

    await expect(
      service.update(userId, alertId, {
        stationId: '00000000-dead-beef-0000-000000000099',
      } as UpdateAlertDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fremder Alarm (nicht der eigene) → NotFound', async () => {
    prisma.priceAlert.findFirst.mockResolvedValue(null);

    await expect(
      service.update(userId, alertId, { active: false } as UpdateAlertDto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.priceAlert.update).not.toHaveBeenCalled();
  });

  it('andere Prisma-Fehler werden unveraendert weitergereicht', async () => {
    prisma.priceAlert.findFirst.mockResolvedValue({ id: alertId, userId });
    prisma.priceAlert.update.mockRejectedValue(
      Object.assign(new Error('DB down'), { code: 'P1001' }),
    );

    await expect(
      service.update(userId, alertId, { active: true } as UpdateAlertDto),
    ).rejects.toThrow('DB down');
  });
});
