# 61 — Provider Simulation Mode and API Adapter Readiness (PR #11)

**Datum:** 2026-05-06 · **Audit-Bezug:** §22 Phase 8 · **Branch:** `api/provider-simulation-readiness`

> **Hinweis zur Numerierung:** Der Auftrag nennt explizit `docs/60`. `docs/60`
> ist aber bereits durch den Post-PR-#10-Stand-Bericht
> (`60-main-after-pr10-staging-readiness-report.md`) belegt. Daher hier
> `docs/61`. Inhalt + Struktur entsprechen exakt dem Auftrag.

## 0. Wahrheits-Garantien (§21)

> `mock_ready ≠ live_ready`
>
> `contract_ready ≠ live_verified`
>
> `sandbox_ready ≠ production_ready`

Mocks und Fixtures bestaetigen NIE, dass die echte Provider-API erreichbar
ist. Sie bestaetigen nur, dass unser Code mit dem dokumentierten Schema des
Providers umgehen kann. Das `liveVerified`-Flag in `ApiReadinessService`
bleibt fuer Mock/Contract IMMER `false`.

## 1. Was dieser PR bringt

### 1.1 ProviderMode (5 Werte)

| Wert | Bedeutung |
|---|---|
| `live` | echte Provider-API |
| `sandbox` | Provider-Sandbox (Stripe Test, Apple Sandbox, Google Test, FCM Emulator, ...) |
| `mock` | lokaler In-Memory-Adapter — schnelle Tests, keine Netzwerke |
| `contract` | lokal mit gespeicherten Provider-Antworten als Fixture (Vertrags-Tests) |
| `disabled` | Adapter nicht geladen, Feature aus |

Pro Adapter eine ENV-Variable:

```
FUEL_PROVIDER_MODE
ROUTING_PROVIDER_MODE
GEOCODER_PROVIDER_MODE
PUSH_PROVIDER_MODE
AUTH_PROVIDER_MODE
PAYMENT_PROVIDER_MODE
```

Strikte Validierung: ungueltiger Wert wirft beim Start
(`parseProviderMode` in `backend/src/common/providers/provider-mode.types.ts`).

### 1.2 Production-Guard

`NODE_ENV=production` + `*_PROVIDER_MODE=mock|contract` → Error beim Start
oder beim Construct des Mock-Adapters, ausser der Betreiber setzt
`ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true` explizit. Das Flag wird im
`ApiReadinessService`-Snapshot ehrlich gespiegelt
(`providerSimulation.allowMockInProduction`).

### 1.3 Mock-Adapter

| Datei | Status |
|---|---|
| `backend/src/providers/mock.provider.ts` | aktualisiert auf 4 namentliche Koeln-Standorte (Rodenkirchen/Kalk/Marsdorf/Innenstadt) — Auftrag §6.1 |
| `backend/src/geo/mock-geocoder.provider.ts` | bereits existent (Geocoder) |
| `backend/src/routing/mock-routing-distance.service.ts` | **NEU** — niemals `precise=true`, `reason='mock_provider'` |
| `backend/src/common/providers/mock-push.provider.ts` | **NEU** — vorbereitet, nicht im AppModule verdrahtet |
| `backend/src/common/providers/mock-auth.provider.ts` | **NEU** — vorbereitet |
| `backend/src/common/providers/mock-payment.provider.ts` | **NEU** — vorbereitet |

Push/Auth/Payment-Mocks sind bewusst nur **vorbereitet** (im Sinne von §19
Abnahmekriterium 5). Die echten `PushService`/`OAuthService`/
`SubscriptionService` laufen unveraendert weiter; die Refaktorierung auf
einheitliche Provider-Mode-Factories ist eigene Folge-Arbeit.

### 1.4 Fixtures (`backend/test/fixtures/`)

```
tankerkoenig/  search.koeln-rodenkirchen.json    detail.aral-rodenkirchen.json
               prices.sample.json
mapbox/        directions.point-to-station.json   directions.route-via-station.json
               error.rate-limit.json              error.server-error.json
               error.timeout.json
nominatim/     search.koeln-rodenkirchen.json     reverse.koeln-rodenkirchen.json
firebase/      messaging.send.success.json        messaging.send.invalid-token.json
stripe/        subscription.active.json           subscription.canceled.json
apple/         iap-receipt.subscription-active.json
google/        play-subscription.active.json
```

Jede Datei hat ein `_source`-Feld, das beschreibt, wie sie entstand. Keine
echten API-Keys, kein PII. Siehe `backend/test/fixtures/README.md`.

### 1.5 Contract-Tests

```
backend/test/contract/tankerkoenig.contract.spec.ts   8 Tests
backend/test/contract/mapbox.contract.spec.ts         5 Tests
backend/test/contract/nominatim.contract.spec.ts      4 Tests
```

Aufruf:

```
npm run test:contract
```

Konfig: `backend/test/jest-contract.json` (rootDir=`.`, testRegex
`*.contract.spec.ts`). Die Suite ist von der Unit-Suite getrennt, damit
Vertrags-Bruch-Erkennung gezielt im CI laufen kann.

### 1.6 ApiReadinessService — Erweiterung

Jeder Adapter im Snapshot meldet jetzt:

```ts
fuel:    { provider, mode, configured, status, missingKeys, ...liveCheckFields }
routing: { provider, mode, enabled, ..., status, missingKeys, ... }
geocoder:{ provider, mode, configured, status, missingKeys }
providerSimulation: {
  fuel:     ProviderReadiness,    // mit ProviderReadinessStatus
  routing:  ProviderReadiness,
  geocoder: ProviderReadiness,
  push:     ProviderReadiness,
  auth:     ProviderReadiness,
  payment:  ProviderReadiness,
  allowMockInProduction: boolean,
  anyMockActive: boolean,
}
```

`ProviderReadinessStatus` aus
`backend/src/common/providers/provider-mode.types.ts`:

```
live_ready | sandbox_ready | mock_ready | contract_ready
| disabled | missing_config | not_implemented | invalid_config
| blocked_in_production | mock_in_production
```

`mock_in_production` ist der bewusste Sonderzustand aus §4.2: ein Mock laeuft
in Production, weil `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true` explizit gesetzt
wurde. Der Snapshot enthaelt eine deutliche `WARNUNG …`-Note + die CLI taggt
diesen Status als `[WARN]`. Niemals als „live geprueft" zaehlbar.

### 1.7 CLI: `providers:check`

```
npm run providers:check
```

Beispielausgabe (default-Setup ohne Keys):

```
[MISS] fuel      mode=live      status=missing_config         liveVerified=false missing=[TANKERKOENIG_API_KEY]
[-- ] routing   mode=disabled  status=disabled               liveVerified=false
[MISS] geocoder  mode=live      status=missing_config         liveVerified=false missing=[NOMINATIM_USER_AGENT]
[-- ] push      mode=disabled  status=disabled               liveVerified=false
[-- ] auth      mode=disabled  status=disabled               liveVerified=false
[-- ] payment   mode=disabled  status=disabled               liveVerified=false
```

Exit-Codes:

| Code | Bedeutung |
|---:|---|
| 0 | alle Adapter bewusst konfiguriert oder bewusst gemockt |
| 1 | irgendein Adapter ist `missing_config` (Live gewollt, Pflicht-Variable fehlt) |
| 2 | irgendein Adapter ist `blocked_in_production` |
| 3 | irgendein Adapter ist `not_implemented` (im aktuellen Modus) |
| 4 | Konfigurations-Parse-Fehler (z.B. `*_PROVIDER_MODE=fantasy`) |

## 2. Beispiel-Konfigurationen

### 2.1 Lokale Entwicklung — alles Mock

```
NODE_ENV=development
FUEL_PROVIDER_MODE=mock
ROUTING_PROVIDER_MODE=mock
GEOCODER_PROVIDER_MODE=mock
```

Status: `mock_ready` fuer fuel/routing/geocoder. `MockRoutingDistanceService`
liefert Distanzen, aber NIEMALS `precise=true`. Das Recommendations-Modul
darf weiterhin Empfehlungen rechnen — `distanceEstimateMode=
haversine_approximation` (oder `mixed`), nicht `precise_routing`.

### 2.2 Staging — live mit echtem Tankerkoenig + Mapbox

```
NODE_ENV=staging
FUEL_PROVIDER_MODE=live
ROUTING_PROVIDER_MODE=live
GEOCODER_PROVIDER_MODE=live
TANKERKOENIG_API_KEY=...
MAPBOX_ACCESS_TOKEN=...
ROUTING_ENABLED=true
ROUTING_PROVIDER=mapbox
```

Status: `live_ready` fuer fuel/routing/geocoder. `liveVerified` bleibt
trotzdem `false`, bis `npm run smoke:tankerkoenig:live` und
`npm run smoke:mapbox:routing` mit den echten Keys gelaufen sind und
`docs/59` ausgefuellt wurde.

### 2.3 Production — Live, Mocks hart blockiert

```
NODE_ENV=production
FUEL_PROVIDER_MODE=live
ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=false
```

Versuch, `FUEL_PROVIDER_MODE=mock` in Production zu setzen, wird beim Start
mit klarer Fehlermeldung abgewiesen. Der Snapshot meldet
`status=blocked_in_production`.

## 3. Was diese PR bewusst NICHT macht

1. **Kein Live-Test gegen echte Provider** — fuer das brauchen wir echte
   Keys. Diese PR bereitet nur die Infrastruktur vor.
2. **Push/Auth/Payment-Mocks sind nicht im AppModule verdrahtet.** Die
   Refaktorierung der bestehenden Module auf das neue ProviderMode-Schema
   ist eigene Folge-Arbeit. Aktuell nutzt das Backend `PushService`,
   `OAuthService`, `SubscriptionService` unveraendert. Die Mock-Stubs
   existieren als Vorbereitung + Doku.
3. **Keine fixture-driven HTTP-Mock-Bibliothek.** Contract-Tests vergleichen
   Schema gegen Fixture. Wenn der Provider die JSON-Struktur aendert,
   schlagen sie Alarm — das ist der Wert. Eine zusaetzliche
   `nock`-basierte Replay-Schicht ist nicht Teil dieses PR.
4. **Keine Aenderung an existierenden Smoke-Skripten.**
   `smoke-tankerkoenig-live.ts` + `smoke-mapbox-routing-live.ts` bleiben
   die einzige Quelle fuer „live verifiziert".

## 4. Audit-Abnahmekriterien (§19) — Selbst-Pruefung

| # | Kriterium | Status | Quelle |
|---:|---|---|---|
| 1 | ProviderMode live/sandbox/mock/contract/disabled existiert | ✅ | `provider-mode.types.ts` |
| 2 | Fuel Mock funktioniert | ✅ | `providers/mock.provider.ts` (existing) |
| 3 | Routing Mock funktioniert | ✅ | `mock-routing-distance.service.ts` + 6 Tests |
| 4 | Geocoder Mock funktioniert | ✅ | `geo/mock-geocoder.provider.ts` (existing) |
| 5 | Push/Auth/Payment Mock vorbereitet oder bewusst dokumentiert | ✅ | `common/providers/mock-{push,auth,payment}.provider.ts` |
| 6 | Production blockiert Mock standardmaessig | ✅ | `assertMockAllowed()` + Tests |
| 7 | API-Readiness zeigt mode/status/liveVerified korrekt | ✅ | `api-readiness.service.ts` + 8 neue Tests |
| 8 | providers:check CLI existiert | ✅ | `scripts/check-provider-readiness.ts` |
| 9 | Fixtures existieren | ✅ | `backend/test/fixtures/{tankerkoenig,mapbox,nominatim,firebase,stripe,apple,google}/` |
| 10 | Contract-Tests fuer Tankerkoenig, Mapbox, Nominatim | ✅ | `backend/test/contract/*.contract.spec.ts` (17 Tests) |
| 11 | Keine Mock-Antwort wird als live verkauft | ✅ | `liveVerified=false` IMMER in `toProviderReadiness` |
| 12 | Backend CI gruen | siehe §5 | |
| 13 | Mobile CI gruen | unveraendert (kein Mobile-Touch) | |
| 14 | Security/gitleaks gruen | siehe §5 | |
| 15 | docs/60 existiert | ⚠ als `docs/61` (siehe §0) | dieses Dokument |

## 5. Lokale CI-Reproduktion auf `api/provider-simulation-readiness`

```
backend npm run lint              # 0 errors, 0 warnings (siehe §6)
backend npm test                  # alle Suites gruen
backend npm run test:contract     # 3 Suites / 17 Tests gruen
backend npm run build             # dist/main.js
gitleaks detect --source=. --no-banner --redact
                                  # no leaks found
```

Konkrete Run-IDs aus `gh run list` werden nach dem Push ergaenzt.

## 6. Nicht-Ziel: Auswirkung auf Mobile-App

Diese PR aendert ausschliesslich Backend-Code, Doku, ENV-Vorlagen und
Backend-Tests. `mobile-app/` bleibt unveraendert. Der Mobile-CI-Workflow
laeuft weiter analog zu PR #10.

## 7. Verweise

- `docs/56-staging-live-api-test-report.md` — Test-Report mit Status-Sprache
- `docs/58-beta-launch-readiness-matrix.md` — Beta-Matrix (4-Farb-Schema)
- `docs/59-live-smoke-result-template.md` — Live-Smoke-Template
- `docs/60-main-after-pr10-staging-readiness-report.md` — PR #10 Stand
- **`docs/61-provider-simulation-and-adapter-readiness.md`** — dieses Dokument
- `docs/62-provider-simulation-post-merge-verification.md` — PR #12 Post-Merge-Verifikation
- `docs/63-api-key-onboarding-runbook.md` — PR #12 Schritt-fuer-Schritt-Anleitung pro Provider
- `backend/src/common/providers/provider-mode.types.ts`
- `backend/src/admin/system/api-readiness.service.ts`
- `backend/scripts/check-provider-readiness.ts`
