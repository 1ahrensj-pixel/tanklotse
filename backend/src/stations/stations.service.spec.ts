import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { FUEL_PROVIDER, FuelPriceProvider, ProviderStation, ProviderStationDetail } from '../providers/fuel-price.interface';
import { STATIONS_PERSISTENCE_PORT, StationsPersistencePort } from './ports/stations-persistence.port';
import { FuelTypeQuery, SearchStationsDto } from './dto';
import { StationsService } from './stations.service';

function makeStation(over: Partial<ProviderStation> = {}): ProviderStation {
  return {
    id: 'mock-1',
    name: 'Mock Station',
    brand: 'MOCK',
    street: 'Hauptstrasse',
    houseNumber: '1',
    postCode: '50996',
    place: 'Koeln',
    lat: 50.89,
    lng: 6.99,
    distanceKm: 2.5,
    isOpen: true,
    prices: { e5: 1.789, e10: 1.749, diesel: 1.629 },
    ...over,
  };
}

function makeDetail(over: Partial<ProviderStationDetail> = {}): ProviderStationDetail {
  return {
    id: 'mock-1',
    name: 'Mock Station',
    brand: 'MOCK',
    street: 'Hauptstrasse',
    houseNumber: '1',
    postCode: '50996',
    place: 'Koeln',
    lat: 50.89,
    lng: 6.99,
    distanceKm: null,
    isOpen: true,
    prices: { e5: 1.789, e10: 1.749, diesel: 1.629 },
    openingTimes: [],
    overrides: [],
    wholeDay: false,
    state: null,
    lastUpdated: null,
    ...over,
  };
}

describe('StationsService', () => {
  let service: StationsService;
  let provider: jest.Mocked<FuelPriceProvider>;
  let persistence: jest.Mocked<StationsPersistencePort>;

  beforeEach(async () => {
    provider = {
      attribution: 'MockProvider — Unit-Test',
      search: jest.fn(),
      getDetail: jest.fn(),
      getPrices: jest.fn(),
      submitComplaint: jest.fn(),
    } as unknown as jest.Mocked<FuelPriceProvider>;

    persistence = {
      findStationById: jest.fn(),
      upsertStation: jest.fn(),
      createComplaint: jest.fn(),
    } as unknown as jest.Mocked<StationsPersistencePort>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        StationsService,
        { provide: FUEL_PROVIDER, useValue: provider },
        { provide: STATIONS_PERSISTENCE_PORT, useValue: persistence },
      ],
    }).compile();
    service = moduleRef.get(StationsService);
  });

  describe('search()', () => {
    const baseDto: SearchStationsDto = {
      lat: 50.89,
      lng: 6.99,
      radius: 5,
      fuelType: FuelTypeQuery.DIESEL,
    } as SearchStationsDto;

    it('liefert alle Stationen + Attribution', async () => {
      provider.search.mockResolvedValue([makeStation(), makeStation({ id: 'mock-2' })]);
      const result = await service.search(baseDto);
      expect(result.attribution).toContain('MockProvider');
      expect(result.count).toBe(2);
      expect(result.stations).toHaveLength(2);
      expect(result.stations[0].selectedPrice).toBe(1.629); // DIESEL
    });

    it('filtert geschlossene Stationen mit onlyOpen=true', async () => {
      provider.search.mockResolvedValue([
        makeStation({ id: 'open-1', isOpen: true }),
        makeStation({ id: 'closed-1', isOpen: false }),
      ]);
      const result = await service.search({ ...baseDto, onlyOpen: true } as SearchStationsDto);
      expect(result.count).toBe(1);
      expect(result.stations[0].id).toBe('open-1');
    });

    it('respektiert brandFilter (case-insensitive)', async () => {
      provider.search.mockResolvedValue([
        makeStation({ id: 'a', brand: 'Aral' }),
        makeStation({ id: 'b', brand: 'Shell' }),
      ]);
      const result = await service.search({ ...baseDto, brandFilter: ['ARAL'] } as SearchStationsDto);
      expect(result.count).toBe(1);
      expect(result.stations[0].brand).toBe('Aral');
    });

    it('shapeStation setzt selectedPrice=null wenn fuelType unbekannt', async () => {
      provider.search.mockResolvedValue([makeStation()]);
      const result = await service.search({ ...baseDto, fuelType: 'OTHER' as FuelTypeQuery } as SearchStationsDto);
      expect(result.stations[0].selectedPrice).toBeNull();
    });
  });

  describe('detail()', () => {
    it('liefert station + attribution', async () => {
      provider.getDetail.mockResolvedValue(makeDetail());
      const result = await service.detail('mock-1');
      expect(result.station.id).toBe('mock-1');
      expect(result.attribution).toBeDefined();
    });

    it('wirft NotFoundException wenn Provider Error wirft', async () => {
      provider.getDetail.mockRejectedValue(new Error('Station nicht im Mock'));
      await expect(service.detail('9999')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('prices()', () => {
    it('liefert prices fuer bekannte Station', async () => {
      provider.getPrices.mockResolvedValue({ 'mock-1': { e5: 1.789, e10: 1.749, diesel: 1.629, isOpen: true } });
      const result = await service.prices('mock-1');
      expect(result.prices.diesel).toBe(1.629);
    });

    it('wirft NotFoundException wenn Provider null liefert', async () => {
      provider.getPrices.mockResolvedValue({});
      await expect(service.prices('9999')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('complaint()', () => {
    it('legt Station on-the-fly an wenn sie nicht im Cache ist', async () => {
      persistence.findStationById.mockResolvedValue(null);
      provider.getDetail.mockResolvedValue(makeDetail());
      provider.submitComplaint.mockResolvedValue({ ok: true, forwarded: true });

      const result = await service.complaint('mock-1', 'WRONG_PRICE_E5', '1.78', 'user-123');

      expect(persistence.upsertStation).toHaveBeenCalled();
      expect(provider.submitComplaint).toHaveBeenCalledWith({
        stationId: 'mock-1',
        type: 'WRONG_PRICE_E5',
        correction: '1.78',
      });
      expect(persistence.createComplaint).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FORWARDED', userId: 'user-123' }),
      );
      expect(result.forwarded).toBe(true);
    });

    it('ueberspringt on-the-fly-Anlage wenn Station bereits existiert', async () => {
      persistence.findStationById.mockResolvedValue({} as never);
      provider.submitComplaint.mockResolvedValue({ ok: true, forwarded: false });

      await service.complaint('mock-1', 'WRONG_STATUS', undefined, null);

      expect(provider.getDetail).not.toHaveBeenCalled();
      expect(persistence.upsertStation).not.toHaveBeenCalled();
      expect(persistence.createComplaint).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING', userId: null }),
      );
    });

    it('wirft Fehler, wenn Station weder in DB noch beim Provider', async () => {
      persistence.findStationById.mockResolvedValue(null);
      provider.getDetail.mockRejectedValue(new Error('not found'));
      await expect(
        service.complaint('ghost', 'WRONG_PRICE_E5', undefined, null),
      ).rejects.toThrow('Station ghost unbekannt');
    });
  });
});
