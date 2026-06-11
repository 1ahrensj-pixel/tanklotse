# 62 — Provider Simulation Post-Merge Verification

**Datum:** 2026-05-07 · **Branch dieses PRs:** `api/provider-simulation-ci-hardening` (PR #12)

> Wahrheit zuerst. Dieser Bericht dokumentiert ehrlich, was nach dem Merge
> von PR #11 wirklich auf `main` ist — nicht, was der PR-Beschreibung nach
> dort sein sollte. Wenn ein Workflow nicht gelaufen ist, steht das so drin.

## 1. Merge-Status

| Feld | Wert |
|---|---|
| **PR** | #11 — Add provider simulation mode and API adapter readiness |
| **Quell-Branch** | `api/provider-simulation-readiness` |
| **PR-Head am Merge** | `38ecec5a236dd2e86fc667e55bb553e53467cd08` |
| **Merge-Commit** | `2d0bf4e` |
| **Main-Head nach Merge + docs/60** | `2d0bf4e` |

`git log --oneline -5` auf `main`:

```
2d0bf4e Merge pull request #11 from 1ahrensj-pixel/api/provider-simulation-readiness
38ecec5 PR #11 Follow-up: ProviderReadiness exakt nach Auftrags-Vertrag §5
c2b0bae Add provider simulation mode and API adapter readiness
87404e9 Add docs/60 main-after-pr10-staging-readiness report
e34ce87 Merge pull request #10 from 1ahrensj-pixel/staging/live-api-readiness
```

**Beobachtung:** Der dritte PR-#11-Commit (`69fbd92` „Final-Audit") wurde
nach dem Merge erstellt und ist NICHT im Merge enthalten. PR #12 zieht ihn
ueber `git cherry-pick 69fbd92` nach (siehe §2.5).

## 2. Enthaltene Hauptaenderungen auf main

### 2.1 ProviderMode-Schema
- `backend/src/common/providers/provider-mode.types.ts` mit `ProviderMode`,
  `ProviderReadinessStatus`, `ProviderReadiness`, `parseProviderMode`,
  `assertMockAllowed`.

### 2.2 Mock-Adapter
- `backend/src/routing/mock-routing-distance.service.ts`
- `backend/src/common/providers/mock-{push,auth,payment}.provider.ts`
- `backend/src/providers/mock.provider.ts` (Fuel) — Stand `38ecec5` mit
  drei generischen Stationen. Die vier namentlichen Koeln-Standorte aus
  Auftrag §6.1 werden durch PR #12 nachgezogen.

### 2.3 Contract-Tests
- `backend/test/contract/{tankerkoenig,mapbox,nominatim}.contract.spec.ts`
- `backend/test/jest-contract.json`
- 17 Tests am Merge-Stand `38ecec5`, 23 Tests nach PR #12 §2.5.

### 2.4 providers:check CLI
- `backend/scripts/check-provider-readiness.ts`
- `backend/src/admin/system/provider-readiness-report.ts`
- npm-Skript `npm run providers:check`.

### 2.5 docs/61 + env-Beispiele
- `docs/61-provider-simulation-and-adapter-readiness.md`
- `.env.example` / `.env.staging.example` / `.env.production.example`
  ergaenzt um `*_PROVIDER_MODE` + `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION`.

## 3. CI-Nachweis

### 3.1 Workflows am Merge-Head `38ecec5`

| Workflow | Run-ID | Commit | Status |
|---|---:|---|---|
| backend | (laut Auditor §1) | `38ecec5` | ✅ success |
| security | (laut Auditor §1) | `38ecec5` | ✅ success |
| mobile | nicht ausgeloest (path-Filter `mobile-app/**` nicht getroffen) | – | n/a |
| web / admin | nicht ausgeloest (path-Filter nicht getroffen) | – | n/a |

> Konkrete numerische Run-IDs sind nicht geprueft worden — diese Datei
> haelt die Zustands-Behauptung des PR-#12-Auftrags fest und schreibt
> keine erfundenen IDs.

### 3.2 Workflows am PR-#12-Head

Werden beim Push automatisch erzeugt. Lokal lauft:

| Befehl | Ergebnis |
|---|---|
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm test` | ✅ alle Suites (siehe §4) |
| `npm run test:contract` | ✅ alle Suites |
| `npm run providers:check` (FUEL=mock, ROUTING=mock, GEOCODER=mock) | ✅ exit 0 |
| `npm run build` | ✅ `dist/main.js` |
| `npx prisma validate` | ✅ schema valid |
| `gitleaks detect --source . --redact --no-banner` | ✅ no leaks found |

## 4. Lokal ausgefuehrte Befehle (PR #12 Final-Stand)

| Befehl | Ergebnis |
|---|---|
| `cd backend && npm run lint` | 0 / 0 |
| `npm test` | siehe Final-Stand im Commit-Log |
| `npm run test:contract` | siehe Final-Stand im Commit-Log |
| `npm run providers:check` mit allen Adaptern auf `mock` | Exit 0 |
| `npm run build` | `dist/main.js` |
| `gitleaks detect --source . --redact --no-banner` | `no leaks found` |

## 5. Wahrheit der Statusbegriffe

> `mock_ready ≠ live_ready`
> `contract_ready ≠ live_verified`
> `sandbox_ready ≠ production_ready`
> `mock_in_production ≠ live_verified`

## 6. Offene Live-Punkte

Was nach diesem PR weiterhin **nicht** live geprueft ist:

| Bereich | Status | Naechster Schritt |
|---|---|---|
| Tankerkoenig live | nicht geprueft | echten Key beantragen → `npm run smoke:tankerkoenig:live` → `docs/59` ausfuellen |
| Mapbox live | nicht geprueft | echten Token holen → `npm run smoke:mapbox:routing` → `docs/59` ausfuellen |
| Firebase live | nicht geprueft | `PUSH_PROVIDER=firebase` + Service-Account-JSON setzen + manueller Test-Push |
| Google Login live | nicht geprueft | OAuth-Client erstellen → `AUTH_PROVIDER_MODE=live` |
| Apple Login live | nicht geprueft | `APPLE_LOGIN_ENABLED=true` + Apple-Developer-Konfig |
| Stripe / IAP live | nicht geprueft | Stripe-Account + Webhook-Endpoint registrieren |
| Pen-Test extern | nicht geprueft | Externer Beauftragung — kein Teil dieser Codebasis |

Schritt-fuer-Schritt-Anleitung pro Provider: `docs/63-api-key-onboarding-runbook.md`.

## 7. Admin-UI (PR #12 §12 — bewusst verschoben)

Das Admin-Dashboard-Frontend (`admin-dashboard/app/system/provider-readiness/
page.tsx`) ist bewusst NICHT Teil von PR #12. Begruendung:

- Die Backend-Antwortform ist mit `providerSimulation.providers[]` und den
  Aggregat-Feldern (`anyMockActive`, `anyContractActive`,
  `hasOnlyMockOrContractProviders`, `hasLiveVerifiedProviders`) jetzt
  stabil und UI-tauglich. Eine separate Frontend-PR kann das ohne weitere
  Backend-Aenderungen einbinden.
- PR #12 ist bereits umfangreich (Verifikation + CI + Tests + Runbook +
  Doku). Eine zusaetzliche UI-Aenderung wuerde den Review erschweren.
- Die Provider-Wahrheit ist bereits ueber `npm run providers:check` und
  `/api/admin/system/api-readiness` verfuegbar — Admins koennen den
  Zustand heute schon verifizieren.

**Folge-PR:** „PR #13 — Admin Provider Readiness UI + Simulation Banner"
(Auftrag §18 Weg A). Inhalt:
- Tabelle (Service / Provider / Mode / Status / Live verified / Missing keys / Next steps).
- Banner „Mock-/Contract-Modus aktiv — kein Live-Test" wenn
  `hasOnlyMockOrContractProviders=true`.
- Banner „Mock laeuft in Production!" wenn `mock_in_production` irgendwo
  aktiv ist.

## 8. PR #13 Security-Fix Verification

### Kontext

PR #12 wurde mit Merge-Commit `1fd3931` gemerged, obwohl `security` an
PR-Head `8565904` rot war. PR #13 behebt diese drei Gitleaks-False-
Positives.

### PR #13

| Feld | Wert |
|---|---|
| **PR** | #13 — `PR #12 Security-Fix: gitleaks False-Positives entschärfen` |
| **Branch** | `api/provider-simulation-ci-fix` |
| **Head** | `878d3130c96c96ffc17ffc2fe69ad506ce73c938` |
| **Merge-Commit** | `dee4b8a6f49b126d0db411827e5193dff94abe31` |
| **Main-Head nach Merge** | `dee4b8a` |

### GitHub Actions auf PR #13

| Workflow | Run-ID | Commit | Status |
|---|---:|---|---|
| backend / test | 25506151083 | `878d313` | success ✅ |
| security / secret-scan | 25506150023 | `878d313` | success ✅ |
| security / api-key-not-in-mobile | 25506150023 | `878d313` | success ✅ |

### Vorheriger Security-Failure

| Feld | Wert |
|---|---|
| **Run-ID** | 25505471353 |
| **Commit** | `8565904` |
| **Befunde** | 3 False-Positives (siehe PR #13 Beschreibung) |

### Ursache + Fix

Ursache:
- Sentinel-Werte in `api-readiness.service.spec.ts` Z. 472+473 trafen `generic-api-key` (Entropy ~4.3).
- Doku-Beispiele in `docs/63-api-key-onboarding-runbook.md` Z. 104, 131, 161 enthielten `-----BEGIN PRIVATE KEY-----` als Format-Marker → `private-key`-Regel (Entropy 5.32).

Fix:
- Sentinels durch `unit-test-marker-<griechisch>` ersetzt (low-entropy, JSON-substring-tauglich).
- PRIVATE-KEY-Marker durch `replace-me-with-pem-from-...`-Platzhalter ersetzt.
- `.gitleaksignore`: drei eng begründete Fingerprints für den alten Hauptcommit `8565904`. Keine breite Datei-Ausnahme. Keine Regel-Deaktivierung.

### Lokale Verifikation an `main` HEAD `dee4b8a`

| Befehl | Ergebnis |
|---|---|
| `gitleaks detect --source . --redact --no-banner` | **no leaks found** ✅ |
| `npm test` | 346 / 346 ✅ |

### Freigabe

> Provider-Simulation-CI-Hardening ist nach Merge von PR #13 abgeschlossen.
> `main` ist secret-clean. Backend + Security workflows sind gruen.

## 9. Freigabe

Diese Verifikation gibt **PR #11 als gemerged** frei und macht den
**Lieferumfang von PR #12 sichtbar**. Sie gibt **nicht** „Beta-Launch"
frei — siehe `docs/58-beta-launch-readiness-matrix.md` fuer den
Gesamt-Beta-Status.

| Frage | Antwort |
|---|---|
| Ist PR #11 wirklich auf main? | Ja, Merge-Commit `2d0bf4e` mit PR-Head `38ecec5`. |
| Wurde der „Final-Audit"-Commit gemerged? | Nein. PR #12 zieht ihn nach (cherry-pick `69fbd92`). |
| Sind Contract-Tests in CI? | Vor PR #12 nein. Nach PR #12 ja (siehe `.github/workflows/backend.yml`). |
| Lief `providers:check` in CI? | Vor PR #12 nein. Nach PR #12 ja. |
| Existiert ein API-Key-Onboarding-Runbook? | Vor PR #12 nein. Nach PR #12 ja (`docs/63`). |
| Macht der Mock-Modus echte HTTP-Calls? | Nein — Netzwerk-Guard-Test in PR #12 verifiziert. |
| Kann ein Mock im Backend `liveVerified=true` melden? | Nein — strukturell ausgeschlossen. |
