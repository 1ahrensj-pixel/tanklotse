import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

/**
 * Audit-Auftrag §7.2 — globales Prometheus-Modul.
 *
 * - `MetricsService` ist global verfuegbar (auch fuer
 *   `external_api_requests_total` aus Provider-Services).
 * - `MetricsInterceptor` ist als globaler APP_INTERCEPTOR registriert
 *   und labelt jede HTTP-Anfrage mit method/path/status.
 * - `/metrics` (im `MetricsController`) liefert den Prom-Text-Dump.
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
