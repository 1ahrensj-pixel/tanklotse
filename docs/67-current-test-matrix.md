# 67 — Current Test Matrix

**Datum:** 2026-05-07T16:32Z · **PR:** #15 · **Branch:** `audit/truth-cleanup-staging-hardening`

> **Wahrheits-Garantie**
>
> Keine Zeile in dieser Tabelle darf 🟢 sein, ohne dass der genannte Befehl
> tatsaechlich gelaufen ist. „Skip" und „nicht ausgefuehrt" sind erlaubte
> Ergebnisse — sie sind ehrliche Zustands-Wahrheiten, keine Versagen.

## 1. Stand zum Pruefzeitpunkt

| Feld | Wert |
|---|---|
| Datum | 2026-05-07T16:32Z |
| Commit-SHA (Branch-Basis) | `074109a` (main HEAD) |
| Branch | `audit/truth-cleanup-staging-hardening` |
| Pruefer | Claude Code (PR #15) |

## 2. Backend (NestJS)

| Bereich | Befehl | Ergebnis | Run-Quelle |
|---|---|---|---|
| Lint | `cd backend && npm run lint` | 🟢 0 errors / 0 warnings | lokal |
| Unit-Tests | `npm test` | 🟢 28 Suites / 346 Tests | lokal |
| Contract-Tests | `npm run test:contract` | 🟢 3 Suites / 23 Tests | lokal |
| Build | `npm run build` | 🟢 `dist/main.js` | lokal |
| Prisma-Validate | `npx prisma validate` | 🟢 schema valid | lokal |
| Providers-Check (alle Mock) | `FUEL_PROVIDER_MODE=mock ROUTING_PROVIDER_MODE=mock GEOCODER_PROVIDER_MODE=mock npm run providers:check` | 🟢 Exit 0 | lokal |
| Tankerkoenig-Live-Smoke | `npm run smoke:tankerkoenig:live` | ⏸ skipped (kein Key) | nicht ausgefuehrt — `docs/65 §1` |
| Mapbox-Live-Smoke | `npm run smoke:mapbox:routing` | ⏸ skipped (kein Token) | nicht ausgefuehrt — `docs/65 §1` |
| PostGIS-Smoke | `DATABASE_URL=… npm run smoke:postgis` | ⏸ nicht ausgefuehrt (kein DB-Service in dieser Session) | siehe `docs/66 §4` |

## 3. Mobile (Flutter)

| Bereich | Befehl | Ergebnis | Hinweis |
|---|---|---|---|
| `flutter pub get` | im Mobile-CI (`.github/workflows/mobile.yml`) | 🟢 in CI | letzte gruene Runs nach PR #11/#12 |
| `flutter analyze` | im Mobile-CI | erwartet 🟢 (PR #15.1 fuegt 1 neuen Banner-Test hinzu) | siehe Workflow |
| `flutter test` | im Mobile-CI | erwartet 🟢 inkl. `simulation_banner_test.dart` | siehe Workflow |
| `flutter build web` | nicht im Standard-CI | ⏸ nicht ausgefuehrt | optional fuer Web-Preview |
| `flutter build apk` / `flutter build ios` | nicht im Standard-CI | ⏸ nicht ausgefuehrt | benoetigt Android-SDK / macOS |
| Mock-Banner sichtbar bei `--dart-define=PROVIDER_SIMULATION_ACTIVE=true` | manueller Test mit Mock-Backend | ⏸ nicht ausgefuehrt — Toolchain in dieser Session nicht installiert | im Folge-PR mit Flutter-Toolchain pruefen |

> Lokal in dieser Code-Session ist kein Flutter-Toolchain installiert — die
> Mobile-Werte stehen aus dem letzten Mobile-CI-Run von `main` HEAD und
> werden bei naechstem PR-Push erneut gegen den Branch geprueft.

## 4. Web

| Bereich | Befehl | Ergebnis | Hinweis |
|---|---|---|---|
| Admin-Dashboard Build | `cd admin-dashboard && npm run build` | 🟢 statisch generiert (inkl. neuer Route `/system/readiness`) | lokal |
| Landingpage Build | `cd landingpage && npm run build` | 🟢 statisch generiert (inkl. SimulationBanner) | lokal |
| Admin Lint | `next lint` | nicht ausgefuehrt | optional |

## 5. Infrastruktur

| Bereich | Befehl | Ergebnis | Hinweis |
|---|---|---|---|
| Docker-Compose-Config-Validate | `docker compose -f infrastructure/docker-compose.yml config` | 🟢 valid (mit erwarteten Warnungen fuer nicht gesetzte Secrets) | lokal |
| Docker-Compose-Up | `docker compose -f infrastructure/docker-compose.yml up -d --build` | ⏸ nicht ausgefuehrt (kein Docker-Daemon in dieser Session) | erforderlich auf echtem Server |
| Curl `/health` | `curl -f http://localhost/health` | ⏸ nicht ausgefuehrt | nach echtem Up |
| Curl `/ready` | `curl -f http://localhost/ready` | ⏸ nicht ausgefuehrt | nach echtem Up |

## 6. Security

| Bereich | Befehl | Ergebnis | Run-Quelle |
|---|---|---|---|
| gitleaks (Repo-Root) | `gitleaks detect --source . --redact --no-banner` | 🟢 no leaks found, 35 commits scanned | lokal |
| api-key-not-in-mobile | CI-Job `security/api-key-not-in-mobile` | 🟢 (zuletzt PR #14) | GitHub Actions |

## 7. End-to-End / Browser

| Bereich | Befehl | Ergebnis |
|---|---|---|
| Playwright | `cd tests && npx playwright test` | ⏸ **nicht ausgefuehrt** (kein Browser-Toolchain in dieser Session) |

## 8. CI-Workflows auf GitHub

| Workflow | Datei | Letzter Stand |
|---|---|---|
| backend | `.github/workflows/backend.yml` | 🟢 nach PR #14 (Run-IDs siehe `docs/62`) — enthaelt jetzt `test:contract` + `providers:check` (PR #12) |
| mobile | `.github/workflows/mobile.yml` | 🟢 nach PR #14 |
| web | `.github/workflows/web.yml` | 🟢 nach PR #14 |
| security | `.github/workflows/security.yml` | 🟢 nach PR #13 (PR #12 war rot, PR #13 hat Fix) |
| staging-live-smoke | `.github/workflows/staging-live-smoke.yml` | ⏸ `workflow_dispatch`-only, nie automatisch ausgefuehrt |

## 9. Was diese Tabelle NICHT zeigt

- Kein Render-Deploy-Lauf — siehe `docs/65 §1` und `docs/66 §4`.
- Kein Vercel-Deploy-Lauf — siehe `docs/64 §3`.
- Kein echter App-Store-/TestFlight-Build.
- Keine Pen-Test-Auswertung.
- Keine Lasttests / Performance-Tests.

## 10. Pflicht beim naechsten Lauf

Diese Datei ist **eine Momentaufnahme**, kein Zustand. Sobald ein Bereich
sich aendert, wird die Datei aktualisiert oder eine neue
`docs/67-current-test-matrix-YYYY-MM-DD.md`-Variante erzeugt. Nicht: Werte
hier raten oder von alter Stand-Doku uebernehmen.

## 11. Verweise

- `docs/65-truth-status-reconciliation.md` — Wahrheit pro Bereich
- `docs/58-beta-launch-readiness-matrix.md` — Beta-Gesamt-Status
- `docs/62-provider-simulation-post-merge-verification.md` — PR #11/#12/#13 Stand
- `docs/64-staging-preview-deployment.md` — Mock-Preview-Deploy
- `docs/66-render-postgis-smoke-report.md` — PostGIS-Smoke
- `.github/workflows/*.yml` — CI-Definitionen
