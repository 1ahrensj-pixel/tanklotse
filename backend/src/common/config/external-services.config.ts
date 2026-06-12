/**
 * Zentrale Aggregation der External-API-Konfiguration (TankLotse §18).
 *
 * Diese Funktion liest `process.env`, interpretiert Feature-Flags und
 * Provider-Auswahl, und gibt eine **strukturierte, secret-freie** Sicht zurueck.
 *
 * Regel: KEINE Secret-Werte zurueckgeben. Nur Booleans
 * (`apiKeyConfigured: true`) oder oeffentliche URLs.
 *
 * Diese Datei ist die Single-Source-of-Truth fuer:
 *   - validation.ts        (Hard-Guards beim Start)
 *   - external-services    (Status-Endpoint im Admin)
 *   - docs/48              (Doku-Generierung)
 */

import {
  ExternalServiceStatus,
  ServiceId,
  ServiceIds,
  ServiceStatus,
} from './external-services.types';

export type FuelProvider = 'tankerkoenig' | 'mtsk' | 'mock';
export type GeocoderProvider = 'nominatim' | 'mapbox' | 'mock';
export type RoutingProvider = 'noop' | 'mapbox' | 'graphhopper' | 'google';
export type SubscriptionProvider =
  | 'none'
  | 'apple'
  | 'google'
  | 'apple_google'
  | 'stripe';

export interface ExternalServicesConfig {
  /** Welche Werte sind technisch nur Pflicht in `production`? */
  isProduction: boolean;

  fuel: {
    provider: FuelProvider;
    /** Tankerkoenig-Pflicht-Werte: TANKERKOENIG_API_KEY. */
    tankerkoenig: { apiKeyConfigured: boolean; baseUrlConfigured: boolean };
    /** MTS-K (vorbereitet, ohne echten Vertrag aktuell). */
    mtsk: {
      enabled: boolean;
      apiKeyConfigured: boolean;
      baseUrlConfigured: boolean;
    };
  };

  geocoder: {
    provider: GeocoderProvider;
    nominatim: { userAgentConfigured: boolean; baseUrlConfigured: boolean };
    mapbox: { accessTokenConfigured: boolean };
  };

  routing: {
    enabled: boolean;
    provider: RoutingProvider;
    mapbox: { accessTokenConfigured: boolean };
    graphhopper: { apiKeyConfigured: boolean };
  };

  push: {
    enabled: boolean;
    /** Inline-Naming aus dem Auftrag (FCM_PROJECT_ID + FCM_CLIENT_EMAIL + FCM_PRIVATE_KEY). */
    fcmInlineConfigured: boolean;
    /** Bestehender Mechanismus im Code (FCM_SERVICE_ACCOUNT_PATH). Akzeptiert als Alias. */
    fcmServiceAccountPathConfigured: boolean;
  };

  googleLogin: {
    enabled: boolean;
    clientIdConfigured: boolean;
    clientSecretConfigured: boolean;
    callbackUrlConfigured: boolean;
  };

  appleLogin: {
    enabled: boolean;
    bundleIdConfigured: boolean;
    teamIdConfigured: boolean;
    keyIdConfigured: boolean;
    privateKeyConfigured: boolean;
  };

  subscriptions: {
    enabled: boolean;
    provider: SubscriptionProvider;
    apple: {
      sharedSecretConfigured: boolean;
      issuerIdConfigured: boolean;
      keyIdConfigured: boolean;
      privateKeyConfigured: boolean;
      bundleIdConfigured: boolean;
    };
    google: {
      packageNameConfigured: boolean;
      /** Inline JSON oder Datei-Pfad (GOOGLE_PLAY_SERVICE_ACCOUNT_PATH) als Alias. */
      serviceAccountConfigured: boolean;
    };
    stripe: {
      secretKeyConfigured: boolean;
      webhookSecretConfigured: boolean;
      monthlyPriceConfigured: boolean;
      yearlyPriceConfigured: boolean;
    };
  };

  sentry: {
    /**
     * `true`, wenn der Betreiber Sentry explizit aktiviert hat
     * (`SENTRY_ENABLED=true`). Audit 2026-05-06 §11 Aufgabe 5: einheitliche
     * Logik mit `validateExternalServices`. Reine DSN-Anwesenheit aktiviert
     * den Dienst NICHT mehr im Aggregator (legacy main.ts initialisiert
     * Sentry separat, wenn DSN gesetzt — der Status zeigt das via `notes`).
     */
    enabled: boolean;
    /** Explizites Flag wurde gesetzt (true oder false). */
    explicitlySet: boolean;
    dsnConfigured: boolean;
    environmentConfigured: boolean;
  };

  smtp: {
    enabled: boolean;
    hostConfigured: boolean;
    portConfigured: boolean;
    userConfigured: boolean;
    /** SMTP_PASS (Auftrag) ODER SMTP_PASSWORD (existing) als Alias. */
    passConfigured: boolean;
    fromConfigured: boolean;
  };

  /** Mapbox Public Token fuer die Mobile-App (kein geheimer Wert). */
  mapPublicToken: { configured: boolean };
}

/**
 * Bekannte Platzhalter, die wir bewusst NICHT als „konfiguriert" akzeptieren.
 * Liste aus Auftrag §11 Aufgabe 2 (Audit 2026-05-06) plus
 * gitleaks-tauglichen Default-Werten der ENV-Vorlagen.
 *
 * Vergleich erfolgt case-insensitive auf den getrimmten Wert.
 */
export const KNOWN_PLACEHOLDERS: ReadonlySet<string> = new Set(
  [
    'replace-me',
    'replace-with-min-32-characters',
    '__replace_with_random_32_char_secret__',
    'changeme_min_32_chars_not_a_real_secret',
    'changeme',
    'change-me',
    'todo',
    'dummy',
    'example',
    'placeholder',
    'please-set-strong-secret-min-32',
  ].map((s) => s.toLowerCase()),
);

/** Hilfsfunktion: prueft, ob ENV-Wert nicht leer und kein bekannter Platzhalter ist. */
export function isMeaningful(v: string | undefined): boolean {
  if (v == null) return false;
  const t = v.trim();
  if (t.length === 0) return false;
  if (KNOWN_PLACEHOLDERS.has(t.toLowerCase())) return false;
  return true;
}

function asBool(v: string | undefined, fallback = false): boolean {
  if (v == null) return fallback;
  const t = v.trim().toLowerCase();
  return t === 'true' || t === '1' || t === 'yes' || t === 'on';
}

/**
 * Strikte Enum-Pruefung fuer Betreiber-Eingaben (Audit 2026-05-06 §14
 * Aufgabe 1).
 *
 * Unterschied zum frueheren `asEnum()`:
 *   - Wenn der Wert NICHT gesetzt ist (`undefined`/`''`) → fallback.
 *   - Wenn der Wert gesetzt ist und IN der Allowlist → return value.
 *   - Wenn der Wert gesetzt ist und NICHT in der Allowlist → **wirft Fehler**.
 *
 * Damit wird verhindert, dass Tippfehler wie `ROUTING_PROVIDER=mapboxx` still
 * auf `noop` zurueckfallen — der Betreiber bekommt den Tippfehler beim Start
 * gemeldet.
 */
function parseEnumOrThrow<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
  keyName: string,
): T {
  if (value == null) return fallback;
  const trimmed = value.trim();
  if (trimmed === '') return fallback;
  if ((allowed as readonly string[]).includes(trimmed)) {
    return trimmed as T;
  }
  throw new Error(
    `${keyName} ist ungueltig: "${trimmed}". Erlaubt: ${allowed.join(', ')}.`,
  );
}

export function getExternalServicesConfig(
  env: NodeJS.ProcessEnv = process.env,
): ExternalServicesConfig {
  const isProduction = env.NODE_ENV === 'production';

  // Strikt gepruefte Provider-Werte: ein gesetzter, aber unzulaessiger Wert
  // wirft beim Start (Audit 2026-05-06 §14 Aufgabe 1). Fehlende/leere Werte
  // erhalten den dokumentierten Default.
  const fuelProvider = parseEnumOrThrow<FuelProvider>(
    env.FUEL_PROVIDER,
    ['tankerkoenig', 'mtsk', 'mock'],
    'tankerkoenig',
    'FUEL_PROVIDER',
  );

  const geocoderProvider = parseEnumOrThrow<GeocoderProvider>(
    env.GEOCODER_PROVIDER,
    ['nominatim', 'mapbox', 'mock'],
    'nominatim',
    'GEOCODER_PROVIDER',
  );

  const routingProvider = parseEnumOrThrow<RoutingProvider>(
    env.ROUTING_PROVIDER,
    ['noop', 'mapbox', 'graphhopper', 'google'],
    'noop',
    'ROUTING_PROVIDER',
  );

  const subscriptionProvider = parseEnumOrThrow<SubscriptionProvider>(
    env.SUBSCRIPTION_PROVIDER,
    ['none', 'apple', 'google', 'apple_google', 'stripe'],
    'none',
    'SUBSCRIPTION_PROVIDER',
  );

  const fcmInlineConfigured =
    isMeaningful(env.FCM_PROJECT_ID) &&
    isMeaningful(env.FCM_CLIENT_EMAIL) &&
    isMeaningful(env.FCM_PRIVATE_KEY);

  const fcmServiceAccountPathConfigured = isMeaningful(env.FCM_SERVICE_ACCOUNT_PATH);

  return {
    isProduction,

    fuel: {
      provider: fuelProvider,
      tankerkoenig: {
        apiKeyConfigured: isMeaningful(env.TANKERKOENIG_API_KEY),
        baseUrlConfigured: isMeaningful(env.TANKERKOENIG_BASE_URL),
      },
      mtsk: {
        enabled: asBool(env.MTSK_ENABLED) || fuelProvider === 'mtsk',
        apiKeyConfigured: isMeaningful(env.MTSK_API_KEY),
        baseUrlConfigured: isMeaningful(env.MTSK_BASE_URL),
      },
    },

    geocoder: {
      provider: geocoderProvider,
      nominatim: {
        userAgentConfigured: isMeaningful(env.NOMINATIM_USER_AGENT ?? env.GEOCODER_USER_AGENT),
        baseUrlConfigured: isMeaningful(env.NOMINATIM_BASE_URL ?? env.GEOCODER_BASE_URL),
      },
      mapbox: {
        accessTokenConfigured: isMeaningful(env.MAPBOX_ACCESS_TOKEN),
      },
    },

    routing: {
      enabled: asBool(env.ROUTING_ENABLED),
      provider: routingProvider,
      mapbox: {
        accessTokenConfigured: isMeaningful(env.MAPBOX_ACCESS_TOKEN),
      },
      graphhopper: {
        apiKeyConfigured: isMeaningful(env.GRAPHHOPPER_API_KEY),
      },
    },

    push: {
      enabled: asBool(env.PUSH_ENABLED),
      fcmInlineConfigured,
      fcmServiceAccountPathConfigured,
    },

    googleLogin: {
      enabled: asBool(env.GOOGLE_LOGIN_ENABLED),
      // GOOGLE_CLIENT_ID (Auftrag) ODER GOOGLE_OAUTH_CLIENT_ID (existing) als Alias.
      clientIdConfigured: isMeaningful(env.GOOGLE_CLIENT_ID ?? env.GOOGLE_OAUTH_CLIENT_ID),
      clientSecretConfigured: isMeaningful(env.GOOGLE_CLIENT_SECRET),
      callbackUrlConfigured: isMeaningful(env.GOOGLE_CALLBACK_URL),
    },

    appleLogin: {
      enabled: asBool(env.APPLE_LOGIN_ENABLED),
      bundleIdConfigured: isMeaningful(env.APPLE_BUNDLE_ID),
      teamIdConfigured: isMeaningful(env.APPLE_TEAM_ID),
      keyIdConfigured: isMeaningful(env.APPLE_KEY_ID),
      privateKeyConfigured: isMeaningful(env.APPLE_PRIVATE_KEY),
    },

    subscriptions: {
      enabled: asBool(env.SUBSCRIPTIONS_ENABLED),
      provider: subscriptionProvider,
      apple: {
        // APPLE_SHARED_SECRET (Auftrag) ODER APPLE_IAP_SHARED_SECRET (existing) als Alias.
        sharedSecretConfigured: isMeaningful(
          env.APPLE_SHARED_SECRET ?? env.APPLE_IAP_SHARED_SECRET,
        ),
        issuerIdConfigured: isMeaningful(env.APPLE_APP_STORE_ISSUER_ID),
        keyIdConfigured: isMeaningful(env.APPLE_APP_STORE_KEY_ID),
        privateKeyConfigured: isMeaningful(env.APPLE_APP_STORE_PRIVATE_KEY),
        bundleIdConfigured: isMeaningful(env.APPLE_BUNDLE_ID),
      },
      google: {
        packageNameConfigured: isMeaningful(env.GOOGLE_PLAY_PACKAGE_NAME),
        // GOOGLE_SERVICE_ACCOUNT_JSON (Auftrag, inline) ODER GOOGLE_PLAY_SERVICE_ACCOUNT_PATH
        // (existing, Datei-Pfad) als Alias.
        serviceAccountConfigured:
          isMeaningful(env.GOOGLE_SERVICE_ACCOUNT_JSON) ||
          isMeaningful(env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH),
      },
      stripe: {
        secretKeyConfigured: isMeaningful(env.STRIPE_SECRET_KEY),
        webhookSecretConfigured: isMeaningful(env.STRIPE_WEBHOOK_SECRET),
        monthlyPriceConfigured: isMeaningful(env.STRIPE_PRICE_ID_PREMIUM_MONTHLY),
        yearlyPriceConfigured: isMeaningful(env.STRIPE_PRICE_ID_PREMIUM_YEARLY),
      },
    },

    sentry: {
      // Audit §11 Aufgabe 5: enabled folgt nur dem expliziten Flag. Reine
      // DSN-Anwesenheit wird unter `notes` gemeldet, aber der Aggregator
      // betrachtet den Dienst nicht automatisch als „aktiv".
      enabled: asBool(env.SENTRY_ENABLED),
      explicitlySet: env.SENTRY_ENABLED != null && env.SENTRY_ENABLED !== '',
      dsnConfigured: isMeaningful(env.SENTRY_DSN),
      environmentConfigured: isMeaningful(env.SENTRY_ENVIRONMENT),
    },

    smtp: {
      enabled: asBool(env.SMTP_ENABLED),
      hostConfigured: isMeaningful(env.SMTP_HOST),
      portConfigured: isMeaningful(env.SMTP_PORT),
      userConfigured: isMeaningful(env.SMTP_USER),
      // SMTP_PASS (Auftrag) ODER SMTP_PASSWORD (existing) als Alias.
      passConfigured: isMeaningful(env.SMTP_PASS ?? env.SMTP_PASSWORD),
      fromConfigured: isMeaningful(env.MAIL_FROM ?? env.SMTP_FROM),
    },

    mapPublicToken: {
      configured: isMeaningful(env.MAPBOX_PUBLIC_TOKEN),
    },
  };
}

// ---------------------------------------------------------------------------
// Status-Berechnung — uebersetzt die Config-Form in eine Liste fuer den
// Admin-Endpoint. Garantie: keine Secret-Werte, nur Schluesselnamen.
// ---------------------------------------------------------------------------

function build(
  service: ServiceId,
  partial: Omit<ExternalServiceStatus, 'service' | 'status'>,
): ExternalServiceStatus {
  const status: ServiceStatus = !partial.enabled
    ? 'disabled'
    : partial.invalidKeys.length > 0
      ? 'invalid'
      : partial.missingKeys.length > 0
        ? 'missing'
        : partial.configured
          ? 'configured'
          : 'optional';
  return { service, status, ...partial };
}

export function buildExternalServicesStatus(
  cfg: ExternalServicesConfig = getExternalServicesConfig(),
): ExternalServiceStatus[] {
  const list: ExternalServiceStatus[] = [];

  // --- Fuel Prices ----------------------------------------------------------
  {
    const provider = cfg.fuel.provider;
    const missingKeys: string[] = [];
    const notes: string[] = [];

    if (provider === 'tankerkoenig' && !cfg.fuel.tankerkoenig.apiKeyConfigured) {
      missingKeys.push('TANKERKOENIG_API_KEY');
    }
    if (provider === 'mtsk') {
      if (!cfg.fuel.mtsk.apiKeyConfigured) missingKeys.push('MTSK_API_KEY');
      if (!cfg.fuel.mtsk.baseUrlConfigured) missingKeys.push('MTSK_BASE_URL');
      notes.push('MTS-K Provider vorbereitet — ohne echten Zugang nicht produktiv getestet.');
    }
    if (provider === 'mock') {
      notes.push('Mock-Provider — nur fuer Tests, in Production nicht erlaubt.');
    }

    list.push(
      build(ServiceIds.fuelPrices, {
        provider,
        enabled: true, // Fuel-Provider ist immer aktiv (Pflicht-Komponente)
        configured: missingKeys.length === 0 && provider !== 'mock',
        requiredInProduction: true,
        missingKeys,
        invalidKeys: [],
        notes: notes.length ? notes : undefined,
      }),
    );
  }

  // --- Geocoder -------------------------------------------------------------
  {
    const provider = cfg.geocoder.provider;
    const missingKeys: string[] = [];
    const notes: string[] = [];

    if (provider === 'nominatim' && !cfg.geocoder.nominatim.userAgentConfigured) {
      missingKeys.push('NOMINATIM_USER_AGENT');
    }
    if (provider === 'mapbox' && !cfg.geocoder.mapbox.accessTokenConfigured) {
      missingKeys.push('MAPBOX_ACCESS_TOKEN');
    }
    if (provider === 'mock') {
      notes.push('Mock-Geocoder — nur fuer Tests.');
    }

    list.push(
      build(ServiceIds.geocoder, {
        provider,
        enabled: true,
        configured: missingKeys.length === 0 && provider !== 'mock',
        requiredInProduction: true,
        missingKeys,
        invalidKeys: [],
        notes: notes.length ? notes : undefined,
      }),
    );
  }

  // --- Routing --------------------------------------------------------------
  {
    const enabled = cfg.routing.enabled;
    const provider = cfg.routing.provider;
    const missingKeys: string[] = [];
    const invalidKeys: string[] = [];
    const notes: string[] = [];

    if (enabled) {
      if (provider === 'mapbox' && !cfg.routing.mapbox.accessTokenConfigured) {
        missingKeys.push('MAPBOX_ACCESS_TOKEN');
      }
      if (provider === 'graphhopper' && !cfg.routing.graphhopper.apiKeyConfigured) {
        missingKeys.push('GRAPHHOPPER_API_KEY');
      }
      if (provider === 'noop' && cfg.isProduction) {
        invalidKeys.push('ROUTING_PROVIDER');
        notes.push('ROUTING_ENABLED=true mit ROUTING_PROVIDER=noop ist in Production unzulaessig.');
      }
    } else {
      notes.push(
        'Routing deaktiviert — Highway-Check und Saved-Routes nutzen Luftlinie-Naeherung. ' +
          'Echte Fahrweg-Berechnung erfordert Mapbox oder GraphHopper API-Key.',
      );
    }

    list.push(
      build(ServiceIds.routing, {
        provider,
        enabled,
        configured:
          enabled && missingKeys.length === 0 && invalidKeys.length === 0,
        requiredInProduction: false, // Feature-Flag steuert das
        missingKeys,
        invalidKeys,
        notes,
      }),
    );
  }

  // --- Push (FCM) -----------------------------------------------------------
  {
    const enabled = cfg.push.enabled;
    const missingKeys: string[] = [];
    const notes: string[] = [];

    const anyMechanism =
      cfg.push.fcmInlineConfigured || cfg.push.fcmServiceAccountPathConfigured;

    if (enabled && !anyMechanism) {
      // Auftrags-Naming als Pflicht-Liste (Inline-Variante).
      missingKeys.push('FCM_PROJECT_ID', 'FCM_CLIENT_EMAIL', 'FCM_PRIVATE_KEY');
      notes.push(
        'Alternativ akzeptiert: FCM_SERVICE_ACCOUNT_PATH (Datei-Pfad) — der existing PushService liest diesen.',
      );
    }
    if (enabled && cfg.push.fcmServiceAccountPathConfigured && !cfg.push.fcmInlineConfigured) {
      notes.push('Push aktiv ueber FCM_SERVICE_ACCOUNT_PATH (existing Mechanismus).');
    }

    list.push(
      build(ServiceIds.push, {
        provider: 'fcm',
        enabled,
        configured: enabled && anyMechanism,
        requiredInProduction: false,
        missingKeys,
        invalidKeys: [],
        notes: notes.length ? notes : undefined,
      }),
    );
  }

  // --- Google Login --------------------------------------------------------
  {
    const enabled = cfg.googleLogin.enabled;
    const missingKeys: string[] = [];

    if (enabled) {
      if (!cfg.googleLogin.clientIdConfigured) {
        missingKeys.push('GOOGLE_CLIENT_ID');
      }
    }

    list.push(
      build(ServiceIds.googleLogin, {
        provider: 'google',
        enabled,
        configured: enabled && missingKeys.length === 0,
        requiredInProduction: false,
        missingKeys,
        invalidKeys: [],
      }),
    );
  }

  // --- Apple Login ---------------------------------------------------------
  {
    const enabled = cfg.appleLogin.enabled;
    const missingKeys: string[] = [];

    if (enabled) {
      if (!cfg.appleLogin.bundleIdConfigured) missingKeys.push('APPLE_BUNDLE_ID');
      if (!cfg.appleLogin.teamIdConfigured) missingKeys.push('APPLE_TEAM_ID');
      if (!cfg.appleLogin.keyIdConfigured) missingKeys.push('APPLE_KEY_ID');
      if (!cfg.appleLogin.privateKeyConfigured) missingKeys.push('APPLE_PRIVATE_KEY');
    }

    list.push(
      build(ServiceIds.appleLogin, {
        provider: 'apple',
        enabled,
        configured: enabled && missingKeys.length === 0,
        requiredInProduction: false,
        missingKeys,
        invalidKeys: [],
      }),
    );
  }

  // --- Subscriptions / IAP -------------------------------------------------
  {
    const enabled = cfg.subscriptions.enabled;
    const provider = cfg.subscriptions.provider;
    const missingKeys: string[] = [];
    const notes: string[] = [];

    const wantsApple = enabled && (provider === 'apple' || provider === 'apple_google');
    const wantsGoogle = enabled && (provider === 'google' || provider === 'apple_google');
    const wantsStripe = enabled && provider === 'stripe';

    if (wantsApple) {
      if (!cfg.subscriptions.apple.sharedSecretConfigured) {
        missingKeys.push('APPLE_SHARED_SECRET');
      }
      if (!cfg.subscriptions.apple.bundleIdConfigured) {
        missingKeys.push('APPLE_BUNDLE_ID');
      }
    }
    if (wantsGoogle) {
      if (!cfg.subscriptions.google.packageNameConfigured) {
        missingKeys.push('GOOGLE_PLAY_PACKAGE_NAME');
      }
      if (!cfg.subscriptions.google.serviceAccountConfigured) {
        missingKeys.push('GOOGLE_SERVICE_ACCOUNT_JSON');
      }
    }
    if (wantsStripe) {
      if (!cfg.subscriptions.stripe.secretKeyConfigured) {
        missingKeys.push('STRIPE_SECRET_KEY');
      }
      if (!cfg.subscriptions.stripe.webhookSecretConfigured) {
        missingKeys.push('STRIPE_WEBHOOK_SECRET');
      }
    }
    if (enabled && provider === 'none') {
      notes.push('SUBSCRIPTIONS_ENABLED=true aber SUBSCRIPTION_PROVIDER=none — Provider waehlen.');
    }

    list.push(
      build(ServiceIds.subscriptions, {
        provider: provider === 'none' ? undefined : provider,
        enabled,
        configured: enabled && missingKeys.length === 0 && provider !== 'none',
        requiredInProduction: false,
        missingKeys,
        invalidKeys: [],
        notes: notes.length ? notes : undefined,
      }),
    );
  }

  // --- Sentry --------------------------------------------------------------
  {
    const enabled = cfg.sentry.enabled;
    const missingKeys: string[] = [];
    const notes: string[] = [];

    if (enabled && !cfg.sentry.dsnConfigured) {
      missingKeys.push('SENTRY_DSN');
    }

    // Audit §11 Aufgabe 5 + §15 P2 (PR #8): SENTRY_DSN ohne SENTRY_ENABLED
    // wird konsistent ueber alle Schichten als „aus" behandelt — main.ts
    // initialisiert Sentry seit PR #6 ebenfalls nur, wenn SENTRY_ENABLED=true
    // gesetzt ist. Frueher hier behauptete Legacy-Initialisierung
    // existiert NICHT mehr.
    if (!enabled && cfg.sentry.dsnConfigured) {
      notes.push(
        'SENTRY_DSN ist gesetzt, aber SENTRY_ENABLED ist nicht true — Sentry bleibt ' +
          'deaktiviert. Setze SENTRY_ENABLED=true fuer aktiviertes Reporting.',
      );
    }

    list.push(
      build(ServiceIds.sentry, {
        provider: 'sentry',
        enabled,
        configured: enabled && missingKeys.length === 0,
        requiredInProduction: false,
        missingKeys,
        invalidKeys: [],
        notes: notes.length ? notes : undefined,
      }),
    );
  }

  // --- SMTP ----------------------------------------------------------------
  {
    const enabled = cfg.smtp.enabled;
    const missingKeys: string[] = [];

    if (enabled) {
      if (!cfg.smtp.hostConfigured) missingKeys.push('SMTP_HOST');
      if (!cfg.smtp.portConfigured) missingKeys.push('SMTP_PORT');
      if (!cfg.smtp.userConfigured) missingKeys.push('SMTP_USER');
      if (!cfg.smtp.passConfigured) missingKeys.push('SMTP_PASS');
      if (!cfg.smtp.fromConfigured) missingKeys.push('MAIL_FROM');
    }

    list.push(
      build(ServiceIds.smtp, {
        provider: 'smtp',
        enabled,
        configured: enabled && missingKeys.length === 0,
        requiredInProduction: false,
        missingKeys,
        invalidKeys: [],
      }),
    );
  }

  // --- Map Public Token (Mobile-App) ---------------------------------------
  {
    const cfgConfigured = cfg.mapPublicToken.configured;
    list.push(
      build(ServiceIds.mapPublicToken, {
        provider: 'mapbox',
        enabled: true, // benoetigt fuer Mobile-Karte
        configured: cfgConfigured,
        requiredInProduction: false, // App kann auch ohne Karte starten
        missingKeys: cfgConfigured ? [] : ['MAPBOX_PUBLIC_TOKEN'],
        invalidKeys: [],
        notes: [
          'Public Token darf in der Mobile-App per --dart-define=MAPBOX_PUBLIC_TOKEN eingebettet werden. ' +
            'Niemals den geheimen MAPBOX_ACCESS_TOKEN dort ausliefern.',
        ],
      }),
    );
  }

  return list;
}
