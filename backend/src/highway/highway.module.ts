import { Module, Provider } from '@nestjs/common';

import { ProvidersModule } from '../providers/providers.module';
import { FUEL_PROVIDER, FuelPriceProvider } from '../providers/fuel-price.interface';
import { HighwayController } from './highway.controller';
import { HighwayService } from './highway.service';
import { MockRoutingProvider } from './mock-routing.provider';
import { NoOpRoutingProvider } from './noop-routing.provider';
import { ROUTING_PROVIDER, RoutingProvider } from './routing.provider';

const routingFactory: Provider = {
  provide: ROUTING_PROVIDER,
  inject: [FUEL_PROVIDER],
  useFactory: (fuel: FuelPriceProvider): RoutingProvider => {
    const name = (process.env.ROUTING_PROVIDER ?? 'noop').toLowerCase();
    if (name === 'mock') {
      // SAFEGUARD (externer Pruefbericht §7.8): MockRoutingProvider darf NIEMALS
      // in Production aktiv sein — sonst sieht der Highway-Check fertig aus,
      // obwohl die Empfehlungen auf Luftlinien-Heuristik basieren.
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'ROUTING_PROVIDER=mock ist in NODE_ENV=production verboten. ' +
            'Setze ROUTING_PROVIDER=noop oder binde einen echten Routing-Provider ein.',
        );
      }
      return new MockRoutingProvider(fuel);
    }
    return new NoOpRoutingProvider();
  },
};

@Module({
  imports: [ProvidersModule],
  controllers: [HighwayController],
  providers: [HighwayService, routingFactory],
  exports: [HighwayService],
})
export class HighwayModule {}
