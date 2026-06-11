import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { MetricsService } from './metrics.service';

/**
 * Audit-Auftrag §7.2 — `/metrics`-Endpoint im Prometheus-Format.
 *
 * Bewusst NICHT im OpenAPI-Schema (`@ApiExcludeController`), damit der
 * Endpoint nicht in der Public-API-Doku auftaucht. Prometheus-Scraper
 * sollten den Endpoint per IP-Allowlist im Nginx absichern (siehe
 * `infrastructure/nginx.conf` fuer das `/metrics`-Location-Block-
 * Pattern, das in einer Folge-PR ergaenzt wird).
 */
@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(): Promise<string> {
    return this.metricsService.registry.metrics();
  }
}
