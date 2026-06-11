import { estimateConsumption, suggestedTankLiters } from './vehicle-estimates';

describe('vehicle-estimates', () => {
  describe('estimateConsumption', () => {
    it('SUV + city → 9.5 * 1.15 ≈ 10.9 l/100km', () => {
      expect(estimateConsumption('suv', 'city')).toBeCloseTo(10.9, 1);
    });

    it('Kompakt + highway → 6.5 * 0.92 ≈ 6.0 l/100km', () => {
      expect(estimateConsumption('compact', 'highway')).toBeCloseTo(6.0, 1);
    });

    it('Mittelklasse + mixed → 7.5 l/100km unveraendert', () => {
      expect(estimateConsumption('midsize', 'mixed')).toBeCloseTo(7.5, 1);
    });

    it('Wohnmobil + city → 13.5 * 1.15 ≈ 15.5 l/100km', () => {
      expect(estimateConsumption('rv', 'city')).toBeCloseTo(15.5, 1);
    });

    it('Custom liefert null', () => {
      expect(estimateConsumption('custom', 'mixed')).toBeNull();
    });
  });

  describe('suggestedTankLiters', () => {
    it.each([
      ['compact_small', 35],
      ['compact', 45],
      ['midsize', 55],
      ['suv', 60],
      ['van', 70],
      ['rv', 90],
    ] as const)('%s → %i l', (cls, expected) => {
      expect(suggestedTankLiters(cls)).toBe(expected);
    });

    it('Custom liefert null', () => {
      expect(suggestedTankLiters('custom')).toBeNull();
    });
  });
});
