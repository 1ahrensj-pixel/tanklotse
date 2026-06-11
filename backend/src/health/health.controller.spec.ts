import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaMock: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prismaMock = { $queryRaw: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  describe('GET /health', () => {
    it('gibt status=ok und uptimeSec zurueck', () => {
      const result = controller.health();
      expect(result.status).toBe('ok');
      expect(result.uptimeSec).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.uptimeSec)).toBe(true);
    });
  });

  describe('GET /ready', () => {
    it('liefert status=ready wenn DB antwortet', async () => {
      prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const result = await controller.ready();
      expect(result.status).toBe('ready');
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('wirft Fehler durch wenn DB nicht erreichbar', async () => {
      prismaMock.$queryRaw.mockRejectedValue(new Error('connection refused'));
      await expect(controller.ready()).rejects.toThrow('connection refused');
    });
  });
});
