import { getExternalServicesConfig } from '../../common/config/external-services.config';
import { ExternalServicesService } from './external-services.service';

/**
 * Tests fuer den Admin-Status-Service (Auftrag §22.8).
 *
 * Pflicht-Garantie: Antwort enthaelt KEINE Secret-Werte. Nur Variablen-Namen
 * und Booleans.
 */
describe('ExternalServicesService', () => {
  function svcFor(env: Record<string, string | undefined>) {
    return new ExternalServicesService(() =>
      getExternalServicesConfig(env as NodeJS.ProcessEnv),
    );
  }

  // --- Pflicht-Garantie: keine Secrets in der Antwort -----------------------
  describe('Sicherheit: Antwort enthaelt KEINE Secret-Werte', () => {
    const sensitiveSecret = 'super-geheimer-key-aus-dem-store-XYZ123';

    const fullEnv = {
      NODE_ENV: 'production',
      FUEL_PROVIDER: 'tankerkoenig',
      TANKERKOENIG_API_KEY: sensitiveSecret,
      MAPBOX_ACCESS_TOKEN: sensitiveSecret,
      GRAPHHOPPER_API_KEY: sensitiveSecret,
      FCM_PROJECT_ID: 'proj',
      FCM_CLIENT_EMAIL: 'sa@proj.iam.gserviceaccount.com',
      FCM_PRIVATE_KEY: sensitiveSecret,
      GOOGLE_CLIENT_ID: '123-abc.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: sensitiveSecret,
      APPLE_PRIVATE_KEY: sensitiveSecret,
      APPLE_TEAM_ID: 'TEAM12345',
      APPLE_KEY_ID: 'KEY12345',
      APPLE_BUNDLE_ID: 'de.tanklotse.app',
      APPLE_SHARED_SECRET: sensitiveSecret,
      STRIPE_SECRET_KEY: sensitiveSecret,
      STRIPE_WEBHOOK_SECRET: sensitiveSecret,
      SMTP_PASS: sensitiveSecret,
      SENTRY_DSN: 'https://x@sentry.io/123',
      ROUTING_ENABLED: 'true',
      ROUTING_PROVIDER: 'mapbox',
      PUSH_ENABLED: 'true',
      GOOGLE_LOGIN_ENABLED: 'true',
      APPLE_LOGIN_ENABLED: 'true',
      SUBSCRIPTIONS_ENABLED: 'true',
      SUBSCRIPTION_PROVIDER: 'stripe',
      SENTRY_ENABLED: 'true',
      SMTP_ENABLED: 'true',
      SMTP_HOST: 'mail.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'no-reply',
      MAIL_FROM: 'no-reply@example.de',
    };

    it('Antwort enthaelt nirgendwo den Secret-Wert', () => {
      const svc = svcFor(fullEnv);
      const json = JSON.stringify({ summary: svc.summary(), services: svc.list() });
      expect(json).not.toContain(sensitiveSecret);
    });

    it('Antwort enthaelt zwar Variablen-NAMEN, aber keine Werte', () => {
      // Bei einem teilweise leeren Stand erscheint der Variablen-Name in
      // missingKeys — das ist gewollt. Werte duerfen aber nirgends auftauchen.
      const svc = svcFor({
        ...fullEnv,
        STRIPE_SECRET_KEY: undefined, // bewusst entfernt → muss in missingKeys auftauchen
      });
      const services = svc.list();
      const stripe = services.find((s) => s.service === 'subscriptions');
      expect(stripe?.missingKeys).toContain('STRIPE_SECRET_KEY');
      // Wert-Form darf nirgends im Output stehen.
      expect(JSON.stringify(services)).not.toContain(sensitiveSecret);
    });
  });

  // --- Status-Berechnung ---------------------------------------------------
  describe('Status-Berechnung', () => {
    it('disabled: PUSH_ENABLED=false → status=disabled, missingKeys=[]', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        PUSH_ENABLED: 'false',
      });
      const push = svc.list().find((s) => s.service === 'push')!;
      expect(push.status).toBe('disabled');
      expect(push.enabled).toBe(false);
      expect(push.missingKeys).toEqual([]);
    });

    it('missing: ROUTING_ENABLED=true + provider=mapbox ohne Token → status=missing, missingKeys=[MAPBOX_ACCESS_TOKEN]', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
      });
      const routing = svc.list().find((s) => s.service === 'routing')!;
      expect(routing.status).toBe('missing');
      expect(routing.enabled).toBe(true);
      expect(routing.missingKeys).toContain('MAPBOX_ACCESS_TOKEN');
    });

    it('configured: ROUTING_ENABLED=true + provider=mapbox + Token → status=configured', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'sk.real',
      });
      const routing = svc.list().find((s) => s.service === 'routing')!;
      expect(routing.status).toBe('configured');
      expect(routing.missingKeys).toEqual([]);
    });

    it('invalid: ROUTING_ENABLED=true + noop in production → status=invalid, invalidKeys=[ROUTING_PROVIDER]', () => {
      const svc = svcFor({
        NODE_ENV: 'production',
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'noop',
      });
      const routing = svc.list().find((s) => s.service === 'routing')!;
      expect(routing.status).toBe('invalid');
      expect(routing.invalidKeys).toContain('ROUTING_PROVIDER');
    });
  });

  // --- Aliase: existing-Naming wird akzeptiert -----------------------------
  describe('ENV-Alias-Akzeptanz', () => {
    it('GOOGLE_OAUTH_CLIENT_ID gilt als Alias fuer GOOGLE_CLIENT_ID', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        GOOGLE_LOGIN_ENABLED: 'true',
        GOOGLE_OAUTH_CLIENT_ID: '123-abc.apps.googleusercontent.com',
      });
      const google = svc.list().find((s) => s.service === 'google-login')!;
      expect(google.status).toBe('configured');
    });

    it('APPLE_IAP_SHARED_SECRET gilt als Alias fuer APPLE_SHARED_SECRET', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'apple',
        APPLE_BUNDLE_ID: 'de.tanklotse.app',
        APPLE_IAP_SHARED_SECRET: 'shared-secret-from-apple',
      });
      const subs = svc.list().find((s) => s.service === 'subscriptions')!;
      expect(subs.status).toBe('configured');
    });

    it('FCM_SERVICE_ACCOUNT_PATH (existing Datei-Pfad) erfuellt PUSH_ENABLED=true', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        PUSH_ENABLED: 'true',
        FCM_SERVICE_ACCOUNT_PATH: './secrets/fcm.json',
      });
      const push = svc.list().find((s) => s.service === 'push')!;
      expect(push.status).toBe('configured');
    });

    it('GOOGLE_PLAY_SERVICE_ACCOUNT_PATH (existing) erfuellt SUBSCRIPTION_PROVIDER=google', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        SUBSCRIPTIONS_ENABLED: 'true',
        SUBSCRIPTION_PROVIDER: 'google',
        GOOGLE_PLAY_PACKAGE_NAME: 'de.tanklotse.app',
        GOOGLE_PLAY_SERVICE_ACCOUNT_PATH: './secrets/google-play.json',
      });
      const subs = svc.list().find((s) => s.service === 'subscriptions')!;
      expect(subs.status).toBe('configured');
    });

    it('SMTP_PASSWORD (existing) erfuellt SMTP_ENABLED=true', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        SMTP_ENABLED: 'true',
        SMTP_HOST: 'mail.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'no-reply',
        SMTP_PASSWORD: 'fake-pass',
        SMTP_FROM: 'no-reply@example.de',
      });
      const smtp = svc.list().find((s) => s.service === 'smtp')!;
      expect(smtp.status).toBe('configured');
    });
  });

  // --- Platzhalter-Werte ("replace-me" etc.) gelten nicht als konfiguriert -----
  describe('Platzhalter-Erkennung (Audit §11 Aufgabe 2)', () => {
    it.each([
      'replace-me',
      'replace-with-min-32-characters',
      '__REPLACE_WITH_RANDOM_32_CHAR_SECRET__',
      'CHANGEME_MIN_32_CHARS_NOT_A_REAL_SECRET',
      'changeme',
      'change-me',
      'todo',
      'dummy',
      'example',
      'placeholder',
      'please-set-strong-secret-min-32',
    ])('MAPBOX_ACCESS_TOKEN=%s wird als nicht konfiguriert behandelt', (placeholder) => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: placeholder,
      });
      const routing = svc.list().find((s) => s.service === 'routing')!;
      expect(routing.status).toBe('missing');
      expect(routing.missingKeys).toContain('MAPBOX_ACCESS_TOKEN');
    });

    it('echter Wert „pk.realtoken123" wird als konfiguriert erkannt', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'pk.realtoken123',
      });
      const routing = svc.list().find((s) => s.service === 'routing')!;
      expect(routing.status).toBe('configured');
      expect(routing.missingKeys).toEqual([]);
    });

    it('TANKERKOENIG_API_KEY=replace-me wird als fehlend erkannt', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'replace-me',
      });
      const fuel = svc.list().find((s) => s.service === 'fuel-prices')!;
      expect(fuel.status).toBe('missing');
      expect(fuel.missingKeys).toContain('TANKERKOENIG_API_KEY');
    });
  });

  // --- Sentry-Logik einheitlich (Audit §11 Aufgabe 5) ----------------------
  describe('Sentry: einheitliche Logik zwischen config und validation', () => {
    it('SENTRY_ENABLED=true ohne SENTRY_DSN → status=missing', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        SENTRY_ENABLED: 'true',
      });
      const sentry = svc.list().find((s) => s.service === 'sentry')!;
      expect(sentry.status).toBe('missing');
      expect(sentry.missingKeys).toContain('SENTRY_DSN');
    });

    it('SENTRY_ENABLED=false → status=disabled, ignoriert DSN', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        SENTRY_ENABLED: 'false',
        SENTRY_DSN: 'https://x@sentry.io/123',
      });
      const sentry = svc.list().find((s) => s.service === 'sentry')!;
      expect(sentry.status).toBe('disabled');
    });

    it('SENTRY_DSN gesetzt ohne SENTRY_ENABLED → status=disabled mit Hinweis-Note', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        SENTRY_DSN: 'https://x@sentry.io/123',
      });
      const sentry = svc.list().find((s) => s.service === 'sentry')!;
      expect(sentry.status).toBe('disabled');
      expect(sentry.notes).toBeDefined();
      expect(sentry.notes!.join(' ')).toMatch(/SENTRY_ENABLED/);
    });

    it('SENTRY_ENABLED=true mit DSN → status=configured', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        SENTRY_ENABLED: 'true',
        SENTRY_DSN: 'https://x@sentry.io/123',
      });
      const sentry = svc.list().find((s) => s.service === 'sentry')!;
      expect(sentry.status).toBe('configured');
    });
  });

  // --- Summary -------------------------------------------------------------
  describe('summary()', () => {
    it('zaehlt alle Status-Bereiche korrekt', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        GEOCODER_PROVIDER: 'nominatim',
        NOMINATIM_USER_AGENT: 'TankLotse/1.0 contact@example.de',
        PUSH_ENABLED: 'false',
        ROUTING_ENABLED: 'false',
        GOOGLE_LOGIN_ENABLED: 'false',
        APPLE_LOGIN_ENABLED: 'false',
        SUBSCRIPTIONS_ENABLED: 'false',
        SENTRY_ENABLED: 'false',
        SMTP_ENABLED: 'false',
      });
      const summary = svc.summary();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.configured + summary.disabled + summary.optional + summary.missing + summary.invalid)
        .toBe(summary.total);
    });
  });

  // --- Notes-Eigenschaft ---------------------------------------------------
  describe('notes — ehrliche Beschreibung "vorbereitet"', () => {
    it('Routing deaktiviert hat einen erklaerenden notes-Text', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'key',
        ROUTING_ENABLED: 'false',
      });
      const routing = svc.list().find((s) => s.service === 'routing')!;
      expect(routing.notes).toBeDefined();
      expect(routing.notes!.join(' ')).toMatch(/Luftlinie|vorbereitet|Mapbox|GraphHopper/i);
    });

    it('FUEL_PROVIDER=mtsk hat einen ehrlichen notes-Text', () => {
      const svc = svcFor({
        FUEL_PROVIDER: 'mtsk',
        MTSK_API_KEY: 'real-key',
        MTSK_BASE_URL: 'https://mtsk.example.de',
      });
      const fuel = svc.list().find((s) => s.service === 'fuel-prices')!;
      expect(fuel.notes).toBeDefined();
      expect(fuel.notes!.join(' ')).toMatch(/MTS-K|vorbereitet/i);
    });
  });
});
