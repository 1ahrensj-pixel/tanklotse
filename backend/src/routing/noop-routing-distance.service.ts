import { Injectable } from '@nestjs/common';

import { RoutingDistanceService } from './routing-distance.service';
import { RoutingDistanceResult } from './routing.types';

/**
 * Default-Implementierung, solange kein echter HTTP-Client existiert.
 * Garantiert ehrlich: keine Routing-Berechnung, keine `precise`-Behauptung.
 */
@Injectable()
export class NoopRoutingDistanceService implements RoutingDistanceService {
  isPreciseRoutingAvailable(): boolean {
    return false;
  }

  async calculateExtraDistanceKm(): Promise<RoutingDistanceResult> {
    return { precise: false, reason: 'noop_provider' };
  }
}
