import { Injectable } from '@nestjs/common';
import { ExitCheckInput, ExitCheckResult, RoutingProvider } from './routing.provider';

/**
 * Default-Provider in Production: keine echte Routenanalyse.
 * Antwortet mit PREPARED-Status und klarer Erklaerung.
 */
@Injectable()
export class NoOpRoutingProvider implements RoutingProvider {
  readonly name = 'noop';

  async exitCheck(_input: ExitCheckInput): Promise<ExitCheckResult> {
    return {
      status: 'PREPARED',
      message:
        'Autobahn-Abfahrts-Check ist vorbereitet. Fuer vollstaendige Routenerkennung wird ein Routing-Provider (z. B. Mapbox Directions, Graphhopper) benoetigt.',
    };
  }
}
