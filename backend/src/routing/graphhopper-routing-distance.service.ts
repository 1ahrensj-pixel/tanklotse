import { Injectable, Logger } from '@nestjs/common';

import { RoutingDistanceService } from './routing-distance.service';
import { RoutingDistanceResult } from './routing.types';

/**
 * Audit 2026-05-06 §17 Phase 5 Aufgabe 11:
 *
 * Stub-Implementierung. Bewusst NICHT als „precise" markiert, weil kein
 * echter HTTP-Client implementiert ist.
 *
 * `RoutingModule` blockt zusaetzlich `ROUTING_PROVIDER=graphhopper` in
 * `NODE_ENV=production`, solange dieser Stub aktiv ist — analog zur
 * Mock-Provider-Sperre fuer FuelProvider/GeocoderProvider.
 *
 * Wenn spaeter ein echter Client implementiert ist:
 *   1. `isPreciseRoutingAvailable()` returnt `true`, sobald `GRAPHHOPPER_API_KEY`
 *      gesetzt ist.
 *   2. `calculateExtraDistanceKm()` ruft `graphhopper.com/api/1/route` mit
 *      mehreren Punkten und vergleicht direct vs. via-station Distanz.
 *   3. Production-Sperre in `RoutingModule` entfernen.
 */
@Injectable()
export class GraphhopperRoutingDistanceService implements RoutingDistanceService {
  private readonly logger = new Logger(GraphhopperRoutingDistanceService.name);

  isPreciseRoutingAvailable(): boolean {
    return false;
  }

  async calculateExtraDistanceKm(): Promise<RoutingDistanceResult> {
    this.logger.warn(
      'GraphhopperRoutingDistanceService ist nur ein Stub — gibt precise=false zurueck. ' +
        'Verwende ROUTING_PROVIDER=mapbox oder ROUTING_PROVIDER=noop.',
    );
    return { precise: false, reason: 'provider_unavailable' };
  }
}
