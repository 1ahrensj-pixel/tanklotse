import { Test } from '@nestjs/testing';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';

describe('StationsController', () => {
  let controller: StationsController;
  let service: { complaint: jest.Mock };

  beforeEach(async () => {
    service = {
      complaint: jest.fn().mockResolvedValue({ ok: true, forwarded: false, complaintId: 'c-1' }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [StationsController],
      providers: [{ provide: StationsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(StationsController);
  });

  describe('POST /stations/:id/complaint', () => {
    it('reicht userId=null durch, wenn kein Nutzer am Request haengt (anonymer Flow)', async () => {
      await controller.complaint(
        'station-1',
        { type: 'WRONG_PRICE_E5', correction: '1.78' } as never,
        {} as never,
      );
      expect(service.complaint).toHaveBeenCalledWith('station-1', 'WRONG_PRICE_E5', '1.78', null);
    });

    it('reicht die userId des eingeloggten Nutzers durch', async () => {
      await controller.complaint(
        'station-1',
        { type: 'WRONG_STATUS' } as never,
        { user: { sub: 'user-123' } } as never,
      );
      expect(service.complaint).toHaveBeenCalledWith('station-1', 'WRONG_STATUS', undefined, 'user-123');
    });

    it('nutzt den optionalen JWT-Guard (kein 401 fuer anonyme Nutzer)', () => {
      const guards = Reflect.getMetadata('__guards__', StationsController.prototype.complaint);
      expect(guards).toEqual([OptionalJwtAuthGuard]);
    });
  });
});
