import { Injectable } from '@nestjs/common';

import { getExternalServicesConfig } from '../../common/config/external-services.config';
import {
  ProviderMode,
  ProviderReadiness,
  type ProviderReadinessStatus,
  parseProviderMode,
} from '../../common/providers/provider-mode.types';
import { RoutingMetricsService } from '../../routing/routing-metrics.service';

/**
 * Audit 2026-05-06 §22 Phase 2 + §10 Aufgabe 1+2 + §22 Phase 8 (PR #11)
 * — Live-Readiness fuer Staging mit Provider-Simulation-Mode.
 *
 * Wahrheits-Garantie:
 *  - Endpoint zeigt nur Variablen-Namen, keine Werte.
 *  - **Klare semantische Trennung** (Audit §10 Aufgabe 1):
 *      `liveSmokeRunnable` = Konfiguration vorhanden, Smoke koennte laufen.
 *      `liveVerified`      = Smoke wurde mit echtem Key erfolgreich ausgefuehrt.
 *      `lastLiveCheckAt`   = Zeitstempel des letzten Smoke-Laufs (oder null).
 *      `lastLiveStatus`    = Resultat: not_checked | success | failed | skipped.
 *    Persistenz fuer `lastLive*` existiert noch nicht — Werte sind heute
 *    statisch (`null` / `not_checked`). Die Felder sind mit Absicht jetzt
 *    schon im Schema, damit das Admin-UI bei spaeterer Persistenz sauber
 *    binden kann.
 *  - Ein `not_implemented`-Status (Audit §10 Aufgabe 2) trennt den
 *    GraphHopper-Stub klar von echten Providern. GraphHopper darf NIE
 *    `liveSmokeRunnable=true` melden.
 *  - PR #11: jeder Adapter meldet seinen `mode` (live/sandbox/mock/contract/
 *    disabled). `mock_ready ≠ live_ready` — Mocks zaehlen niemals als
 *    `liveVerified=true`. Das `providerSimulation`-Feld listet alle Adapter
 *    inkl. Push/Auth/Payment in einer einheitlichen Form.
 */
export type ReadinessStatus =
  | 'ok'
  | 'missing_config'
  | 'not_checked'
  | 'failed'
  | 'disabled'
  | 'not_implemented';

export type LiveCheckStatus = 'not_checked' | 'success' | 'failed' | 'skipped';

export interface LiveCheckFields {
  /** Konfiguration vorhanden + Smoke-Skript koennte HTTP-Calls machen. */
  liveSmokeRunnable: boolean;
  /** Smoke wurde erfolgreich gegen die echte API ausgefuehrt. Heute immer false. */
  liveVerified: boolean;
  /** Zeitstempel des letzten Smoke-Laufs. Heute immer null (keine Persistenz). */
  lastLiveCheckAt: string | null;
  /** Resultat des letzten Smoke-Laufs. Heute immer `not_checked`. */
  lastLiveStatus: LiveCheckStatus;
}

export interface ApiReadinessSnapshot {
  fuel: LiveCheckFields & {
    provider: string;
    mode: ProviderMode;
    configured: boolean;
    status: ReadinessStatus;
    missingKeys: string[];
    notes?: string[];
  };
  routing: LiveCheckFields & {
    enabled: boolean;
    provider: string;
    mode: ProviderMode;
    configured: boolean;
    status: ReadinessStatus;
    missingKeys: string[];
    notes?: string[];
  };
  geocoder: {
    provider: string;
    mode: ProviderMode;
    configured: boolean;
    status: ReadinessStatus;
    missingKeys: string[];
  };
  costControls: {
    routingMaxCandidates: number;
    routingConcurrency: number;
    mapboxCacheTtlSeconds: number;
    mapboxTimeoutMs: number;
    mapboxDailyRequestLimit: number;
    mapboxWarnRequestsPerHour: number;
  };
  mapbox: {
    requestsLastHour: number;
    cacheHitsLastHour: number;
    cacheMissesLastHour: number;
    cacheHitRate: number | null;
    timeoutsLastHour: number;
    rateLimitsLastHour: number;
    providerErrorsLastHour: number;
    overWarnThreshold: boolean;
  };
  /**
   * Audit §22 Phase 8 (PR #11): einheitliche Provider-Simulation-Sicht. Jeder
   * Adapter meldet `mode` + `status` als `ProviderReadinessStatus` — auch
   * vorbereitete Mocks fuer Push/Auth/Payment.
   */
  providerSimulation: {
    fuel: ProviderReadiness;
    routing: ProviderReadiness;
    geocoder: ProviderReadiness;
    push: ProviderReadiness;
    auth: ProviderReadiness;
    payment: ProviderReadiness;
    /** `true` setzt der Betreiber NUR aus, wenn Mocks in Production erlaubt sind. */
    allowMockInProduction: boolean;
    /** `true`, sobald irgendein Adapter im Mock-Modus laeuft. */
    anyMockActive: boolean;
    /** PR #12 §5.2: `true`, sobald irgendein Adapter im Contract-Modus laeuft. */
    anyContractActive: boolean;
    /** PR #12 §5.2: ein Live-Smoke wurde tatsaechlich erfolgreich ausgefuehrt + persistiert (heute strukturell immer false). */
    hasLiveVerifiedProviders: boolean;
    /** PR #12 §5.2: kein Adapter laeuft im Live- oder Sandbox-Modus. */
    hasOnlyMockOrContractProviders: boolean;
    /** PR #12 §9.1: einheitliche Liste fuer UI-Tabellen. */
    providers: ProviderReadiness[];
  };
}

const NOT_CHECKED: LiveCheckFields = Object.freeze({
  liveSmokeRunnable: false,
  liveVerified: false,
  lastLiveCheckAt: null,
  lastLiveStatus: 'not_checked' as LiveCheckStatus,
});

@Injectable()
export class ApiReadinessService {
  constructor(private readonly metrics: RoutingMetricsService) {}

  snapshot(env: NodeJS.ProcessEnv = process.env): ApiReadinessSnapshot {
    const cfg = getExternalServicesConfig(env);

    // --- Mode-Auswertung pro Adapter ----------------------------------------
    // Audit §22 Phase 8 (PR #11): expliziter Modus pro Adapter.
    const fuelMode = resolveFuelMode(env, cfg.fuel.provider);
    const routingMode = resolveRoutingMode(env, cfg.routing.enabled);
    const geocoderMode = resolveGeocoderMode(env, cfg.geocoder.provider);
    const pushMode = parseProviderMode(
      env.PUSH_PROVIDER_MODE,
      cfg.push.enabled ? 'live' : 'disabled',
      'PUSH_PROVIDER_MODE',
    );
    const authMode = parseProviderMode(
      env.AUTH_PROVIDER_MODE,
      cfg.googleLogin.enabled || cfg.appleLogin.enabled ? 'live' : 'disabled',
      'AUTH_PROVIDER_MODE',
    );
    const paymentMode = parseProviderMode(
      env.PAYMENT_PROVIDER_MODE,
      cfg.subscriptions.enabled ? 'live' : 'disabled',
      'PAYMENT_PROVIDER_MODE',
    );
    const allowMockInProduction = isAllowMock(env);

    // --- Fuel ---------------------------------------------------------------
    // Audit §10 Aufgabe 2 (Intensiv-Audit): provider-spezifische Logik.
    // Tankerkoenig hat ein Live-Smoke-Script → liveSmokeRunnable=true mit Key.
    // MTS-K ist konfigurierbar, aber es existiert KEIN Smoke-Script → der
    // Status `not_implemented` mit Note ist ehrlicher als ein "ok".
    const fuelMissing: string[] = [];
    let fuelStatus: ReadinessStatus;
    let fuelLiveRunnable = false;
    let fuelNotes: string[] | undefined;

    if (fuelMode === 'mock' || fuelMode === 'contract') {
      fuelStatus = 'disabled';
      fuelNotes = [
        `FUEL_PROVIDER_MODE=${fuelMode} aktiv — Antworten kommen aus Mock/Fixture, ` +
          `niemals von Tankerkoenig. liveVerified bleibt false.`,
      ];
    } else if (cfg.fuel.provider === 'tankerkoenig') {
      if (!cfg.fuel.tankerkoenig.apiKeyConfigured) {
        fuelMissing.push('TANKERKOENIG_API_KEY');
        fuelStatus = 'missing_config';
      } else {
        fuelStatus = 'ok';
        fuelLiveRunnable = true;
      }
    } else if (cfg.fuel.provider === 'mtsk') {
      if (!cfg.fuel.mtsk.apiKeyConfigured) {
        fuelMissing.push('MTSK_API_KEY');
        fuelStatus = 'missing_config';
      } else {
        fuelStatus = 'not_implemented';
        fuelLiveRunnable = false;
        fuelNotes = [
          'MTS-K ist konfigurierbar, aber es existiert noch kein Live-Smoke-Script ' +
            'und kein produktiver MTS-K-FuelProvider-Code. Verwende ' +
            'FUEL_PROVIDER=tankerkoenig oder warte auf eigenen MTS-K-PR.',
        ];
      }
    } else {
      // mock — nur in NODE_ENV=test erlaubt (validation.ts blockiert in prod).
      fuelStatus = 'disabled';
      fuelLiveRunnable = false;
    }
    const fuelConfigured =
      fuelMissing.length === 0 &&
      cfg.fuel.provider !== 'mock' &&
      fuelMode !== 'mock' &&
      fuelMode !== 'contract';

    // --- Routing ------------------------------------------------------------
    // Audit §10 Aufgabe 2: GraphHopper ist Stub → eigener Status.
    const routingMissing: string[] = [];
    let routingStatus: ReadinessStatus = 'disabled';
    let routingNotes: string[] | undefined;
    let routingLiveRunnable = false;

    if (routingMode === 'mock' || routingMode === 'contract') {
      routingStatus = 'disabled';
      routingNotes = [
        `ROUTING_PROVIDER_MODE=${routingMode} aktiv — MockRoutingDistanceService ` +
          `liefert NIEMALS precise=true. liveVerified bleibt false.`,
      ];
    } else if (cfg.routing.enabled) {
      if (cfg.routing.provider === 'mapbox') {
        if (!cfg.routing.mapbox.accessTokenConfigured) {
          routingMissing.push('MAPBOX_ACCESS_TOKEN');
          routingStatus = 'missing_config';
        } else {
          routingStatus = 'ok';
          routingLiveRunnable = true;
        }
      } else if (cfg.routing.provider === 'graphhopper') {
        // Stub: NIE liveSmokeRunnable=true. Auch wenn ein API-Key vorhanden
        // ist — der HTTP-Client existiert nicht.
        routingStatus = 'not_implemented';
        routingNotes = [
          'GraphHopper ist vorbereitet, aber kein produktiver Routing-Client. ' +
            'Verwende ROUTING_PROVIDER=mapbox oder warte auf eigenen GraphHopper-PR.',
        ];
      } else if (cfg.routing.provider === 'noop') {
        routingStatus = 'not_checked';
        routingNotes = [
          'ROUTING_ENABLED=true mit ROUTING_PROVIDER=noop ergibt nur Schaetzungen — ' +
            'in Production bereits per validation.ts blockiert.',
        ];
      }
    }

    // --- Geocoder -----------------------------------------------------------
    const geoMissing: string[] = [];
    if (cfg.geocoder.provider === 'mapbox' && !cfg.geocoder.mapbox.accessTokenConfigured) {
      geoMissing.push('MAPBOX_ACCESS_TOKEN');
    }
    if (
      cfg.geocoder.provider === 'nominatim' &&
      !cfg.geocoder.nominatim.userAgentConfigured
    ) {
      geoMissing.push('NOMINATIM_USER_AGENT');
    }
    let geoStatus: ReadinessStatus =
      geoMode(geocoderMode) ? 'disabled' : geoMissing.length ? 'missing_config' : 'ok';

    // --- ProviderReadiness ---------------------------------------------------
    // Form analog Auftrag §5: service / provider / mode / status /
    // configured / runnable / liveVerified / lastLiveStatus / missingKeys /
    // notes / howToConfigure.
    const isProd = env.NODE_ENV === 'production';
    const providerSimulation = {
      fuel: toProviderReadiness({
        service: 'fuel',
        provider: cfg.fuel.provider,
        mode: fuelMode,
        configured: fuelConfigured,
        liveSmokeRunnable: fuelLiveRunnable,
        missingKeys: fuelMissing,
        notImplemented: fuelStatus === 'not_implemented',
        notes: fuelNotes ?? [],
        howToConfigureLive: ['Setze FUEL_PROVIDER=tankerkoenig.', 'Setze TANKERKOENIG_API_KEY im Backend-ENV.', 'Setze FUEL_PROVIDER_MODE=live.', 'Backend neu starten.', 'npm run smoke:tankerkoenig:live ausfuehren.'],
        isProd,
        allowMock: allowMockInProduction,
      }),
      routing: toProviderReadiness({
        service: 'routing',
        provider: cfg.routing.provider,
        mode: routingMode,
        configured: cfg.routing.enabled && routingMissing.length === 0 && routingStatus === 'ok',
        liveSmokeRunnable: routingLiveRunnable,
        missingKeys: routingMissing,
        notImplemented: routingStatus === 'not_implemented',
        notes: routingNotes ?? [],
        howToConfigureLive: ['Setze ROUTING_ENABLED=true.', 'Setze ROUTING_PROVIDER=mapbox.', 'Setze MAPBOX_ACCESS_TOKEN im Backend-ENV.', 'Setze ROUTING_PROVIDER_MODE=live.', 'Backend neu starten.', 'npm run smoke:mapbox:routing ausfuehren.'],
        isProd,
        allowMock: allowMockInProduction,
      }),
      geocoder: toProviderReadiness({
        service: 'geocoder',
        provider: cfg.geocoder.provider,
        mode: geocoderMode,
        configured: geoMissing.length === 0,
        liveSmokeRunnable: false, // kein dedizierter Live-Smoke fuer Geocoder
        // Im Mock-/Contract-/Disabled-Modus zaehlen Live-Pflicht-Variablen nicht.
        missingKeys: geoMode(geocoderMode) ? [] : geoMissing,
        notImplemented: false,
        notes: [],
        howToConfigureLive: cfg.geocoder.provider === 'nominatim' ? ['Setze NOMINATIM_USER_AGENT (Pflicht laut OSM-Nutzungsbedingungen).', 'Setze GEOCODER_PROVIDER_MODE=live.', 'Backend neu starten.'] : ['Setze MAPBOX_ACCESS_TOKEN.', 'Setze GEOCODER_PROVIDER_MODE=live.', 'Backend neu starten.'],
        isProd,
        allowMock: allowMockInProduction,
      }),
      push: stubProviderReadiness({
        service: 'push',
        provider: 'firebase',
        mode: pushMode,
        configured: cfg.push.enabled && (cfg.push.fcmInlineConfigured || cfg.push.fcmServiceAccountPathConfigured),
        adapterImplementedForLive: false, // FCM-Adapter existiert, aber kein Live-Smoke
        missingKeysIfLive: ['FCM_PROJECT_ID', 'FCM_CLIENT_EMAIL', 'FCM_PRIVATE_KEY'],
        howToConfigureLive: ['Setze FCM_PROJECT_ID + FCM_CLIENT_EMAIL + FCM_PRIVATE_KEY (oder FCM_SERVICE_ACCOUNT_PATH).', 'Setze PUSH_ENABLED=true und PUSH_PROVIDER_MODE=live.', 'Backend neu starten.'],
        isProd,
        allowMock: allowMockInProduction,
      }),
      auth: stubProviderReadiness({
        service: 'auth',
        provider: cfg.googleLogin.enabled ? 'google' : cfg.appleLogin.enabled ? 'apple' : 'none',
        mode: authMode,
        configured: cfg.googleLogin.enabled || cfg.appleLogin.enabled,
        adapterImplementedForLive: true,
        missingKeysIfLive: [],
        howToConfigureLive: ['Setze GOOGLE_LOGIN_ENABLED=true + GOOGLE_CLIENT_ID/SECRET (oder APPLE_LOGIN_ENABLED=true + APPLE_BUNDLE_ID/TEAM_ID/KEY_ID/PRIVATE_KEY).', 'Setze AUTH_PROVIDER_MODE=live.', 'Backend neu starten.'],
        isProd,
        allowMock: allowMockInProduction,
      }),
      payment: stubProviderReadiness({
        service: 'payment',
        provider: cfg.subscriptions.provider === 'none' ? 'none' : cfg.subscriptions.provider,
        mode: paymentMode,
        configured: cfg.subscriptions.enabled && cfg.subscriptions.provider !== 'none',
        adapterImplementedForLive: true,
        missingKeysIfLive: [],
        howToConfigureLive: ['Setze SUBSCRIPTIONS_ENABLED=true.', 'Setze SUBSCRIPTION_PROVIDER (apple|google|apple_google|stripe) + zugehoerige Keys.', 'Setze PAYMENT_PROVIDER_MODE=live.', 'Backend neu starten.'],
        isProd,
        allowMock: allowMockInProduction,
      }),
      allowMockInProduction,
      anyMockActive: [fuelMode, routingMode, geocoderMode, pushMode, authMode, paymentMode].some(
        (m) => m === 'mock' || m === 'contract',
      ),
      anyContractActive: false, // unten gefuellt
      hasLiveVerifiedProviders: false, // heute strukturell, ohne Persistenz
      hasOnlyMockOrContractProviders: false, // unten gefuellt
      providers: [] as ProviderReadiness[], // unten gefuellt
    };

    // PR #12 §5.2 + §9.1: Aggregat-Felder + flache Liste fuer UIs.
    const allModes = [fuelMode, routingMode, geocoderMode, pushMode, authMode, paymentMode];
    const allProviders: ProviderReadiness[] = [
      providerSimulation.fuel,
      providerSimulation.routing,
      providerSimulation.geocoder,
      providerSimulation.push,
      providerSimulation.auth,
      providerSimulation.payment,
    ];
    providerSimulation.anyContractActive = allModes.some((m) => m === 'contract');
    providerSimulation.hasLiveVerifiedProviders = allProviders.some((p) => p.liveVerified);
    providerSimulation.hasOnlyMockOrContractProviders = allProviders
      .filter((p) => p.mode !== 'disabled')
      .every((p) => p.mode === 'mock' || p.mode === 'contract');
    providerSimulation.providers = allProviders;

    return {
      fuel: {
        provider: cfg.fuel.provider,
        mode: fuelMode,
        configured: fuelConfigured,
        status: fuelStatus,
        missingKeys: fuelMissing,
        notes: fuelNotes,
        ...NOT_CHECKED,
        liveSmokeRunnable: fuelLiveRunnable,
      },
      routing: {
        enabled: cfg.routing.enabled,
        provider: cfg.routing.provider,
        mode: routingMode,
        configured: cfg.routing.enabled && routingMissing.length === 0 && routingStatus === 'ok',
        status: routingStatus,
        missingKeys: routingMissing,
        notes: routingNotes,
        ...NOT_CHECKED,
        liveSmokeRunnable: routingLiveRunnable,
      },
      geocoder: {
        provider: cfg.geocoder.provider,
        mode: geocoderMode,
        configured: geoMissing.length === 0,
        status: geoStatus,
        missingKeys: geoMissing,
      },
      costControls: {
        routingMaxCandidates: parsePositiveInt(env.ROUTING_MAX_CANDIDATES, 10),
        routingConcurrency: parsePositiveInt(env.ROUTING_CONCURRENCY, 4),
        mapboxCacheTtlSeconds: parsePositiveInt(env.MAPBOX_CACHE_TTL_S, 1800),
        mapboxTimeoutMs: parsePositiveInt(env.MAPBOX_TIMEOUT_MS, 4000),
        mapboxDailyRequestLimit: parsePositiveInt(env.MAPBOX_DAILY_REQUEST_LIMIT, 1000),
        mapboxWarnRequestsPerHour: parsePositiveInt(env.MAPBOX_WARN_REQUESTS_PER_HOUR, 200),
      },
      mapbox: this.metrics.snapshot(),
      providerSimulation,
    };
  }
}

function geoMode(m: ProviderMode): boolean {
  return m === 'mock' || m === 'contract' || m === 'disabled';
}

function resolveFuelMode(env: NodeJS.ProcessEnv, provider: string): ProviderMode {
  const explicit = parseProviderMode(env.FUEL_PROVIDER_MODE, 'live', 'FUEL_PROVIDER_MODE');
  if (explicit !== 'live') return explicit;
  // Legacy: FUEL_PROVIDER=mock spiegelt sich als mode=mock.
  if (provider === 'mock') return 'mock';
  return 'live';
}

function resolveRoutingMode(env: NodeJS.ProcessEnv, enabled: boolean): ProviderMode {
  const explicit = parseProviderMode(env.ROUTING_PROVIDER_MODE, 'live', 'ROUTING_PROVIDER_MODE');
  if (explicit !== 'live') return explicit;
  if (!enabled) return 'disabled';
  return 'live';
}

function resolveGeocoderMode(env: NodeJS.ProcessEnv, provider: string): ProviderMode {
  const explicit = parseProviderMode(env.GEOCODER_PROVIDER_MODE, 'live', 'GEOCODER_PROVIDER_MODE');
  if (explicit !== 'live') return explicit;
  if (provider === 'mock') return 'mock';
  return 'live';
}

function isAllowMock(env: NodeJS.ProcessEnv): boolean {
  const v = (env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function statusForMode(
  mode: ProviderMode,
  opts: { configured: boolean; missing: string[]; notImplemented: boolean; allowMock: boolean; isProd: boolean },
): ProviderReadinessStatus {
  if (mode === 'disabled') return 'disabled';
  if (mode === 'mock') {
    if (opts.isProd) {
      // Audit §22 Phase 8 §4.2: in Production muss Mock entweder hart
      // blockiert ODER bewusst erlaubt + deutlich gekennzeichnet sein.
      return opts.allowMock ? 'mock_in_production' : 'blocked_in_production';
    }
    return 'mock_ready';
  }
  if (mode === 'contract') {
    if (opts.isProd) {
      return opts.allowMock ? 'mock_in_production' : 'blocked_in_production';
    }
    return 'contract_ready';
  }
  if (opts.notImplemented) return 'not_implemented';
  if (opts.missing.length > 0) return 'missing_config';
  if (mode === 'sandbox') return 'sandbox_ready';
  return opts.configured ? 'live_ready' : 'missing_config';
}

function notesForMode(opts: {
  mode: ProviderMode;
  service: string;
  status: ProviderReadinessStatus;
  baseNotes: string[];
}): string[] {
  const out = [...opts.baseNotes];
  if (opts.mode === 'mock') {
    out.push(`Mock-Daten aktiv. Kein echter ${opts.service}-Live-Test.`);
  } else if (opts.mode === 'contract') {
    out.push(`Contract-Modus aktiv (Fixtures). Kein echter ${opts.service}-Live-Test.`);
  } else if (opts.mode === 'sandbox') {
    out.push(`Sandbox-Modus aktiv. Sandbox-Erfolg ist nicht Production-Erfolg.`);
  }
  if (opts.status === 'blocked_in_production') {
    out.push('In Production blockiert. Setze ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true bewusst, falls noetig.');
  }
  if (opts.status === 'mock_in_production') {
    out.push(
      'WARNUNG: Mock-Adapter laeuft in Production (ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true). ' +
        'Echte Nutzer bekommen Mock-Antworten. Niemals als „live geprueft" zaehlen.',
    );
  }
  return out;
}

function toProviderReadiness(opts: {
  service: string;
  provider: string;
  mode: ProviderMode;
  configured: boolean;
  liveSmokeRunnable: boolean;
  missingKeys: string[];
  notImplemented: boolean;
  notes: string[];
  howToConfigureLive: string[];
  isProd: boolean;
  allowMock: boolean;
}): ProviderReadiness {
  const status = statusForMode(opts.mode, {
    configured: opts.configured,
    missing: opts.missingKeys,
    notImplemented: opts.notImplemented,
    allowMock: opts.allowMock,
    isProd: opts.isProd,
  });
  const runnable =
    status === 'live_ready' ||
    status === 'sandbox_ready' ||
    status === 'mock_ready' ||
    status === 'contract_ready' ||
    status === 'mock_in_production';
  return {
    service: opts.service,
    provider: opts.provider,
    mode: opts.mode,
    status,
    configured: opts.configured,
    runnable,
    liveVerified: false,
    lastLiveStatus: 'not_checked',
    liveSmokeRunnable: opts.liveSmokeRunnable && (opts.mode === 'live' || opts.mode === 'sandbox'),
    missingKeys: opts.missingKeys,
    notes: notesForMode({ mode: opts.mode, service: opts.service, status, baseNotes: opts.notes }),
    howToConfigure: status === 'missing_config' ? opts.howToConfigureLive : undefined,
  };
}

function stubProviderReadiness(opts: {
  service: string;
  provider: string;
  mode: ProviderMode;
  configured: boolean;
  adapterImplementedForLive: boolean;
  missingKeysIfLive: string[];
  howToConfigureLive: string[];
  isProd: boolean;
  allowMock: boolean;
}): ProviderReadiness {
  let missing: string[] = [];
  let notImplemented = false;

  if ((opts.mode === 'live' || opts.mode === 'sandbox') && !opts.adapterImplementedForLive) {
    notImplemented = true;
  }
  if ((opts.mode === 'live' || opts.mode === 'sandbox') && !opts.configured) {
    missing = opts.missingKeysIfLive;
  }
  const status = statusForMode(opts.mode, {
    configured: opts.configured,
    missing,
    notImplemented,
    allowMock: opts.allowMock,
    isProd: opts.isProd,
  });
  const runnable =
    status === 'live_ready' ||
    status === 'sandbox_ready' ||
    status === 'mock_ready' ||
    status === 'contract_ready' ||
    status === 'mock_in_production';
  return {
    service: opts.service,
    provider: opts.provider,
    mode: opts.mode,
    status,
    configured: opts.configured,
    runnable,
    liveVerified: false,
    lastLiveStatus: 'not_checked',
    liveSmokeRunnable: false,
    missingKeys: missing,
    notes: notesForMode({ mode: opts.mode, service: opts.service, status, baseNotes: [] }),
    howToConfigure: status === 'missing_config' ? opts.howToConfigureLive : undefined,
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value == null) return fallback;
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
