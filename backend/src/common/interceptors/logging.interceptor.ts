import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

import { anonymizeIp } from '../utils/ip';
import { redactUrlForLog } from '../utils/redact-url';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest<Request>();
    const ip = anonymizeIp(req.ip ?? req.socket?.remoteAddress ?? '');

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        // originalUrl enthält den vollen Query-String — Tokens/Koordinaten
        // werden vor dem Logging redaktiert (DSGVO: anonymisierte Logs).
        const url = redactUrlForLog(req.originalUrl);
        this.logger.log(`${req.method} ${url} ${duration}ms ip=${ip}`);
      }),
    );
  }
}
