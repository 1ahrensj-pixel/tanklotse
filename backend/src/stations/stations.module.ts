import { Module } from '@nestjs/common';

import { ProvidersModule } from '../providers/providers.module';
import { PrismaStationsPersistenceAdapter } from './adapters/prisma-stations-persistence.adapter';
import { STATIONS_PERSISTENCE_PORT } from './ports/stations-persistence.port';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';

/**
 * PR #24 §6.2 — Hexagonal-Pilot.
 *
 * Der `StationsService` injiziert jetzt das Port-Symbol
 * `STATIONS_PERSISTENCE_PORT`. Production-DI liefert dafuer den
 * Prisma-Adapter; ein Folge-PR koennte einen InMemoryAdapter fuer
 * isolierte Unit-Tests bereitstellen.
 */
@Module({
  imports: [ProvidersModule],
  controllers: [StationsController],
  providers: [
    StationsService,
    {
      provide: STATIONS_PERSISTENCE_PORT,
      useClass: PrismaStationsPersistenceAdapter,
    },
  ],
  exports: [StationsService],
})
export class StationsModule {}
