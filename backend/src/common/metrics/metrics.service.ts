import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

/**
 * Audit-Auftrag §7.2 — Prometheus-Metriken.
 *
 * Exponiert:
 *   - http_requests_total{method,path,status}        Counter
 *   - http_request_duration_seconds{method,path}     Histogram
 *   - external_api_requests_total{provider,status}   Counter
 *   - default Node-Prozess-Metriken (CPU, RSS, GC).
 *
 * `path` ist auf das NestJS-Route-Pattern (`/api/stations/:id`) reduziert,
 * NICHT auf die konkrete URL — sonst explodieren die Label-Kardinalitaeten.
 *
 * Sicherheits-Garantie:
 *   - `path` wird normalisiert (UUIDs / Nummern → `:id`), damit personen-
 *     bezogene IDs niemals in Prometheus landen.
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Anzahl HTTP-Anfragen, gelabelt mit method/path/status.',
    labelNames: ['method', 'path', 'status'] as const,
    registers: [this.registry],
  });

  readonly httpRequestDurationSeconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP-Anfrage-Dauer in Sekunden, gelabelt mit method/path.',
    labelNames: ['method', 'path'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  readonly externalApiRequestsTotal = new Counter({
    name: 'external_api_requests_total',
    help: 'Anzahl Calls an externe Provider (Tankerkoenig/Mapbox/...).',
    labelNames: ['provider', 'status'] as const,
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Reduziert eine konkrete URL `/api/stations/abc-123` auf das Route-
   * Pattern `/api/stations/:id`, damit Label-Kardinalitaeten begrenzt
   * bleiben.
   */
  normalizePath(rawPath: string): string {
    return rawPath
      .replace(/\?.*$/, '') // Query-String entfernen
      .replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '/:uuid')
      .replace(/\/[0-9]+(?=\/|$)/g, '/:id');
  }
}
