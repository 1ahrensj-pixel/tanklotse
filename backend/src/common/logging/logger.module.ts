import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { redactQueryObject, redactUrlForLog } from '../utils/redact-url';

/**
 * Audit-Auftrag §7.3 — Structured JSON logging via pino.
 *
 * Wahrheits-Garantie:
 *   - In Production: reines JSON-Format (eine Zeile pro Log-Event) —
 *     ideal fuer Log-Aggregatoren (Loki/CloudWatch/Datadog).
 *   - In Development: `pino-pretty` formatiert die JSON-Logs farbig
 *     fuer die Console.
 *   - REDACT: `req.headers.authorization`, `req.headers.cookie`,
 *     `req.body.password`, `req.body.token` werden hart als `[REDACTED]`
 *     maskiert.
 *   - URL-/Query-Redaction: Die pino-Redact-Pfade greifen nur auf
 *     Objektpfade, nicht auf den Query-String in `req.url`. Der eigene
 *     `req`-Serializer unten maskiert deshalb zusaetzlich sensible
 *     Query-Parameter (token, q, ...) und kuerzt GPS-Koordinaten —
 *     damit landen weder Mail-Link-Tokens noch praezise Standorte in
 *     den Logs (Audit-Befund "HTTP-Log protokolliert volle URLs").
 *
 * Verwendet `req.id` aus pino-http fuer automatische Correlation-IDs
 * pro Request.
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["set-cookie"]',
            'req.body.password',
            'req.body.newPassword',
            'req.body.token',
            'req.body.refreshToken',
            'req.body.identityToken',
            'req.body.idToken',
            'res.headers["set-cookie"]',
            '*.secret',
            '*.passwordHash',
            '*.totpSecret',
            '*.apiKey',
            '*.api_key',
          ],
          censor: '[REDACTED]',
        },
        serializers: {
          // pino-http wickelt den Custom-Serializer in den Standard-
          // Serializer ein (wrapRequestSerializer): `req` ist hier das
          // bereits serialisierte Objekt mit `url` (= originalUrl inkl.
          // Query-String) und `query` (geparstes Express-Query-Objekt).
          req(req: { url?: unknown; query?: unknown } & Record<string, unknown>) {
            if (typeof req.url === 'string') {
              req.url = redactUrlForLog(req.url);
            }
            if (req.query && typeof req.query === 'object' && !Array.isArray(req.query)) {
              // Kopie statt Mutation — req.query referenziert das live
              // Express-Objekt.
              req.query = redactQueryObject(req.query as Record<string, unknown>);
            }
            return req;
          },
        },
        autoLogging: {
          ignore: (req) => {
            const url = (req.url ?? '').toString();
            // Health/Metrics nicht jede Sekunde loggen — sonst spammt das Logs voll.
            return url.startsWith('/health') || url.startsWith('/ready') || url.startsWith('/metrics');
          },
        },
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      },
    }),
  ],
})
export class LoggerModule {}
