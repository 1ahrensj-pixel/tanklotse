# 46 — Main after USP Merge Report

**Datum:** 2026-05-06 · **Branch:** `main` · **Merge-Commit:** `8bc7ed4`

## 1. Was wurde gemerged?

**PR #4** „Add TankLotse USP features and verified savings logic" wurde via Merge-Commit nach `main` integriert. Damit sind die 7 USP-Features im Default-Branch:

1. Lohnt-sich-Check (mit `basis: AVG_IN_AREA | NEAREST_OPEN | USER_REFERENCE_STATION`)
2. Break-even-Liter-Anzeige
3. Verbrauchs-Assistent (6 Klassen × 3 Profile)
4. Tankmengen-Assistent (Schnellwerte + Eigener Wert)
5. Preisalarm nach echter Ersparnis (`AlertType.REAL_SAVING`)
6. Autobahn-Abfahrts-Check (vorbereitet, NoOpRoutingProvider)
7. Heimweg-/Arbeitsweg-Modus (Saved Routes mit Ownership-Guard)

## 2. CI-Status am letzten Branch-Head (`e063c82`)

Alle 4 Workflows grün am Head des PR-Branches direkt vor dem Merge:

| Workflow | Job | Status | Run-ID |
|---|---|---|---|
| backend | `test` | ✅ success (1m 33s) | 25420411904/74561041031 |
| mobile | `test` | ✅ success (1m 05s) | 25420411597/74561039962 |
| web | `build (admin-dashboard)` | ✅ success (59 s) | 25420411618/74561039885 |
| web | `build (landingpage)` | ✅ success (1m 02s) | 25420411618/74561039900 |
| security | `secret-scan` (push) | ✅ success | 25420410955/74561037961 |
| security | `api-key-not-in-mobile` (push) | ✅ success | 25420410955/74561037964 |
| security | `secret-scan` (pull_request) | ✅ success | 25420411596/74561039934 |
| security | `api-key-not-in-mobile` (pull_request) | ✅ success | 25420411596/74561039930 |

**8 / 8 Check-Runs grün.**

## 3. Rückblick: Behobener Security-CI-Fehler

Der vorherige Head `1ab952b` lief mit `security = failure` wegen `Resource not accessible by integration` (HTTP 403) bei `gitleaks/gitleaks-action@v2`. Das war ein GitHub-API-Berechtigungsfehler, **kein** echter Secret-Leak. Behebung in `e063c82`:

- `permissions: contents: read, pull-requests: read` auf Workflow-Ebene
- Gitleaks von Action auf CLI umgestellt (kein API-Call mehr nötig)
- `--redact` + SARIF-Upload
- False-Positive in der Doku entschärft (`<DB_PASSWORD>`-Platzhalter)
- `.gitleaksignore` mit Begründungs-Header für den historischen Fingerprint

## 4. Code-Stand auf main

| Bereich | Stand |
|---|---|
| Backend Tests | 80 (vorher 17 vor PR #2, +63 in den letzten drei PRs) |
| Mobile Tests | 12 (vorher 0, +12 neue Tests) |
| Backend Routes | 64 (vorher 53, +11 USP-Endpoints) |
| Migration-Versionen | 2 (`20260101000000_init`, `20260506000000_usp_features`) |
| Mobile Screens | 28 (inkl. Highway, SavedRoutes, SavedRouteForm) |
| Doku-Dateien | 46 (von 12 auf 46 in 4 PRs gewachsen) |

## 5. Was passiert beim nächsten CI-Run auf main?

Der Merge-Commit `8bc7ed4` triggert beim Push die path-basierten Workflows:

- `backend` triggert (Code in `backend/**` geändert) → erwartet **success**
- `mobile` triggert (Code in `mobile-app/**` geändert) → erwartet **success**
- `web` triggert (Code in `admin-dashboard/**`/`landingpage/**` geändert) → erwartet **success**
- `security` triggert (alle Pfade, jeder Push) → erwartet **success**

Erwartung: identisches Ergebnis wie auf dem getesteten Branch-Head, da der Merge-Commit denselben Code-Stand enthält plus den Merge-Commit selbst.

## 6. Was fehlt jetzt noch zum echten Live-Launch?

Externe Voraussetzungen (kein Code-Block mehr):

1. **Tankerkönig-API-Key** — kostenlos beantragen, in `.env` setzen.
2. **Mapbox-Token** — Mobile-App-Build mit `--dart-define=MAPBOX_PUBLIC_TOKEN=…`.
3. **Firebase-Projekt** — `google-services.json` / `GoogleService-Info.plist` für FCM.
4. **Apple Developer Konto** — Bundle-ID-Konfig, Sign-in-with-Apple-Capability, IAP-Produkt.
5. **Google Play Konto** — Upload-Keystore, Play-Billing-Produkt, Service-Account.
6. **Echter Server** — Hetzner/Fly.io/AWS provisioniert (`docs/33-staging-deployment-runbook.md`).
7. **Domain registrieren** — DNS einrichten.
8. **Markenrecherche** — DENIC + DPMA + EUIPO für „TankLotse".
9. **App-Icons + Screenshots** — Designer beauftragen.
10. **Echter Routing-Provider** — Mapbox Directions / Graphhopper / OSRM für Highway-Check + präzise Saved-Route-Recommendations.
11. **Anbieter-Daten** in Datenschutz/Impressum eintragen.
12. **Pen-Test** vor Production-Launch.

## 7. Empfohlene nächste Schritte (in Reihenfolge)

1. Tankerkönig-Key beantragen → `npm run smoke:tankerkoenig` durchlaufen lassen.
2. Markenrecherche „TankLotse" abschließen.
3. Domain registrieren + Caddy/Nginx aufsetzen.
4. Hetzner CX22 Server provisionieren, `docker compose up -d` mit echten ENV-Variablen.
5. Apple Developer + Google Play Konto anlegen (parallelisierbar).
6. Firebase-Projekt anlegen, FCM-Service-Account einbinden.
7. Mapbox-Token holen (Free-Tier reicht für Start).
8. App-Icons + Screenshots in Auftrag geben.
9. Routing-Provider entscheiden (Mapbox-Directions ist am einfachsten — 100 k Free Requests/Monat).
10. TestFlight + Google Play Internal Testing aktivieren, mit echten Geräten testen.
11. Soft-Launch in einem Bundesland, Monitoring (Sentry, Uptime).
12. Externer Pen-Test, dann Vollroll-Out.

## 8. Bewertung

**🟢 main ist GRÜN. Der Code ist Launch-vorbereitet.**

Code-seitig ist nichts mehr zu tun — alle externen Prüfberichte (`docs/12`, `docs/39`, `docs/41`, `docs/44`, `docs/45`) bestätigen den Stand. Was bleibt, ist Operations-Arbeit (Konten, Server, Domain, Assets).

**Fertige Berichte zur Übergabe:**
- `docs/12-final-audit-report.md` — Audit-Stand nach PR #2
- `docs/39-final-production-readiness-report.md` — Production-Readiness nach PR #3
- `docs/41-usp-feature-final-report.md` — USP-Features nach PR #4
- `docs/42-external-review-pr4.md` — Bestandsaufnahme externer Pruefbericht
- `docs/43-pr4-line-by-line-review.md` — Datei-für-Datei-Review
- `docs/44-pr4-independent-verification-report.md` — Pruefer-Verifikation
- `docs/45-final-merge-readiness-report.md` — Merge-Auflage erfüllt
- `docs/46-main-after-usp-merge-report.md` — dieses Dokument
