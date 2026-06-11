import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { FUEL_PROVIDER, FuelPriceProvider } from '../providers/fuel-price.interface';
import { FavoritesController } from './favorites.controller';

const user = { sub: 'u-1', email: 'u@x', role: 'USER' } as never;

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let prisma: {
    favorite: { findMany: jest.Mock; upsert: jest.Mock; deleteMany: jest.Mock };
    station: { findUnique: jest.Mock; upsert: jest.Mock };
  };
  let provider: jest.Mocked<FuelPriceProvider>;

  beforeEach(async () => {
    prisma = {
      favorite: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
      station: { findUnique: jest.fn(), upsert: jest.fn() },
    };
    provider = {
      attribution: 'mock',
      name: 'mock',
      search: jest.fn(),
      getDetail: jest.fn(),
      getPrices: jest.fn(),
      submitComplaint: jest.fn(),
    } as unknown as jest.Mocked<FuelPriceProvider>;

    const moduleRef = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: FUEL_PROVIDER, useValue: provider },
      ],
    }).compile();
    controller = moduleRef.get(FavoritesController);
  });

  describe('GET /favorites', () => {
    it('listet eigene Favoriten inkl. Station-Daten', async () => {
      const data = [{ id: 'f1', userId: 'u-1', stationId: 's1', station: { id: 's1' } }];
      prisma.favorite.findMany.mockResolvedValue(data);
      const result = await controller.list(user);
      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        include: { station: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(data);
    });
  });

  describe('POST /favorites', () => {
    const dto = { stationId: 's1', name: 'Mein Stammtanker' };

    it('legt Station on-the-fly an wenn sie nicht existiert', async () => {
      prisma.station.findUnique.mockResolvedValue(null);
      provider.getDetail.mockResolvedValue({
        id: 's1', name: 'Mock Station', brand: 'Aral', street: 'Hauptstr.', houseNumber: '1',
        postCode: '50996', place: 'Koeln', lat: 50.89, lng: 6.99, distanceKm: null, isOpen: true,
        prices: { e5: null, e10: null, diesel: null },
        openingTimes: [], overrides: [], wholeDay: false, state: null, lastUpdated: null,
      });
      prisma.favorite.upsert.mockResolvedValue({ id: 'f-new' });

      const result = await controller.add(user, dto);

      expect(provider.getDetail).toHaveBeenCalledWith('s1');
      expect(prisma.station.upsert).toHaveBeenCalled();
      expect(prisma.favorite.upsert).toHaveBeenCalledWith({
        where: { userId_stationId: { userId: 'u-1', stationId: 's1' } },
        update: {},
        create: { userId: 'u-1', stationId: 's1' },
      });
      expect(result).toEqual({ id: 'f-new' });
    });

    it('ueberspringt Station-Anlage wenn Station bereits existiert', async () => {
      prisma.station.findUnique.mockResolvedValue({ id: 's1' });
      prisma.favorite.upsert.mockResolvedValue({ id: 'f-new' });
      await controller.add(user, dto);
      expect(provider.getDetail).not.toHaveBeenCalled();
      expect(prisma.station.upsert).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /favorites/:stationId', () => {
    it('loescht NUR eigene Favoriten (where userId+stationId)', async () => {
      prisma.favorite.deleteMany.mockResolvedValue({ count: 1 });
      await controller.remove(user, 's-target');
      expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-1', stationId: 's-target' },
      });
    });
  });
});
