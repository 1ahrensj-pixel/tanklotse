import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

import { getExternalServicesConfig } from './external-services.config';

export enum NodeEnv {
  development = 'development',
  staging = 'staging',
  production = 'production',
  test = 'test',
}

export enum FuelProviderName {
  tankerkoenig = 'tankerkoenig',
  mtsk = 'mtsk',
  mock = 'mock',
}

class EnvSchema {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsInt()
  JWT_ACCESS_TTL!: number;

  @IsInt()
  JWT_REFRESH_TTL!: number;

  @IsEnum(FuelProviderName)
  FUEL_PROVIDER!: FuelProviderName;

  @IsOptional()
  @IsString()
  TANKERKOENIG_API_KEY?: string;

  // Audit 2026-05-06 §11 Aufgabe 3: provider-spezifisch optional. Pflicht nur,
  // wenn FUEL_PROVIDER=tankerkoenig — wird in `validateExternalServices` geprueft.
  // Default: https://creativecommons.tankerkoenig.de/json (vom existing
  // TankerkoenigProvider gesetzt).
  @IsOptional()
  @IsString()
  TANKERKOENIG_BASE_URL?: string;

  @IsOptional()
  @IsString()
  GEOCODER_PROVIDER?: string;

  @IsOptional()
  @IsString()
  GEOCODER_BASE_URL?: string;

  @IsOptional()
  @IsString()
  GEOCODER_USER_AGENT?: string;

  // Optional ueberall, in Production via Hard-Guard erzwungen.
  @IsOptional()
  @IsString()
  COOKIE_SECRET?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;
}

export function configValidation(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvSchema, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Konfiguration ungültig:\n${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`,
    );
  }

  // ---- Provider-spezifische Pflichtfelder ---------------------------------
  if (validated.FUEL_PROVIDER === FuelProviderName.tankerkoenig && !validated.TANKERKOENIG_API_KEY) {
    throw new Error(
      'TANKERKOENIG_API_KEY ist Pflicht, wenn FUEL_PROVIDER=tankerkoenig.',
    );
  }
  if (validated.FUEL_PROVIDER === FuelProviderName.mock && validated.NODE_ENV !== NodeEnv.test) {
    throw new Error(
      'MockProvider darf nur in NODE_ENV=test aktiv sein. Produktion/Staging/Dev verbietet das.',
    );
  }

  // ---- Production Hard-Guards --------------------------------------------
  // Setzt: COOKIE_SECRET (>=32), CORS_ORIGINS (mind. 1 Eintrag, kein "*").
  // (entspricht Audit-Finding §13 P2.4 aus PR #5 + Auftrag §21.1 aus PR #6)
  if (validated.NODE_ENV === NodeEnv.production) {
    if (!validated.COOKIE_SECRET || validated.COOKIE_SECRET.length < 32) {
      throw new Error(
        'COOKIE_SECRET muss in NODE_ENV=production gesetzt und mindestens 32 Zeichen lang sein.',
      );
    }
    const corsList = (validated.CORS_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (corsList.length === 0) {
      throw new Error(
        'CORS_ORIGINS muss in NODE_ENV=production mindestens einen Eintrag enthalten.',
      );
    }
    if (corsList.includes('*')) {
      throw new Error(
        'CORS_ORIGINS=* ist in NODE_ENV=production nicht erlaubt — exakte Origins eintragen.',
      );
    }
  }

  // ---- Feature-Flag-getriebene Validation ---------------------------------
  // Greift fuer alle Umgebungen: wenn ein Feature aktiv ist, muessen die
  // dafuer noetigen Keys vorhanden sein. Wenn ein Feature ausgeschaltet ist,
  // duerfen die Keys fehlen.
  validateExternalServices(config);

  return validated;
}

/**
 * Feature-Flag-getriebene Validation aller externen Dienste (Auftrag §21).
 *
 * Liest die zentrale `getExternalServicesConfig`-Aggregation und wirft bei
 * fehlenden Pflichtwerten je nach Feature-Flag/Provider/Environment.
 */
export function validateExternalServices(env: Record<string, unknown>): void {
  const cfg = getExternalServicesConfig(env as NodeJS.ProcessEnv);
  const isProd = cfg.isProduction;

  // --- Geocoder ------------------------------------------------------------
  if (cfg.geocoder.provider === 'mapbox' && !cfg.geocoder.mapbox.accessTokenConfigured) {
    throw new Error(
      'MAPBOX_ACCESS_TOKEN ist Pflicht, wenn GEOCODER_PROVIDER=mapbox.',
    );
  }
  if (
    cfg.geocoder.provider === 'nominatim' &&
    !cfg.geocoder.nominatim.userAgentConfigured
  ) {
    // Nominatim verlangt einen User-Agent. In Test akzeptieren wir den Default.
    if (isProd) {
      throw new Error(
        'NOMINATIM_USER_AGENT (oder GEOCODER_USER_AGENT) ist Pflicht in Production, wenn GEOCODER_PROVIDER=nominatim.',
      );
    }
  }
  if (cfg.geocoder.provider === 'mock' && isProd) {
    throw new Error('GEOCODER_PROVIDER=mock ist in NODE_ENV=production nicht erlaubt.');
  }

  // --- MTS-K (vorbereitet) -------------------------------------------------
  if (cfg.fuel.mtsk.enabled || cfg.fuel.provider === 'mtsk') {
    if (!cfg.fuel.mtsk.apiKeyConfigured) {
      throw new Error('MTSK_API_KEY ist Pflicht, wenn MTSK_ENABLED=true oder FUEL_PROVIDER=mtsk.');
    }
    if (!cfg.fuel.mtsk.baseUrlConfigured) {
      throw new Error('MTSK_BASE_URL ist Pflicht, wenn MTSK_ENABLED=true oder FUEL_PROVIDER=mtsk.');
    }
  }

  // --- Routing -------------------------------------------------------------
  if (cfg.routing.enabled) {
    const p = cfg.routing.provider;
    if (p === 'mapbox' && !cfg.routing.mapbox.accessTokenConfigured) {
      throw new Error(
        'MAPBOX_ACCESS_TOKEN ist Pflicht, wenn ROUTING_ENABLED=true und ROUTING_PROVIDER=mapbox.',
      );
    }
    if (p === 'graphhopper' && !cfg.routing.graphhopper.apiKeyConfigured) {
      throw new Error(
        'GRAPHHOPPER_API_KEY ist Pflicht, wenn ROUTING_ENABLED=true und ROUTING_PROVIDER=graphhopper.',
      );
    }
    if (p === 'noop' && isProd) {
      throw new Error(
        'ROUTING_ENABLED=true mit ROUTING_PROVIDER=noop ist in NODE_ENV=production nicht erlaubt — echten Provider waehlen.',
      );
    }
  }

  // --- Push (FCM) ----------------------------------------------------------
  if (cfg.push.enabled) {
    const inline = cfg.push.fcmInlineConfigured;
    const filePath = cfg.push.fcmServiceAccountPathConfigured;
    if (!inline && !filePath) {
      throw new Error(
        'PUSH_ENABLED=true verlangt entweder FCM_PROJECT_ID + FCM_CLIENT_EMAIL + FCM_PRIVATE_KEY ' +
          'oder FCM_SERVICE_ACCOUNT_PATH (existing Mechanismus).',
      );
    }
  }

  // --- Google Login -------------------------------------------------------
  if (cfg.googleLogin.enabled && !cfg.googleLogin.clientIdConfigured) {
    throw new Error(
      'GOOGLE_CLIENT_ID (oder GOOGLE_OAUTH_CLIENT_ID) ist Pflicht, wenn GOOGLE_LOGIN_ENABLED=true.',
    );
  }

  // --- Apple Login --------------------------------------------------------
  if (cfg.appleLogin.enabled) {
    const a = cfg.appleLogin;
    const missing: string[] = [];
    if (!a.bundleIdConfigured) missing.push('APPLE_BUNDLE_ID');
    if (!a.teamIdConfigured) missing.push('APPLE_TEAM_ID');
    if (!a.keyIdConfigured) missing.push('APPLE_KEY_ID');
    if (!a.privateKeyConfigured) missing.push('APPLE_PRIVATE_KEY');
    if (missing.length > 0) {
      throw new Error(
        `APPLE_LOGIN_ENABLED=true verlangt: ${missing.join(', ')}.`,
      );
    }
  }

  // --- Subscriptions ------------------------------------------------------
  if (cfg.subscriptions.enabled) {
    const p = cfg.subscriptions.provider;
    if (p === 'none') {
      throw new Error(
        'SUBSCRIPTIONS_ENABLED=true verlangt SUBSCRIPTION_PROVIDER (apple|google|apple_google|stripe).',
      );
    }
    if (p === 'apple' || p === 'apple_google') {
      if (!cfg.subscriptions.apple.sharedSecretConfigured) {
        throw new Error(
          'APPLE_SHARED_SECRET (oder APPLE_IAP_SHARED_SECRET) ist Pflicht, wenn SUBSCRIPTION_PROVIDER apple einschliesst.',
        );
      }
      if (!cfg.subscriptions.apple.bundleIdConfigured) {
        throw new Error(
          'APPLE_BUNDLE_ID ist Pflicht, wenn SUBSCRIPTION_PROVIDER apple einschliesst.',
        );
      }
    }
    if (p === 'google' || p === 'apple_google') {
      if (!cfg.subscriptions.google.packageNameConfigured) {
        throw new Error(
          'GOOGLE_PLAY_PACKAGE_NAME ist Pflicht, wenn SUBSCRIPTION_PROVIDER google einschliesst.',
        );
      }
      if (!cfg.subscriptions.google.serviceAccountConfigured) {
        throw new Error(
          'GOOGLE_SERVICE_ACCOUNT_JSON (oder GOOGLE_PLAY_SERVICE_ACCOUNT_PATH) ist Pflicht, wenn SUBSCRIPTION_PROVIDER google einschliesst.',
        );
      }
    }
    if (p === 'stripe') {
      if (!cfg.subscriptions.stripe.secretKeyConfigured) {
        throw new Error(
          'STRIPE_SECRET_KEY ist Pflicht, wenn SUBSCRIPTION_PROVIDER=stripe.',
        );
      }
      if (!cfg.subscriptions.stripe.webhookSecretConfigured) {
        throw new Error(
          'STRIPE_WEBHOOK_SECRET ist Pflicht, wenn SUBSCRIPTION_PROVIDER=stripe.',
        );
      }
    }
  }

  // --- Sentry -------------------------------------------------------------
  // Wenn explizit SENTRY_ENABLED=true gesetzt, dann SENTRY_DSN Pflicht.
  // SENTRY_DSN allein (ohne SENTRY_ENABLED) bleibt zulaessig — historisches
  // Opt-in-Verhalten in main.ts.
  if (
    (env as Record<string, unknown>).SENTRY_ENABLED &&
    String((env as Record<string, unknown>).SENTRY_ENABLED).toLowerCase() === 'true' &&
    !cfg.sentry.dsnConfigured
  ) {
    throw new Error('SENTRY_DSN ist Pflicht, wenn SENTRY_ENABLED=true.');
  }

  // --- SMTP ---------------------------------------------------------------
  if (cfg.smtp.enabled) {
    const missing: string[] = [];
    if (!cfg.smtp.hostConfigured) missing.push('SMTP_HOST');
    if (!cfg.smtp.portConfigured) missing.push('SMTP_PORT');
    if (!cfg.smtp.userConfigured) missing.push('SMTP_USER');
    if (!cfg.smtp.passConfigured) missing.push('SMTP_PASS (oder SMTP_PASSWORD)');
    if (!cfg.smtp.fromConfigured) missing.push('MAIL_FROM (oder SMTP_FROM)');
    if (missing.length > 0) {
      throw new Error(`SMTP_ENABLED=true verlangt: ${missing.join(', ')}.`);
    }
  }
}
