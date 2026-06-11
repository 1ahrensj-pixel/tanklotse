# 65 — Truth Status Reconciliation

**Datum:** 2026-05-07 · **PR:** #15 · **Quelle:** Audit 2026-05-07 §2 Befund 2.

> **Wahrheits-Garantie**
>
> ```
> mock_ready ≠ live_ready
> contract_ready ≠ live_verified
> sandbox_ready ≠ production_ready
> skip ohne Key ≠ Live-Test bestanden
> ```

Diese Datei ist die einzige Quelle der Wahrheit dafuer, **welcher externe
Bereich heute wirklich live verifiziert ist und welcher nicht**. Wenn
ein anderes Dokument hier widerspricht, ist diese Datei richtig — oder
sie wird hier korrigiert.

## 1. Aktueller Live-Status pro Bereich

| Bereich | aktueller Status | Beweis | offen |
|---|---|---|---|
| **Tankerkönig** | ⏸ vorbereitet, **nicht live verifiziert** | `npm run smoke:tankerkoenig:live` skippt sauber ohne Key (`docs/37` §3); Mock-Adapter mit 4 Koeln-Stationen funktioniert (`MockProvider`-Spec) | echten API-Key beantragen + `docs/63 §2` ausfuehren + `docs/59` ausfuellen |
| **Mapbox Routing** | ⏸ vorbereitet, **nicht live verifiziert** | `npm run smoke:mapbox:routing` skippt ohne Key; `MockRoutingDistanceService` liefert `precise=false`, `source=mock_fixture` | echten Server-Token holen + `docs/63 §3` ausfuehren |
| **Mapbox Geocoding** | ⏸ Code-Pfad nicht aktiv (Default Nominatim) | — | nur relevant, wenn `GEOCODER_PROVIDER=mapbox` |
| **Nominatim Geocoder** | ⏸ Code-Pfad vorbereitet, **kein dedizierter Live-Smoke** | `NOMINATIM_USER_AGENT` Pflicht-Validation aktiv; Mock-Adapter liefert Koeln-Treffer | dedizierten Live-Smoke schreiben + ausfuehren (Folge-PR) |
| **Firebase Push (FCM)** | ⏸ vorbereitet, **nicht live verifiziert** | defensive `PushService`-Initialisierung; `MockPushProvider` validiert nur Payload | Service-Account-JSON + Test-Push an Geraete-Token |
| **Apple Login** | ⏸ vorbereitet, **nicht live verifiziert** | Code-Pfad in `OAuthService` + Mock-Stub | Apple-Developer-Konto + `APPLE_PRIVATE_KEY` aus `AuthKey-XXXX.p8` |
| **Google Login** | ⏸ vorbereitet, **nicht live verifiziert** | Code-Pfad in `OAuthService` + Mock-Stub | Google-OAuth-Client + `GOOGLE_CLIENT_ID/SECRET` |
| **Apple IAP** | ⏸ vorbereitet, **nicht live verifiziert** | `SubscriptionService`-Pfad + Mock-Stub | App-Store-Connect-Subscription + Sandbox-Testkauf |
| **Google Play Billing** | ⏸ vorbereitet, **nicht live verifiziert** | `SubscriptionService`-Pfad + Mock-Stub | Google-Play-Console-Subscription + Internal-Testing |
| **Stripe (optional)** | ⏸ vorbereitet, **nicht live verifiziert** | `SubscriptionService`-Pfad + Webhook-Endpoint | Stripe-Account + Test-mode-Smoke |
| **Sentry** | ⏸ deaktiviert (Default), Code aktivierungsbereit | `getExternalServicesConfig` + `validation.ts` | DSN + `SENTRY_ENABLED=true` setzen, dann Test-Event |
| **SMTP** | ⏸ deaktiviert (Default), Code aktivierungsbereit | `MailerService` + Validation | SMTP-Provider + Test-Mail |
| **Docker Production-Compose** | ⏸ Konfig-Datei valid (`docker compose config` lokal ok), **kein Production-Up-Smoke gelaufen** | `infrastructure/docker-compose.yml` + Hardening in PR #15 | echter Server + `docker compose up -d` + Health-Curl |
| **Render-PostGIS-Extension** | ⏸ unbekannt | `prisma/schema.prisma` benoetigt `postgis`; lokal lauft `postgis/postgis:16-3.4` | Render-Postgres-Smoke (`backend/scripts/smoke-postgis.ts`) |
| **Vercel Admin/Landingpage** | ⏸ Konfig vorbereitet (`vercel.json`), nicht deployed | siehe `docs/64` | Operator-Deploy + URLs eintragen |
| **Pen-Test extern** | 🔴 nicht beauftragt | — | extern beauftragen |

## 2. Was definitiv NICHT live geprueft ist

> **Niemand darf** an einer dieser Stellen schreiben „live geprueft",
> „bestanden", „beta-ready", „production-ready" oder gleichwertig.

- Tankerkoenig-API mit echtem Key → kein Test-Run dokumentiert.
- Mapbox-Directions-API mit echtem Token → kein Test-Run dokumentiert.
- FCM-Push an echtes Endgeraet → kein Test-Run dokumentiert.
- Apple/Google-Login-Flow durchlaufen → nicht gemacht.
- Apple-IAP-Sandbox-Kauf → nicht gemacht.
- Google-Play-Billing-Sandbox-Kauf → nicht gemacht.
- Stripe-Test-mode-Webhook → nicht gemacht.
- Render-/Railway-Production-Boot → nicht gemacht.
- Render-PostGIS-Extension-Aktivierung → nicht geprueft.
- Browser-/Playwright-E2E auf Staging-URL → nicht gemacht.
- App-Store-Submission → nicht eingereicht.

## 3. Was schon dokumentiert + verifiziert ist

| Bereich | Status |
|---|---|
| Provider-Simulation (mock/contract/sandbox/disabled/live) Schema | ✅ verifiziert ueber `provider-mode.types.spec.ts` |
| MockRouting → niemals `precise_routing` | ✅ verifiziert (RecommendationsService-Spec) |
| Production-Guard fuer 6 Adapter-Scopes | ✅ `it.each`-Test |
| Mock macht keine Netzwerk-Calls | ✅ `mock-network-guard.spec.ts` |
| API-Readiness gibt keine Secrets aus | ✅ 8-fache Sentinel-Tests |
| `providers:check` Exit-Codes 0/1/2/3/4 | ✅ Spec |
| Backend-Lint + Build | ✅ CI gruen |
| gitleaks (Repo-Root) | ✅ no leaks found nach PR #13 |
| Backend-Tests | ✅ 346 Unit + 23 Contract |
| Contract-Tests in CI | ✅ `.github/workflows/backend.yml` (PR #12) |

## 4. Statussprache (verbindlich)

Dieselben Begriffe wie in `docs/56 §0`:

| Begriff | Bedeutung |
|---|---|
| `live_ready` | echte API + Key + Adapter koennten echt laufen |
| `live_verified` | echter Smoke-Test wurde bestanden + persistiert |
| `mock_ready` | interne Testdaten funktionieren |
| `contract_ready` | API-Format mit Fixtures geprueft |
| `sandbox_ready` | Anbieter-Sandbox bereit |
| `mock_in_production` | Mock laeuft trotz Production — bewusster Sonder-Warnzustand |

## 5. Welche Doku-Aussagen wurden in PR #15 korrigiert

| Datei | Vorher | Nachher |
|---|---|---|
| `docs/48` §3.9 (Sentry) | „DSN allein aktiviert Sentry" | Tabelle: nur `SENTRY_ENABLED=true` + `SENTRY_DSN` aktiviert |
| `docs/48` §6 Tabelle | „Tankerkönig ✅ produktiv getestet (mit echtem Key)" | „⏸ vorbereitet, **nicht live verifiziert**" |
| `docs/48` §6 Tabelle | „Nominatim ✅ produktiv" | „⏸ Code-Pfad vorbereitet, kein dedizierter Live-Smoke" |
| `README.md` Doku-Index | endete bei `docs/41` + `A1/A2` | aktualisiert auf `docs/00` … `docs/67` |

### 5.1 Nachzieher PR #15.1 (Flutter §5.3+5.4)

| Datei | Aenderung |
|---|---|
| `mobile-app/lib/core/env/app_env.dart` | Neu: `AppEnv.appEnv` + `AppEnv.providerSimulationActive` + `isStaging`/`isProduction`. Liest `--dart-define=APP_ENV` und `--dart-define=PROVIDER_SIMULATION_ACTIVE`. |
| `mobile-app/lib/shared/widgets/simulation_banner.dart` | Neu: `SimulationBanner`-Widget mit dem Auftrags-Pflichttext „Demo-Modus: Es werden keine echten Tankstellenpreise angezeigt." |
| `mobile-app/lib/shared/main_shell.dart` | Banner ueber jedem Screen, der unter dem Shell laeuft. |
| `mobile-app/test/simulation_banner_test.dart` | Default-Lauf (kein dart-define) zeigt nichts; Pflichttext bleibt im Quelltext erhalten. |
| `mobile-app/lib/core/services/push_service.dart` | bereits defensiv (try/catch), App-Start crashed nicht ohne Firebase-Konfig — bestaetigt durch §5.4-Audit. |
| `mobile-app/lib/features/search/map_screen.dart` | bereits `String.fromEnvironment('MAPBOX_PUBLIC_TOKEN', defaultValue: '')` — bestaetigt durch §5.4-Audit. |

## 6. Verweise

- `docs/37-live-data-provider-report.md` — der ehrliche Skip-Bericht
- `docs/48-external-api-configuration.md` — jetzt korrigiert
- `docs/56-staging-live-api-test-report.md` — Statussprache
- `docs/58-beta-launch-readiness-matrix.md` — Beta-Status
- `docs/59-live-smoke-result-template.md` — Vorlage fuer kommende Live-Smoke-Ergebnisse
- `docs/61-provider-simulation-and-adapter-readiness.md` — Provider-Modi
- `docs/62-provider-simulation-post-merge-verification.md` — PR #11/#12/#13 Stand
- `docs/63-api-key-onboarding-runbook.md` — Wenn echte Keys da sind
- `docs/64-staging-preview-deployment.md` — Mock-Preview
- `docs/66-render-postgis-smoke-report.md` — PostGIS-Smoke (PR #15)
- `docs/67-current-test-matrix.md` — aktueller Teststatus (PR #15)
