import 'reflect-metadata';

import { configValidation } from './validation';

/**
 * Vollstaendiges Test-Set zur Konfigurations-Validation (Auftrag §22).
 *
 * Strategie: jeder Test geht von einer minimalen, gueltigen Production-Config
 * aus und kippt jeweils einen Wert um, um den erwarteten Fehler zu pruefen.
 */
describe('configValidation', () => {
  /**
   * Ein vollstaendiger, gueltiger Production-Stand.
   * Jeder Test darf gezielt einzelne Felder ueberschreiben/loeschen.
   */
  const baseProduction = {
    NODE_ENV: 'production',
    PORT: '3000',
    DATABASE_URL: 'postgres://u:p@h:5432/db',
    REDIS_URL: 'redis://h:6379',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    JWT_ACCESS_TTL: '900',
    JWT_REFRESH_TTL: '2592000',
    FUEL_PROVIDER: 'tankerkoenig',
    TANKERKOENIG_API_KEY: 'real-key',
    TANKERKOENIG_BASE_URL: 'https://creativecommons.tankerkoenig.de/json',
    GEOCODER_PROVIDER: 'nominatim',
    GEOCODER_USER_AGENT: 'TankLotse/1.0 contact@example.de',
    COOKIE_SECRET: 'c'.repeat(32),
    CORS_ORIGINS: 'https://app.example.com,https://admin.example.com',
  };

  // --- §22.1 Basis ---------------------------------------------------------
  describe('§22.1 Basis-Production-Pflichten', () => {
    it('akzeptiert vollstaendige Production-Config', () => {
      expect(() => configValidation({ ...baseProduction })).not.toThrow();
    });

    it('wirft, wenn DATABASE_URL fehlt', () => {
      const cfg = { ...baseProduction, DATABASE_URL: undefined };
      expect(() => configValidation(cfg)).toThrow(/DATABASE_URL/i);
    });

    it('wirft, wenn REDIS_URL fehlt', () => {
      const cfg = { ...baseProduction, REDIS_URL: undefined };
      expect(() => configValidation(cfg)).toThrow(/REDIS_URL/i);
    });

    it('wirft, wenn JWT_ACCESS_SECRET fehlt', () => {
      const cfg = { ...baseProduction, JWT_ACCESS_SECRET: undefined };
      expect(() => configValidation(cfg)).toThrow();
    });

    it('wirft, wenn JWT_ACCESS_SECRET zu kurz ist', () => {
      const cfg = { ...baseProduction, JWT_ACCESS_SECRET: 'kurz' };
      expect(() => configValidation(cfg)).toThrow();
    });

    it('wirft, wenn COOKIE_SECRET fehlt', () => {
      const cfg = { ...baseProduction, COOKIE_SECRET: undefined };
      expect(() => configValidation(cfg)).toThrow(/COOKIE_SECRET/);
    });

    it('wirft, wenn COOKIE_SECRET zu kurz ist', () => {
      const cfg = { ...baseProduction, COOKIE_SECRET: 'kurz' };
      expect(() => configValidation(cfg)).toThrow(/COOKIE_SECRET/);
    });

    it('wirft, wenn CORS_ORIGINS leer ist', () => {
      const cfg = { ...baseProduction, CORS_ORIGINS: '' };
      expect(() => configValidation(cfg)).toThrow(/CORS_ORIGINS/);
    });

    it('wirft, wenn CORS_ORIGINS=*', () => {
      const cfg = { ...baseProduction, CORS_ORIGINS: '*' };
      expect(() => configValidation(cfg)).toThrow(/CORS_ORIGINS/);
    });
  });

  // --- §22.2 Fuel ----------------------------------------------------------
  describe('§22.2 Fuel-Provider', () => {
    it('FUEL_PROVIDER=tankerkoenig ohne API-Key → Fehler', () => {
      const cfg = { ...baseProduction, TANKERKOENIG_API_KEY: undefined };
      expect(() => configValidation(cfg)).toThrow(/TANKERKOENIG_API_KEY/);
    });

    it('FUEL_PROVIDER=tankerkoenig mit API-Key → ok', () => {
      expect(() => configValidation({ ...baseProduction })).not.toThrow();
    });

    // Audit §11 Aufgabe 3: TANKERKOENIG_BASE_URL ist provider-spezifisch
    // optional. Existing TankerkoenigProvider hat einen Default.
    it('FUEL_PROVIDER=tankerkoenig ohne TANKERKOENIG_BASE_URL → ok (Default greift)', () => {
      const cfg = { ...baseProduction, TANKERKOENIG_BASE_URL: undefined };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('FUEL_PROVIDER=mtsk ohne TANKERKOENIG_BASE_URL → ok, MTSK-Werte reichen', () => {
      const cfg = {
        ...baseProduction,
        FUEL_PROVIDER: 'mtsk',
        TANKERKOENIG_API_KEY: undefined,
        TANKERKOENIG_BASE_URL: undefined,
        MTSK_API_KEY: 'real-mtsk-key',
        MTSK_BASE_URL: 'https://mtsk.example.de',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('FUEL_PROVIDER=mock in Production → Fehler', () => {
      const cfg = {
        ...baseProduction,
        FUEL_PROVIDER: 'mock',
        TANKERKOENIG_API_KEY: undefined,
      };
      expect(() => configValidation(cfg)).toThrow(/MockProvider/);
    });

    it('FUEL_PROVIDER=mock in Test → ok', () => {
      const cfg = {
        ...baseProduction,
        NODE_ENV: 'test',
        FUEL_PROVIDER: 'mock',
        TANKERKOENIG_API_KEY: undefined,
        TANKERKOENIG_BASE_URL: undefined,
        COOKIE_SECRET: undefined,
        CORS_ORIGINS: undefined,
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('FUEL_PROVIDER=mtsk ohne MTSK_API_KEY → Fehler', () => {
      const cfg = {
        ...baseProduction,
        FUEL_PROVIDER: 'mtsk',
        TANKERKOENIG_API_KEY: undefined,
      };
      expect(() => configValidation(cfg)).toThrow(/MTSK_API_KEY/);
    });
  });

  // --- §22.3 Geocoder ------------------------------------------------------
  describe('§22.3 Geocoder', () => {
    it('GEOCODER_PROVIDER=nominatim in Production ohne USER_AGENT → Fehler', () => {
      const cfg = {
        ...baseProduction,
        GEOCODER_USER_AGENT: undefined,
        NOMINATIM_USER_AGENT: undefined,
      };
      expect(() => configValidation(cfg)).toThrow(/NOMINATIM_USER_AGENT/);
    });

    it('GEOCODER_PROVIDER=mapbox ohne MAPBOX_ACCESS_TOKEN → Fehler', () => {
      const cfg = { ...baseProduction, GEOCODER_PROVIDER: 'mapbox' };
      expect(() => configValidation(cfg)).toThrow(/MAPBOX_ACCESS_TOKEN/);
    });

    it('GEOCODER_PROVIDER=mapbox mit MAPBOX_ACCESS_TOKEN → ok', () => {
      const cfg = {
        ...baseProduction,
        GEOCODER_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'sk.real',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('GEOCODER_PROVIDER=mock in Production → Fehler', () => {
      const cfg = { ...baseProduction, GEOCODER_PROVIDER: 'mock' };
      expect(() => configValidation(cfg)).toThrow(/GEOCODER_PROVIDER=mock/);
    });
  });

  // --- §22.4 Routing -------------------------------------------------------
  describe('§22.4 Routing', () => {
    it('ROUTING_ENABLED=false → fehlende Keys erlaubt', () => {
      const cfg = { ...baseProduction, ROUTING_ENABLED: 'false' };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('ROUTING_ENABLED=true + provider=mapbox ohne MAPBOX_ACCESS_TOKEN → Fehler', () => {
      const cfg = {
        ...baseProduction,
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
      };
      expect(() => configValidation(cfg)).toThrow(/MAPBOX_ACCESS_TOKEN/);
    });

    it('ROUTING_ENABLED=true + provider=mapbox mit Token → ok', () => {
      const cfg = {
        ...baseProduction,
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'sk.real',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('ROUTING_ENABLED=true + provider=graphhopper ohne API-Key → Fehler', () => {
      const cfg = {
        ...baseProduction,
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'graphhopper',
      };
      expect(() => configValidation(cfg)).toThrow(/GRAPHHOPPER_API_KEY/);
    });

    it('ROUTING_ENABLED=true + provider=noop in Production → Fehler', () => {
      const cfg = {
        ...baseProduction,
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'noop',
      };
      expect(() => configValidation(cfg)).toThrow(/ROUTING_PROVIDER=noop/);
    });

    it('ROUTING_ENABLED=true + provider=noop in development → ok', () => {
      const cfg = {
        ...baseProduction,
        NODE_ENV: 'development',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'noop',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });
  });

  // --- §22.5 Push ----------------------------------------------------------
  describe('§22.5 Push', () => {
    it('PUSH_ENABLED=false → fehlende FCM-Werte erlaubt', () => {
      const cfg = { ...baseProduction, PUSH_ENABLED: 'false' };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('PUSH_ENABLED=true ohne FCM-Werte → Fehler', () => {
      const cfg = { ...baseProduction, PUSH_ENABLED: 'true' };
      expect(() => configValidation(cfg)).toThrow(
        /FCM_PROJECT_ID|FCM_CLIENT_EMAIL|FCM_PRIVATE_KEY|FCM_SERVICE_ACCOUNT_PATH/,
      );
    });

    it('PUSH_ENABLED=true mit Inline-FCM-Werten → ok', () => {
      const cfg = {
        ...baseProduction,
        PUSH_ENABLED: 'true',
        FCM_PROJECT_ID: 'proj',
        FCM_CLIENT_EMAIL: 'sa@proj.iam.gserviceaccount.com',
        FCM_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('PUSH_ENABLED=true mit FCM_SERVICE_ACCOUNT_PATH (existing) → ok', () => {
      const cfg = {
        ...baseProduction,
        PUSH_ENABLED: 'true',
        FCM_SERVICE_ACCOUNT_PATH: './secrets/fcm.json',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });
  });

  // --- §22.6 OAuth ---------------------------------------------------------
  describe('§22.6 OAuth (Google + Apple Login)', () => {
    it('GOOGLE_LOGIN_ENABLED=false → fehlende Werte erlaubt', () => {
      const cfg = { ...baseProduction, GOOGLE_LOGIN_ENABLED: 'false' };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('GOOGLE_LOGIN_ENABLED=true ohne CLIENT_ID → Fehler', () => {
      const cfg = { ...baseProduction, GOOGLE_LOGIN_ENABLED: 'true' };
      expect(() => configValidation(cfg)).toThrow(/GOOGLE_CLIENT_ID/);
    });

    it('GOOGLE_LOGIN_ENABLED=true mit GOOGLE_OAUTH_CLIENT_ID (existing) → ok', () => {
      const cfg = {
        ...baseProduction,
        GOOGLE_LOGIN_ENABLED: 'true',
        GOOGLE_OAUTH_CLIENT_ID: '123-abc.apps.googleusercontent.com',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('APPLE_LOGIN_ENABLED=false → fehlende Werte erlaubt', () => {
      const cfg = { ...baseProduction, APPLE_LOGIN_ENABLED: 'false' };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('APPLE_LOGIN_ENABLED=true ohne Pflichtwerte → Fehler', () => {
      const cfg = { ...baseProduction, APPLE_LOGIN_ENABLED: 'true' };
      expect(() => configValidation(cfg)).toThrow(/APPLE_/);
    });

    it('APPLE_LOGIN_ENABLED=true mit allen Werten → ok', () => {
      const cfg = {
        ...baseProduction,
        APPLE_LOGIN_ENABLED: 'true',
        APPLE_BUNDLE_ID: 'de.tanklotse.app',
        APPLE_TEAM_ID: 'ABCDE12345',
        APPLE_KEY_ID: 'KEY12345',
        APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });
  });

  // --- §22.7 Subscriptions / IAP ------------------------------------------
  describe('§22.7 Subscriptions / IAP', () => {
    it('SUBSCRIPTIONS_ENABLED=false → fehlende Werte erlaubt', () => {
      const cfg = { ...baseProduction, SUBSCRIPTIONS_ENABLED: 'false' };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('SUBSCRIPTIONS_ENABLED=true + provider=apple verlangt APPLE_SHARED_SECRET', () => {
      const cfg = {
        ...baseProduction,
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'apple',
        APPLE_BUNDLE_ID: 'de.tanklotse.app',
      };
      expect(() => configValidation(cfg)).toThrow(/APPLE_SHARED_SECRET/);
    });

    it('SUBSCRIPTIONS_ENABLED=true + apple mit Aliassen (APPLE_IAP_SHARED_SECRET) → ok', () => {
      const cfg = {
        ...baseProduction,
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'apple',
        APPLE_BUNDLE_ID: 'de.tanklotse.app',
        APPLE_IAP_SHARED_SECRET: 'apple-iap-secret-from-app-store-connect',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('SUBSCRIPTIONS_ENABLED=true + provider=google verlangt PACKAGE_NAME + ServiceAccount', () => {
      const cfg = {
        ...baseProduction,
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'google',
      };
      expect(() => configValidation(cfg)).toThrow(/GOOGLE_PLAY_PACKAGE_NAME/);
    });

    it('SUBSCRIPTIONS_ENABLED=true + google mit GOOGLE_PLAY_SERVICE_ACCOUNT_PATH (existing) → ok', () => {
      const cfg = {
        ...baseProduction,
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'google',
        GOOGLE_PLAY_PACKAGE_NAME: 'de.tanklotse.app',
        GOOGLE_PLAY_SERVICE_ACCOUNT_PATH: './secrets/google-play.json',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('SUBSCRIPTIONS_ENABLED=true + provider=stripe verlangt SECRET_KEY und WEBHOOK_SECRET', () => {
      const cfg = {
        ...baseProduction,
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'stripe',
      };
      expect(() => configValidation(cfg)).toThrow(/STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET/);
    });

    it('SUBSCRIPTIONS_ENABLED=true + stripe mit beiden Keys → ok', () => {
      const cfg = {
        ...baseProduction,
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'stripe',
        STRIPE_SECRET_KEY: 'sk_live_fake',
        STRIPE_WEBHOOK_SECRET: 'whsec_fake',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('SUBSCRIPTIONS_ENABLED=true + provider=none → Fehler', () => {
      const cfg = {
        ...baseProduction,
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'none',
      };
      expect(() => configValidation(cfg)).toThrow(/SUBSCRIPTION_PROVIDER/);
    });
  });

  // --- Sentry / SMTP ------------------------------------------------------
  describe('Sentry + SMTP Feature-Flags', () => {
    it('SENTRY_ENABLED=true ohne SENTRY_DSN → Fehler', () => {
      const cfg = { ...baseProduction, SENTRY_ENABLED: 'true' };
      expect(() => configValidation(cfg)).toThrow(/SENTRY_DSN/);
    });

    it('SENTRY_ENABLED=true mit DSN → ok', () => {
      const cfg = {
        ...baseProduction,
        SENTRY_ENABLED: 'true',
        SENTRY_DSN: 'https://x@sentry.io/123',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('SMTP_ENABLED=false → fehlende Werte erlaubt', () => {
      const cfg = { ...baseProduction, SMTP_ENABLED: 'false' };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('SMTP_ENABLED=true ohne SMTP_HOST → Fehler', () => {
      const cfg = { ...baseProduction, SMTP_ENABLED: 'true' };
      expect(() => configValidation(cfg)).toThrow(/SMTP_/);
    });

    it('SMTP_ENABLED=true mit allen Werten (Aliassen) → ok', () => {
      const cfg = {
        ...baseProduction,
        SMTP_ENABLED: 'true',
        SMTP_HOST: 'mail.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'no-reply',
        SMTP_PASSWORD: 'fake', // existing alias for SMTP_PASS
        SMTP_FROM: 'no-reply@example.de', // existing alias for MAIL_FROM
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });
  });

  // --- Provider-Tippfehler werfen hart (Audit 2026-05-06 §14 Aufgabe 1) ----
  describe('Provider-Tippfehler-Schutz: kein Silent Fallback', () => {
    it('FUEL_PROVIDER=tankerkoenigg → Fehler', () => {
      const cfg = { ...baseProduction, FUEL_PROVIDER: 'tankerkoenigg' };
      expect(() => configValidation(cfg)).toThrow(/FUEL_PROVIDER/);
    });

    it('GEOCODER_PROVIDER=mapboxx → Fehler', () => {
      const cfg = { ...baseProduction, GEOCODER_PROVIDER: 'mapboxx' };
      expect(() => configValidation(cfg)).toThrow(/GEOCODER_PROVIDER/);
    });

    it('ROUTING_PROVIDER=mapboxx → Fehler', () => {
      const cfg = { ...baseProduction, ROUTING_PROVIDER: 'mapboxx' };
      expect(() => configValidation(cfg)).toThrow(/ROUTING_PROVIDER/);
    });

    it('SUBSCRIPTION_PROVIDER=stripee → Fehler', () => {
      const cfg = { ...baseProduction, SUBSCRIPTION_PROVIDER: 'stripee' };
      expect(() => configValidation(cfg)).toThrow(/SUBSCRIPTION_PROVIDER/);
    });

    it('Fehlender ROUTING_PROVIDER faellt auf noop zurueck (kein Fehler)', () => {
      const cfg = { ...baseProduction, ROUTING_PROVIDER: undefined };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('Fehlender GEOCODER_PROVIDER faellt auf nominatim zurueck (kein Fehler)', () => {
      const cfg = { ...baseProduction, GEOCODER_PROVIDER: undefined };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('Fehlender SUBSCRIPTION_PROVIDER faellt auf none zurueck (kein Fehler)', () => {
      const cfg = { ...baseProduction, SUBSCRIPTION_PROVIDER: undefined };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('Leerer ROUTING_PROVIDER (whitespace-only) faellt auf noop zurueck', () => {
      const cfg = { ...baseProduction, ROUTING_PROVIDER: '   ' };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('Erlaubte Werte werden akzeptiert (mapbox routing mit Token)', () => {
      const cfg = {
        ...baseProduction,
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'sk.real',
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });
  });

  // --- non-production lockerer Modus -------------------------------------
  describe('non-production-Verhalten', () => {
    it('Development ohne COOKIE_SECRET → ok', () => {
      const cfg = {
        ...baseProduction,
        NODE_ENV: 'development',
        COOKIE_SECRET: undefined,
        CORS_ORIGINS: undefined,
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });

    it('Test mit FUEL_PROVIDER=mock + leeren Secrets → ok', () => {
      const cfg = {
        ...baseProduction,
        NODE_ENV: 'test',
        FUEL_PROVIDER: 'mock',
        TANKERKOENIG_API_KEY: undefined,
        COOKIE_SECRET: undefined,
        CORS_ORIGINS: undefined,
        GEOCODER_USER_AGENT: undefined,
      };
      expect(() => configValidation(cfg)).not.toThrow();
    });
  });
});
