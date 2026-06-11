import { Inject, Injectable } from '@nestjs/common';

import { FUEL_PROVIDER, FuelPriceProvider } from '../providers/fuel-price.interface';
import { ExitCheckInput, ExitCheckResult, RoutingProvider } from './routing.provider';

/**
 * MockRoutingProvider — NUR in Tests / Dev.
 * Heuristik: nimmt die Stationen im Umkreis und berechnet Luftlinien-
 * Detour als "Abfahrts-Distanz". Liefert OK-Status mit Kandidaten.
 */
@Injectable()
export class MockRoutingProvider implements RoutingProvider {
  readonly name = 'mock';

  constructor(@Inject(FUEL_PROVIDER) private readonly fuel: FuelPriceProvider) {}

  async exitCheck(input: ExitCheckInput): Promise<ExitCheckResult> {
    const stations = await this.fuel.search({
      lat: input.currentLat,
      lng: input.currentLng,
      radius: Math.max(2, input.maxExitDetourKm),
      fuelType: input.fuelType,
      sort: 'price',
    });
    const fuelKey = input.fuelType.toLowerCase() as 'e5' | 'e10' | 'diesel';
    const candidates = stations
      .map((s) => ({
        stationId: s.id,
        stationName: s.name,
        brand: s.brand,
        pricePerLiter: s.prices[fuelKey] ?? 0,
        exitDetourKm: s.distanceKm ?? 0,
      }))
      .filter((c) => c.pricePerLiter > 0 && c.exitDetourKm <= input.maxExitDetourKm)
      .sort((a, b) => a.pricePerLiter - b.pricePerLiter)
      .slice(0, 5);

    if (candidates.length === 0) {
      return { status: 'NOT_FOUND', message: 'Keine Tankstellen im Abfahrts-Radius gefunden.' };
    }

    return {
      status: 'OK',
      message: 'Abfahrts-Empfehlungen (Mock-Routing, Luftlinien-Distanz).',
      candidates,
    };
  }
}
