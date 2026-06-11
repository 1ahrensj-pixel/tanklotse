import { Global, Injectable, Module } from '@nestjs/common';

/**
 * Audit 2026-05-06 §22 Phase 5: Routing-Kosten + Health beobachten.
 *
 * Dieser Service zaehlt Live-Mapbox-Calls in einem Sliding-Window. Reicht fuer
 * Staging-Beobachtung — fuer Production-Metriken sollte spaeter Prometheus
 * via `@willsoto/nestjs-prometheus` ergaenzt werden.
 *
 * Bewusst:
 *  - Werte sind In-Memory (kein Redis). Sliding-Window per Timestamp-Buffer.
 *  - Kein Throw bei Limit-Ueberschreitung — nur Logging + Status-Flag. Harte
 *    Drossel ist Folge-PR.
 *  - Service ist `@Global` und wird vom `RoutingModule` exportiert, damit
 *    `MapboxRoutingDistanceService` und `ApiReadinessService` denselben
 *    Counter teilen.
 */
@Injectable()
export class RoutingMetricsService {
  /** Timestamps in ms — sliding window 1h. */
  private readonly callTimestamps: number[] = [];
  private readonly cacheHitTimestamps: number[] = [];
  private readonly cacheMissTimestamps: number[] = [];
  private readonly timeoutTimestamps: number[] = [];
  private readonly rateLimitTimestamps: number[] = [];
  private readonly providerErrorTimestamps: number[] = [];

  private readonly windowMs = 60 * 60 * 1000; // 1h

  recordRequest(): void {
    this.push(this.callTimestamps);
  }
  recordCacheHit(): void {
    this.push(this.cacheHitTimestamps);
  }
  recordCacheMiss(): void {
    this.push(this.cacheMissTimestamps);
  }
  recordTimeout(): void {
    this.push(this.timeoutTimestamps);
  }
  recordRateLimit(): void {
    this.push(this.rateLimitTimestamps);
  }
  recordProviderError(): void {
    this.push(this.providerErrorTimestamps);
  }

  snapshot(): {
    requestsLastHour: number;
    cacheHitRate: number | null;
    cacheHitsLastHour: number;
    cacheMissesLastHour: number;
    timeoutsLastHour: number;
    rateLimitsLastHour: number;
    providerErrorsLastHour: number;
    overWarnThreshold: boolean;
  } {
    const reqs = this.count(this.callTimestamps);
    const hits = this.count(this.cacheHitTimestamps);
    const misses = this.count(this.cacheMissTimestamps);
    const total = hits + misses;
    const warnThreshold = parsePositiveInt(process.env.MAPBOX_WARN_REQUESTS_PER_HOUR, 200);
    return {
      requestsLastHour: reqs,
      cacheHitsLastHour: hits,
      cacheMissesLastHour: misses,
      cacheHitRate: total > 0 ? hits / total : null,
      timeoutsLastHour: this.count(this.timeoutTimestamps),
      rateLimitsLastHour: this.count(this.rateLimitTimestamps),
      providerErrorsLastHour: this.count(this.providerErrorTimestamps),
      overWarnThreshold: reqs >= warnThreshold,
    };
  }

  private push(buf: number[]): void {
    const now = Date.now();
    buf.push(now);
    // Lazy-cleanup: alle Eintraege jenseits des Fensters wegwerfen.
    const cutoff = now - this.windowMs;
    while (buf.length > 0 && buf[0] < cutoff) buf.shift();
  }

  private count(buf: number[]): number {
    const cutoff = Date.now() - this.windowMs;
    while (buf.length > 0 && buf[0] < cutoff) buf.shift();
    return buf.length;
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value == null) return fallback;
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

@Global()
@Module({
  providers: [RoutingMetricsService],
  exports: [RoutingMetricsService],
})
export class RoutingMetricsModule {}
