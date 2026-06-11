import { Injectable } from '@nestjs/common';

/**
 * Zentrale Berechnungslogik fuer den Lohnt-sich-Check.
 *
 * USP der App: nicht nur Literpreis vergleichen, sondern berechnen, ob sich
 * der Weg zur guenstigeren Tankstelle wirklich lohnt — inklusive
 * Break-even-Liter.
 *
 * Formeln (Spezifikation Punkt 6.6):
 *   priceAdvantage   = (referencePrice - targetPrice) * tankLiters
 *   detourFuelCost   = (extraDistanceKm * consumption / 100) * targetPrice
 *   timeCost         = additionalMinutes / 60 * hourlyValue        (optional)
 *   realSavings      = priceAdvantage - detourFuelCost - timeCost
 *   breakEvenLiters  = detourFuelCost / (referencePrice - targetPrice)
 */

export type Recommendation =
  | 'LOHNT_SICH'
  | 'LOHNT_SICH_KNAPP'
  | 'LOHNT_SICH_NICHT'
  | 'NUR_WENN_AUF_ROUTE'
  | 'ERST_AB_X_LITERN'
  | 'DATEN_UNSICHER';

export interface SavingCalculationInput {
  /** Literpreis der Vergleichsstation. */
  referencePrice: number;
  /** Literpreis der Zielstation. */
  targetPrice: number;
  /**
   * **Zusätzlicher Umweg in km** — _nicht_ die normale Entfernung zur Tankstelle!
   *
   * Definition: die zusätzliche Strecke (Hin und zurück, falls relevant), die
   * Du gegenüber Deinem Hauptweg fährst, wenn du an dieser Tankstelle hältst.
   *
   * - Tankstelle 5 km entfernt, aber genau auf dem Weg → `extraDistanceKm = 0`
   * - Tankstelle 5 km entfernt, 4 km Umweg → `extraDistanceKm = 4`
   *
   * Aufrufer ist verantwortlich, das korrekt zu setzen. Der Service rechnet
   * **immer** mit `extraDistanceKm`, niemals mit roher Entfernung.
   */
  extraDistanceKm: number;
  /** Verbrauch des Fahrzeugs in l/100km. */
  consumptionLPer100Km: number;
  /** Tankmenge in Litern. */
  tankLiters: number;
  /** Optional: Zusatzfahrzeit in Minuten. */
  additionalMinutes?: number;
  /** Optional: persoenlicher Stundenwert in EUR/h. */
  hourlyValueEur?: number;
  /** Optional: Datenqualitaet — wenn unklar (geschlossene Station, fehlende Preise) → DATEN_UNSICHER */
  dataConfidence?: 'high' | 'low';
}

export interface SavingCalculationResult {
  /** PreisDelta pro Liter (positiv = Ziel ist guenstiger). */
  priceDeltaPerLiter: number;
  /** Bruttovorteil rein durch guenstigeren Literpreis bei der vorgesehenen Tankmenge. */
  grossSavingEuro: number;
  /** Zusaetzliche Kraftstoffkosten durch Umweg. */
  detourCostEuro: number;
  /** Optional veranschlagte Zeitkosten. */
  timeCostEuro: number;
  /** Reale Ersparnis = brutto − Umweg − Zeit. */
  realSavingEuro: number;
  /** Lohnt sich ab X Litern (null wenn nicht definiert). */
  breakEvenLiters: number | null;
  /** Empfehlung als Enum. */
  recommendation: Recommendation;
  /** Menschenlesbare deutsche Erklaerung. */
  explanation: string;
}

interface Thresholds {
  lohntAb: number;
  knappAb: number;
}

@Injectable()
export class SavingsService {
  private readonly thresholds: Thresholds;

  constructor() {
    this.thresholds = {
      lohntAb: parseEnvNumber('SAVINGS_LOHNT_AB_EUR', 2.0),
      knappAb: parseEnvNumber('SAVINGS_KNAPP_AB_EUR', 0.5),
    };
  }

  /**
   * Hauptfunktion: berechnet alles auf einmal.
   */
  calculate(input: SavingCalculationInput): SavingCalculationResult {
    this.assertValid(input);

    if (input.dataConfidence === 'low') {
      return {
        priceDeltaPerLiter: 0,
        grossSavingEuro: 0,
        detourCostEuro: 0,
        timeCostEuro: 0,
        realSavingEuro: 0,
        breakEvenLiters: null,
        recommendation: 'DATEN_UNSICHER',
        explanation:
          'Die Datenlage ist unsicher (z. B. fehlender Preis oder geschlossene Tankstelle). Empfehlung: lieber spaeter pruefen.',
      };
    }

    const priceDelta = input.referencePrice - input.targetPrice;
    const grossSaving = priceDelta * input.tankLiters;
    const detourCost = ((input.extraDistanceKm * input.consumptionLPer100Km) / 100) * input.targetPrice;
    const timeCost =
      input.additionalMinutes != null && input.hourlyValueEur != null
        ? (input.additionalMinutes / 60) * input.hourlyValueEur
        : 0;
    const realSaving = grossSaving - detourCost - timeCost;
    const breakEven = this.calculateBreakEven(priceDelta, detourCost);

    const recommendation = this.classify({
      priceDelta,
      realSaving,
      breakEven,
      tankLiters: input.tankLiters,
      extraDistanceKm: input.extraDistanceKm,
    });
    const explanation = this.explain({
      grossSaving,
      detourCost,
      timeCost,
      realSaving,
      tankLiters: input.tankLiters,
      extraDistanceKm: input.extraDistanceKm,
      breakEven,
      recommendation,
    });

    return {
      priceDeltaPerLiter: round(priceDelta, 3),
      grossSavingEuro: round(grossSaving, 2),
      detourCostEuro: round(detourCost, 2),
      timeCostEuro: round(timeCost, 2),
      realSavingEuro: round(realSaving, 2),
      breakEvenLiters: breakEven === null ? null : round(breakEven, 1),
      recommendation,
      explanation,
    };
  }

  /**
   * Reine Mathematik fuer Break-even-Liter.
   *  priceDelta > 0 und detourCost > 0  →  detourCost / priceDelta
   *  priceDelta > 0 und detourCost = 0  →  0 (lohnt sich sofort)
   *  priceDelta <= 0                    →  null (preislich nicht guenstiger)
   */
  calculateBreakEven(priceDelta: number, detourCost: number): number | null {
    if (priceDelta <= 0) return null;
    if (detourCost <= 0) return 0;
    return detourCost / priceDelta;
  }

  /**
   * Vergleicht eine Liste von Optionen gegen eine Referenz-Baseline und
   * sortiert sie nach realer Ersparnis (groesste zuerst).
   */
  rankByRealValue<T extends { pricePerLiter: number; extraDistanceKm: number }>(
    options: T[],
    consumptionLPer100Km: number,
    tankLiters: number,
    referencePrice: number,
  ): Array<T & { result: SavingCalculationResult }> {
    if (options.length === 0) return [];
    return options
      .map((o) => ({
        ...o,
        result: this.calculate({
          referencePrice,
          targetPrice: o.pricePerLiter,
          extraDistanceKm: o.extraDistanceKm,
          consumptionLPer100Km,
          tankLiters,
        }),
      }))
      .sort((a, b) => b.result.realSavingEuro - a.result.realSavingEuro);
  }

  // ---- privates ---------------------------------------------------------

  private classify(args: {
    priceDelta: number;
    realSaving: number;
    breakEven: number | null;
    tankLiters: number;
    extraDistanceKm: number;
  }): Recommendation {
    if (args.realSaving >= this.thresholds.lohntAb) return 'LOHNT_SICH';
    if (args.realSaving >= this.thresholds.knappAb) return 'LOHNT_SICH_KNAPP';
    // Preisvorteil pro Liter, aber bei dieser Tankmenge frisst der Umweg ihn auf
    if (args.priceDelta > 0 && args.breakEven !== null && args.tankLiters < args.breakEven) {
      return 'ERST_AB_X_LITERN';
    }
    // Kein nennenswerter Umweg, aber auch kein nennenswerter Vorteil → nur wenn man eh vorbeifaehrt
    if (args.priceDelta > 0 && args.extraDistanceKm <= 0.5) {
      return 'NUR_WENN_AUF_ROUTE';
    }
    return 'LOHNT_SICH_NICHT';
  }

  private explain(args: {
    grossSaving: number;
    detourCost: number;
    timeCost: number;
    realSaving: number;
    tankLiters: number;
    extraDistanceKm: number;
    breakEven: number | null;
    recommendation: Recommendation;
  }): string {
    const fmt = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
    const base = `Du sparst rechnerisch ${fmt(args.grossSaving)} bei ${args.tankLiters} Litern. Der Umweg von ${args.extraDistanceKm.toFixed(1).replace('.', ',')} km kostet ca. ${fmt(args.detourCost)} Kraftstoff.`;
    const time = args.timeCost > 0 ? ` Plus ca. ${fmt(args.timeCost)} Zeitkosten.` : '';
    const summary = ` Reale Ersparnis: ${fmt(args.realSaving)}.`;
    const verdictText: Record<Recommendation, string> = {
      LOHNT_SICH: ' Empfehlung: lohnt sich.',
      LOHNT_SICH_KNAPP: ' Empfehlung: lohnt sich knapp.',
      LOHNT_SICH_NICHT: ' Empfehlung: lohnt sich nicht.',
      NUR_WENN_AUF_ROUTE: ' Empfehlung: nur sinnvoll, wenn du sowieso dort vorbeifaehrst.',
      ERST_AB_X_LITERN:
        args.breakEven !== null
          ? ` Empfehlung: lohnt sich erst ab ${args.breakEven.toFixed(0)} Litern.`
          : ' Empfehlung: lohnt sich erst bei groesserer Tankmenge.',
      DATEN_UNSICHER: ' Empfehlung: lieber spaeter pruefen.',
    };
    return base + time + summary + verdictText[args.recommendation];
  }

  private assertValid(i: SavingCalculationInput) {
    if (!Number.isFinite(i.referencePrice) || i.referencePrice <= 0) {
      throw new Error('referencePrice ungueltig');
    }
    if (!Number.isFinite(i.targetPrice) || i.targetPrice <= 0) {
      throw new Error('targetPrice ungueltig');
    }
    if (!Number.isFinite(i.extraDistanceKm) || i.extraDistanceKm < 0) {
      throw new Error('extraDistanceKm ungueltig');
    }
    if (!Number.isFinite(i.consumptionLPer100Km) || i.consumptionLPer100Km <= 0) {
      throw new Error('consumptionLPer100Km ungueltig');
    }
    if (!Number.isFinite(i.tankLiters) || i.tankLiters <= 0) {
      throw new Error('tankLiters ungueltig');
    }
    // Optionale Zeitwerte: wenn gesetzt, muessen sie endlich und nicht-negativ
    // sein. Negative Werte wuerden die reale Ersparnis kuenstlich erhoehen
    // (Audit-Finding §5 / Pruefbericht 2026-05-06).
    if (i.additionalMinutes != null) {
      if (!Number.isFinite(i.additionalMinutes) || i.additionalMinutes < 0) {
        throw new Error('additionalMinutes ungueltig');
      }
    }
    if (i.hourlyValueEur != null) {
      if (!Number.isFinite(i.hourlyValueEur) || i.hourlyValueEur < 0) {
        throw new Error('hourlyValueEur ungueltig');
      }
    }
  }
}

function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

function parseEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
