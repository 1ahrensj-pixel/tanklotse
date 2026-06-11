import { AlertType, FuelType, type PriceAlert } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { SavingsService } from '../savings/savings.service';
import { AlertsEvaluator, StationPriceSnapshot } from './alerts.evaluator';

function alert(overrides: Partial<PriceAlert>): PriceAlert {
  return {
    id: 'alert-1',
    userId: 'user-1',
    stationId: null,
    fuelType: FuelType.DIESEL,
    radiusKm: new Decimal(5),
    lat: new Decimal(50.93),
    lng: new Decimal(6.95),
    maxPrice: new Decimal(1.6),
    active: true,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    timeWindowStart: null,
    timeWindowEnd: null,
    lastTriggeredAt: null,
    alertType: AlertType.MAX_PRICE,
    minRealSavingEur: null,
    tankLiters: null,
    consumptionLPer100Km: null,
    maxExtraDistanceKm: null,
    onlyOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PriceAlert;
}

const stations: StationPriceSnapshot[] = [
  { id: 's1', lat: 50.93, lng: 6.95, price: 1.79, isOpen: true, distanceKm: 0.5 },
  { id: 's2', lat: 50.94, lng: 6.96, price: 1.59, isOpen: true, distanceKm: 4.8 },
  { id: 's3', lat: 50.92, lng: 6.94, price: 1.55, isOpen: false, distanceKm: 1.8 },
];

describe('AlertsEvaluator', () => {
  const evaluator = new AlertsEvaluator(new SavingsService());

  describe('MAX_PRICE', () => {
    it('triggert wenn billigste offene Station <= maxPrice', () => {
      const a = alert({ alertType: AlertType.MAX_PRICE, maxPrice: new Decimal(1.6) });
      const t = evaluator.evaluate(a, stations);
      expect(t).not.toBeNull();
      expect(t!.stationId).toBe('s2');
      expect(t!.triggerPrice).toBeCloseTo(1.59, 2);
    });

    it('triggert nicht, wenn nur die geschlossene Station unter maxPrice ist (onlyOpen=true)', () => {
      const a = alert({ alertType: AlertType.MAX_PRICE, maxPrice: new Decimal(1.56), onlyOpen: true });
      expect(evaluator.evaluate(a, stations)).toBeNull();
    });
  });

  describe('REAL_SAVING', () => {
    it('triggert wenn echte Ersparnis >= 5 € erreicht ist', () => {
      const a = alert({
        alertType: AlertType.REAL_SAVING,
        minRealSavingEur: new Decimal(5),
        tankLiters: new Decimal(60),
        consumptionLPer100Km: new Decimal(7),
        maxExtraDistanceKm: new Decimal(10),
      });
      const t = evaluator.evaluate(a, stations);
      // avg = (1.79 + 1.59) / 2 = 1.69
      // s2: priceDelta = 0.10, gross = 6 €, detour = 0.534, real ≈ 5.47 € → trigger
      expect(t).not.toBeNull();
      expect(t!.realSavingEuro!).toBeGreaterThanOrEqual(5);
    });

    it('triggert nicht, wenn Umweg die Ersparnis frisst (zu enges maxExtraDistanceKm)', () => {
      const a = alert({
        alertType: AlertType.REAL_SAVING,
        minRealSavingEur: new Decimal(2),
        tankLiters: new Decimal(40),
        consumptionLPer100Km: new Decimal(8),
        maxExtraDistanceKm: new Decimal(0.5), // < distance 4.8 → s2 ausgeschlossen
      });
      const t = evaluator.evaluate(a, stations);
      // s1 ist innerhalb 0.5 km, aber teurer als avg → kein realSaving
      expect(t).toBeNull();
    });

    it('triggert nicht ohne Konfiguration (Pflichtfelder fehlen)', () => {
      const a = alert({ alertType: AlertType.REAL_SAVING, minRealSavingEur: null });
      expect(evaluator.evaluate(a, stations)).toBeNull();
    });
  });
});
