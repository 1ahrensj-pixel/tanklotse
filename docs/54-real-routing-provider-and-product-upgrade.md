# 54 — Real Routing Provider and Product Upgrade

**Datum:** 2026-05-06 · **Branch:** `real-routing-and-product-upgrade` · **Basis:** `main` (`cb0efa4` — nach PR #8 + docs/53)

## 1. Kurzurteil

**🟢 Auditor-§17-Auftrag (Phasen 1-6) umgesetzt.** Phase 7 (neue
Produktfeatures wie Auto-Profil, Tankstellenqualitaet) ist bewusst auf
spaetere PRs verschoben — die wuerden den Scope eines einzelnen PR
sprengen.

Was geliefert wurde:
- Phase 1: PR #8 gemerged, `docs/53` auf main (separater Commit)
- Phase 2: `distanceEstimateMode` + `disclaimer` jetzt **pro Empfehlung**
- Phase 2: Summary-Variante `'mixed'` fuer gemischte Ergebnisse
- Phase 3: `rankStations` ist async, ruft pro Kandidat `RoutingDistanceService`
- Phase 3: `RoutingDistanceInput` mit `point_to_station` + `route_via_station`
- Phase 4: **Echter `MapboxRoutingDistanceService`** mit HTTP-Client,
  Cache (Redis-`CacheService`), Fallback bei Timeout/429/500
- Phase 5: `GraphhopperRoutingDistanceService` als Stub mit
  Production-Sperre in `RoutingModule`
- Phase 6: Mobile `BreakEvenBadge` zeigt jetzt „(exakt)" bei precise,
  „(geschaetzt)" sonst
- Phase 6: Neues Widget `RecommendationVerdictText` mit lesbarem
  Entscheidungssatz statt nur Zahlen

**214 / 214 Backend-Tests** gruen (vorher 198, +16 neu), Mobile **19 / 19
Tests** (vorher 14, +5 neu), Lint clean, Build OK, gitleaks clean.

## 2. Was PR #8 geloest hat

PR #8 hat den Wahrheits-Bug aus PR #7 behoben:
> ENV-Konfig (`ROUTING_ENABLED=true` + `ROUTING_PROVIDER=mapbox`) reichte aus,
> um `precise_routing` zu setzen — ohne HTTP-Client.

Loesung: `RoutingDistanceService` wurde eingefuehrt, der Default
`NoopRoutingDistanceService` gibt `isPreciseRoutingAvailable()=false` zurueck.
Damit war der Fall „ich behaupte präzise, ohne zu rechnen" geschlossen.

## 3. Warum per-recommendation Routing Truth noetig war

Auch in PR #8 hing `distanceEstimateMode` global an `BestStationResult`. Das
ist nur korrekt, wenn ALLE Empfehlungen denselben Modus haben.

Realer Fall mit echtem Provider:
```
Station A: Mapbox-Call ok → precise (extraDistanceKm = 1.2)
Station B: Mapbox-Call timeout → fallback (extraDistanceKm = haversine 4.6)
```

Mit globalem Mode hätte `BestStationResult.distanceEstimateMode` luegen
muessen — entweder „alle precise" oder „alle Schaetzung". Beides ist falsch.

**Fix:** Jede `RealSavingRecommendation` traegt jetzt ihren eigenen
`distanceEstimateMode` und `disclaimer`. Das `BestStationResult` aggregiert:

| Einzel-Modes | Summary |
|---|---|
| alle gleich | dieser Mode |
| gemischt | `'mixed'` mit Hinweis-Text |
| keine Empfehlungen | requestedMode-Fallback |

## 4. MapboxRoutingDistanceService

`backend/src/routing/mapbox-routing-distance.service.ts`

### 4.1 Wahrheits-Garantie

- `isPreciseRoutingAvailable()` returns `true` nur, wenn
  `MAPBOX_ACCESS_TOKEN` gesetzt ist.
- `calculateExtraDistanceKm()` returns `precise=true` nur bei:
  - HTTP 200
  - plausibler `distance` (Number, finite) im Response
  - JSON erfolgreich parsed

### 4.2 Zwei Modes

**`point_to_station`** (lokale Suche, `bestStation()`):

```
url = /directions/v5/mapbox/driving/{originLng,originLat};{stationLng,stationLat}
extraKm = response.routes[0].distance / 1000
```

**`route_via_station`** (`stationsAlongRoute()` mit Saved Routes):

```
direct = /directions/v5/mapbox/driving/{originLng,originLat};{destLng,destLat}
via    = /directions/v5/mapbox/driving/{originLng,originLat};{stationLng,stationLat};{destLng,destLat}
extraKm = max(0, viaKm - directKm)
```

Mapbox erwartet **`lng,lat`** (nicht `lat,lng`) — dafuer gibt es einen
expliziten Test.

### 4.3 Konfiguration

| ENV-Variable | Default | Zweck |
|---|---|---|
| `MAPBOX_ACCESS_TOKEN` | — | Pflicht. Ohne den gibt Service nur `precise=false`. |
| `MAPBOX_DIRECTIONS_BASE_URL` | `https://api.mapbox.com/directions/v5` | API-Endpunkt |
| `MAPBOX_TIMEOUT_MS` | `4000` | HTTP-Timeout pro Call. AbortController abbricht. |
| `MAPBOX_CACHE_TTL_S` | `1800` (30 min) | Redis-Cache-TTL fuer Routen. |

## 5. GraphHopper-Status

`backend/src/routing/graphhopper-routing-distance.service.ts`

Stub ohne HTTP-Client. `isPreciseRoutingAvailable()` immer `false`.

`RoutingModule` blockiert `ROUTING_PROVIDER=graphhopper` in
`NODE_ENV=production` mit `Error`. Begruendung: ein Stub darf nicht in
Production laufen — entweder echten Client implementieren oder Provider
umstellen auf `mapbox` / `noop`.

Zukuenftige Implementierung folgt analog zu Mapbox:
1. `isPreciseRoutingAvailable()` returns `true`, sobald `GRAPHHOPPER_API_KEY` gesetzt
2. `calculateExtraDistanceKm()` ruft `graphhopper.com/api/1/route` mit Wegpunkten
3. Production-Sperre in `RoutingModule` entfernen

## 6. Cache und Kostenkontrolle

Audit §17 Phase 4 Aufgabe 9.

- `MapboxRoutingDistanceService` injiziert optional `CacheService` (Redis).
- Cache-Key: `routing:mapbox:driving:{lat1,lng1}|{lat2,lng2}[|{lat3,lng3}]`
- Koordinaten auf 5 Dezimalstellen gerundet (≈ 1,1 m Praezision) — gleiche
  Strecke wird identisch gehasht, auch wenn der Suchpunkt um Milimeter
  variiert.
- TTL-Default 30 min (`MAPBOX_CACHE_TTL_S`). Routen aendern sich nicht im
  Sekundentakt; Preise schon. Cache-Hit reduziert HTTP-Calls + Mapbox-Kosten
  drastisch.
- Test verifiziert: zwei identische Anfragen fuehren zu **einem** HTTP-Call.

## 7. Fallback-Verhalten

Audit §17 Phase 4 Aufgabe 10.

`MapboxRoutingDistanceService` wirft NIEMALS aus `calculateExtraDistanceKm()`.
Bei jedem Fehler kommt ein `RoutingDistanceResult` mit `precise=false`
und `reason`:

| Fehler-Quelle | `reason` |
|---|---|
| AbortError (Timeout) | `provider_timeout` |
| HTTP 429 | `provider_rate_limited` |
| HTTP 500-599 | `provider_unavailable` |
| anderer HTTP-Fehler | `provider_error` |
| JSON ohne `routes[]` | `provider_error` |
| invalid input (z.B. `route_via_station` ohne `destination`) | `invalid_input` |
| kein Token | `invalid_input` (`isPreciseRoutingAvailable=false`) |

In allen Faellen faellt `RecommendationsService.rankStations` auf die
approximative Distanz (Haversine bzw. Sample) zurueck — die Empfehlung
markiert sich selbst als `haversine_approximation` oder `route_sampling`
mit `disclaimer != null`.

## 8. Mobile UX: geschaetzt vs. exakt

`mobile-app/lib/shared/widgets/break_even_badge.dart`

Neuer Suffix:
- `precise_routing` → `(exakt)`
- alle anderen → `(geschaetzt)`

`mobile-app/lib/shared/widgets/recommendation_verdict_text.dart` (NEU)

Lesbare Saetze statt nur Zahlen:

| realSavingEuro | breakEvenLiters | tankLiters | Satz |
|---|---|---|---|
| ≥ 2,00 | irgendwas | x | „Gute Wahl: Bei x Litern sparst du real X €." |
| 0,50–2,00 | irgendwas | x | „Bei x Litern sparst du real X € — lohnt sich knapp." |
| 0–0,50 | irgendwas | x | „Bei x Litern sparst du nur X € — lohnt sich vor allem, wenn du sowieso vorbeifaehrst." |
| <= 0 | > 0,5 | x | „Bei x Litern wuerde sich der Stop nicht lohnen. Lohnt sich erst ab Y Litern." |
| <= 0 | <= 0,5 | x | „Diese Tankstelle ist zwar guenstiger, aber der Umweg frisst die Ersparnis auf." |
| beliebig | `null` | x | „Diese Tankstelle ist preislich nicht guenstiger — der Stop lohnt sich nicht." |

Plus eine Footnote, die die Quelle macht klar:
- estimated → „Werte basieren auf einer geschaetzten Entfernung — der reale Fahrweg kann abweichen."
- precise → „Werte basieren auf einer exakten Routen-Berechnung."

## 9. Neue Produktfeatures (bewusst nicht in diesem PR)

Audit §17 Phase 7 fordert:
- „Ich fahre sowieso vorbei"-Modus
- Preisalarm nach echter Ersparnis (RealSavingAlert)
- Auto-Profil mit Lernlogik
- Tankstellenqualitaet (reliability/convenience scores)

**Stand:**

| Feature | Status |
|---|---|
| „Sowieso vorbei"-Modus | Effektiv schon durch `SavedRoutes` + `stationsAlongRoute` mit `route_via_station` Routing-Mode (PR #4 + dieser PR). Frontend-„Quick-Search-mit-Ziel" fehlt — Folge-PR. |
| Preisalarm nach echter Ersparnis | Existiert bereits seit PR #4 als `AlertType.REAL_SAVING`. Verbesserung mit Routing-Genauigkeit kommt automatisch durch diesen PR. Felder wie `routeId`-Bezug sind Folge-PR. |
| Auto-Profil + Lernlogik | Datenmodell teilweise da (`Vehicle.vehicleClass`, `drivingProfile` aus PR #4). Lernlogik ist groesseres Thema, eigener PR. |
| Tankstellenqualitaet | Nicht in diesem PR. Eigener PR mit Datenmodell + Score-Berechnung + UI. |

`docs/54` ist ehrlich: das sind Folge-PRs.

## 10. Tests

### 10.1 Backend (214 / 214)

| Suite | Tests |
|---|---:|
| `validation.spec.ts` | 60 |
| `external-services.service.spec.ts` | 31 |
| `external-services.controller.spec.ts` | 10 |
| `recommendations.service.spec.ts` | 13 (vorher 11, **+2 neu**) |
| **`mapbox-routing-distance.service.spec.ts`** | **11 (NEU)** |
| **`graphhopper-routing-distance.service.spec.ts`** | **2 (NEU)** |
| `savings.service.spec.ts` | 28 |
| `saved-routes.service.spec.ts` | 12 |
| `auth.service.spec.ts` | 12 |
| `recommendations.controller.spec.ts` | 5 |
| Andere | 30 |
| **Gesamt** | **214** |

Neu in PR #9:
- `Per-Empfehlung-Mode bleibt haversine_approximation, wenn RoutingService precise=false liefert`
- `Mixed-Summary: precise fuer Station A, Fallback fuer Station B → BestStationResult.mode=mixed`
- 11 Mapbox-Tests: HTTP 200/429/500, Timeout, Cache-Hit, koordinaten-Reihenfolge, point_to_station, route_via_station mit Clamping
- 2 Graphhopper-Stub-Tests

### 10.2 Mobile (19 / 19)

| Test-Datei | Tests |
|---|---:|
| `break_even_badge_test.dart` | 6 (vorher 4, **+1 neu** fuer „(exakt)") |
| **`recommendation_verdict_text_test.dart`** | **5 (NEU)** |
| Andere | 8 |
| **Gesamt** | **19** |

## 11. CI

Lokal verifiziert:

```
Backend Lint:    0 errors / 0 warnings
Backend Tests:   214 / 214 ✅
Backend Build:   dist/main.js
Mobile Analyze:  No issues found ✅
Mobile Tests:    19 / 19 ✅
gitleaks:        no leaks found ✅
```

Web (`admin-dashboard`/`landingpage`) wurde nicht angefasst — path-basierte
Trigger werden nicht ausgeloest, by-design.

## 12. Noch offene Launch-Punkte

| Bereich | Status |
|---|---|
| Echter GraphHopper-HTTP-Client | offen, vorbereitet |
| Frontend „Sowieso-vorbei"-Such-UI | offen |
| Preisalarm REAL_SAVING + routeId-Bezug | teilweise (existiert) |
| Auto-Profil-Lernlogik | offen, eigener PR |
| Tankstellenqualitaet (reliability/convenience scores) | offen, eigener PR |
| Production-Server, Domain, App-Store-Konten | unveraendert beim Betreiber |

## 13. Beta-/Launch-Einschaetzung

**🟢 Beta-fertig nach Merge dieses PR**, vorausgesetzt der Betreiber setzt
einen echten `MAPBOX_ACCESS_TOKEN` ein.

Was funktioniert nach Merge:
- ENV `ROUTING_ENABLED=true` + `ROUTING_PROVIDER=mapbox` + `MAPBOX_ACCESS_TOKEN`
  → echter Routing-Service aktiv
- Per-Empfehlung Wahrheit: Station A precise, Station B fallback ist
  ehrlich abgebildet
- Cache spart Calls, Fallback verhindert App-Crash bei Mapbox-Ausfall
- Mobile zeigt „(exakt)" bei precise, „(geschaetzt)" sonst, Entscheidungs-
  satz statt nur Zahlen

Was nicht reicht fuer Live-Launch (unveraendert):
- echtes Production-Setup (Server, Domain, DNS, Certs)
- App-Store-Konten + Builds
- Markenrecherche, Pen-Test
- Soft-Launch in einem Bundesland

## 13a. Nachaudit-Fixes vor Merge (Audit §13)

Nach Submission von PR #9 hat der externe Auditor 8 Hardening-Punkte
aufgeschrieben (`§13`). Alle in einem Folge-Commit auf demselben Branch
behoben:

| # | Befund | Fix |
|---|---|---|
| 1 | Unbekannter `ROUTING_PROVIDER` fiel still auf `noop` | `RoutingModule` wirft jetzt bei `ROUTING_ENABLED=true` + `mapboxx` o.ä. — kein stiller Fallback. 6 Tests in `routing.module.spec.ts`. |
| 2 | Mapbox kann pro Empfehlungslauf bis zu n*HTTP-Calls produzieren | Pre-Sort + `ROUTING_MAX_CANDIDATES` (Default 10). Test verifiziert ≤ N Calls. |
| 3 | `Promise.all` feuert alle Calls gleichzeitig | `mapWithConcurrency` Worker-Pool + `ROUTING_CONCURRENCY` (Default 4). Test verifiziert `maxActive ≤ N`. |
| 4 | `point_to_station` wurde im UI als „exakter Umweg" verkauft | Neuer `routingMode` pro `RealSavingRecommendation`. Mobile `DistanceLabel` unterscheidet 4 Faelle: precise/estimated × point_to_station/route_via_station. Tests in `distance_label_test.dart` + `break_even_badge_test.dart` + `recommendation_verdict_text_test.dart`. |
| 5 | `MAPBOX_ACCESS_TOKEN=replace-me` wurde als gueltig akzeptiert | `isMeaningfulMapboxToken()` lehnt 11 Platzhalter ab + Mindestlaenge 20. 11 parametrische Tests. |
| 6 | Cache-Key war nicht versioniert/modus-bewusst | Neuer Schluessel `routing:mapbox:v1:driving:<routeKind>:<points>`. Test verifiziert: identische Punkte mit unterschiedlichem RouteKind → 3 separate Cache-Entries. |
| 7 | Env-Doku unvollstaendig | `.env.example`, `.env.production.example` und `docs/48` §3.4 erweitert. |
| 8 | GraphHopper darf nicht produktiv erscheinen | Production-Sperre in `RoutingModule` bleibt. Stub liefert immer `precise=false`. |

### Verhalten nach §13-Fix

| ENV | Service | API-`distanceEstimateMode` |
|---|---|---|
| `ROUTING_ENABLED=false` | Noop | `haversine_approximation` (bestStation) / `route_sampling` (Saved Routes) |
| `ROUTING_ENABLED=true` + `ROUTING_PROVIDER=mapboxx` | — | **Hartes Throw beim Bootstrap** |
| `ROUTING_ENABLED=true` + `mapbox` + Token = `replace-me` | bewusstes Fallback auf Noop | Schaetzungen mit Disclaimer |
| `ROUTING_ENABLED=true` + `mapbox` + realer Token | Mapbox | Top-N precise, Rest fallback → `mixed`-Summary |

## 14. Verweise

- `docs/45` bis `docs/49` — Geschichte der Audit-Kette
- `docs/50` — Stand auf main nach PR #5+#6
- `docs/51` — Master-Audit-Hardening (PR #7)
- `docs/52` — Routing Truth + CI Verification (PR #8)
- `docs/53` — Stand auf main nach PR #8
- **`docs/54-real-routing-provider-and-product-upgrade.md`** — dieses Dokument
