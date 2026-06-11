import { Injectable } from '@nestjs/common';

import { assertMockAllowed } from '../common/providers/provider-mode.types';
import { RoutingDistanceService } from './routing-distance.service';
import {
  RoutingDistanceInput,
  RoutingDistanceResult,
} from './routing.types';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Mock-Routing.
 *
 * Wahrheits-Garantie:
 *   `precise: false` IMMER. Niemals `precise_routing` melden.
 *   `reason: 'mock_provider'` macht im Log + im Empfehlungs-Output sichtbar,
 *   dass dieser Wert KEIN echter Routing-Provider-Wert ist.
 *
 * Werte: deterministische Haversine-Naeherung, damit Tests stabil sind.
 * In Production darf dieser Service nur mit `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true`
 * geladen werden — der Production-Guard wirft im Constructor.
 */
@Injectable()
export class MockRoutingDistanceService implements RoutingDistanceService {
  constructor() {
    assertMockAllowed('routing');
  }

  isPreciseRoutingAvailable(): boolean {
    return false;
  }

  async calculateExtraDistanceKm(
    input: RoutingDistanceInput,
  ): Promise<RoutingDistanceResult> {
    if (input.mode === 'route_via_station' && !input.destination) {
      return {
        precise: false,
        reason: 'invalid_input',
        provider: 'mock',
        source: 'mock_fixture',
      };
    }

    const direct = haversineKm(input.origin, input.station);
    let extra: number;
    if (input.mode === 'point_to_station') {
      extra = round2(direct);
    } else {
      const viaStation =
        haversineKm(input.origin, input.station) +
        haversineKm(input.station, input.destination!);
      const directRoute = haversineKm(input.origin, input.destination!);
      extra = round2(Math.max(0, viaStation - directRoute));
    }

    // Wahrheits-Trennung: Mock liefert eine Zahl, aber NIEMALS precise=true.
    // `source: 'mock_fixture'` macht die Herkunft auch in Logs eindeutig.
    return {
      precise: false,
      provider: 'mock',
      reason: 'mock_provider',
      extraDistanceKm: extra,
      source: 'mock_fixture',
    };
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
