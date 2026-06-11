/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Provider-Simulation-Mode.
 *
 * Wahrheits-Achse fuer jeden externen Adapter:
 *   live      = echte API gegen den Provider
 *   sandbox   = offizielle Sandbox/Stage des Providers (Stripe Test, Apple
 *               Sandbox, Google Test, Firebase Emulator, ...)
 *   mock      = lokaler In-Memory-Adapter — schnelle Tests, keine Netzwerke
 *   contract  = lokal mit gespeicherten Provider-Antworten als Fixture
 *               (Vertrags-Tests gegen *.json in `backend/test/fixtures/...`)
 *   disabled  = Adapter nicht geladen, Feature aus
 *
 * Strikte Regel (§21 Wahrheit):
 *   mock_ready     ≠ live_ready
 *   contract_ready ≠ live_verified
 *   sandbox_ready  ≠ production_ready
 *
 * Production-Schutz (§21 Pflicht):
 *   `NODE_ENV=production` + `*_PROVIDER_MODE=mock` → wirft Error,
 *   ausser der Betreiber setzt explizit `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true`.
 */
export type ProviderMode = 'live' | 'sandbox' | 'mock' | 'contract' | 'disabled';

export const PROVIDER_MODES: readonly ProviderMode[] = [
  'live',
  'sandbox',
  'mock',
  'contract',
  'disabled',
] as const;

/**
 * Status pro Adapter im API-Readiness-Snapshot.
 *
 *   live_ready          = Konfiguration + Adapter koennten echt laufen.
 *                         (Nicht: echter Live-Test bestanden — dafuer ist
 *                         `liveVerified` in `ProviderReadiness`.)
 *   sandbox_ready       = Sandbox-Adapter geladen + Sandbox-Credentials gesetzt.
 *   mock_ready          = Mock-Adapter geladen — antwortet aus In-Memory-Daten.
 *   contract_ready      = Mock-Adapter mit Fixtures geladen — Vertrags-Tests
 *                         laufen.
 *   disabled            = Adapter nicht geladen, Feature ausgeschaltet.
 *   missing_config      = Modus gefordert, aber Pflicht-Variablen fehlen.
 *   not_implemented     = Modus gefordert, aber Code-Pfad existiert noch nicht.
 *   invalid_config      = Konfiguration in sich widerspruechlich (z.B.
 *                         provider+mode-Mix passt nicht).
 *   blocked_in_production = Modus in Production gesperrt (z.B. mock ohne
 *                         `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true`).
 *   mock_in_production    = Mock laeuft in Production, weil
 *                         `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true` bewusst
 *                         gesetzt ist (Audit §22 Phase 8 §4.2). Deutliche
 *                         Warnung im UI, da gefaehrlicher Sonderzustand.
 */
export type ProviderReadinessStatus =
  | 'live_ready'
  | 'sandbox_ready'
  | 'mock_ready'
  | 'contract_ready'
  | 'disabled'
  | 'missing_config'
  | 'not_implemented'
  | 'invalid_config'
  | 'blocked_in_production'
  | 'mock_in_production';

export type ProviderLiveStatus = 'not_checked' | 'success' | 'failed' | 'skipped';

/**
 * Readiness-Vertrag analog Auftrag §5. `service` + `provider` machen den
 * Adapter explizit, `configured`/`runnable`/`liveVerified`/`lastLiveStatus`
 * sind die vier Wahrheits-Achsen, die in der Doku auseinandergehalten
 * werden muessen.
 */
export interface ProviderReadiness {
  service: string;
  provider: string;
  mode: ProviderMode;
  status: ProviderReadinessStatus;
  /** Konfiguration ist vollstaendig fuer den gewaehlten Modus. */
  configured: boolean;
  /** Adapter koennte tatsaechlich Anfragen verarbeiten. */
  runnable: boolean;
  /** Echter Smoke wurde mit echtem Key ausgefuehrt. Heute strukturell false. */
  liveVerified: boolean;
  /** Resultat des letzten Smoke-Laufs. Heute statisch `not_checked`. */
  lastLiveStatus: ProviderLiveStatus;
  /** Ein dedizierter Smoke-Skript existiert + waere im aktuellen Modus ausfuehrbar. */
  liveSmokeRunnable: boolean;
  missingKeys: string[];
  notes: string[];
  /** Aktion-Hinweise fuer Betreiber (Auftrag §14.1) — keine Secret-Werte. */
  howToConfigure?: string[];
}

const MODE_ENV_KEYS: Record<string, string> = {
  fuel: 'FUEL_PROVIDER_MODE',
  routing: 'ROUTING_PROVIDER_MODE',
  geocoder: 'GEOCODER_PROVIDER_MODE',
  push: 'PUSH_PROVIDER_MODE',
  auth: 'AUTH_PROVIDER_MODE',
  payment: 'PAYMENT_PROVIDER_MODE',
};

/**
 * Parst `*_PROVIDER_MODE` strikt: leerer Wert → fallback, ungueltiger Wert → Error.
 *
 * Verhaelt sich analog zu `parseEnumOrThrow` in `external-services.config.ts`,
 * damit Tippfehler beim Start hart abbrechen statt still in `live` zu fallen.
 */
export function parseProviderMode(
  value: string | undefined,
  fallback: ProviderMode,
  keyName: string,
): ProviderMode {
  if (value == null) return fallback;
  const trimmed = value.trim();
  if (trimmed === '') return fallback;
  if ((PROVIDER_MODES as readonly string[]).includes(trimmed)) {
    return trimmed as ProviderMode;
  }
  throw new Error(
    `${keyName} ist ungueltig: "${trimmed}". Erlaubt: ${PROVIDER_MODES.join(', ')}.`,
  );
}

/**
 * Production-Guard: wirft, wenn ein Adapter im Mock-Modus laeuft, ohne dass
 * der Betreiber `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true` explizit gesetzt hat.
 *
 * Wird beim Start von jedem Mock-Adapter aufgerufen (Factory-Pfad in
 * Modules).
 */
export function assertMockAllowed(
  scope: keyof typeof MODE_ENV_KEYS | string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') return;
  const allow = (env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION ?? '').trim().toLowerCase();
  if (allow === 'true' || allow === '1' || allow === 'yes') return;
  const envKey =
    (MODE_ENV_KEYS as Record<string, string>)[scope] ?? `${scope.toUpperCase()}_PROVIDER_MODE`;
  throw new Error(
    `${envKey}=mock ist in NODE_ENV=production nicht erlaubt. ` +
      `Setze ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true, um Mocks bewusst zu erlauben ` +
      `(NICHT empfohlen — Mocks zaehlen niemals als live geprueft).`,
  );
}

/**
 * Helper: leeres Readiness-Objekt fuer „Adapter nicht geladen".
 */
export function disabledReadiness(
  service: string,
  provider: string,
  notes: string[] = [],
): ProviderReadiness {
  return {
    service,
    provider,
    mode: 'disabled',
    status: 'disabled',
    configured: false,
    runnable: false,
    liveVerified: false,
    lastLiveStatus: 'not_checked',
    liveSmokeRunnable: false,
    missingKeys: [],
    notes,
  };
}

export const PROVIDER_MODE_ENV_KEYS = MODE_ENV_KEYS;
