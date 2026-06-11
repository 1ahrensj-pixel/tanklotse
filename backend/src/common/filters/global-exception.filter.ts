import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;

    // body-parser's PayloadTooLargeError ist KEINE HttpException; ohne Sondernbehandlung
    // wuerden 1 MB-Bodies als 500 durchgereicht. Wir detektieren `type`/`statusCode`
    // (gesetzt von body-parser) und mappen explizit auf 413.
    const errAny = exception as { type?: string; statusCode?: number };
    const isPayloadTooLarge =
      !isHttp &&
      (errAny?.type === 'entity.too.large' || errAny?.statusCode === 413);

    let status: number;
    let message: unknown;
    if (isHttp) {
      status = (exception as HttpException).getStatus();
      message = (exception as HttpException).getResponse();
    } else if (isPayloadTooLarge) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = { message: 'Request-Body zu gross.', code: 'PAYLOAD_TOO_LARGE' };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = { message: 'Interner Fehler', code: 'INTERNAL_ERROR' };
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception);
      }
    }

    response.status(status).json(
      typeof message === 'string'
        ? { statusCode: status, message }
        : { statusCode: status, ...(message as object) },
    );
  }
}
