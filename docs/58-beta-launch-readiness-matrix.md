# 58 — Beta Launch Readiness Matrix

**Datum:** 2026-05-06 · **Stand:** main `42f78a8` + offener Staging-Live-PR

> **Strikte Auditor-Regel §22 Phase 13 + §10 Aufgabe 5:** Keine Fantasie-
> Status. Wenn offen, dann offen.

## 0. Statussprache

| Begriff | Bedeutung |
|---|---|
| 🟢 **fertig** | Code/Doku/Build im Repo, lokal verifiziert |
| 🟡 **vorbereitet, nicht verifiziert** | ausfuehrbar mit echten Keys, aber **nicht live geprueft** |
| 🔴 **offen** | nicht implementiert oder nicht beschafft |
| ⚪ **extern blockiert** | erfordert Drittanbieter / Hardware (z.B. macOS, Apple Developer) |

Wichtige Trennung (Audit §10 Aufgabe 1 + 2):
- `liveSmokeRunnable=true` ≠ live geprueft. Es bedeutet nur „ausfuehrbar".
- API-Readiness-`status=ok` bedeutet **„Konfiguration ist bereit"**, NICHT
  „Live-Test bestanden". Ein 🟢 in dieser Matrix erfordert zusaetzlich
  einen erfolgreichen `docs/59`-Eintrag fuer den jeweiligen Bereich.
- `liveVerified=true` ist heute strukturell unmoeglich (Persistenz fehlt).
  Bis dahin gilt fuer jeden Live-Bereich der Stand aus `docs/59`.
- 🟡 ist nicht 🟢. Ein Eintrag wird erst 🟢, wenn der entsprechende Smoke
  gegen die echte API gelaufen ist (siehe `docs/59`).

## 1. Bewertungsmatrix

Spalten:
- **Status**: 🟢 fertig / 🟡 vorbereitet, nicht verifiziert / 🔴 offen / ⚪ extern blockiert
- **Beleg**: konkrete Datei / Run-ID / Stand
- **Offen**: was beim Betreiber noch zu tun ist

### 1.1 Code + Tests

| Bereich | Status | Beleg | Offen |
|---|---|---|---|
| Backend Lint | 🟢 | `npm run lint` 0/0 lokal verifiziert | — |
| Backend Tests | 🟢 | 237/237 (Stand vor Staging-PR) | — |
| Backend Build | 🟢 | `dist/main.js` lokal | — |
| Mobile Analyze | 🟢 | `flutter analyze` clean | — |
| Mobile Tests | 🟢 | 28/28 lokal | — |
| Security gitleaks | 🟢 | `no leaks found` | — |
| Backend GitHub-Actions | 🟢 | PR-#10-Head `697d900`, Run-IDs 25435333740 (PR) + 25435335309 (push) | Hardening-Folge-Commit `0930599` laeuft beim naechsten CI-Trigger |
| Mobile GitHub-Actions | 🟢 | PR-#10-Head `697d900`, Run-IDs 25435335277 (PR) + 25435335309 (push) | s.o. |
| Security GitHub-Actions | 🟢 | PR-#10-Head `697d900`, Run-IDs 25435333742 (PR) + 25435335318 (push) | s.o. |

### 1.2 Externe APIs

| Bereich | Status | Beleg | Offen |
|---|---|---|---|
| Tankerkoenig live | 🔴 | `npm run smoke:tankerkoenig:live` Script vorhanden | API-Key beantragen + Smoke ausfuehren |
| Mapbox Routing live | 🔴 | `npm run smoke:mapbox:routing` mit 4 Faellen | Mapbox-Token holen + 4 Smoke-Faelle ausfuehren |
| Mapbox-Kostenkontrolle | 🟡 | Top-N + Concurrency + Cache implementiert; Counter im Service aktiv | mit echtem Traffic kalibrieren (`MAPBOX_WARN_REQUESTS_PER_HOUR`) |
| Nominatim Adresssuche | 🟡 | `User-Agent` als Production-Pflicht erzwungen | mit echtem Server-Hostname + Kontakt-Email setzen |
| MTS-K | ⚪ | nur Stub | echter MTS-K-Vertrag fehlt |

### 1.3 Mobile-Builds

| Bereich | Status | Beleg | Offen |
|---|---|---|---|
| Mobile Web (Staging) | 🟡 | `flutter build web --release` lokal verifiziert | mit `--dart-define=API_BASE_URL=...` gegen Staging-Server bauen |
| Mobile Android | 🔴 | `mobile-app/.env.staging.example` mit Build-Befehl | Android-SDK in Build-Umgebung einrichten + APK-Smoke |
| Mobile iOS | ⚪ | dokumentierter Build-Befehl | macOS noetig — extern blockiert in dieser Sandbox |

### 1.4 Infrastruktur

| Bereich | Status | Beleg | Offen |
|---|---|---|---|
| `.env.staging.example` | 🟢 | Repo-Root, vollstaendig | beim Deployment Werte setzen, NIE als File committen |
| Production-Config-Validation | 🟢 | `validation.ts` enforced (Audit §11+§13) | — |
| Docker compose | 🟢 | `docker compose config` valid | — |
| Production-Server | 🔴 | nicht provisioniert | Hetzner CX22 / Fly.io / AWS auswaehlen |
| Domain | 🔴 | offen | Markenrecherche + DENIC + DPMA |
| DNS + TLS | 🔴 | offen | Caddy/Nginx-Config + Lets-Encrypt |

### 1.5 Konten + Compliance

| Bereich | Status | Beleg | Offen |
|---|---|---|---|
| Apple Developer Konto | 🔴 | offen | 99 USD/Jahr, Bundle-ID-Reservierung |
| Google Play Konto | 🔴 | offen | 25 USD einmalig, Service-Account |
| Mapbox Konto | 🔴 | offen | Free-Tier 100k Requests/Monat reicht fuer Beta |
| Tankerkoenig Konto | 🔴 | offen | kostenlos via creativecommons.tankerkoenig.de |
| Sentry Konto | 🟡 | optional, deaktiviert | nicht zwingend fuer Beta |
| Datenschutzerklaerung | 🔴 | `docs/57` Vorlage | Anwalt-Review |
| Impressum | 🔴 | offen | Betreiber-Daten eintragen |
| Pen-Test | 🔴 | offen | extern beauftragen vor Production-Launch |

### 1.6 Security-Härtung

| Bereich | Status | Beleg | Offen |
|---|---|---|---|
| `JWT_*_SECRET` >= 32 Zeichen Production-Pflicht | 🟢 | `validation.ts` | — |
| `COOKIE_SECRET` >= 32 Production-Pflicht | 🟢 | `validation.ts` (PR #5) | — |
| `CORS_ORIGINS` ohne `*` Production-Pflicht | 🟢 | `validation.ts` (PR #6) | — |
| Helmet + CSP | 🟢 | `main.ts` mit production-CSP | — |
| Sentry-Redaction | 🟢 | `main.ts` `beforeBreadcrumb` | — |
| Admin-Endpoint Rollen-Schutz | 🟢 | `external-services.controller.spec.ts` 10 Tests | — |
| Swagger Production-Default `false` | 🟢 | `main.ts` (PR #7) | — |
| Routing-Provider-Strict | 🟢 | `routing.module.ts` (PR #9 Hardening) | — |
| Mapbox-Placeholder-Token-Erkennung | 🟢 | `mapbox-routing-distance.service.ts` (PR #9 Hardening) | — |
| Provider-Simulation-Mode (live/sandbox/mock/contract/disabled) | 🟢 | `provider-mode.types.ts` (PR #11) | — |
| Production-Guard gegen Mock | 🟢 | `assertMockAllowed()` + Tests fuer alle 6 Adapter (PR #12) | — |
| MockRouting → niemals `precise_routing` | 🟢 | RecommendationsService-Spec (PR #12) | — |
| Mock-Modus macht keine Netzwerk-Calls | 🟢 | `mock-network-guard.spec.ts` (PR #12) | — |
| Provider-Contract-Tests in CI | 🟢 | `.github/workflows/backend.yml` (PR #12) | — |
| `providers:check` CLI in CI | 🟢 | gleicher Workflow (PR #12) | — |
| Sentinel-Tests fuer 8 Secrets | 🟢 | `api-readiness.service.spec.ts` (PR #12) | — |
| Security/gitleaks gruen auf `main` | 🟢 | nach PR #13 (Merge `dee4b8a`) | — |
| Live-API-Verifikation (Tankerkoenig/Mapbox) | 🔴 | — | echte Keys + Smoke-Skript-Lauf + `docs/59` ausfuellen |

## 2. Merge-Empfehlung dieses PRs

**🟡 PR mergen, sobald CI grün.** Der PR liefert die Werkzeuge — die
Verifikation gegen echte APIs muss der Betreiber separat durchfuehren und
in `docs/56` §4 eintragen. Erst danach kann ein **echter** Beta-Status
in dieser Matrix gesetzt werden.

## 3. Was vor Beta-Launch zwingend abgehakt sein muss

In Reihenfolge:

1. 🔴 → 🟢 Tankerkoenig live (Schritt 1: Key beantragen, kostenlos)
2. 🔴 → 🟢 Mapbox live + 4 Smoke-Tests gruen
3. 🔴 → 🟢 Mobile Android Build mit Staging-Konfig (mind. APK-Debug)
4. 🔴 → 🟢 Production-Server provisioniert + Smoke gegen die echte URL
5. 🔴 → 🟢 Domain registriert + DNS + TLS
6. 🔴 → 🟢 Datenschutzerklaerung Anwalt-Review
7. 🔴 → 🟢 Impressum vervollstaendigt
8. 🔴 → 🟢 Apple Developer + Google Play Konten + TestFlight/Internal-Testing
9. 🔴 → 🟢 Pen-Test extern beauftragt

## 4. Was vor Public-Launch zwingend abgehakt sein muss

Zusaetzlich zu Beta:

- Markenrecherche „TankLotse" abgeschlossen (DENIC + DPMA + EUIPO)
- Soft-Launch in einem Bundesland mit Sentry + Uptime-Monitoring (mind. 4 Wochen)
- Pen-Test bestanden + dokumentiert
- DSGVO-Auftragsverarbeitungsvertraege (AVV) mit Mapbox/Apple/Google/Stripe wenn aktiv
- Notfall-Plan fuer Mapbox-Tageslimit (harte Drossel statt nur Warning)

## 5. Verweise

- `docs/45` bis `docs/55` — vollstaendige PR-Historie
- `docs/56-staging-live-api-test-report.md` (Statussprache)
- `docs/57-privacy-and-provider-notices-staging.md`
- `docs/59-live-smoke-result-template.md`
- `docs/60-main-after-pr10-staging-readiness-report.md`
- `docs/61-provider-simulation-and-adapter-readiness.md` — **PR #11 Provider-Simulation-Mode**
- `docs/62-provider-simulation-post-merge-verification.md` — **PR #12 Post-Merge-Verifikation**
- `docs/63-api-key-onboarding-runbook.md` — **PR #12 API-Key-Onboarding-Runbook**
- `.env.staging.example`, `.env.production.example`
- `backend/scripts/smoke-*-live.ts`
- `backend/scripts/check-provider-readiness.ts` (`npm run providers:check`)
- `backend/test/staging-live-api.e2e-spec.ts`
- `backend/test/contract/*.contract.spec.ts` (`npm run test:contract`)

## 6. Provider-Modi (Audit §22 Phase 8 / PR #11)

Pro externem Adapter ist eine `ProviderReadinessStatus` ausgewiesen:

| Status | Bedeutung | Beta-tauglich? |
|---|---|---|
| `live_ready` | Konfiguration komplett, Adapter koennte echt laufen | nur in Kombi mit `live_verified` |
| `live_verified` | Smoke-Skript erfolgreich gegen echte API gelaufen | ja |
| `sandbox_ready` | Provider-Sandbox aktiv | nicht fuer Public-Beta |
| `mock_ready` | Mock-Adapter aktiv | nur fuer Dev/Demo, niemals Beta |
| `contract_ready` | Vertrags-Tests gegen Fixtures gruen | nur Dev |
| `mock_in_production` | Mock laeuft in Prod (Allow-Flag gesetzt) | NIEMALS — bewusster Sonder-Warnzustand |
| `disabled` | Adapter aus | je nach Feature |
| `missing_config` | Pflicht-Variablen fehlen | nein |
| `not_implemented` | Code-Pfad fehlt noch (z.B. GraphHopper) | nein |
| `blocked_in_production` | Mock in Prod ohne Allow-Flag | nein |
