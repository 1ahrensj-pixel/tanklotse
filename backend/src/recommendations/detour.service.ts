import { Injectable } from '@nestjs/common';

import { SavingsService, SavingCalculationResult } from '../savings/savings.service';

/**
 * Backward-kompatible Schicht über {@link SavingsService}.
 *
 * Die alten Verdict-Werte werden auf das erweiterte Recommendation-Enum gemappt,
 * sodass bestehende Mobile-Clients und Tests nicht brechen.
 */

export interface DetourInput {
  comparisonPricePerLiter: number;
  targetPricePerLiter: number;
  detourKm: number;
  consumptionLPer100Km: number;
  tankLiters: number;
  additionalMinutes?: number;
  hourlyValueEur?: number;
}

export type Verdict =
  | 'lohnt_sich'
  | 'lohnt_sich_knapp'
  | 'lohnt_sich_nicht'
  | 'nur_wenn_vorbei';

export interface DetourResult {
  priceAdvantageEur: number;
  detourFuelCostEur: number;
  timeCostEur: number;
  realSavingsEur: number;
  verdict: Verdict;
  explanation: string;
  /** NEU: Lohnt sich ab X Litern. Null wenn nicht definiert. */
  breakEvenLiters: number | null;
}

@Injectable()
export class DetourService {
  constructor(private readonly savings: SavingsService) {}

  calculate(input: DetourInput): DetourResult {
    const r: SavingCalculationResult = this.savings.calculate({
      referencePrice: input.comparisonPricePerLiter,
      targetPrice: input.targetPricePerLiter,
      tankLiters: input.tankLiters,
      extraDistanceKm: input.detourKm,
      consumptionLPer100Km: input.consumptionLPer100Km,
      additionalMinutes: input.additionalMinutes,
      hourlyValueEur: input.hourlyValueEur,
    });
    return {
      priceAdvantageEur: r.grossSavingEuro,
      detourFuelCostEur: r.detourCostEuro,
      timeCostEur: r.timeCostEuro,
      realSavingsEur: r.realSavingEuro,
      verdict: mapToLegacyVerdict(r.recommendation),
      explanation: r.explanation,
      breakEvenLiters: r.breakEvenLiters,
    };
  }

  /** Backward-kompatibles Ranking (siehe SavingsService.rankByRealValue). */
  rankByRealValue<T extends { pricePerLiter: number; detourKm: number }>(
    options: T[],
    consumptionLPer100Km: number,
    tankLiters: number,
    baselinePricePerLiter?: number,
  ): Array<T & { realSavingsEur: number }> {
    if (options.length === 0) return [];
    const baseline = baselinePricePerLiter ?? Math.max(...options.map((o) => o.pricePerLiter));
    const ranked = this.savings.rankByRealValue(
      options.map((o) => ({ ...o, pricePerLiter: o.pricePerLiter, extraDistanceKm: o.detourKm })),
      consumptionLPer100Km,
      tankLiters,
      baseline,
    );
    return ranked.map((r) => ({
      ...(r as unknown as T),
      realSavingsEur: r.result.realSavingEuro,
    }));
  }
}

function mapToLegacyVerdict(rec: SavingCalculationResult['recommendation']): Verdict {
  switch (rec) {
    case 'LOHNT_SICH':
      return 'lohnt_sich';
    case 'LOHNT_SICH_KNAPP':
      return 'lohnt_sich_knapp';
    case 'NUR_WENN_AUF_ROUTE':
    case 'ERST_AB_X_LITERN':
      return 'nur_wenn_vorbei';
    case 'DATEN_UNSICHER':
    case 'LOHNT_SICH_NICHT':
    default:
      return 'lohnt_sich_nicht';
  }
}
