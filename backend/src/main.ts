import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Sentry-Init: Audit 2026-05-06 §11 Aufgabe 7 (Variant A) — eindeutige
  // Konfiguration. Sentry startet nur, wenn SENTRY_ENABLED=true UND
  // SENTRY_DSN gesetzt ist. Damit denkt main.ts identisch zur zentralen
  // `external-services.config.ts` und zur `validation.ts`.
  // Reine DSN-Anwesenheit ohne Flag aktiviert Sentry NICHT mehr — der
  // Status-Endpoint zeigt diesen Zustand via Note ehrlich an.
  const sentryEnabled =
    String(process.env.SENTRY_ENABLED ?? '').toLowerCase() === 'true';
  if (sentryEnabled && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: 0.1,
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.data && typeof breadcrumb.data === 'object') {
          for (const key of Object.keys(breadcrumb.data)) {
            if (/key|secret|token|password/i.test(key)) {
              (breadcrumb.data as Record<string, unknown>)[key] = '[REDACTED]';
            }
          }
        }
        return breadcrumb;
      },
    });
    logger.log('Sentry aktiviert (SENTRY_ENABLED=true, DSN gesetzt).');
  } else if (process.env.SENTRY_DSN && !sentryEnabled) {
    logger.warn(
      'SENTRY_DSN ist gesetzt, aber SENTRY_ENABLED ist nicht true — Sentry bleibt aus. ' +
        'Setze SENTRY_ENABLED=true fuer aktiviertes Reporting.',
    );
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.set('trust proxy', 1);

  // CSP fuer die JSON-/Swagger-API. Helmet-Default + bewusste Lockerung
  // fuer die Swagger-UI-Inline-Scripts und Mapbox/FCM-Telemetry-Domains.
  // Web-Frontends (admin, landingpage) setzen ihre eigenen, strengeren CSPs.
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            useDefaults: true,
            directives: {
              'default-src': ["'self'"],
              // Swagger-UI braucht Inline und data: fuer die Schema-Anzeige.
              'script-src': ["'self'", "'unsafe-inline'"],
              'style-src': ["'self'", "'unsafe-inline'"],
              'img-src': ["'self'", 'data:', 'https:'],
              'font-src': ["'self'", 'data:'],
              'connect-src': [
                "'self'",
                'https://creativecommons.tankerkoenig.de',
                'https://nominatim.openstreetmap.org',
                'https://appleid.apple.com',
                'https://oauth2.googleapis.com',
                'https://androidpublisher.googleapis.com',
                'https://fcm.googleapis.com',
                'https://buy.itunes.apple.com',
                'https://sandbox.itunes.apple.com',
              ],
              'frame-ancestors': ["'none'"],
              'object-src': ["'none'"],
              'base-uri': ["'self'"],
              'form-action': ["'self'"],
              'upgrade-insecure-requests': [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(compression());
  app.use(cookieParser(process.env.COOKIE_SECRET ?? process.env.JWT_ACCESS_SECRET));

  // Explizite Body-Limits. Express-Default ist 100kb fuer JSON; wir setzen
  // 200kb fuer reine API-Requests. Groessere Payloads bekommen 413 statt
  // 500 dank der explizit gesetzten Grenze + dem GlobalExceptionFilter,
  // der PayloadTooLargeError als HttpException identifiziert.
  app.use(json({ limit: '200kb' }));
  app.use(urlencoded({ extended: true, limit: '200kb' }));

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });

  // Swagger in Production absichern (Audit 2026-05-06 §14 Aufgabe 5):
  // - non-production (development/staging/test): immer aktiviert.
  // - production: nur aktiviert, wenn SWAGGER_ENABLED=true bewusst gesetzt
  //   ist. Standardmaessig wird Swagger in production NICHT exponiert,
  //   damit Schema/Endpoints nicht ungewollt oeffentlich einsehbar sind.
  const isProduction = process.env.NODE_ENV === 'production';
  const swaggerExplicitlyEnabled =
    String(process.env.SWAGGER_ENABLED ?? '').toLowerCase() === 'true';
  const swaggerEnabled = !isProduction || swaggerExplicitlyEnabled;
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('TankLotse API')
      .setDescription('Backend-API für die TankLotse-App.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs/api', app, document);
    logger.log(
      `Swagger UI verfuegbar unter /docs/api (env=${process.env.NODE_ENV ?? 'development'}).`,
    );
  } else {
    logger.log(
      'Swagger UI in Production deaktiviert. Setze SWAGGER_ENABLED=true, um sie bewusst zu aktivieren.',
    );
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`TankLotse-Backend läuft auf Port ${port} (env=${process.env.NODE_ENV ?? 'development'})`);
}

bootstrap().catch((err) => {
  console.error('Backend-Start fehlgeschlagen:', err);
  process.exit(1);
});
