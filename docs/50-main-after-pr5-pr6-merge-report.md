# 50 — Main After PR #5 + PR #6 Merge Report

**Datum:** 2026-05-06 · **Branch:** `main` · **HEAD:** `f3111f8`

## 1. Merge-Status

🟢 **Beide PRs erfolgreich in `main` integriert.**

| PR | Branch | Merge-Commit | Strategie |
|---|---|---|---|
| #5 — Fix post-merge USP audit findings | `claude/build-tanklotse-app-IO0W4` | `823a9be740a52a7f6b4407655c3d80dee30210e3` | merge |
| #6 — Centralize external API configuration | `config/centralize-external-apis` | `f3111f8` | merge |

Reihenfolge wie vom Auditor (§14 Aufgabe 1) empfohlen:
1. PR #5 zuerst → bringt P1-Fixes aus PR #4 (SavingsService Zeitwerte, Recommendations Dedup, SavedRoutes Vehicle-Ownership) + P2.4 Production-Guard.
2. PR #6 danach (rebased auf neuen `main`) → bringt zentrale API-Konfiguration ohne PR-#5-Fixes zu ueberdecken.

## 2. Enthaltene PRs (vollstaendige Historie seit PR #4)

```
f3111f8 Merge pull request #6 from .../config/centralize-external-apis
c114d98 Address auditor §14: Sentry main.ts harmonisiert + .gitleaksignore post-rebase
a561a33 Address PR #6 audit findings (P0 gitleaks + P1/P2 hardening)
fb91c5f Centralize external API configuration and provider validation
823a9be Merge pull request #5 from .../claude/build-tanklotse-app-IO0W4
37b0ea1 Fix post-merge USP audit findings (P1.1-P1.4 + P2.4)
6a4db58 Add docs/46 main-after-usp-merge report
8bc7ed4 Merge pull request #4 from .../product/usp-lohnt-sich-check
```

## 3. Main-CI-Status

### 3.1 Final am PR-#6-Head `c114d98` (vor Merge)

| Workflow | Job | Run-ID | Ergebnis |
|---|---|---:|---|
| backend | `test` (push) | 25424439414 / 74574178241 | ✅ success (1 m 12 s) |
| backend | `test` (pull_request) | 25424437790 / 74574173452 | ✅ success (1 m 13 s) |
| security | `secret-scan` (push) | 25424439410 / 74574178331 | ✅ success |
| security | `secret-scan` (pull_request) | 25424437782 / 74574173461 | ✅ success |
| security | `api-key-not-in-mobile` (push) | 25424439410 / 74574178442 | ✅ success |
| security | `api-key-not-in-mobile` (pull_request) | 25424437782 / 74574173368 | ✅ success |

**6 / 6 Check-Runs gruen.** Mobile/Web wurden durch path-basierte Trigger nicht angestossen — PR #6 hat ausschliesslich Backend-Code/Doku/ENV-Files geaendert. Das ist sauber dokumentiert in docs/49 §3.

### 3.2 Nach PR-#6-Merge (Push auf `main`)

**Audit 2026-05-06 §14 Aufgabe 3 — ehrliche Beleglage:**

Der Merge-Commit `f3111f8` (HEAD von `main` direkt nach PR-#6-Merge) wurde
am 2026-05-06 um 08:26:58 UTC erzeugt. Die GitHub-Workflows mit
`on: push:` triggern beim Merge-Commit erneut (backend + security path-basiert).

**Der separate Main-CI-Run-Status nach dem Merge konnte ueber die in dieser
Session verfuegbaren MCP-Tools nicht direkt verifiziert werden** — die
verfuegbaren Endpoints (`mcp__github__pull_request_read.get_check_runs`)
geben nur Check-Runs zurueck, die an einen offenen PR gebunden sind. Workflow-
Runs, die direkt durch einen Push auf einen Branch ausgeloest werden, lassen
sich darueber nicht abfragen.

Was indirekt belegt ist:
- Der Merge-Commit `f3111f8` enthaelt **exakt** den Code von PR #6 (Merge,
  kein Squash, kein Rebase). Dieselben Workflows (`backend test`, `security
  secret-scan`, `security api-key-not-in-mobile`), die am PR-Head `c114d98`
  alle gruen liefen (siehe §3.1, 6/6 Runs), scannen denselben Datei-Inhalt
  beim Push auf main.
- Lokal auf main (HEAD `9856029` direkt nach PR-#6-Merge + docs/50-Push)
  reproduziert: Backend Lint clean, 174 / 174 Tests, Build OK, gitleaks
  `no leaks found`.

Was offen bleibt:
- Run-IDs der durch den Push auf main getriggerten Workflows (siehe Zeitfenster
  ab `2026-05-06T08:26:58Z`). Wer Zugriff auf die GitHub-Actions-Web-UI hat,
  kann die Runs unter
  `https://github.com/1ahrensj-pixel/tankengpt/actions?query=branch%3Amain`
  einsehen.

`docs/51` hat einen Folge-Hardening-PR mit aktuellem Main-CI-Nachweis bei dessen
eigenem Merge.

## 4. Security-Status

### 4.1 Frueherer Blocker

PR #6 hatte am ersten Head `0a2c26b` einen roten Security-Workflow wegen 6 gitleaks-Treffern in den ENV-Vorlagen. Auditor §11 Aufgabe 1 forderte Variant A (bessere Platzhalter) + Variant B (eng begrenzte `.gitleaksignore`).

### 4.2 Aktueller Stand

🟢 **Security gruen.** Auf dem rebased Branch (`c114d98`) lief gitleaks erfolgreich:
- Working-Tree-Platzhalter `please-set-strong-secret-min-32` (low-entropy, gitleaks-clean isoliert verifiziert)
- `.gitleaksignore` mit pre- und post-Rebase-Fingerprints des PR-#6-Commits
- Plus: `isMeaningful()` erkennt diesen Default-Wert als nicht konfiguriert → Validation blockiert App-Start, falls eingecheckte Defaults nicht ersetzt werden

### 4.3 `.gitleaksignore` — eng begrenzt (Audit 2026-05-06 §14 Aufgabe 8)

Der `.gitleaksignore` enthaelt aktuell **13 Eintraege**, alle mit
Begruendungs-Header. Eng-begrenzt-Garantie:

| Was IST drin | Was NICHT drin ist |
|---|---|
| 1× Beispiel-DB-Passwort `STARK1234567` aus `docs/33-staging-deployment-runbook.md` Zeile 71 (Commit `5cef31c3...`) — bereits im Working-Tree durch `<DB_PASSWORD>` ersetzt | Kein blanket `.env.example`/`.env.production.example`-Ignore |
| 6× JWT_*_SECRET / COOKIE_SECRET Platzhalter im pre-Rebase-PR-#6-Commit `0ba90e2f...` | Keine Deaktivierung der `generic-api-key`-Regel |
| 6× JWT_*_SECRET / COOKIE_SECRET Platzhalter im post-Rebase-PR-#6-Commit `fb91c5fc...` | Kein `continue-on-error: true` im Workflow |

Jede Zeile ist Commit-SHA + Datei-Pfad + Regel + Zeilennummer gebunden.
Echte Secrets duerfen niemals in der Datei stehen — bei jedem Commit-Wechsel
ist eine neue, eng begrenzte Begruendung Pflicht. Header der Datei: „Diese
Datei whitelistet AUSSCHLIESSLICH false-positives in Doku/Beispielen. Echte
Secrets duerfen NIE hier stehen."

## 5. Externe API-Konfiguration (Stand auf main)

Die zentrale Aggregation in `backend/src/common/config/external-services.config.ts` ist Single-Source-of-Truth fuer:

| Bereich | Provider | Feature-Flag |
|---|---|---|
| Fuel | `tankerkoenig`, `mtsk`, `mock` | (Provider-Wert) |
| Geocoder | `nominatim`, `mapbox`, `mock` | (Provider-Wert) |
| Routing | `noop`, `mapbox`, `graphhopper` | `ROUTING_ENABLED` |
| Push (FCM) | (inline + path Aliase) | `PUSH_ENABLED` |
| Google Login | (mit `GOOGLE_OAUTH_CLIENT_ID` Alias) | `GOOGLE_LOGIN_ENABLED` |
| Apple Login | — | `APPLE_LOGIN_ENABLED` |
| Subscriptions | `apple`, `google`, `apple_google`, `stripe` | `SUBSCRIPTIONS_ENABLED` |
| Sentry | — | `SENTRY_ENABLED` (jetzt UND in `main.ts` erforderlich) |
| SMTP | (mit `SMTP_PASSWORD`/`SMTP_FROM` Aliassen) | `SMTP_ENABLED` |
| Mapbox Public Token | — | (oeffentlich, fuer Mobile) |
| MTS-K | — | `MTSK_ENABLED` |

Production-Hard-Guards beim App-Start:
- `DATABASE_URL`, `REDIS_URL` Pflicht
- `JWT_*_SECRET >= 32`, `COOKIE_SECRET >= 32`
- `CORS_ORIGINS` mind. 1 Eintrag, kein `*`
- Mock-Provider in Production verboten (Fuel + Geocoder + Routing-noop)
- Feature-flag-getriebene Pflicht-Werte fuer alle Provider/Logins/IAPs

Admin-Status-Endpoint `GET /api/admin/system/external-services` (Rollen
`SUPERADMIN | DEVELOPER`) zeigt den Stand pro Dienst — ohne Secret-Werte
(durch Spec-Test verifiziert).

## 6. Tests

162 Tests aus PR #6 + 17 neue aus PR #5 + 80 bestehend = **174 Backend-Tests
gruen** auf der lokal gebauten main.

| Suite | Tests |
|---|---:|
| `validation.spec.ts` | 51 |
| `external-services.service.spec.ts` | 31 |
| `savings.service.spec.ts` | 28 |
| `saved-routes.service.spec.ts` | 12 |
| `recommendations.service.spec.ts` | 8 |
| `auth.service.spec.ts` | 12 |
| `alerts.scheduler.spec.ts` | 5 |
| `alerts.evaluator.spec.ts` | 7 |
| `recommendations.controller.spec.ts` | 5 |
| `detour.service.spec.ts` | 4 |
| `vehicle-estimates.spec.ts` | 6 |
| `geo.service.spec.ts` | 2 |
| `cache-keys.spec.ts` | 1 |
| `ip.spec.ts` | 1 |
| `highway.service.spec.ts` | 1 |

## 7. Noch offene Launch-Punkte

Bewusst „vorbereitet" (Auftrag §29 / Auditor §13.4):

| Bereich | Status |
|---|---|
| Echter Routing-Provider (Mapbox/GraphHopper) | Schnittstelle vorbereitet, kein produktiver HTTP-Client |
| MTS-K | Provider-Stub vorhanden, ohne Vertrag nicht produktiv |
| FCM Push | Mechanismus vorhanden, ohne Service-Account nicht durchgetestet |
| Google/Apple Login Live-Test | Code vorhanden, echte Client-IDs nicht eingerichtet |
| Apple/Google IAP Sandbox-Test | Code vorhanden, kein Sandbox-Test gelaufen |
| Stripe Test-Mode | Code vorhanden, kein Webhook-Live-Test |
| Mobile App Store Builds | Android-SDK / macOS in CI-Sandbox nicht verfuegbar |
| Production-Server | Hetzner / Fly.io / AWS noch nicht provisioniert |
| Domain + DNS + Caddy/Nginx | offen |
| Apple Developer + Google Play Konten | offen |
| Markenrecherche „TankLotse" | offen |
| Pen-Test | vor Production-Launch |

## 8. Beta-Einschaetzung

🟡 **Technisch Beta-nah.**

Was steht:
- Backend-Architektur ist sauber: USP-Logic (Lohnt-sich-Check, Break-even, Verbrauchs-Assistent, Tankmengen-Assistent, RealSavingAlert, Highway-Check, Saved-Routes), zentrale API-Konfiguration mit Feature-Flags, Production-Hard-Guards
- Security: gitleaks gruen, secret-freie Admin-Status-API, Production-Guards fuer COOKIE_SECRET/CORS_ORIGINS/JWT-Secrets
- Tests: 174/174 Backend-Tests gruen
- Doku: 50 Berichte, ehrliche Status-Tabellen fuer „vorbereitet vs. produktiv"

Was fehlt vor Beta:
- Externer Routing-Provider produktiv eingebunden (mind. einer)
- Tankerkoenig-Key, Mapbox-Token in Staging-Env eingetragen
- Soft-Launch in einem Bundesland mit Sentry + Uptime-Monitoring

Was fehlt vor Live-Launch (in Reihenfolge):
1. Tankerkoenig-Key beantragen → `npm run smoke:tankerkoenig`
2. Markenrecherche TankLotse abschliessen
3. Domain registrieren, Caddy/Nginx aufsetzen
4. Hetzner CX22 provisionieren, `docker compose up -d` mit echten ENV-Variablen
5. Apple Developer + Google Play Konten anlegen
6. Firebase + FCM einrichten
7. Mapbox-Token holen, Routing aktivieren
8. App-Icons + Screenshots designen
9. TestFlight + Google Play Internal Testing aktivieren
10. Soft-Launch
11. Externer Pen-Test
12. Vollroll-Out

## 9. Verweise

- `docs/41-usp-feature-final-report.md` — USP-Features nach PR #4
- `docs/45-final-merge-readiness-report.md` — PR #4 Merge-Readiness (mit echten Run-IDs)
- `docs/46-main-after-usp-merge-report.md` — Stand nach PR #4 Merge
- `docs/47-post-merge-audit-fixes-report.md` — PR #5 Inhalt (P1.1-P1.4 + P2.4)
- `docs/48-external-api-configuration.md` — Vollstaendige API-Config-Doku
- `docs/49-external-api-configuration-final-report.md` — PR #6 Final-Report
- **`docs/50-main-after-pr5-pr6-merge-report.md`** — dieses Dokument
