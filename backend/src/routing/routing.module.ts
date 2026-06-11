import { Global, Module, Provider } from '@nestjs/common';

import {
  assertMockAllowed,
  parseProviderMode,
} from '../common/providers/provider-mode.types';
import { GraphhopperRoutingDistanceService } from './graphhopper-routing-distance.service';
import { MapboxRoutingDistanceService } from './mapbox-routing-distance.service';
import { MockRoutingDistanceService } from './mock-routing-distance.service';
import { NoopRoutingDistanceService } from './noop-routing-distance.service';
import {
  ROUTING_DISTANCE_SERVICE,
  RoutingDistanceService,
} from './routing-distance.service';
import { RoutingMetricsModule } from './routing-metrics.service';

/**
 * Audit 2026-05-06 §17 Phase 4 + §22 Phase 8 (PR #11): zwei Achsen.
 *
 *   `ROUTING_ENABLED=true|false`
 *     Master-Schalter. Wenn false, wird der Noop-Default verwendet.
 *
 *   `ROUTING_PROVIDER=noop|mapbox|graphhopper`
 *     Welche konkrete Implementierung soll laufen.
 *
 *   `ROUTING_PROVIDER_MODE=live|sandbox|mock|contract|disabled`
 *     Wie laeuft sie. `mock`/`contract` ueberschreiben `ROUTING_PROVIDER` und
 *     laden `MockRoutingDistanceService` (precise=false IMMER).
 *     `disabled` zwingt Noop unabhaengig von `ROUTING_ENABLED`.
 *
 * Production-Sperre fuer den Graphhopper-Stub: `validation.ts` (existing)
 * verbietet `ROUTING_ENABLED=true` + `ROUTING_PROVIDER=noop` schon, plus
 * dieses Modul wirft beim Construct, wenn `ROUTING_PROVIDER=graphhopper`
 * in `NODE_ENV=production` aktiv ist (Stub kann keine Routen liefern).
 */
const routingDistanceProvider: Provider = {
  provide: ROUTING_DISTANCE_SERVICE,
  useFactory: (
    mapbox: MapboxRoutingDistanceService,
    graphhopper: GraphhopperRoutingDistanceService,
    noop: NoopRoutingDistanceService,
  ): RoutingDistanceService => {
    const mode = parseProviderMode(
      process.env.ROUTING_PROVIDER_MODE,
      'live',
      'ROUTING_PROVIDER_MODE',
    );

    if (mode === 'mock' || mode === 'contract') {
      assertMockAllowed('routing');
      return new MockRoutingDistanceService();
    }
    if (mode === 'disabled') {
      return noop;
    }

    const enabled = String(process.env.ROUTING_ENABLED ?? '').toLowerCase() === 'true';
    if (!enabled) return noop;

    const provider = (process.env.ROUTING_PROVIDER ?? 'noop').trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (provider === 'mapbox') {
      if (!mapbox.isPreciseRoutingAvailable()) {
        // ENV sagt mapbox, aber MAPBOX_ACCESS_TOKEN fehlt/ist Platzhalter →
        // bewusstes Fallback auf Noop, statt zu werfen. Status-Endpoint zeigt
        // das via missingKeys; App startet trotzdem mit Schaetzungen.
        return noop;
      }
      return mapbox;
    }

    if (provider === 'graphhopper') {
      if (isProd) {
        throw new Error(
          'ROUTING_PROVIDER=graphhopper ist in NODE_ENV=production nicht erlaubt — ' +
            'der Service ist nur ein Stub. Verwende mapbox oder noop.',
        );
      }
      return graphhopper;
    }

    if (provider === 'noop') {
      return noop;
    }

    // Audit 2026-05-06 §13 Aufgabe 1: kein stiller Fallback bei
    // Tippfehlern wie ROUTING_PROVIDER=mapboxx. Hart fehlschlagen.
    throw new Error(
      `ROUTING_PROVIDER ist ungueltig: "${provider}". Erlaubt: noop, mapbox, graphhopper.`,
    );
  },
  inject: [
    MapboxRoutingDistanceService,
    GraphhopperRoutingDistanceService,
    NoopRoutingDistanceService,
  ],
};

@Global()
@Module({
  imports: [RoutingMetricsModule],
  providers: [
    MapboxRoutingDistanceService,
    GraphhopperRoutingDistanceService,
    NoopRoutingDistanceService,
    routingDistanceProvider,
  ],
  // `RoutingMetricsService` ist via `@Global` aus `RoutingMetricsModule`
  // ueberall erreichbar — daher hier nicht erneut exportieren.
  exports: [ROUTING_DISTANCE_SERVICE],
})
export class RoutingModule {}
