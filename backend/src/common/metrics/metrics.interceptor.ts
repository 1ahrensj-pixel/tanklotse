import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

import { MetricsService } from './metrics.service';

/**
 * Audit-Auftrag §7.2 — Sammelt Request-Counter + Latency-Histogram
 * fuer jeden Express-Request, ohne eine eigene Route oder Middleware
 * im AppModule zu brauchen.
 *
 * Wird global aktiviert ueber `APP_INTERCEPTOR` in `app.module.ts`.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const method = req.method;
    const startNs = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.record(req, res, method, startNs),
        error: () => this.record(req, res, method, startNs),
      }),
    );
  }

  private record(req: Request, res: Response, method: string, startNs: bigint) {
    const path = this.metrics.normalizePath(req.originalUrl || req.url || '/');
    const status = String(res.statusCode || 0);
    const durSec = Number(process.hrtime.bigint() - startNs) / 1e9;
    this.metrics.httpRequestsTotal.inc({ method, path, status });
    this.metrics.httpRequestDurationSeconds.observe({ method, path }, durSec);
  }
}
