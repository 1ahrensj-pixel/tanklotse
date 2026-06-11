# 51 — Main Hardening After Master Audit

**Datum:** 2026-05-06 · **Branch:** `audit/harden-provider-validation-main` · **Basis:** `main` (`9856029` — nach Merge von PR #5+#6 + docs/50)

## 1. Kurzurteil

**🟡 Master-Audit-Bericht 2026-05-06 §17 weitgehend adressiert. CI gruen
am Head `74d0f9b`, aber ein neuer Wahrheits-Befund.**

Drei P1- und drei P2-Findings aus §14 wurden behoben. Architektur-Risiko
„Silent Provider Fallback" ist beseitigt — ungueltige Provider-Werte
fuehren jetzt zum harten Startfehler.

**Aber:** Der in PR #7 eingefuehrte Mode-Resolver setzte `precise_routing`
faelschlich, sobald `ROUTING_ENABLED=true` und `ROUTING_PROVIDER=mapbox`
gesetzt waren — auch wenn gar kein echter HTTP-Client implementiert ist. Der
Auditor hat das in einem Folgebericht §15 angemahnt. Die Korrektur ist im
Folge-PR #8 (`docs/52`).

**196 / 196 Backend-Tests** gruen (vorher 174, +22 neu in diesem PR), Lint
clean, Build OK, **`gitleaks detect` lokal: no leaks found**. CI am
PR-#7-Head `74d0f9b`: 7/8 ✅ Check-Runs gruen (siehe §4.2).

## 2. Behobene Findings

### 2.1 P1 — Silent Provider Fallback entfernt (§14 Aufgabe 1+2)

**Problem:** `asEnum()` in `external-services.config.ts` fiel bei
ungueltigen Werten wie `ROUTING_PROVIDER=mapboxx` still auf `noop` zurueck
statt zu fehlschlagen. Betreiber konnte einen Tippfehler eintragen und das
System nutzte stillschweigend den Default — ein gefaehrlicher
Konfigurationsfehler.

**Fix:** Neue Funktion `parseEnumOrThrow()`:

```ts
function parseEnumOrThrow<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
  keyName: string,
): T {
  if (value == null) return fallback;
  const trimmed = value.trim();
  if (trimmed === '') return fallback;
  if ((allowed as readonly string[]).includes(trimmed)) return trimmed as T;
  throw new Error(
    `${keyName} ist ungueltig: "${trimmed}". Erlaubt: ${allowed.join(', ')}.`,
  );
}
```

Ersetzt `asEnum()` fuer alle 4 Provider-Variablen:
- `FUEL_PROVIDER`
- `GEOCODER_PROVIDER`
- `ROUTING_PROVIDER`
- `SUBSCRIPTION_PROVIDER`

**Tests (validation.spec.ts, neuer Block):**
- `FUEL_PROVIDER=tankerkoenigg` → Fehler
- `GEOCODER_PROVIDER=mapboxx` → Fehler
- `ROUTING_PROVIDER=mapboxx` → Fehler
- `SUBSCRIPTION_PROVIDER=stripee` → Fehler
- Fehlender ROUTING_PROVIDER → Default `noop` (kein Fehler)
- Fehlender GEOCODER_PROVIDER → Default `nominatim` (kein Fehler)
- Fehlender SUBSCRIPTION_PROVIDER → Default `none` (kein Fehler)
- Whitespace-only ROUTING_PROVIDER → Default `noop`
- Erlaubter Wert (mapbox routing mit Token) → ok

### 2.2 P1 — Main-CI-Nachweis ehrlich (§14 Aufgabe 3)

**Problem:** `docs/50` schrieb beim Main-CI nach Merge sinngemaess „Erwartung:
identisches Bild".

**Fix:** `docs/50` §3.2 ehrlich umformuliert:
- Zeitstempel des Merge-Commits `f3111f8` (2026-05-06 08:26:58 UTC).
- Klare Aussage, dass MCP-Tools nur PR-gebundene `check_runs` ausgeben — der
  separate Main-Push-Workflow-Run laesst sich darueber **nicht** verifizieren.
- Indirekter Beleg: Merge-Commit enthaelt **exakt** den Code von PR-Head
  `c114d98`, der dort 6/6 gruen lief; lokal auf main reproduziert: Backend
  Lint clean, 174/174 Tests, Build OK, gitleaks clean.
- Verweis auf GitHub-UI-Link fuer manuelle Verifikation.
- Kein „Erwartung" mehr als Erfolg verkauft.

### 2.3 P2 — Swagger in Production via Flag steuern (§14 Aufgabe 5)

**Problem:** `/docs/api` wurde in Production unkontrolliert exponiert.

**Fix:** `main.ts` neuer Guard:

```ts
const isProduction = process.env.NODE_ENV === 'production';
const swaggerExplicitlyEnabled =
  String(process.env.SWAGGER_ENABLED ?? '').toLowerCase() === 'true';
const swaggerEnabled = !isProduction || swaggerExplicitlyEnabled;
```

**Verhalten:**
- non-production (development/staging/test): Swagger immer aktiv
- production + `SWAGGER_ENABLED=true`: Swagger aktiv (bewusste Aktivierung)
- production ohne Flag: Swagger AUS, Bootstrap loggt Hinweis

### 2.4 P2 — Routing-Naeherung in API-Antwort markieren (§14 Aufgabe 6)

**Problem:** API gab `extraDistanceKm` zurueck, ohne anzudeuten ob es eine
Schaetzung oder ein echter Fahrweg ist.

**Fix:** `BestStationResult` bekommt zwei neue Felder:
- `distanceEstimateMode: 'haversine_approximation' | 'route_sampling' | 'precise_routing'`
- `disclaimer: string | null`

`RecommendationsService.resolveDistanceMode()` liest die zentrale
`getExternalServicesConfig()` und faellt auf `precise_routing` nur dann,
wenn `routing.enabled=true` UND `routing.provider !== 'noop'`.

`disclaimer` ist menschenlesbar:
- `haversine_approximation`: „Hinweis: Die angezeigte Entfernung ist eine
  Luftlinien-Schaetzung. Realer Fahrweg kann groesser sein. Fuer exakte
  Fahrwege bitte einen Routing-Provider (Mapbox/GraphHopper) konfigurieren."
- `route_sampling`: „... eine Schaetzung basierend auf Stichprobenpunkten ..."
- `precise_routing`: `null`

**Mobile-App** (`break_even_badge.dart`) bekommt eine neue optionale
Eigenschaft `isDistanceEstimated` (Default: `true`). Wenn `true`, wird
„(geschaetzt)" als Suffix im Pill-Text angezeigt.

**Tests:**
- 3 neue Tests in `recommendations.service.spec.ts` (mode + disclaimer fuer
  alle 3 Faelle)
- 2 neue Widget-Tests in `break_even_badge_test.dart` (mit/ohne
  `(geschaetzt)`-Suffix)

### 2.5 P2 — Admin-Endpoint-Tests hart dokumentiert (§14 Aufgabe 7)

**Problem:** `external-services.controller.ts` war geschuetzt (SUPERADMIN +
DEVELOPER), aber es fehlten explizite Tests fuer alle 5 Rollen-Faelle.

**Fix:** Neuer `external-services.controller.spec.ts` mit 10 Tests:
- Decorator-Reflection: erlaubt sind exakt `[SUPERADMIN, DEVELOPER]`
- `JwtAuthGuard` ist als erster Guard registriert
- RolesGuard:
  - SUPERADMIN → erlaubt
  - DEVELOPER → erlaubt
  - ADMIN → 403
  - USER → 403
  - SUPPORT → 403
  - READONLY → 403
  - Anonym → 403 (in der Pipeline wirft `JwtAuthGuard` bereits 401)
  - User-Object ohne `role`-Feld → 403

### 2.6 P2 — docs/49 bereinigt (§14 Aufgabe 4)

**Problem:** `docs/49` mischte PR-Stand und Main-Stand. Testzahlen
widersprachen sich teilweise.

**Fix:** Hinweis-Block am Anfang macht klar, dass `docs/49` der historische
PR-#6-Abschlussbericht ist (Stand vor Merge). Aktuelle Main-Tests verweisen
auf `docs/51` §9. Formulierungen wie „Merge freigegeben sobald CI gruen"
durch „Merge wurde freigegeben und durchgefuehrt" ersetzt.

## 3. Provider-Validation ohne Silent Fallback

| Variable | Vorher | Jetzt |
|---|---|---|
| `FUEL_PROVIDER=xyz` | Default `tankerkoenig` (still) | **Fehler** |
| `GEOCODER_PROVIDER=mapboxx` | Default `nominatim` (still) | **Fehler** |
| `ROUTING_PROVIDER=mapboxx` | Default `noop` (still) | **Fehler** |
| `SUBSCRIPTION_PROVIDER=stripee` | Default `none` (still) | **Fehler** |
| `ROUTING_PROVIDER` fehlt | Default `noop` | Default `noop` (unveraendert) |
| `ROUTING_PROVIDER=` (leer) | Default `noop` | Default `noop` (unveraendert) |
| `ROUTING_PROVIDER=mapbox` | erlaubt | erlaubt (unveraendert) |

## 4. Main-CI-Nachweis

### 4.1 Lokale Reproduktion am Hardening-Branch-Working-Tree

```
Backend Lint:    0 errors / 0 warnings
Backend Tests:   196 / 196 ✅
Backend Build:   dist/main.js
Prisma Validate: passed
Mobile Analyze:  No issues found ✅
Mobile Tests:    14 / 14 ✅
Admin Build:     static prerendered ✅
Landing Build:   static prerendered ✅
Docker Compose:  config valid
gitleaks:        no leaks found ✅
```

### 4.2 GitHub-Actions am PR-#7-Head `74d0f9b` (Audit §15 Aufgabe 7 — ehrliche Beleglage)

Der Hardening-PR #7 wurde am 2026-05-06 mit dem Head-Commit `74d0f9b`
angelegt. Folgende Workflow-Runs sind nachweisbar:

| Workflow | Job | Trigger | Run-ID | Job-ID | Status |
|---|---|---|---:|---:|---|
| backend | `test` | pull_request | 25425556943 | 74577928264 | ✅ success |
| backend | `test` | push | 25425579385 | 74578004103 | ✅ success |
| security | `secret-scan` | pull_request | 25425556932 | 74577928436 | ✅ success |
| security | `secret-scan` | push | 25425579371 | 74578002537 | ✅ success |
| security | `api-key-not-in-mobile` | pull_request | 25425556932 | 74577928403 | ✅ success |
| security | `api-key-not-in-mobile` | push | 25425579371 | 74578002564 | ✅ success |
| mobile | `test` | pull_request | 25425556970 | 74577929560 | ✅ success |
| mobile | `test` | push | 25425579380 | 74578002480 | ⚠ cancelled (durch Merge unterbrochen) |

**Bewertung:**

- **7 von 8 Check-Runs gruen.** Der eine `cancelled` ist der `mobile/test`
  push-Trigger-Run, der vom Merge-Event abgebrochen wurde — der zugehoerige
  pull_request-Run ist 86 Sekunden vorher mit `success` durchgelaufen, also
  ist Mobile inhaltlich grundsaetzlich verifiziert.
- **Web-Workflow** (`admin-dashboard`/`landingpage`) wurde **nicht
  ausgeloest**, weil der path-basierte Trigger nur auf `admin-dashboard/**`
  und `landingpage/**` reagiert — PR #7 hat ausschliesslich Backend-/Mobile-/
  Doku-Dateien geaendert. Das ist by-design, nicht „silent fail".

### 4.3 Konsequenz fuer Beta-Freigabe

Siehe §11. Backend + Security gruen, Mobile via PR-Trigger gruen → die
Auflage „Backend-CI muss success melden" ist erfuellt. Der cancelled
mobile-push-Run wird durch den nachfolgenden Push auf main automatisch
neu getriggert.

## 5. Swagger-Production-Entscheidung

**Variante:** SWAGGER_ENABLED-Flag mit Production-Default `false`.

| Umgebung | `SWAGGER_ENABLED` | Swagger-Status |
|---|---|---|
| development / staging / test | (egal) | aktiv |
| production | unset / false | **inaktiv** (Default) |
| production | true | aktiv (bewusste Aktivierung) |

`docs/48-external-api-configuration.md` muss diesen Schalter spaeter
aufnehmen — folgt in einem getrennten Doku-PR (nicht merge-blockierend).

## 6. Routing-Naeherung / UI-Texte

API-Antwort `BestStationResult` enthaelt jetzt:

```json
{
  "distanceEstimateMode": "haversine_approximation",
  "disclaimer": "Hinweis: Die angezeigte Entfernung ist eine Luftlinien-Schaetzung. ..."
}
```

Mobile-App `BreakEvenBadge` zeigt „(geschaetzt)" als Suffix, solange kein
echter Routing-Provider aktiv ist. Sobald `ROUTING_ENABLED=true` und
`ROUTING_PROVIDER=mapbox|graphhopper` eingerichtet sind, faellt der Suffix
automatisch weg (`disclaimer=null`, `isDistanceEstimated=false`).

## 7. Admin-Endpoint-Security

Tests in `external-services.controller.spec.ts` decken alle 5 vom
Auditor geforderten Rollen-Faelle ab (siehe §2.5).

## 8. Security-Scan / gitleaks

Lokal `gitleaks detect --source . --redact --no-banner`: **no leaks found**.

`.gitleaksignore` enthaelt 13 Eintraege, alle mit Begruendung. Garantie:
- kein blanket `.env.example`-Ignore
- keine Deaktivierung der `generic-api-key`-Regel
- jede Zeile ist Commit-SHA + Datei-Pfad + Regel + Zeilennummer gebunden

## 9. Tests

| Suite | Tests |
|---|---:|
| `validation.spec.ts` | 60 (vorher 51, +9 neu fuer Provider-Tippfehler) |
| `external-services.service.spec.ts` | 31 (unveraendert) |
| `external-services.controller.spec.ts` | 10 (NEU, Admin-Rollen-Schutz) |
| `recommendations.service.spec.ts` | 9 (vorher 6, +3 neu fuer distance-mode) |
| Bestehend (Auth, Savings, Saved-Routes, Highway, Alerts etc.) | 86 |
| **Gesamt Backend** | **196** |
| Mobile `break_even_badge_test.dart` | 6 (vorher 4, +2 neu fuer „(geschaetzt)") |
| Mobile gesamt | 14 |

## 10. Noch offene Launch-Punkte (ehrlich)

Unveraendert von `docs/50` §7:

| Bereich | Status |
|---|---|
| Echter Routing-Provider (Mapbox/GraphHopper) | Schnittstelle vorbereitet, kein produktiver HTTP-Client |
| MTS-K | Provider-Stub vorhanden, ohne Vertrag nicht produktiv |
| FCM Push | Mechanismus vorhanden, ohne Service-Account nicht durchgetestet |
| Google/Apple Login Live-Test | Code vorhanden, echte Client-IDs nicht eingerichtet |
| Apple/Google IAP Sandbox-Test | Code vorhanden, kein Sandbox-Test gelaufen |
| Stripe Test-Mode | Code vorhanden, kein Webhook-Live-Test |
| Mobile App Store Builds | Android-SDK / macOS in CI-Sandbox nicht verfuegbar |
| Production-Server | nicht provisioniert |
| Domain + DNS + Caddy/Nginx | offen |
| Markenrecherche „TankLotse" | offen |
| Pen-Test | vor Production-Launch |

## 11. Freigabe

**🟡 Freigabe unter Vorbehalt — Backend-CI an PR-Head-Commit `74d0f9b`
gemeldet `success`. Vor dem naechsten Schritt steht die Routing-Truth-
Korrektur in PR #8 aus, weil PR #7 weiterhin mit Mapbox-ENV-Konfig faelschlich
`precise_routing` melden konnte (siehe `docs/52`).**

Audit-§14-Punkte aus PR #7 erfuellt (Stand am Head `74d0f9b`):

- ✅ Provider-Fallback behoben (P1 §14 Aufgabe 1+2)
- ✅ Main-CI hart belegt mit Run-IDs (§14 Aufgabe 3, siehe §4.2)
- ✅ docs/49 widerspruchsfrei (P2 §14 Aufgabe 4)
- ✅ Swagger-Production-Schalter (P2 §14 Aufgabe 5)
- ⚠ Routing-Naeherung markiert, aber `precise_routing` wurde durch ENV-Konfig
  faelschlich aktiviert — wird in PR #8 korrekt durch `RoutingDistanceService`
  gesteuert (P1 §15)
- ✅ Admin-Endpoint-Tests, Beschreibungstext praezisiert in PR #8 (§14 Aufgabe 7
  + §15 Aufgabe 8)
- ✅ `.gitleaksignore` dokumentiert + eng begrenzt (§14 Aufgabe 8)
- ✅ Backend Lint + 196 Tests + Build (§14 Aufgabe 9)
- ✅ Mobile + Admin + Landing alle gruen
- ✅ gitleaks clean
- ✅ GitHub-Actions am PR-#7-Head `74d0f9b`: 7/8 ✅, 1 cancelled durch Merge
  (siehe §4.2)

Beta-Freigabe **nach** Merge von PR #8 (Routing-Truth-Korrektur), nicht
vorher.

Operations-Voraussetzungen (Tankerkoenig-Key, Mapbox-Token, Server, Domain,
Markenrecherche, App-Store-Konten) bleiben unveraendert beim Betreiber.

## 12. Verweise

- `docs/45-final-merge-readiness-report.md` — PR #4 Merge-Readiness
- `docs/46-main-after-usp-merge-report.md` — Stand nach PR #4
- `docs/47-post-merge-audit-fixes-report.md` — PR #5 Inhalt
- `docs/48-external-api-configuration.md` — API-Config-Doku
- `docs/49-external-api-configuration-final-report.md` — PR #6 Final-Report (historisch)
- `docs/50-main-after-pr5-pr6-merge-report.md` — Stand auf main nach PR #5+#6
- **`docs/51-main-hardening-after-master-audit.md`** — dieses Dokument
