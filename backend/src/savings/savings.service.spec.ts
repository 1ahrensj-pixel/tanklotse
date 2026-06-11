import { SavingsService } from './savings.service';

describe('SavingsService', () => {
  let svc: SavingsService;

  beforeEach(() => {
    delete process.env.SAVINGS_LOHNT_AB_EUR;
    delete process.env.SAVINGS_KNAPP_AB_EUR;
    svc = new SavingsService();
  });

  describe('Spec-Beispiele aus Master-Prompt §15', () => {
    it('Beispiel 1: Diesel 1,70 → 1,60 / 50 l / 4 km / 8 l-100km → +4,49 € lohnt_sich', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        tankLiters: 50,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
      });
      expect(r.grossSavingEuro).toBeCloseTo(5.0, 2);
      expect(r.detourCostEuro).toBeCloseTo(0.51, 2);
      expect(r.realSavingEuro).toBeCloseTo(4.49, 2);
      expect(r.recommendation).toBe('LOHNT_SICH');
    });

    it('Beispiel 2: Diesel 1,70 → 1,68 / 40 l / 8 km / 10 l-100km → -0,54 € (lohnt sich erst bei mehr Litern)', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.68,
        tankLiters: 40,
        extraDistanceKm: 8,
        consumptionLPer100Km: 10,
      });
      expect(r.grossSavingEuro).toBeCloseTo(0.8, 2);
      expect(r.detourCostEuro).toBeCloseTo(1.34, 2);
      expect(r.realSavingEuro).toBeLessThan(0);
      // Bei dieser Konstellation ist breakEven ≈ 67 l → ERST_AB_X_LITERN ist
      // technisch korrekter als LOHNT_SICH_NICHT, weil bei groesserer Tankmenge
      // der Stop tatsaechlich rentabel wuerde.
      expect(r.recommendation).toBe('ERST_AB_X_LITERN');
      expect(r.breakEvenLiters).toBeCloseTo(67.2, 0);
    });
  });

  describe('Break-even-Liter (§7.3)', () => {
    it('Fall 1: 1,70 vs 1,60 / Umweg 2,00 € → 20 Liter', () => {
      // priceDelta = 0.10 €, detourCost wird so berechnet, dass 0.10 * extraDist * cons / 100 * target = 2.00
      // hier setzen wir es direkt:
      const breakEven = svc.calculateBreakEven(0.1, 2.0);
      expect(breakEven).toBeCloseTo(20, 5);
    });

    it('Fall 2: gleicher Preis → null', () => {
      expect(svc.calculateBreakEven(0, 1.0)).toBeNull();
    });

    it('Fall 3: Ziel teurer → null', () => {
      expect(svc.calculateBreakEven(-0.05, 1.0)).toBeNull();
    });

    it('Fall 4: kein Umweg → 0 Liter (lohnt sofort)', () => {
      expect(svc.calculateBreakEven(0.1, 0)).toBe(0);
    });
  });

  describe('Recommendation-Klassen', () => {
    it('LOHNT_SICH bei realSaving >= 2 €', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        tankLiters: 50,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
      });
      expect(r.recommendation).toBe('LOHNT_SICH');
    });

    it('LOHNT_SICH_KNAPP zwischen 0,50 € und 2,00 €', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.65,
        tankLiters: 30,
        extraDistanceKm: 1,
        consumptionLPer100Km: 7,
      });
      // gross 1.50, detour ≈ 0.115 → real ≈ 1.39 → KNAPP
      expect(r.recommendation).toBe('LOHNT_SICH_KNAPP');
    });

    it('NUR_WENN_AUF_ROUTE bei kleinem Vorteil und kaum Umweg', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.69,
        tankLiters: 20,
        extraDistanceKm: 0.3,
        consumptionLPer100Km: 7,
      });
      expect(r.recommendation).toBe('NUR_WENN_AUF_ROUTE');
    });

    it('ERST_AB_X_LITERN bei guenstigerem Preis aber zu kleiner Tankmenge', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        tankLiters: 5, // viel zu wenig
        extraDistanceKm: 5,
        consumptionLPer100Km: 8,
      });
      expect(r.recommendation).toBe('ERST_AB_X_LITERN');
      expect(r.breakEvenLiters).not.toBeNull();
      expect(r.breakEvenLiters!).toBeGreaterThan(5);
    });

    it('DATEN_UNSICHER bei dataConfidence=low', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        tankLiters: 50,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
        dataConfidence: 'low',
      });
      expect(r.recommendation).toBe('DATEN_UNSICHER');
      expect(r.realSavingEuro).toBe(0);
    });
  });

  describe('Konfigurierbare Schwellen', () => {
    it('respektiert SAVINGS_LOHNT_AB_EUR=5', () => {
      process.env.SAVINGS_LOHNT_AB_EUR = '5';
      const local = new SavingsService();
      const r = local.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        tankLiters: 50,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
      });
      // realSaving ≈ 4.49 < 5 → KNAPP statt LOHNT_SICH
      expect(r.recommendation).toBe('LOHNT_SICH_KNAPP');
    });
  });

  describe('rankByRealValue', () => {
    it('sortiert absteigend nach realer Ersparnis', () => {
      const ranked = svc.rankByRealValue(
        [
          { id: 'A', pricePerLiter: 1.629, extraDistanceKm: 4.8 },
          { id: 'B', pricePerLiter: 1.659, extraDistanceKm: 1.2 },
          { id: 'C', pricePerLiter: 1.689, extraDistanceKm: 0 },
        ],
        8,
        50,
        1.689,
      );
      expect(ranked.length).toBe(3);
      expect(ranked[0].result.realSavingEuro).toBeGreaterThanOrEqual(ranked[1].result.realSavingEuro);
      expect(ranked[1].result.realSavingEuro).toBeGreaterThanOrEqual(ranked[2].result.realSavingEuro);
    });
  });

  describe('Validation', () => {
    it('wirft bei negativem Preis', () => {
      expect(() =>
        svc.calculate({
          referencePrice: -1,
          targetPrice: 1.6,
          tankLiters: 50,
          extraDistanceKm: 4,
          consumptionLPer100Km: 8,
        }),
      ).toThrow('referencePrice');
    });

    it('wirft bei Tankmenge 0', () => {
      expect(() =>
        svc.calculate({
          referencePrice: 1.7,
          targetPrice: 1.6,
          tankLiters: 0,
          extraDistanceKm: 4,
          consumptionLPer100Km: 8,
        }),
      ).toThrow('tankLiters');
    });

    // Externer Pruefbericht 2026-05-06 §5: optionale Zeitwerte werden nicht
    // validiert → negative Werte koennten reale Ersparnis kuenstlich erhoehen.
    it('wirft bei negativem additionalMinutes', () => {
      expect(() =>
        svc.calculate({
          referencePrice: 1.7,
          targetPrice: 1.6,
          tankLiters: 50,
          extraDistanceKm: 4,
          consumptionLPer100Km: 8,
          additionalMinutes: -30,
          hourlyValueEur: 30,
        }),
      ).toThrow('additionalMinutes');
    });

    it('wirft bei negativem hourlyValueEur', () => {
      expect(() =>
        svc.calculate({
          referencePrice: 1.7,
          targetPrice: 1.6,
          tankLiters: 50,
          extraDistanceKm: 4,
          consumptionLPer100Km: 8,
          additionalMinutes: 30,
          hourlyValueEur: -100,
        }),
      ).toThrow('hourlyValueEur');
    });

    it('wirft bei NaN additionalMinutes', () => {
      expect(() =>
        svc.calculate({
          referencePrice: 1.7,
          targetPrice: 1.6,
          tankLiters: 50,
          extraDistanceKm: 4,
          consumptionLPer100Km: 8,
          additionalMinutes: Number.NaN,
          hourlyValueEur: 30,
        }),
      ).toThrow('additionalMinutes');
    });

    it('akzeptiert additionalMinutes=0 und hourlyValueEur=0', () => {
      expect(() =>
        svc.calculate({
          referencePrice: 1.7,
          targetPrice: 1.6,
          tankLiters: 50,
          extraDistanceKm: 4,
          consumptionLPer100Km: 8,
          additionalMinutes: 0,
          hourlyValueEur: 0,
        }),
      ).not.toThrow();
    });

    it('positive Zeitkosten reduzieren reale Ersparnis korrekt (kein Vorzeichen-Bug)', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        tankLiters: 50,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
        additionalMinutes: 30,
        hourlyValueEur: 30,
      });
      expect(r.timeCostEuro).toBeCloseTo(15, 2);
      // grossSaving 5 €, detourCost ~0.51 €, timeCost 15 € → realSaving < 0
      expect(r.realSavingEuro).toBeLessThan(0);
    });
  });

  describe('Erklaertext', () => {
    it('enthaelt Empfehlung und €-Betrag in deutscher Notation', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        tankLiters: 50,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
      });
      expect(r.explanation).toMatch(/€/);
      expect(r.explanation).toMatch(/Empfehlung/);
      expect(r.explanation).toMatch(/lohnt sich/);
    });
  });

  // §7.4 (externer Pruefbericht): Pflicht-Edge-Cases.
  describe('Pflichtfaelle aus externem Pruefbericht §7.4', () => {
    it('Fall A: Ziel guenstiger, aber Tankmenge unter Break-even → ERST_AB_X_LITERN', () => {
      // priceDelta 0.10 €, detourCost = 8*8/100*1.6 = 1.024 €
      // breakEven = 10.24 l, tankLiters 5 → unter break-even
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        extraDistanceKm: 8,
        consumptionLPer100Km: 8,
        tankLiters: 5,
      });
      expect(r.recommendation).toBe('ERST_AB_X_LITERN');
      expect(r.breakEvenLiters).not.toBeNull();
      expect(r.breakEvenLiters!).toBeGreaterThan(5);
      expect(r.realSavingEuro).toBeLessThan(0);
    });

    it('Fall B: Ziel guenstiger und liegt auf Route (extraDistanceKm=0) → lohnt sofort', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        extraDistanceKm: 0,
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(r.detourCostEuro).toBeCloseTo(0, 5);
      expect(r.breakEvenLiters).toBe(0);
      expect(r.recommendation).toBe('LOHNT_SICH'); // 5 € real >> 2 € Schwelle
    });

    it('Fall C: Ziel teurer als Referenz → LOHNT_SICH_NICHT, breakEven null', () => {
      const r = svc.calculate({
        referencePrice: 1.6,
        targetPrice: 1.7,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(r.priceDeltaPerLiter).toBeLessThan(0);
      expect(r.breakEvenLiters).toBeNull();
      expect(r.recommendation).toBe('LOHNT_SICH_NICHT');
    });

    it('Fall D: gute Brutto-Ersparnis wird durch Zeitkosten aufgefressen → LOHNT_SICH_NICHT', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
        tankLiters: 50,
        additionalMinutes: 30,
        hourlyValueEur: 30,
      });
      expect(r.timeCostEuro).toBeCloseTo(15, 2);
      expect(r.realSavingEuro).toBeLessThan(0);
      // Mit dem Zeitkosten-Anteil rutscht es klar aus LOHNT_SICH heraus.
      expect(['LOHNT_SICH_NICHT', 'ERST_AB_X_LITERN']).toContain(r.recommendation);
    });

    it('Fall E: dataConfidence=low → DATEN_UNSICHER, keine Empfehlungs-Zahl', () => {
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.55,
        extraDistanceKm: 4,
        consumptionLPer100Km: 8,
        tankLiters: 50,
        dataConfidence: 'low',
      });
      expect(r.recommendation).toBe('DATEN_UNSICHER');
      expect(r.realSavingEuro).toBe(0);
      expect(r.grossSavingEuro).toBe(0);
    });
  });

  // §7.5 — Entfernung vs. Umweg
  describe('Entfernung vs. Umweg', () => {
    it('Station 5 km entfernt aber auf Route (extraDistanceKm=0.2) rechnet mit 0.2 km, nicht 5', () => {
      // Wenn die App faelschlicherweise 5 km als Umweg eintraegt:
      // detourCost = 5*8/100*1.6 = 0.64 €
      // priceDelta=0.10 → grossSaving=5 → real=4.36 → LOHNT_SICH
      // Mit korrektem 0.2 km Umweg:
      // detourCost = 0.2*8/100*1.6 = 0.0256 € → real ≈ 4.97 €
      const r = svc.calculate({
        referencePrice: 1.7,
        targetPrice: 1.6,
        extraDistanceKm: 0.2,
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(r.detourCostEuro).toBeLessThan(0.1);
      expect(r.realSavingEuro).toBeGreaterThan(4.9);
    });
  });
});
