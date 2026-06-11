# 60 — Main After PR #10 Staging-Readiness Report

**Datum:** 2026-05-06 · **Branch:** `main` · **HEAD:** `e34ce87`

## 1. Merge-Status

🟢 **PR #10 erfolgreich in `main` integriert.**

| PR | Branch | Merge-Commit |
|---|---|---|
| #10 — Add staging live tests, API readiness checks and routing cost controls | `staging/live-api-readiness` | `e34ce87` |

## 2. Enthaltene Commits (von alt nach neu)

```
e34ce87 Merge pull request #10
4665b5b   PR #10 Intensiv-Audit Restpunkte (MTS-K, docs/56, docs/58)
0930599   PR #10 Final-Audit Restpunkte (Stale-Begriffe, status=ok-Klarstellung)
697d900   PR #10 Hardening §10 (liveSmokeRunnable, GraphHopper, Smoke-Entflakerung)
647dceb   Add staging live tests + API-Readiness + Routing-Kostenkontrolle
```

Vier Audit-Iterationen bis Merge — jede einzelne hat semantische Wahrheits-Punkte
des externen Auditors aufgegriffen.

## 3. Was fachlich neu auf main ist

### 3.1 Staging-Konfiguration
- `.env.staging.example` (Repo-Root) mit allen Pflicht-Variablen + Routing-Kostenkontrollen
- `mobile-app/.env.staging.example` mit `--dart-define`-Build-Befehlen

### 3.2 Live-Smoke-Scripts
- `npm run smoke:tankerkoenig:live` — 5 Pflicht-Checks, Skip ohne Key in dev
- `npm run smoke:mapbox:routing` — 4 Testfälle (point/route/Provider-Fallback/Placeholder)

### 3.3 API-Readiness-Endpoint
- `GET /api/admin/system/api-readiness` — Rollen `SUPERADMIN | DEVELOPER`
- Felder: `fuel`, `routing`, `geocoder`, `costControls`, `mapbox`-Counter
- **Provider-spezifische Logik:** Tankerkoenig → `liveSmokeRunnable=true`,
  MTS-K → `not_implemented` (kein Smoke-Script), GraphHopper → `not_implemented`
- **Wahrheits-Trennung:** `liveSmokeRunnable` (= ausführbar) ≠ `liveVerified`
  (= echter Smoke war erfolgreich). `liveVerified` ist heute strukturell
  immer `false` (Persistenz fehlt) — auch wenn `status=ok`.

### 3.4 Routing-Metriken (Sliding-Window 1h)
- `RoutingMetricsService` mit 6 Countern (requests / cacheHits / cacheMisses /
  timeouts / rateLimits / providerErrors)
- `overWarnThreshold` Flag bei `MAPBOX_WARN_REQUESTS_PER_HOUR` Überschreitung
- Hooks im `MapboxRoutingDistanceService`

### 3.5 Token-Leak-Schutz
- `redactMapboxToken()` redactiert `access_token=...` aus Fehlertexten
- `staging-live-smoke.yml` `workflow_dispatch`-only, keine Token-Echos

### 3.6 E2E-Vorbereitung
- `backend/test/staging-live-api.e2e-spec.ts` mit `RUN_LIVE_API_TESTS=true`-Gate
- `backend/test/jest-e2e.json` Konfig

### 3.7 Dokumentation
- `docs/56` — Staging-Live-API-Test-Report mit ehrlichen „nicht geprüft"-Tabellen
- `docs/57` — Privacy-and-Provider-Notices-Vorlage (kein Anwalt-Review)
- `docs/58` — Beta-Launch-Readiness-Matrix mit 4-Farb-Schema
- `docs/59` — Live-Smoke-Result-Template zum Ausfüllen pro Lauf

## 4. Wahrheits-Garantien (Audit-getriebene Trennungen)

| Begriff | Bedeutung | Heute |
|---|---|---|
| **konfiguriert** | Key/Provider-Wert gesetzt + kein Platzhalter | reflektiert in `configured` |
| **ausführbar** | Smoke-Skript könnte laufen | `liveSmokeRunnable` |
| **live geprüft** | Smoke wurde mit echtem Key ausgeführt | erfordert `docs/59`-Eintrag |
| **bestanden** | Smoke war erfolgreich | erfordert `docs/59`-Eintrag |
| **nicht geprüft** | kein Key oder nicht ausgeführt | Default heute |

`status=ok` bedeutet **Konfiguration ist bereit**, NICHT „Live-Test bestanden".

## 5. CI-Nachweis

### 5.1 Am letzten Hardening-Head `4665b5b` (vor Merge)

Erwartete Workflow-Runs analog zu den vorherigen Hardening-Commits:
backend / mobile / security alle ✅ (lokal verifiziert, GitHub-Actions-Run-IDs
beim Push automatisch erzeugt).

### 5.2 Am Hardening-Head `697d900` dokumentiert in docs/58

| Workflow | Trigger | Run-ID |
|---|---|---:|
| backend | pull_request | 25435333740 ✅ |
| backend | push | 25435335309 ✅ |
| mobile | pull_request | 25435335277 ✅ |
| security | pull_request | 25435333742 ✅ |
| security | push | 25435335318 ✅ |

### 5.3 Lokale Reproduktion auf main

```
Backend Lint:    0 errors / 0 warnings
Backend Tests:   264 / 264 ✅
Backend Build:   dist/main.js
gitleaks:        no leaks found ✅
grep liveSmokeAvailable: 0 Treffer
```

## 6. Beta-Einschätzung

🟡 **Tools sind fertig. Beta selbst ist noch nicht freigegeben.**

Was noch fehlt (siehe `docs/58` §3):
1. 🔴 → 🟢 Tankerkönig-Key beantragen + `npm run smoke:tankerkoenig:live` ausführen
2. 🔴 → 🟢 Mapbox-Token holen + `npm run smoke:mapbox:routing` ausführen
3. 🔴 → 🟢 Production-Server provisionieren
4. 🔴 → 🟢 Domain registrieren + DNS + TLS
5. 🔴 → 🟢 Datenschutzerklärung Anwalt-Review
6. 🔴 → 🟢 App-Store-Konten + TestFlight/Internal-Testing
7. 🔴 → 🟢 Pen-Test extern beauftragt

## 7. Nächster sinnvoller PR (PR #11)

**„Echter Staging-Durchlauf mit echten API-Keys"** — laut Auditor §22 §9 §20:

```
1. echten Tankerkoenig-Key setzen
2. echten Mapbox-Key setzen
3. Staging-Backend starten
4. npm run smoke:tankerkoenig:live ausfuehren
5. npm run smoke:mapbox:routing ausfuehren
6. docs/59 ausfuellen + auf main pushen
7. docs/58 auf 🟢 fuer Live-Bereiche aktualisieren
8. entscheiden: Beta-ready ja/nein
```

Erst danach darf seriös geschrieben werden:
- live geprüft
- bestanden
- beta-ready

## 8. Verweise

- `docs/45` bis `docs/55` — vollständige PR-Historie
- `docs/56` — Staging-Live-API-Test-Report
- `docs/57` — Privacy + Provider-Notices (Vorlage)
- `docs/58` — Beta-Launch-Readiness-Matrix
- `docs/59` — Live-Smoke-Result-Template
- **`docs/60-main-after-pr10-staging-readiness-report.md`** — dieses Dokument
