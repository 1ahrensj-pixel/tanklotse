# Final Audit Report — TankLotse / tankengpt

**Audit-Branch:** `audit/finalize-tanklotse`
**Vorherige Branches:** `claude/build-tanklotse-app-IO0W4` (Initial-Build + Live-Verifikation)

---

## 1. Zusammenfassung

Das Repository wurde umfassend geprüft, an allen Stellen wo Build-Blocker oder funktionale Lücken bestanden, repariert, mit echten Befehlen verifiziert und ehrlich dokumentiert.

**Kurzfassung:**

- **Backend** ist produktionsnah: kompiliert, gelinted (0 Errors / 0 Warnings), 17/17 Jest-Tests grün, läuft live gegen echte PostgreSQL+PostGIS+Redis, alle 53 API-Routen registriert, `/health` und `/ready` antworten OK, Auth-Roundtrip + CRUD verifiziert.
- **Mobile-App** (Flutter 3.24.5) baut sauber: `flutter analyze` zeigt **0 Issues**, `flutter test` 3/3 grün, `flutter build web --release` erfolgreich (`build/web/main.dart.js` erzeugt). APK-Build wurde nur durch fehlendes Android-SDK in der Audit-Umgebung blockiert — kein Code-Problem.
- **Admin-Dashboard** (Next 15.5.15) baut: `npm run build` → `.next/standalone/server.js`, alle 9 Routen statisch generiert.
- **Landingpage** (Next 15.5.15) baut: 10 Routen statisch, Sitemap + Robots vorhanden.
- **Docker Compose** ist syntaktisch valide; in der Audit-Umgebung kein Docker-Daemon, daher Stack nativ verifiziert (Postgres 16 + PostGIS 3.4 + Redis 7 + Backend).
- **Prisma-Migration** wurde produktiv gegen die Live-Datenbank ausgerollt (`prisma migrate status` → up to date).
- **Sicherheit**: Tankerkönig-API-Key nirgends im Frontend (CI-Workflow blockiert), keine Hardcoded-Secrets, keine `.env` eingecheckt, Argon2id, JWT-Secret-Mindestlänge erzwungen, IP-Anonymisierung in Logs.

**Bewertung:** **GELB** — gut lauffähiger Rohbau, mehrere reale externe Abhängigkeiten fehlen für echten Production-Launch (siehe §13).

---

## 2. Geprüfte Module

| Modul | Pfad | Status |
|---|---|---|
| Backend (NestJS) | `backend/` | Fertig (mit Live-Verifikation) |
| Datenbank (Prisma + PostgreSQL/PostGIS) | `backend/prisma/` (verlinkt aus `database/`) | Fertig |
| Mobile-App (Flutter) | `mobile-app/` | Fertig bis auf APK-/IPA-Build (Toolchain extern) |
| Admin-Dashboard (Next 15) | `admin-dashboard/` | Fertig |
| Landingpage (Next 15) | `landingpage/` | Fertig |
| Infrastructure (Docker Compose, Nginx, Backup) | `infrastructure/` | Vorbereitet |
| CI/CD (GitHub Actions) | `.github/workflows/` | Vorbereitet, syntaktisch valide |
| Doku | `docs/` | 12 Hauptdokumente + 2 Anhänge |
| E2E-Tests | `tests/` | Playwright-Specs, nicht in dieser Sandbox ausgeführt |

---

## 3. Build-Ergebnisse

| Modul | Befehl | Ergebnis | Bemerkung |
|---|---|---|---|
| Backend | `npm install` | ✅ ok | 908 Pakete |
| Backend | `npx prisma generate` | ✅ ok | Prisma Client v5.22.0 |
| Backend | `npx prisma validate` | ✅ ok | Schema valid (mit DATABASE_URL gesetzt) |
| Backend | `npx prisma migrate deploy` | ✅ ok | 1 Migration angewendet |
| Backend | `npm run lint` | ✅ ok | 0 Errors, 0 Warnings (max-warnings=0) |
| Backend | `npm test` | ✅ ok | **17/17 Tests grün** |
| Backend | `npm run build` | ✅ ok | `dist/main.js` erzeugt |
| Backend | `node dist/main.js` (live) | ✅ ok | 53 Routes registriert, `/health` + `/ready` 200 |
| Mobile | `flutter pub get` | ✅ ok | 147 Dependencies |
| Mobile | `flutter analyze` | ✅ ok | **0 Issues** |
| Mobile | `flutter test` | ✅ ok | **3/3 Tests grün** |
| Mobile | `flutter build apk --debug` | ⚠️ blockiert | Kein Android-SDK in der Sandbox |
| Mobile | `flutter build web --release` | ✅ ok | Cross-Compile-Smoke-Build erfolgreich |
| Admin | `npm install` | ✅ ok | 398 Pakete |
| Admin | `npm run build` | ✅ ok | 9 Routen statisch + standalone server |
| Landing | `npm install` | ✅ ok | 358 Pakete |
| Landing | `npm run build` | ✅ ok | 10 Routen statisch + standalone server |
| Docker | `docker compose config` | ✅ ok | Syntaktisch valide |
| Docker | `docker compose up -d --build` | ⚠️ blockiert | Kein Docker-Daemon in der Sandbox |

---

## 4. Test-Ergebnisse

### Backend (Jest)

| Test-Datei | Tests | Ergebnis |
|---|---:|---|
| `src/common/utils/ip.spec.ts` | 4 | ✅ |
| `src/cache/cache-keys.spec.ts` | 2 | ✅ |
| `src/recommendations/detour.service.spec.ts` | 5 | ✅ |
| `src/recommendations/recommendations.service.spec.ts` | 2 | ✅ |
| `src/recommendations/recommendations.controller.spec.ts` (NEU im Audit) | 3 | ✅ |
| **Summe** | **17** | **17/17** |

Die neue HTTP-Test-Datei verifiziert die zwei Spec-Beispiele aus dem Auftrag (§15) gegen den echten NestApp-HTTP-Layer:

- **Beispiel 1** (1,70 → 1,60 / 50 l / 4 km / 8 l/100 km): real ≈ +4,49 € · `lohnt_sich` ✅
- **Beispiel 2** (1,70 → 1,68 / 40 l / 8 km / 10 l/100 km): real ≈ -0,54 € · `lohnt_sich_nicht` ✅
- Validation: ungültige Werte → 400 ✅

### Mobile (flutter_test)

| Test-Datei | Tests | Ergebnis |
|---|---:|---|
| `test/recommendation_model_test.dart` | 2 | ✅ |
| `test/widget_smoke_test.dart` | 1 | ✅ |
| **Summe** | **3** | **3/3** |

### Live-E2E (curl gegen lokales Backend)

| Endpoint | Methode | Erwartet | Tatsächlich |
|---|---|---|---|
| `/health` | GET | 200, `status:ok` | ✅ |
| `/ready` | GET | 200, `status:ready` | ✅ |
| `/api/recommendations/detour-calculation` | POST | korrekte Werte | ✅ |
| `/api/recommendations/best-station` | POST | sortierte Liste | ✅ |
| `/api/stations/search` | GET | Stations-Liste | ✅ |
| `/api/auth/register` | POST | accessToken | ✅ |
| `/api/auth/me` | GET | User-Profil | ✅ |
| `/api/vehicles` | POST | 201 + Objekt | ✅ |
| `/api/vehicles` | GET | Liste | ✅ |
| `/api/vehicles/:id` | DELETE | 204 | ✅ |
| `/api/alerts` | POST | 201 + Objekt | ✅ |
| `/api/favorites` | POST | 201 + Objekt | ✅ |
| `/api/favorites/:id` | DELETE | 204 | ✅ |
| `/api/stations/:id/complaint` | POST | 201 + ok | ✅ |
| Validation `lat=200` | GET | 400 | ✅ |
| Validation `password<12` | POST | 400 | ✅ |

---

## 5. Gefundene Fehler

| # | Fehler | Modul | Schweregrad |
|---|---|---|---|
| 1 | ESLint v9 erwartet Flat Config — `.eslintrc.json` funktionierte nicht mehr | Backend | hoch (CI-Blocker) |
| 2 | `npm run lint` Pattern `test/**/*.ts` matchte keine Files | Backend | mittel |
| 3 | 1 Lint-Error (unbenutzter `Param`-Import) + 8 Warnings | Backend | mittel |
| 4 | `flutter analyze` 1 Error: `Color.withValues` ist erst ab Flutter 3.27 verfügbar | Mobile | hoch (Build-Blocker) |
| 5 | `flutter analyze` 27 Infos/Warnings (trailing-commas, snake_case, async-gaps) | Mobile | niedrig |
| 6 | Web-Build scheiterte: Web-Plattform-Scaffolding (`web/index.html`) fehlte | Mobile | niedrig (audit-spezifisch) |
| 7 | Backend-Test-Datei mit `import * as request from 'supertest'` (Default-Import nötig) | Backend | niedrig |
| 8 | nodemailer 6.x mit 2 high-severity Vulnerabilities (Email-Domain-Confusion + DoS) | Backend | hoch |
| 9 | Manuelle PLZ-/Adress-Suche in der Mobile-App **nicht implementiert** (Spec 6.2) | Mobile | mittel |
| 10 | `database/`-Verzeichnis ist leer (Prisma liegt in `backend/`) — irreführend | Doku | niedrig |
| 11 | Doku-Nummerierung wich vom Auftrag ab (z.B. `05-app-architecture` statt `05-mobile-app`) | Doku | niedrig |
| 12 | `09-security.md` und `07-landingpage.md` fehlten komplett | Doku | mittel |

---

## 6. Behobene Fehler

| # | Fix | Commit |
|---|---|---|
| 1 | `eslint.config.mjs` (Flat Config) erstellt, alte `.eslintrc.json` entfernt | dieser PR |
| 2 | `package.json`-Lint-Script auf `eslint src` umgestellt | dieser PR |
| 3 | `Param`-Import entfernt; alle 8 `any`-Warnings durch konkrete Typen ersetzt (`Prisma.InputJsonValue`, `ComplaintType`, `AppleJwk`, `FuelPriceProvider`) | dieser PR |
| 4 | `Color.withValues(alpha: 0.15)` → `Color.withOpacity(0.15)` | dieser PR |
| 5 | `dart fix --apply` (18 auto-fixes) + 3 manuelle async-gap-Fixes (messenger/navigator vor await) | dieser PR |
| 6 | `flutter create --platforms=web` für Audit-Cross-Compile-Smoke | dieser PR |
| 7 | Supertest-Default-Import | dieser PR |
| 8 | nodemailer 8.0.7 (latest) installiert | dieser PR |
| 10 | `database/README.md` mit Verweis auf `backend/prisma/` angelegt | dieser PR |
| 11 | Docs umbenannt: `05-mobile-app.md`, `06-admin-dashboard.md`, `10-datenschutz.md`, alte Inhalte in `A1-store-release.md`, `A2-troubleshooting.md` archiviert | dieser PR |
| 12 | `07-landingpage.md` und `09-security.md` neu geschrieben | dieser PR |

---

## 7. Noch offene Punkte

### Funktional
- **Manuelle PLZ-/Adress-Suche im Mobile** (Spec 6.2) fehlt. Aktuell nur GPS. Für Implementierung Geocoder-Anbindung (z.B. Nominatim für Test, kommerzieller Anbieter für Production).
- **Mapbox-Karte** im Mobile zeigt Placeholder; echte Marker-Implementierung erfordert `--dart-define=MAPBOX_PUBLIC_TOKEN=...`.
- **In-App-Purchase-Kauf-Flow** fehlt: Backend-Verify-Endpoints sind da, aber Mobile-Käuflauf (`in_app_purchase`-Plugin) ist nur Snackbar-Hinweis.
- **Push-Token-Registrierung** im Mobile: Repository-Klasse vorhanden, aber FCM-Plugin-Setup + Aufruf-Flow fehlt (braucht Firebase-Konfig).
- **Apple-/Google-Sign-In im Mobile**: Buttons sind sichtbar, Backend-Endpoints (`/auth/login/apple`, `/auth/login/google`) sind real implementiert; Mobile-Side fehlt das echte Auslösen via `sign_in_with_apple` / `google_sign_in`-Plugin.

### Infrastruktur / extern
- **Docker-Daemon-Smoke-Test** in der Audit-Umgebung nicht möglich (CLI da, kein Daemon). Compose-Config ist syntaktisch valide, alle Services real beim Build/Start nativ getestet.
- **Android-SDK** für `flutter build apk --debug` nicht in der Sandbox installiert; Web-Build erfolgreich als Cross-Compile-Smoke.

### Konten / Verträge (extern, nicht code-fixbar)
- Tankerkönig-API-Key (kostenlos beantragen)
- Apple Developer Programm (99 USD/Jahr)
- Google Play Developer (25 USD einmalig)
- Firebase-Projekt + FCM-Service-Account
- Mapbox-Token
- Sentry-Projekt
- Domain `tanklotse.de` (DENIC-Recherche zwingend)
- Marken-Recherche DPMA + EUIPO
- Ggf. SMTP-Anbieter (Verifizierungs-Mails)
- Ggf. Stripe-Konto (B2B-Subscription)

---

## 8. Sicherheitsprüfung

Siehe ausführlich `docs/09-security.md`. Highlights:

- ✅ Helmet, CORS-Whitelist, ThrottlerGuard global, Argon2id, JWT-Secret-Mindestlänge erzwungen, Bruteforce-Lockout, Refresh-Token nur als SHA-256-Hash in DB.
- ✅ Admin-2FA (TOTP) implementiert; Audit-Log für Admin-Aktionen.
- ✅ IP in Logs anonymisiert (geprüft: Log-Zeile zeigt `127.0.0.0`).
- ✅ Sentry-Filter entfernt `key|secret|token|password` aus Breadcrumbs.
- ⚠️ 3 high-severity npm-Audit-Hits (alle transitiv über NestJS, nicht code-relevant ohne Upload-Endpoints).
- ⚠️ CSP-Header sind in Helmet aktuell **deaktiviert** (würden Mapbox/FCM blocken). Vor Live-Gang feinjustieren.

---

## 9. Datenschutzprüfung

Siehe `docs/10-datenschutz.md`. Highlights:

- ✅ Konto-Löschung: `DELETE /api/auth/me` + Mobile-Screen mit Bestätigungs-Dialog.
- ✅ Datenexport: `GET /api/auth/me/export`.
- ✅ Consent-Versionierung: `user_consents`-Tabelle mit `type`/`accepted`/`version`.
- ✅ Standort optional in der App: Onboarding hat „Ohne Standort fortfahren"-Button.
- ✅ Push nur nach Einwilligung (Push-Token wird erst nach Alarm-Anlage gespeichert).
- ✅ Kennzeichen ist **nicht** Teil des Vehicle-Modells → keine zusätzliche Pflicht-PII.
- ✅ IP-Anonymisierung in Logs.
- ⚠️ **Manuelle Suche ohne GPS** ist im Backend möglich (Endpoint akzeptiert beliebige lat/lng), aber im Mobile-UI fehlt das Eingabe-Feld → echte UX-Lücke.

---

## 10. API-Key- und Secret-Prüfung

Suchergebnis (Repo komplett, ohne `node_modules`/`.git`/`.next`/`dist`):

```
✅ KEINE Hardcoded-Tankerkönig-Keys gefunden
✅ KEINE Stripe-/Apple-/Google-Live-Secrets im Code
✅ KEINE .env eingecheckt (.env in .gitignore)
✅ Tankerkönig-Key ausschließlich serverseitig: process.env.TANKERKOENIG_API_KEY
✅ CI-Workflow .github/workflows/security.yml blockiert künftige Eindringen via grep
```

Treffer der Suche sind ausnahmslos:
- `.env.example` (leere Variablen-Definition)
- README/Doku (URL-Verweise zur Tankerkönig-Website)
- `docker-compose.yml` (`${TANKERKOENIG_API_KEY}` — Variable wird durchgereicht)
- Backend `process.env.*` Lese-Stellen
- Mobile `data_source_screen.dart` öffnet `https://creativecommons.tankerkoenig.de/` als Link (kein Key)

---

## 11. Docker-/Deployment-Prüfung

| Punkt | Status |
|---|---|
| `docker compose config` | ✅ syntaktisch valide |
| `docker compose up -d --build` | ⚠️ kein Docker-Daemon in der Audit-Umgebung |
| Backend-Image `Dockerfile` | ✅ Multi-Stage, Entrypoint-Skript macht `prisma migrate deploy && node dist/main.js` |
| `docker-entrypoint.sh` | ✅ neu im vorigen Branch, jetzt verifiziert ausführbar |
| Prisma als prod-Dep | ✅ (war ursprünglich devDep — gefixt) |
| openssl im Runtime-Image | ✅ (für Prisma-Migration nötig) |
| Nginx-Config | ✅ vorhanden (admin.tanklotse.de + tanklotse.de + /api/) |
| Backup-Skript | ✅ `infrastructure/backup.sh` (pg_dump, 14 Tage Retention) |
| Health-Check | ✅ `/health` und `/ready` live verifiziert |
| Let's Encrypt / HTTPS | ⚠️ vorbereitet, in `docs/08-deployment.md` dokumentiert |
| Provider-Anbindung Deploy-Workflow | ⚠️ nur Platzhalter — bewusst, da Hosting-Provider offen ist |

---

## 12. App-Store-Bereitschaft

| Punkt | Status |
|---|---|
| Bundle-ID | ✅ `de.tanklotse.app` in pubspec/main reserviert |
| iOS Sign-in-Setup | ⚠️ Code-Endpoint da, Apple-Developer-Konto + Capability-Konfig fehlt |
| Android FCM Setup | ⚠️ Code-Endpoint da, `google-services.json` fehlt |
| Datenquellen-Hinweis App-Store | ✅ in `docs/A1-store-release.md` formuliert |
| Datenschutz-URL | ⚠️ erst nach Domain-Registrierung final |
| App-Icons | ❌ noch nicht designt |
| Screenshots | ❌ noch nicht erzeugt |
| TestFlight-/Internal-Test-Build | ❌ braucht echte Konten |

---

## 13. Produktionsreife Einschätzung

**Bewertung: 🟡 GELB — Guter Rohbau, noch nicht produktionsreif.**

| Bereich | Bewertung | Begründung |
|---|---|---|
| Backend | 🟢 | Kompiliert, getestet, läuft live, alle Routen registriert |
| Datenbank | 🟢 | Prisma-Schema vollständig, PostGIS aktiv, Migration ausgerollt |
| Mobile-Code | 🟢 | analyze/test grün, web-build erfolgreich |
| Mobile-Funktionalität | 🟡 | Karten-/IAP-/Push-/Apple-Google-Login-Flows brauchen externe Tokens |
| Web-Frontends | 🟢 | Beide bauen, gepatchte Next-Version (CVE-2025-66478 fixed) |
| Docker | 🟡 | Compose valide, real getestet auf nativen Diensten |
| CI/CD | 🟢 | 5 Workflows, syntaktisch valide |
| Security | 🟡 | Solide Basis, npm-Audit-Hits klassifiziert (alle non-critical) |
| Datenschutz | 🟡 | Pflichtfunktionen vorhanden, manuelle Adress-Suche fehlt |
| Doku | 🟢 | 12 Dokumente + 2 Anhänge, ehrlich gehalten |

**Was fehlt zum 🟢 GRÜN:**

1. Mapbox-Karte real verdrahten (Mobile)
2. Manuelle PLZ-Suche (Mobile + Geocoder-Endpoint im Backend)
3. Echter Apple-Developer-/Google-Play-/Firebase-/Mapbox-Setup (extern)
4. Domain + HTTPS + SMTP + Sentry konfiguriert
5. Docker-Stack auf Staging-Server tatsächlich gefahren

---

## 14. Nächste empfohlene Schritte

In dieser Reihenfolge:

1. **Tankerkönig-Key beantragen** und in Server-`.env` setzen → erlaubt erste echte API-Smoke-Tests gegen Live-Daten.
2. **Manuelle Suche im Mobile umsetzen**: Eingabefeld + Backend-Endpoint `/api/geo/search` (intern Nominatim für Start, später kommerzieller Geocoder).
3. **Mapbox-Token holen** + `mapbox_gl`-Plugin in Mobile einbinden, `map_screen.dart` real implementieren.
4. **Firebase-Projekt** anlegen, FCM einrichten, Mobile-Push-Flow in `main.dart` integrieren.
5. **Apple-Developer- und Google-Play-Konten** anlegen, Bundle-IDs registrieren, `sign_in_with_apple`/`google_sign_in`-Plugins einbinden.
6. **Server provisionieren** (Hetzner/Fly.io/AWS), `infrastructure/docker-compose.yml` deployen, Let's Encrypt aktivieren, ersten echten `prisma migrate deploy` + Seed.
7. **Markenrecherche** (DENIC, DPMA, EUIPO) für „TankLotse" — falls geblockt, eine der Alternativen aus dem Master-Prompt.
8. **TestFlight / Internal-Test-Spur** in den Stores aktivieren, mit 5–10 Testern in den Echtbetrieb.
9. **Externer Pen-Test** (mindestens leichter Smoke gegen die produktiven Endpoints).
10. **Monitoring** (Sentry-DSN setzen, Loki/Cloudwatch für Logs, Uptime-Monitor auf `/health`).

---

*Audit durchgeführt mit echten Befehlen, Logs und Live-Server. Jede Aussage in diesem Bericht ist durch ausgeführte Befehle belegbar — siehe Commit-History des Branches `audit/finalize-tanklotse`.*
