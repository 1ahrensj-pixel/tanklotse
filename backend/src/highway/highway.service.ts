import { Inject, Injectable } from '@nestjs/common';

import { SavingsService } from '../savings/savings.service';
import { ExitCheckDto } from './highway.dto';
import { ROUTING_PROVIDER, RoutingProvider, ExitCheckResult } from './routing.provider';

export interface HighwayExitRecommendation extends ExitCheckResult {
  /** Berechnete Empfehlungen mit Lohnt-sich-Check pro Kandidat (nur bei OK). */
  recommendations?: Array<{
    stationId: string;
    stationName: string;
    brand: string;
    pricePerLiter: number;
    exitDetourKm: number;
    grossSavingEuro: number;
    detourCostEuro: number;
    realSavingEuro: number;
    breakEvenLiters: number | null;
    recommendation: string;
    explanation: string;
  }>;
}

@Injectable()
export class HighwayService {
  constructor(
    @Inject(ROUTING_PROVIDER) private readonly routing: RoutingProvider,
    private readonly savings: SavingsService,
  ) {}

  async exitCheck(dto: ExitCheckDto): Promise<HighwayExitRecommendation> {
    const result = await this.routing.exitCheck({
      currentLat: dto.currentLat,
      currentLng: dto.currentLng,
      routePolyline: dto.routePolyline,
      fuelType: dto.fuelType,
      tankLiters: dto.tankLiters,
      consumptionLPer100Km: dto.consumptionLPer100Km,
      maxExitDetourKm: dto.maxExitDetourKm,
    });

    if (result.status !== 'OK' || !result.candidates || result.candidates.length === 0) {
      return result;
    }

    // Vergleichsbasis: teuerster Kandidat (typisches Autobahn-Preisniveau)
    const referencePrice = Math.max(...result.candidates.map((c) => c.pricePerLiter));

    const enriched = result.candidates.map((c) => {
      const r = this.savings.calculate({
        referencePrice,
        targetPrice: c.pricePerLiter,
        extraDistanceKm: c.exitDetourKm,
        consumptionLPer100Km: dto.consumptionLPer100Km,
        tankLiters: dto.tankLiters,
      });
      return {
        ...c,
        grossSavingEuro: r.grossSavingEuro,
        detourCostEuro: r.detourCostEuro,
        realSavingEuro: r.realSavingEuro,
        breakEvenLiters: r.breakEvenLiters,
        recommendation: r.recommendation,
        explanation: r.explanation,
      };
    });

    return {
      ...result,
      motorwayStationPrice: referencePrice,
      recommendations: enriched.sort((a, b) => b.realSavingEuro - a.realSavingEuro),
    };
  }
}
