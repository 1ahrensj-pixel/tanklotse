# 52 — Routing Truth and CI Verification

**Datum:** 2026-05-06 · **Branch:** `audit/routing-truth-and-ci-verification` · **Basis:** `main` (`2bbda17` — nach Merge von PR #7)

## 1. Kurzurteil

**🟢 Auditor-Bericht 2026-05-06 §15 vollstaendig adressiert.** Der wichtigste
Fund war ein neuer Wahrheits-Bug in PR #7: ENV-Konfig
(`ROUTING_ENABLED=true` + `ROUTING_PROVIDER=mapbox`) reichte aus, um
`distanceEstimateMode='precise_routing'` zu setzen — obwohl gar kein HTTP-
Client existiert. Die App haette also Schaetzungen als praezise Werte
verkauft. Das ist behoben.

**198 / 198 Backend-Tests** gruen (vorher 196, +2 neu fuer Routing-Truth).
Lint clean, Build OK, gitleaks clean.

## 2. Warum PR #7 nachgeschaerft werden musste

PR #7 hat `distanceEstimateMode` + `disclaimer` korrekt eingefuehrt — die
Werte standen in der API-Antwort. Aber die `resolveDistanceMode()`-Logik
las die zentrale `getExternalServicesConfig()` und schloss aus
`routing.enabled === true && routing.provider !== 'noop'`, dass die Distanz
„praezise" sei.

Das war eine Lüge:

```text
ROUTING_ENABLED=true + ROUTING_PROVIDER=mapbox bedeutet NUR,
dass ein Provider _konfiguriert_ ist.
Es bedeutet NICHT, dass eine konkrete Empfehlung tatsaechlich
ueber HTTP zur Mapbox-Directions-API gegangen ist.
```

Der Auditor hat das im Bericht §15 zu Recht als P1 markiert. Ohne Fix
haette ein Betreiber, der nur den Mapbox-Token einsetzt, ohne dass jemand
den HTTP-Client implementiert hat, der App-UI eine falsche Praezisions-
Aussage verkauft.

## 3. precise_routing nur bei echter Routing-Berechnung

### 3.1 Neue Architektur

`backend/src/recommendations/routing-distance.service.ts` (NEU):

```ts
export interface RoutingDistanceService {
  isPreciseRoutingAvailable(): boolean;
  calculateExtraDistanceKm(input: RoutingDistanceInput): Promise<RoutingDistanceResult>;
}

@Injectable()
export class NoopRoutingDistanceService implements RoutingDistanceService {
  isPreciseRoutingAvailable(): boolean { return false; }
  async calculateExtraDistanceKm(): Promise<RoutingDistanceResult> {
    return { precise: false };
  }
}
```

`RecommendationsModule` registriert `NoopRoutingDistanceService` als
Default. Spaeter (echter Mapbox/GraphHopper-PR) wird hier per Factory der
echte Client injiziert — analog `HighwayModule.RoutingProvider`.

### 3.2 Geaendertes Verhalten in `resolveDistanceMode`

Vorher (PR #7, Audit-§15-Fund):

```ts
if (cfg.routing.enabled && cfg.routing.provider !== 'noop') {
  return 'precise_routing';
}
```

Jetzt (PR #8):

```ts
if (this.routingDistance.isPreciseRoutingAvailable()) {
  return 'precise_routing';
}
return requested; // haversine_approximation oder route_sampling
```

Die ENV-Konfig steuert den Mode nicht mehr. Nur die konkrete Service-
Implementierung kann `precise_routing` aktivieren.

### 3.3 Verhaltensmatrix

| ENV-Konfig | Service | API-Antwort `distanceEstimateMode` |
|---|---|---|
| `ROUTING_ENABLED=false` | NoopRoutingDistanceService | `haversine_approximation` (bestStation) / `route_sampling` (Saved Routes) |
| `ROUTING_ENABLED=true` + `mapbox` + Token | NoopRoutingDistanceService | `haversine_approximation` / `route_sampling` (kein precise — Service liefert keine Route) |
| `ROUTING_ENABLED=true` + `mapbox` + Token | (zukuenftig) MapboxRoutingDistanceService mit echtem HTTP-Call | `precise_routing` (nur fuer Empfehlungen, fuer die wirklich eine Route abgerufen wurde) |

## 4. Sentry-Status-Note korrigiert

`external-services.config.ts` — Sentry-Note bei „DSN gesetzt, ENABLED nicht
true":

Vorher:
> SENTRY_DSN ist gesetzt, aber SENTRY_ENABLED ist nicht true — die Legacy-
> Initialisierung in main.ts startet Sentry trotzdem. Setze SENTRY_ENABLED=true
> fuer eindeutige Konfiguration.

**Das war veraltet.** `main.ts` startet Sentry seit PR #6 ausschliesslich,
wenn `SENTRY_ENABLED=true` gesetzt ist. Der „Legacy-Pfad" existiert nicht
mehr.

Jetzt:
> SENTRY_DSN ist gesetzt, aber SENTRY_ENABLED ist nicht true — Sentry bleibt
> deaktiviert. Setze SENTRY_ENABLED=true fuer aktiviertes Reporting.

## 5. CI-Nachweis mit Run-IDs

### 5.1 PR-#7-Head `74d0f9b` (Audit §15 Aufgabe 7)

Dokumentiert in `docs/51` §4.2 (in diesem PR aktualisiert). Zusammenfassung:

| Workflow | Trigger | Run-ID | Status |
|---|---|---:|---|
| backend `test` | pull_request | 25425556943 | ✅ success |
| backend `test` | push | 25425579385 | ✅ success |
| security `secret-scan` | pull_request | 25425556932 | ✅ success |
| security `secret-scan` | push | 25425579371 | ✅ success |
| security `api-key-not-in-mobile` | pull_request | 25425556932 | ✅ success |
| security `api-key-not-in-mobile` | push | 25425579371 | ✅ success |
| mobile `test` | pull_request | 25425556970 | ✅ success |
| mobile `test` | push | 25425579380 | ⚠ cancelled (Merge-Event) |

**7 / 8 Check-Runs gruen.** Der eine `cancelled` ist der mobile-push-Run,
der bei der Merge-Aktion abgebrochen wurde — der zugehoerige PR-Trigger-
Run ist 86 Sekunden vorher mit `success` durchgelaufen, also ist Mobile
inhaltlich verifiziert.

**Web-Workflow** wurde wegen path-basierter Trigger (`admin-dashboard/**`,
`landingpage/**`) nicht ausgeloest — PR #7 hat ausschliesslich Backend-/
Mobile-/Doku-Dateien geaendert. Das ist by-design, nicht „silent fail".

### 5.2 PR #8 (dieser PR) lokal

```
Backend Lint:    0 errors / 0 warnings
Backend Tests:   198 / 198 ✅ (vorher 196, +2 neu fuer Routing-Truth)
Backend Build:   dist/main.js
Mobile Analyze:  No issues found ✅
Mobile Tests:    14 / 14 ✅
gitleaks:        no leaks found ✅
```

GitHub-Actions auf dem Branch `audit/routing-truth-and-ci-verification`
laeuft nach Push erstmalig.

## 6. Swagger-Config vollstaendig dokumentiert

| Datei | Aenderung |
|---|---|
| `.env.example` | `SWAGGER_ENABLED=true` (Default fuer Dev) mit Erklaerung |
| `.env.production.example` | `SWAGGER_ENABLED=false` mit Hinweis „nicht ohne zusaetzlichen Schutz" |
| `docs/48-external-api-configuration.md` | Neuer Abschnitt §3.4b „Swagger UI" |
| `docs/52` (dieser Bericht) | Querverweise |

Verhalten:
- non-production: Swagger immer aktiv
- production + Flag fehlt/false: **AUS** (Default)
- production + `SWAGGER_ENABLED=true`: aktiv (bewusst, nicht oeffentlich
  exponieren — IP-Allowlist / VPN / Auth-Proxy)

## 7. Tests

### 7.1 Backend (198 / 198)

| Suite | Tests |
|---|---:|
| `validation.spec.ts` | 60 |
| `external-services.service.spec.ts` | 31 |
| `external-services.controller.spec.ts` | 10 (Kommentar praezisiert in PR #8) |
| `recommendations.service.spec.ts` | 11 (vorher 9, **+2 neu in PR #8**) |
| `savings.service.spec.ts` | 28 |
| `saved-routes.service.spec.ts` | 12 |
| `auth.service.spec.ts` | 12 |
| Andere | 34 |
| **Gesamt** | **198** |

Neu in PR #8:
- `Mapbox-Konfig allein erzeugt KEIN precise_routing (stationsAlongRoute)`
- `precise_routing erscheint NUR, wenn der RoutingDistanceService
  isPreciseRoutingAvailable=true meldet`

Plus angepasst: `mit aktiviertem Routing-Provider (mapbox) → mode=precise_routing`
ist umbenannt zu `Mapbox-Konfig allein erzeugt KEIN precise_routing
(bestStation)` und kehrt jetzt die Erwartung um (haversine + disclaimer
not null).

### 7.2 Mobile (14 / 14)

Unveraendert — der Mobile-Test ueberprueft nur das `(geschaetzt)`-Suffix
des `BreakEvenBadge`-Widgets. Da das Widget den Default `isDistanceEstimated=true`
hat und das Backend jetzt korrekt liefert, ist die UI weiter korrekt.

## 8. Offene Launch-Punkte

Unveraendert von `docs/51` §10:

| Bereich | Status |
|---|---|
| Echter Mapbox/GraphHopper-RoutingDistanceService | Schnittstelle vorbereitet (`RoutingDistanceService`-Interface), kein produktiver HTTP-Client |
| MTS-K, FCM Push, Google/Apple Login, IAP, Stripe | jeweils vorbereitet, ohne Vertrag/Test nicht produktiv |
| Mobile App Store Builds | Android-SDK / macOS in CI-Sandbox nicht verfuegbar |
| Production-Server, Domain, DNS | nicht provisioniert |
| Markenrecherche, Pen-Test | offen |

## 9. Beta-Freigabe / keine Freigabe

**🟢 Beta-Freigabe nach Merge von PR #8** — vorher nicht.

Begruendung:
- ✅ Routing-Truth-Bug behoben (P1 §15 Aufgabe 2+3)
- ✅ Tests gegen falsches precise_routing (3 Tests, P1 §15 Aufgabe 4)
- ✅ Sentry-Status-Note korrigiert (P2 §15 Aufgabe 5)
- ✅ docs/51 entschaerft + Run-IDs eingetragen (P2 §15 Aufgabe 6+7)
- ✅ Admin-Endpoint Test-Beschreibung praezisiert (P2 §15 Aufgabe 8)
- ✅ SWAGGER_ENABLED in Doku + ENV-Vorlagen (P2 §15 Aufgabe 9)
- ✅ precise_routing in Doku als „nur bei echter Routing-Berechnung" definiert (P2 §15 Aufgabe 10)
- ✅ Backend Lint + 198 Tests + Build (§15 Aufgabe 12)
- ✅ gitleaks clean

Operations-Voraussetzungen (Tankerkoenig-Key, Mapbox-Token, Server, Domain,
Markenrecherche, App-Store-Konten, Pen-Test) liegen weiter beim Betreiber.

Sobald jemand wirklich Mapbox/GraphHopper braucht, implementiert der naechste
PR `MapboxRoutingDistanceService` bzw. `GraphhopperRoutingDistanceService`
und verdrahtet ihn in `RecommendationsModule` per Factory anhand der
`ROUTING_PROVIDER`-ENV-Variable. Dann darf — und nur dann — die API-Antwort
`precise_routing` melden.

## 10. Verweise

- `docs/45` bis `docs/49` — Geschichte der Audit-Kette
- `docs/50` — Stand auf main nach PR #5+#6
- `docs/51` — Master-Audit-Hardening-Bericht (PR #7) mit korrigierten
  CI-Nachweisen
- **`docs/52-routing-truth-and-ci-verification.md`** — dieses Dokument
