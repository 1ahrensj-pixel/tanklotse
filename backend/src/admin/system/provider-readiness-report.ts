import { ApiReadinessService } from './api-readiness.service';
import {
  ProviderReadiness,
  ProviderReadinessStatus,
} from '../../common/providers/provider-mode.types';
import { RoutingMetricsService } from '../../routing/routing-metrics.service';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) + PR #12 §6.1 — testbare
 * Render-Logik fuer `npm run providers:check`. Gibt String + Exit-Code
 * zurueck, OHNE `process.exit` zu rufen — damit Unit-Tests den Output
 * sauber pruefen.
 *
 * Exit-Codes (PR #12 §6.1):
 *   0  alles okay / bewusst mock-ready / contract-ready / sandbox-ready /
 *      live-ready / disabled
 *   1  irgendein Adapter ist `missing_config`
 *   2  `invalid_config` (z.B. ungueltiger ProviderMode beim Parsen)
 *   3  `blocked_in_production`
 *   4  `not_implemented` ODER `mock_in_production` (warnender Zustand)
 */
export interface ProviderReadinessReport {
  output: string;
  exitCode: number;
}

export const PROVIDERS_CHECK_EXIT_CODES = {
  ok: 0,
  missing_config: 1,
  invalid_config: 2,
  blocked_in_production: 3,
  warning: 4, // not_implemented oder mock_in_production
} as const;

function pad(s: string, w: number): string {
  if (s.length >= w) return s;
  return s + ' '.repeat(w - s.length);
}

function tagFor(status: ProviderReadinessStatus): string {
  switch (status) {
    case 'live_ready':
    case 'sandbox_ready':
    case 'mock_ready':
    case 'contract_ready':
      return 'OK ';
    case 'disabled':
      return '-- ';
    case 'missing_config':
      return 'MISS';
    case 'blocked_in_production':
      return 'BLK ';
    case 'not_implemented':
      return 'NIY ';
    case 'invalid_config':
      return 'INV ';
    case 'mock_in_production':
      return 'WARN';
    default:
      return '?  ';
  }
}

function row(name: string, p: ProviderReadiness): string {
  const missing = p.missingKeys.length > 0 ? ` missing=[${p.missingKeys.join(',')}]` : '';
  return `[${tagFor(p.status)}] ${pad(name, 9)} mode=${pad(p.mode, 9)} status=${pad(p.status, 22)} liveVerified=${p.liveVerified}${missing}`;
}

export function renderProviderReadinessReport(
  env: NodeJS.ProcessEnv = process.env,
): ProviderReadinessReport {
  const svc = new ApiReadinessService(new RoutingMetricsService());
  let snap;
  try {
    snap = svc.snapshot(env);
  } catch (e) {
    // PR #12 §6.1: ungueltige *_PROVIDER_MODE-Werte werfen beim Parsen →
    // Exit-Code 2 (invalid_config), nicht mehr 4.
    return {
      output: `[providers:check] Konfigurations-Fehler (invalid_config): ${(e as Error).message}`,
      exitCode: PROVIDERS_CHECK_EXIT_CODES.invalid_config,
    };
  }

  const sim = snap.providerSimulation;
  const lines: string[] = [];
  lines.push('');
  lines.push('TankLotse — Provider Simulation Readiness');
  lines.push('=========================================');
  lines.push(`NODE_ENV=${env.NODE_ENV ?? 'development'}`);
  lines.push(`ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=${sim.allowMockInProduction}`);
  lines.push(`anyMockActive=${sim.anyMockActive}`);
  lines.push('');

  const adapters: Array<[string, ProviderReadiness]> = [
    ['fuel', sim.fuel],
    ['routing', sim.routing],
    ['geocoder', sim.geocoder],
    ['push', sim.push],
    ['auth', sim.auth],
    ['payment', sim.payment],
  ];
  for (const [n, p] of adapters) {
    lines.push(row(n, p));
    if (p.howToConfigure && p.howToConfigure.length > 0) {
      for (const h of p.howToConfigure) {
        lines.push(`           → ${h}`);
      }
    }
  }
  lines.push('');
  lines.push('Legende: OK = bereit, MISS = Pflicht-Variable fehlt, BLK = in Production gesperrt, NIY = noch nicht implementiert, INV = invalid_config.');
  lines.push('Wahrheit: mock_ready != live_ready, contract_ready != live_verified.');

  // PR #12 §6.1: streng aufsteigende Schwere
  //   1 missing_config < 3 blocked_in_production < 4 warning (mock_in_prod / not_implemented)
  let exit: number = PROVIDERS_CHECK_EXIT_CODES.ok;
  for (const [, p] of adapters) {
    if (p.status === 'missing_config' && exit < PROVIDERS_CHECK_EXIT_CODES.missing_config) {
      exit = PROVIDERS_CHECK_EXIT_CODES.missing_config;
    }
    if (
      p.status === 'blocked_in_production' &&
      exit < PROVIDERS_CHECK_EXIT_CODES.blocked_in_production
    ) {
      exit = PROVIDERS_CHECK_EXIT_CODES.blocked_in_production;
    }
    if (p.status === 'not_implemented' && exit < PROVIDERS_CHECK_EXIT_CODES.warning) {
      exit = PROVIDERS_CHECK_EXIT_CODES.warning;
    }
    if (p.status === 'mock_in_production' && exit < PROVIDERS_CHECK_EXIT_CODES.warning) {
      exit = PROVIDERS_CHECK_EXIT_CODES.warning;
    }
  }
  return { output: lines.join('\n'), exitCode: exit };
}
