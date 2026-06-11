#!/usr/bin/env ts-node
/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — providers:check CLI.
 *
 * Druckt die Provider-Simulation-Sicht aus `ApiReadinessService` als kompakte
 * Tabelle plus Klartext-Zusammenfassung.
 *
 * Aufruf:
 *   npm run providers:check
 *   FUEL_PROVIDER_MODE=mock npm run providers:check
 *
 * Exit-Codes (CI-tauglich):
 *   0  alle Adapter sind bewusst konfiguriert oder bewusst gemockt
 *   1  irgendein Adapter ist `missing_config` (live gewuenscht, Pflicht-Variable fehlt)
 *   2  irgendein Adapter ist `blocked_in_production` (Mock in prod ohne Allow-Flag)
 *   3  irgendein Adapter ist `not_implemented` (im aktuellen Modus)
 *   4  Konfigurations-Parse-Fehler (z.B. `*_PROVIDER_MODE=fantasy`)
 *
 * Logik in `src/admin/system/provider-readiness-report.ts`, damit die Render-
 * Funktion direkt unit-getestet werden kann.
 */
import 'reflect-metadata';

import { renderProviderReadinessReport } from '../src/admin/system/provider-readiness-report';

if (require.main === module) {
  const r = renderProviderReadinessReport(process.env);
  process.stdout.write(r.output + '\n');
  process.exit(r.exitCode);
}
