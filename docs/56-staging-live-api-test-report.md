# 56 — Staging Live API Test Report

**Datum:** 2026-05-06 · **Branch:** `staging/live-api-readiness` · **Basis:** `main` (`42f78a8`)

## 0. Statussprache (Audit §10 Aufgabe 5 + §22 Phase 8)

Dieser Bericht — und alle Folgeberichte — verwenden ausschliesslich diese
Begriffe. Andere Mischformen sind nicht erlaubt.

| Begriff | Bedeutung |
|---|---|
| **konfiguriert** | Key/Provider-Wert ist gesetzt und kein Platzhalter |
| **ausführbar** | Smoke-Skript kann gestartet werden (= `liveSmokeRunnable=true`) |
| **live geprueft** | Smoke wurde mit echtem Key gegen die echte API ausgefuehrt |
| **bestanden** | Smoke war erfolgreich mit echtem Key |
| **live_ready** | echte API + Key bereit (PR #11 — `ProviderReadinessStatus`) |
| **live_verified** | echter Smoke erfolgreich (PR #11) |
| **mock_ready** | interne Testdaten funktionieren (PR #11) |
| **contract_ready** | API-Format mit Fixtures geprueft (PR #11) |
| **sandbox_ready** | Anbieter-Sandbox bereit (PR #11) |
| **mock_in_production** | Mock laeuft in Production trotz Verbots — Sonderwarnung (PR #11) |

> Strikte Wahrheit: `mock_ready ≠ live_ready`, `contract_ready ≠ live_verified`,
> `sandbox_ready ≠ production_ready`. Siehe `docs/61` fuer den
> Provider-Simulation-Mode.
| **nicht geprueft** | Kein echter Key oder noch nicht ausgefuehrt |

Konkrete Mapping-Regel:
- API-Readiness `liveSmokeRunnable=true` ≠ „live geprueft". Es heisst nur
  „ausfuehrbar".
- API-Readiness **`status=ok`** bedeutet: **Konfiguration ist bereit**.
  Es bedeutet ausdruecklich **NICHT**: Live-Test wurde bestanden.
- API-Readiness **`liveVerified=true`** wuerde bedeuten: ein echter
  Live-Smoke-Lauf war erfolgreich. Da Persistenz dafuer noch nicht
  existiert, ist `liveVerified` heute **immer `false`** — auch wenn
  `status=ok`.
- „Bestanden" darf erst eingetragen werden, wenn der Smoke gegen die echte
  API gelaufen ist und der Betreiber das hier (oder in `docs/59`)
  dokumentiert.

> **Hinweis zur Doku-Numerierung:** Der Auditor §17 schlug `docs/55` vor.
> Da `docs/55-main-after-pr9-real-routing-report.md` bereits existiert, ist
> dieser Bericht `docs/56`. Die nachfolgenden zwei Dokumente entsprechend
> verschoben: `docs/57` (Privacy) statt 56, `docs/58` (Readiness-Matrix)
> statt 57.

## 1. Kurzurteil

**🟡 Werkzeuge fuer Live-API-Tests sind komplett vorbereitet und ausführbar
(`liveSmokeRunnable=true`), aber NICHT live geprueft.** Diese Session hatte
keine echten Tankerkoenig-/Mapbox-Keys verfuegbar — die Verifikation
„bestanden" muss beim Betreiber erfolgen (siehe `docs/59` Template).

**Was geliefert wurde (lokal verifiziert mit Mocks):**
- `.env.staging.example` mit allen Pflicht-Variablen
- `npm run smoke:tankerkoenig:live` Script (Phase 3)
- `npm run smoke:mapbox:routing` Script mit 4 Testfaellen (Phase 4)
- `RoutingMetricsService` Sliding-Window-Counter (Phase 5)
- `GET /api/admin/system/api-readiness` Endpoint (Phase 2)
- `staging-live-api.e2e-spec.ts` mit `RUN_LIVE_API_TESTS=true`-Gate (Phase 8)
- Mobile staging Build-Anleitung in `mobile-app/.env.staging.example` (Phase 7)

**Was nicht geliefert werden konnte (offene Punkte beim Betreiber):**
- §6 Testfaelle 1-7 gegen reale APIs ausgefuehrt
- Mobile Staging-Build mit echtem Mapbox-Public-Token
- Staging-Server provisioniert + Smoke gegen echte URL

## 2. Was wurde umgesetzt

### 2.1 `.env.staging.example` (Phase 1)

Pflicht-Variablen + Defaults + alle Mapbox-Kostenkontrollen
(`ROUTING_MAX_CANDIDATES=10`, `ROUTING_CONCURRENCY=4`, `MAPBOX_TIMEOUT_MS=4000`,
`MAPBOX_CACHE_TTL_S=1800`). `.gitignore` schon korrekt: `.env.staging` wird
nicht committed.

### 2.2 ApiReadinessService (Phase 2)

`GET /api/admin/system/api-readiness`, geschuetzt durch
`JwtAuthGuard + RolesGuard` mit Rollen `SUPERADMIN | DEVELOPER`.

Antwort enthaelt **keine** Secret-Werte — Spec-Test mit Sentinel-Token
verifiziert das. Felder: `fuel`, `routing`, `geocoder`, `costControls`,
`mapbox` (Sliding-Window-Counter).

11 Tests in `api-readiness.service.spec.ts`, alle gruen.

### 2.3 Live-Smoke fuer Tankerkoenig (Phase 3)

`backend/scripts/smoke-tankerkoenig-live.ts`:
- Skip mit Exit 0 ohne Key in development
- Hartfehler mit Exit 2 ohne Key in `NODE_ENV=staging|production`
- 5 Pflicht-Checks gemaess §6.3: HTTP 200, Stationen kommen, Preis vorhanden,
  isOpen ausgewertet, Attribution/CC-Hinweis
- Testet zwei Spots: Rodenkirchen + Koeln-Kalk

Aufruf: `npm run smoke:tankerkoenig:live`

### 2.4 Live-Smoke fuer Mapbox (Phase 4)

`backend/scripts/smoke-mapbox-routing-live.ts`: 4 Testfaelle gemaess §7.2:

| Testfall | Erwartung |
|---|---|
| A — `point_to_station` | `precise=true`, km > 0 |
| B — `route_via_station` | `precise=true`, km ≥ 0 (= viaKm − directKm) |
| C — kontrollierter Provider-Fallback (`MAPBOX_TIMEOUT_MS=1`) | kontrolliertes Verhalten ohne Throw. Akzeptiert: `precise=false` mit `reason ∈ {provider_timeout, provider_unavailable, provider_error}` ODER `precise=true` (wenn Mapbox schneller als 1 ms war). |
| D — ungueltiger Token (`replace-me`) | `isPreciseRoutingAvailable()=false`, kein HTTP-Call |

Aufruf: `npm run smoke:mapbox:routing`

### 2.5 Mapbox-Counter (Phase 5)

`backend/src/routing/routing-metrics.service.ts`:
- Sliding-Window 1h
- 6 Counter: requests / cacheHits / cacheMisses / timeouts / rateLimits / providerErrors
- `overWarnThreshold` flag bei `requestsLastHour ≥ MAPBOX_WARN_REQUESTS_PER_HOUR`
  (Default 200)

`MapboxRoutingDistanceService` ruft die Counter-Hooks an den richtigen
Stellen auf (cache hit/miss vor HTTP, Fehler-Klassifikation im catch).

Harte Drossel bei `MAPBOX_DAILY_REQUEST_LIMIT` ist als ENV-Variable
vorbereitet, aber **noch nicht aktiv** — Folge-PR.

### 2.6 Staging-E2E-Suite (Phase 8)

`backend/test/staging-live-api.e2e-spec.ts` — laeuft nur mit
`RUN_LIVE_API_TESTS=true`. Sonst skipped sauber via `describe.skip`.

Aufruf:
```bash
RUN_LIVE_API_TESTS=true \
  TANKERKOENIG_API_KEY=... \
  MAPBOX_ACCESS_TOKEN=... \
  npm run test:e2e
```

### 2.7 Mobile Staging-Build (Phase 7)

`mobile-app/.env.staging.example` dokumentiert die `--dart-define`-Befehle
fuer Android/iOS/Web. Mobile-Builds erfordern echtes Android-SDK / macOS,
das in dieser CI-Sandbox nicht verfuegbar ist — Build-Verifikation findet
beim Betreiber statt.

## 3. Testfaelle (§6 / §9) — ehrlicher Status

**Strikte Auditor-Regel §21:** „Nicht schreiben Mapbox live geprueft, wenn
kein echter Mapbox-Key genutzt wurde."

Alle Testfaelle aus §6 / §9 sind **vorbereitet**, aber **nicht ausgefuehrt**.

| # | Testfall | Status |
|---|---|---|
| 1 | Lokale Suche Rodenkirchen | konfiguriert / ausfuehrbar (mit Key); **nicht geprueft** |
| 2 | Lokale Suche Koeln-Kalk | konfiguriert / ausfuehrbar (mit Key); **nicht geprueft** |
| 3 | Route Rodenkirchen → Innenstadt | konfiguriert / ausfuehrbar (mit Key); **nicht geprueft** |
| 4 | Zu kleiner Tank / lohnt sich nicht | lokal mit Unit-Tests verifiziert (Savings-Logik); **nicht live geprueft** |
| 5 | Groesserer Tank / lohnt sich | lokal mit Unit-Tests verifiziert; **nicht live geprueft** |
| 6 | Mapbox deaktiviert (`ROUTING_ENABLED=false`) | lokal mit Unit-Tests verifiziert; **bestanden lokal** |
| 7 | Mapbox Rate-Limit / Fallback | lokal mit Mock-Fetch verifiziert (4 Tests in `mapbox-routing-distance.service.spec.ts`); **bestanden lokal** |

**Verbindlich fuer den Betreiber:** Bevor Beta-Launch erlaubt ist, muss
der Betreiber die Smoke-Scripts mit echten Keys ausfuehren und die
Ergebnisse hier eintragen — analog zu `docs/45` §2.

## 4. Ergebnisbericht-Vorlage (vom Betreiber auszufuellen)

### Tankerkoenig-Live-Smoke

| Datum | Spot | Stationen | Preise plausibel? | Attribution? | Ergebnis |
|---|---|---:|---|---|---|
| TBD | Rodenkirchen | TBD | TBD | TBD | TBD |
| TBD | Koeln-Kalk | TBD | TBD | TBD | TBD |

### Mapbox-Live-Smoke

| Datum | Testfall | Ergebnis | Notizen |
|---|---|---|---|
| TBD | A — point_to_station | TBD | TBD |
| TBD | B — route_via_station | TBD | TBD |
| TBD | C — kontrollierter Provider-Fallback | TBD | TBD |
| TBD | D — ungueltiger Token | TBD | TBD |

### `/api/admin/system/api-readiness`-Aufruf

| Datum | fuel.status | routing.status | geocoder.status | mapbox.requestsLastHour |
|---|---|---|---|---:|
| TBD | TBD | TBD | TBD | TBD |

## 5. Sicherheits-Garantien (lokal verifiziert)

- API-Readiness gibt **keine** Secret-Werte aus (Sentinel-Test im Spec).
- gitleaks lokal: `no leaks found`.
- Smoke-Scripts loggen weder Token noch Header-Inhalt.
- E2E-Suite ist `describe.skip` ohne explizite Flag — keine versehentlichen
  Live-Calls in CI.

## 6. CI

Kein neuer Workflow — die existierenden Workflows (`backend`, `security`)
laufen unveraendert. Optional ist
`.github/workflows/staging-live-smoke.yml` als `workflow_dispatch`-Trigger
vorbereitet (verbraucht API-Kontingent, deshalb manuell).

## 7. Beta-Bewertung

**🟡 Beta-Werkzeuge sind fertig.** Beta selbst ist noch nicht freigegeben,
weil Live-Verifikation aussteht.

Naechste Schritte beim Betreiber:
1. Tankerkoenig-Key beantragen (kostenlos)
2. Mapbox-Token holen (Free-Tier 100k Requests/Monat reicht fuer Beta)
3. `.env.staging` aus `.env.staging.example` kopieren + Werte einsetzen
4. `npm run smoke:tankerkoenig:live` ausfuehren, Ergebnis hier eintragen
5. `npm run smoke:mapbox:routing` ausfuehren, Ergebnis hier eintragen
6. `RUN_LIVE_API_TESTS=true npm run test:e2e` ausfuehren
7. Beta-Freigabe-Tabelle in `docs/58` aktualisieren

## 8. Verweise

- `.env.staging.example` (Repo-Root)
- `mobile-app/.env.staging.example`
- `backend/scripts/smoke-tankerkoenig-live.ts`
- `backend/scripts/smoke-mapbox-routing-live.ts`
- `backend/src/admin/system/api-readiness.service.ts`
- `backend/src/admin/system/api-readiness.controller.ts`
- `backend/src/routing/routing-metrics.service.ts`
- `backend/test/staging-live-api.e2e-spec.ts`
- `docs/57-privacy-and-provider-notices-staging.md`
- `docs/58-beta-launch-readiness-matrix.md`
