import { SavingsService } from '../savings/savings.service';
import { FuelTypeDto } from '../recommendations/dto';
import { HighwayService } from './highway.service';
import { NoOpRoutingProvider } from './noop-routing.provider';
import type { FuelPriceProvider } from '../providers/fuel-price.interface';
import { MockRoutingProvider } from './mock-routing.provider';

describe('HighwayService', () => {
  it('liefert PREPARED-Status mit NoOpRoutingProvider', async () => {
    const svc = new HighwayService(new NoOpRoutingProvider(), new SavingsService());
    const r = await svc.exitCheck({
      currentLat: 50.93,
      currentLng: 6.95,
      fuelType: FuelTypeDto.DIESEL,
      tankLiters: 60,
      consumptionLPer100Km: 8,
      maxExitDetourKm: 5,
    });
    expect(r.status).toBe('PREPARED');
    expect(r.message).toContain('Routing-Provider');
  });

  it('liefert mit MockRoutingProvider Empfehlungen mit Lohnt-sich-Check', async () => {
    const fuelStub: FuelPriceProvider = {
      name: 'stub',
      attribution: 'Test',
      async search() {
        return [
          {
            id: 's1', name: 'Autobahn', brand: 'X', street: 's', houseNumber: '1',
            postCode: '50996', place: 'Köln', lat: 50.93, lng: 6.95,
            distanceKm: 0.5, isOpen: true,
            prices: { e5: null, e10: null, diesel: 1.899 },
          },
          {
            id: 's2', name: 'Abfahrt', brand: 'Y', street: 's', houseNumber: '2',
            postCode: '50996', place: 'Köln', lat: 50.94, lng: 6.96,
            distanceKm: 3.2, isOpen: true,
            prices: { e5: null, e10: null, diesel: 1.679 },
          },
        ];
      },
      async getDetail() { throw new Error('nope'); },
      async getPrices() { return {}; },
      async submitComplaint() { return { ok: true, forwarded: false }; },
    };
    const svc = new HighwayService(new MockRoutingProvider(fuelStub), new SavingsService());
    const r = await svc.exitCheck({
      currentLat: 50.93, currentLng: 6.95,
      fuelType: FuelTypeDto.DIESEL,
      tankLiters: 60,
      consumptionLPer100Km: 8.5,
      maxExitDetourKm: 8,
    });
    expect(r.status).toBe('OK');
    expect(r.recommendations).toBeDefined();
    expect(r.recommendations!.length).toBe(2);
    // s2 (3.2 km Umweg, 22 ct guenstiger) sollte real lohnen
    const s2 = r.recommendations!.find((c) => c.stationId === 's2')!;
    expect(s2.realSavingEuro).toBeGreaterThan(0);
  });
});
