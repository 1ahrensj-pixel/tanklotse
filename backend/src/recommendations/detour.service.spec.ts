import { SavingsService } from '../savings/savings.service';
import { DetourService } from './detour.service';

describe('DetourService (Wrapper auf SavingsService)', () => {
  const svc = new DetourService(new SavingsService());

  it('berechnet das Beispiel aus der Spezifikation korrekt', () => {
    // Vergleichspreis 1.689, Zielpreis 1.629 (= 6 ct guenstiger), 4.8 km Umweg,
    // Verbrauch 8 l/100 km, 50 l Tank
    const r = svc.calculate({
      comparisonPricePerLiter: 1.689,
      targetPricePerLiter: 1.629,
      detourKm: 4.8,
      consumptionLPer100Km: 8,
      tankLiters: 50,
    });
    expect(r.priceAdvantageEur).toBeCloseTo(3.0, 2);
    expect(r.detourFuelCostEur).toBeCloseTo(0.63, 2);
    expect(r.realSavingsEur).toBeCloseTo(2.37, 2);
    expect(r.verdict).toBe('lohnt_sich');
  });

  it('beruecksichtigt Zeitkosten, wenn Stundenwert gesetzt ist', () => {
    const r = svc.calculate({
      comparisonPricePerLiter: 1.799,
      targetPricePerLiter: 1.749,
      detourKm: 5,
      consumptionLPer100Km: 7,
      tankLiters: 40,
      additionalMinutes: 10,
      hourlyValueEur: 30,
    });
    expect(r.priceAdvantageEur).toBeCloseTo(2.0, 2);
    expect(r.timeCostEur).toBeCloseTo(5.0, 2);
    expect(r.realSavingsEur).toBeLessThan(0);
    expect(r.verdict).toBe('lohnt_sich_nicht');
  });

  it('klassifiziert "nur wenn vorbei", wenn Vorteil winzig und Umweg <= 0.5 km', () => {
    const r = svc.calculate({
      comparisonPricePerLiter: 1.7,
      targetPricePerLiter: 1.69,
      detourKm: 0.3,
      consumptionLPer100Km: 7,
      tankLiters: 20,
    });
    expect(r.verdict).toBe('nur_wenn_vorbei');
  });

  it('liefert breakEvenLiters in der Antwort (NEU)', () => {
    const r = svc.calculate({
      comparisonPricePerLiter: 1.7,
      targetPricePerLiter: 1.6,
      detourKm: 4,
      consumptionLPer100Km: 8,
      tankLiters: 50,
    });
    expect(r.breakEvenLiters).not.toBeNull();
    expect(r.breakEvenLiters!).toBeGreaterThan(0);
  });

  it('wirft bei ungueltigen Eingaben (Wrapper delegiert an SavingsService)', () => {
    expect(() =>
      svc.calculate({
        comparisonPricePerLiter: 0,
        targetPricePerLiter: 1,
        detourKm: 1,
        consumptionLPer100Km: 7,
        tankLiters: 50,
      }),
    ).toThrow('referencePrice');

    expect(() =>
      svc.calculate({
        comparisonPricePerLiter: 1.7,
        targetPricePerLiter: 1.6,
        detourKm: -1,
        consumptionLPer100Km: 7,
        tankLiters: 50,
      }),
    ).toThrow('extraDistanceKm');
  });

  it('rankByRealValue sortiert guenstigste reale Wahl nach oben', () => {
    const ranked = svc.rankByRealValue(
      [
        { id: 'A', pricePerLiter: 1.629, detourKm: 4.8 },
        { id: 'B', pricePerLiter: 1.659, detourKm: 1.2 },
        { id: 'C', pricePerLiter: 1.689, detourKm: 0 },
      ],
      8,
      50,
    );
    expect(ranked.length).toBe(3);
    expect(ranked.find((r) => r.id === 'C')!.realSavingsEur).toBeCloseTo(0, 2);
  });

  it('Erklaertext ist deutsch und enthaelt EUR-Werte', () => {
    const r = svc.calculate({
      comparisonPricePerLiter: 1.799,
      targetPricePerLiter: 1.629,
      detourKm: 4.8,
      consumptionLPer100Km: 8,
      tankLiters: 55,
    });
    expect(r.explanation).toMatch(/€/);
    expect(r.explanation).toMatch(/Empfehlung/);
  });
});
