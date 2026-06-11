# TankLotse — Live-Readiness-Checkliste

> **Stand:** Master-Loop Iteration 2. Code-seitig ist das Projekt launch-bereit.
> Was bleibt, sind **Betreiber-Entscheidungen** (Konten, Verträge, Identität) —
> unten als TODO-Liste mit Anleitung.

---

## ✅ ERLEDIGT (code-seitig, live verifiziert)

### Produkt & Technik
- [x] Backend (NestJS + Prisma + PostGIS + Redis): 401 Unit- + 23 Contract-Tests grün
- [x] Landingpage + Admin-Dashboard (Next.js 15): Lint clean, Lighthouse 100/100/100/100
- [x] Mobile-App (Flutter): 34 Tests, `flutter analyze` 0 Issues
- [x] E2E: Playwright Chromium+Webkit, axe-core WCAG 2.1 AA (0 Verstöße), Responsive-Tests
- [x] **NEU:** Admin-Dashboard-E2E (6 Tests: Login, Fehlerfall, Feature-Flags, Users, AuthZ)
- [x] **NEU:** Journey-Test `audit/journey-test.sh` — 16 Live-Checks (Registrierung→Mail→Login→Suche→DSGVO-Export→Admin)
- [x] **NEU:** E-Mail-Verifizierung zeigt Browser-Nutzern eine gebrandete Bestätigungsseite
- [x] **NEU:** Passwort-Reset-Link führt zu funktionierendem Formular (vorher: 404! Kritischer Bug behoben)
- [x] Reset-Token sind Single-Use (live verifiziert: Reuse → 400)
- [x] **NEU:** Landing-FAQ (5 Fragen) + FAQPage-JSON-LD, Trust-Streifen, korrigierte Beispielrechnung
- [x] **NEU:** Preise-Seite ehrlich gemacht — keine erfundenen Gratis-Limits, Premium klar als „geplant", „Werbefrei"-Widerspruch entfernt (Web + App konsistent)
- [x] **NEU:** Cross-Browser komplett: Playwright Chromium 46/46 + Webkit 46/46
- [x] **NEU:** Brute-Force-Schutz: strikte IP-Rate-Limits auf Login/Register/Forgot/Reset (env-konfigurierbar, live verifiziert: 429 nach Limit) zusätzlich zum Account-Lockout
- [x] **NEU:** Lighthouse-Recheck nach allen Landing-Änderungen: 100/100/100/100 (Home + Preise, Production-Build)
- [x] **NEU (kritisch):** Landing-Dockerfile hatte ungültige COPY-Syntax → Docker-Build wäre gecrasht. Gefixt + BuildKit-Lint clean
- [x] **NEU (kritisch):** NEXT_PUBLIC_API_URL-Falle entschärft — Variable wird zur Build-Zeit in Bundle + CSP eingebacken; fehlte sie, blockte die CSP alle Admin-API-Calls (Login komplett tot, im Prod-Build-Test gefunden). Fix: Dockerfile-ARGs, laute Build-Warnung, render.yaml deployt jetzt auch beide Frontends mit korrekten Build-Vars
- [x] **NEU:** E2E-Suite läuft komplett gegen Production-Builds (46/46) — launch-realistisch statt nur Dev-Server
- [x] **NEU (Sweep #2, 11 verifizierte Befunde behoben):** Admin-2FA wird jetzt serverseitig erzwungen (Pre-Auth-Token + TOTP_REQUIRED-Guard — vorher genügte das Passwort trotz eingerichtetem TOTP!), Kern-USP „Tankstellen entlang der Route" in der App verdrahtet (war komplett tot), Alarm-Löschen/Deaktivieren in der App, Premium-Status-Anzeige + Käufe-wiederherstellen, Admin-Login-UX (403 ≠ 2FA, 401-Redirect, Flag-Toggle-Fehler sichtbar), Admin-Pagination validiert (400 statt 500), onlyOpen=false-Bug, Alert-stationId-UUID+FK-Handling, README-Schnellstart-Falle (Backend jetzt 464 Tests)
- [x] **NEU (Multi-Agent-Sweep, 20 verifizierte Befunde behoben):** Push-Registrierung in der App verdrahtet (Preisalarme jetzt zustellbar!), Deploy-Workflow lädt Secrets + deployt Tags statt main-HEAD, DSGVO-Erklärung mit Art.-13-Pflichtangaben (Rechtsgrundlagen, Speicherdauern, Beschwerderecht, FCM/Nominatim als Empfänger), Log-Redaction für Tokens + GPS-Koordinaten, anonyme Beschwerden möglich (Optional-JWT), Alert-Erstellung mit stationId-Fallback, Premium-Login-Gate, Consent-Nachweis + Datenschutz-Link in der App, In-App-Datenexport, IAP-Receipt-Bindung gegen Mehrfach-Einlösung, Blog auf korrektes Deutsch, 404-Doppel-Layout, npm ci überall, Subscription- + OAuth-Service-Tests (Backend jetzt 437 Tests)

### Sicherheit
- [x] Argon2id-Hashing, JWT + Refresh-Rotation, 2FA TOTP für Admins
- [x] Helmet + CSP, CORS-Whitelist, Rate-Limiting, Body-Limit 200kb → 413
- [x] 401/403-Trennung live verifiziert (USER-Token kommt nicht an Admin-Endpoints)
- [x] Anti-Enumeration: forgot-password antwortet immer 204
- [x] IP-Kürzung in Logs (DSGVO), strukturierte Logs mit Redaction

### DSGVO & Recht (Struktur)
- [x] Datenschutzerklärung (Landing + App), Datenquelle-Attribution (Tankerkönig CC BY 4.0)
- [x] Konto löschen + Datenexport über API (live verifiziert)
- [x] Consent-Tracking (TERMS/PRIVACY/LOCATION/PUSH, versioniert)
- [x] Impressum strukturell vollständig (§ 5 DDG / § 18 MStV) — **Inhalte sind Platzhalter!**

### Betrieb & Deployment
- [x] Deploy-Konfigs: `render.yaml`, `railway.json`, Docker-Production-Compose
- [x] CI: 6 GitHub-Workflows (Backend/Web/Mobile/Security/Staging/E2E)
- [x] Lokale Dev-Umgebung: Docker-Stack + Mailpit + Adminer + Seed + `README_LOCAL.md`
- [x] Runbooks: Staging-Deployment (docs/33), API-Key-Onboarding (docs/63), Store-Release (docs/A1)

---

## 🔴 LIVE-BLOCKER — nur der Betreiber kann sie lösen

| # | Blocker | Was zu tun ist | Anleitung |
|---|---------|----------------|-----------|
| L1 | **Impressum & Datenschutz: echte Identität** | „Max Mustermann / Musterstraße 123" durch echten Namen, Adresse, Telefon ersetzen. Ohne korrektes Impressum: Abmahnrisiko ab Tag 1. **Zentralisiert: nur noch 2 Dateien** — `landingpage/lib/legal-identity.ts` (Website, speist Impressum + Datenschutz) und `mobile-app/lib/core/legal/legal_identity.dart` (App). 8 Felder ausfüllen, fertig. | je 1 Konfig-Datei pro Plattform |
| L2 | **Tankerkönig-API-Key** (kostenlos) | Key beantragen auf creativecommons.tankerkoenig.de → in Production-Env als `TANKERKOENIG_API_KEY` setzen, `FUEL_PROVIDER_MODE=live` | docs/63-api-key-onboarding-runbook.md |
| L3 | **Hosting-Konto + Deploy** | Render ODER Railway-Konto anlegen, `render.yaml` deployt den Stack; Production-Secrets (JWT, Cookie, Admin-Passwort) beim Setup generieren | docs/33 + docs/64 |
| L4 | **Domain** | tanklotse.de (oder andere) registrieren, DNS auf Hosting zeigen, `NEXT_PUBLIC_SITE_URL`/`CORS_ORIGINS` setzen | Hosting-Doku |
| L5 | **Produktions-SMTP** | Provider wählen (Resend/Postmark/SES — alle haben Free-Tier), `SMTP_*`-Envs setzen | .env.production.example |
| L6 | **App-Store-Konten** (nur für Mobile-Launch) | Apple Developer (99 €/Jahr) + Google Play (25 € einmalig); Web-Launch geht auch OHNE | docs/A1-store-release.md |
| L7 | **Geocoding-Policy prüfen** | Nominatim ist für geringe Last ok (User-Agent gesetzt); bei Wachstum auf Mapbox umstellen (`GEOCODER_PROVIDER=mapbox`) | docs/48 |

### Empfohlene Launch-Reihenfolge (Web-First, ~1 Tag Aufwand)

1. **L1** Impressum-Daten eintragen (30 min)
2. **L2** Tankerkönig-Key beantragen (kostenlos, wenige Stunden Wartezeit)
3. **L4** Domain registrieren (15 min)
4. **L3** Render-Deploy mit `render.yaml` (1–2 h inkl. Secrets + Smoke-Test)
5. **L5** Resend-Konto (Free: 100 Mails/Tag) anbinden (30 min)
6. `scripts/verify-staging-preview.sh` gegen die Live-URLs laufen lassen
7. **Web ist live.** App-Store-Release (L6) danach in Ruhe.

---

## 🟡 NACH dem Launch (erste 30 Tage)

- [ ] Sentry aktivieren (`SENTRY_ENABLED=true` + DSN) — Error-Monitoring
- [ ] Uptime-Monitoring (UptimeRobot free) auf `/health` + `/ready`
- [ ] Backup-Plan: Render-Postgres hat Point-in-Time-Recovery — Retention prüfen
- [ ] Erste echte Nutzer-Feedback-Schleife (Mail an support@)
- [ ] Push-Notifications: FCM-Projekt anlegen wenn Preisalarme nativ kommen sollen
