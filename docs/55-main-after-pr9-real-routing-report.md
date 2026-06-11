# 55 — Main After PR #9 Real Routing Report

**Datum:** 2026-05-06 · **Branch:** `main` · **HEAD:** `bf60755`

## 1. Merge-Status

🟢 **PR #9 erfolgreich in `main` integriert.**

| PR | Branch | Merge-Commit |
|---|---|---|
| #9 — Real routing provider + product upgrade | `real-routing-and-product-upgrade` | `bf60755` |

## 2. Enthaltene Commits

```
bf60755 Merge pull request #9 (real-routing-and-product-upgrade)
b553ee0 PR #9 Hardening: Provider-Strict + Top-N + Concurrency + Token-Validierung + UX-Wahrheit (Auditor §13)
fa7d620 Real routing provider + product upgrade (Auditor §17 Phase 1-6)
```

## 3. CI-Nachweis am Hardening-Head `b553ee0` (vor Merge)

Belegbare GitHub-Actions-Runs am 2026-05-06:

| Workflow | Job | Trigger | Run-ID | Status |
|---|---|---|---:|---|
| backend | `test` | pull_request | 25429808912 | ✅ success (1 m 11 s) |
| backend | `test` | push | 25429810332 | ✅ success (1 m 09 s) |
| security | `secret-scan` | pull_request | 25429808934 | ✅ success |
| security | `secret-scan` | push | 25429810307 | ✅ success |
| security | `api-key-not-in-mobile` | pull_request | 25429808934 | ✅ success |
| security | `api-key-not-in-mobile` | push | 25429810307 | ✅ success |
| mobile | `test` | pull_request | 25429808913 | ⚠ noch `in_progress` zum Merge-Zeitpunkt |
| mobile | `test` | push | 25429810327 | ⚠ noch `in_progress` zum Merge-Zeitpunkt |

**6 / 8 Check-Runs gruen am Merge-Zeitpunkt.** Die zwei `mobile/test`-Runs
liefen noch — beim Merge automatisch unterbrochen. Lokal auf der Branch-
Working-Copy waren beide gruen (Mobile 28/28 Tests ✅).

## 4. Was wurde fachlich umgesetzt?

### Phase 1-6 (Auditor §17, Commit `fa7d620`)
- Echtes `MapboxRoutingDistanceService` mit HTTP-Client + Cache + Fallback
- `GraphhopperRoutingDistanceService` Stub mit Production-Sperre
- Neues `backend/src/routing/`-Modul mit Factory-Provider
- `distanceEstimateMode` + `disclaimer` **pro Empfehlung** + `mixed`-Summary
- `rankStations` async, `RoutingDistanceInput` mit `point_to_station` + `route_via_station`
- Mobile: `BreakEvenBadge` mit „(exakt)"/„(geschaetzt)"-Suffix
- Mobile: neues `RecommendationVerdictText`-Widget

### Hardening (Auditor §13, Commit `b553ee0`)
1. **Provider-Strict**: `ROUTING_PROVIDER=mapboxx` wirft hart, kein stiller Fallback
2. **Top-N**: `ROUTING_MAX_CANDIDATES` (Default 10) begrenzt Routing-Calls
3. **Concurrency**: `ROUTING_CONCURRENCY` (Default 4) begrenzt parallele Calls
4. **`routingMode` pro Recommendation**: 4 Mobile-Label-Varianten — bei `point_to_station` + `precise` zeigt UI „exakte Strecke", **kein** „Umweg"
5. **Mapbox-Placeholder-Tokens** abgelehnt (`replace-me`, `changeme`, ... + Min-Länge 20)
6. **Cache-Key versioniert**: `routing:mapbox:v1:driving:<routeKind>:<points>`
7. Env-Doku erweitert (4 Routing-Cost-Variablen in `.env.*` + `docs/48`)
8. GraphHopper bleibt ehrlich Stub mit Production-Sperre

## 5. Tests + Builds (lokal)

| Check | Befehl | Ergebnis |
|---|---|---|
| Backend Lint | `npm run lint` | 0 errors / 0 warnings |
| Backend Tests | `npm test` | **237 / 237 ✅** |
| Backend Build | `npm run build` | `dist/main.js` |
| Mobile Analyze | `flutter analyze` | No issues found |
| Mobile Tests | `flutter test` | **28 / 28 ✅** |
| Security Scan | `gitleaks detect --source .` | no leaks found |

## 6. Beta-Einschaetzung

🟢 **Backend ist Beta-fertig**, sobald der Betreiber einen echten
`MAPBOX_ACCESS_TOKEN` einsetzt. Mit `ROUTING_ENABLED=true` +
`ROUTING_PROVIDER=mapbox` + Token aktiviert sich der echte Routing-Pfad,
mit Top-N + Concurrency + Cache + Fallback — alles produktionsreif.

Was an der **Wahrheit** der UI hartnaeckig richtig bleibt:
- Bei lokaler Suche (kein Reiseziel) zeigt die App „exakte Strecke zur
  Tankstelle", nicht „exakter Umweg" — auch wenn Mapbox aktiv ist.
- Bei Saved-Routes (mit Reiseziel) zeigt die App „exakter Zusatzumweg",
  weil Mapbox `origin → station → destination` minus `origin → destination`
  berechnet.

## 7. Naechste sinnvolle Produktstufen (Auditor §15)

Diese sind explizit nicht Teil von PR #9 und gehoeren in eigene PRs:

| PR | Inhalt |
|---|---|
| #10 | „Ich-fahre-sowieso-vorbei"-Modus (UI fuer Quick-Search-mit-Ziel) |
| #11 | Preisalarm nach echter Ersparnis mit Route-Bezug |
| #12 | Auto-Profil + Lernlogik (vehicleClass × drivingProfile) |
| #13 | Tankstellenqualitaet (reliability/convenience scores) |
| #14 | Firmen-/Flotten-Modus |

Operations-Voraussetzungen (Tankerkoenig-Key, Mapbox-Token, Server, Domain,
Markenrecherche, App-Store-Konten, Pen-Test) bleiben unveraendert beim
Betreiber.

## 8. Verweise

- `docs/45` bis `docs/49` — Audit-Kette
- `docs/50` — Stand auf main nach PR #5+#6
- `docs/51` — Master-Audit-Hardening (PR #7)
- `docs/52` — Routing-Truth (PR #8)
- `docs/53` — Stand auf main nach PR #8
- `docs/54` — Real Routing Provider (PR #9 Inhalt)
- **`docs/55-main-after-pr9-real-routing-report.md`** — dieses Dokument
