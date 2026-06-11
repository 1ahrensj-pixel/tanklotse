# TankLotse — Lokale Entwicklungsumgebung

Schritt-für-Schritt-Anleitung: Docker-Stack starten, Backend + Frontend hochfahren, Seed-Daten laden, Mails testen.

---

## Voraussetzungen

| Tool | Version | Hinweis |
|------|---------|---------|
| Docker Desktop | ≥ 4.x | Mit WSL2-Backend auf Windows |
| Node.js | ≥ 20 LTS | `node -v` |
| npm | ≥ 10 | kommt mit Node 20 |
| Flutter (optional) | 3.27.x | Nur für Mobile-Tests |

---

## 1. Docker-Stack starten

```bash
# Einmalig im Projekt-Root
docker compose -p tanklotse -f infrastructure/docker-compose.dev.yml up -d
```

Dieser Befehl startet:

| Service | Port (Host) | Beschreibung |
|---------|-------------|--------------|
| **Postgres + PostGIS** | `5435` | Datenbank |
| **Redis** | `6381` | Cache + Rate-Limiting |
| **Mailpit** (SMTP) | `1026` | Lokaler Mail-Catcher |
| **Mailpit** (Web-UI) | `8026` | Gesendete Mails ansehen |
| **Adminer** | `8081` | DB-Browser |

> **Warum Offset-Ports?** Die Standard-Ports 5432/6379/8080 sind auf diesem Rechner
> ggf. durch andere Stacks belegt. Die Ports 5435/6381/8026/8081 sind freigehalten.

Status prüfen:

```bash
docker compose -p tanklotse -f infrastructure/docker-compose.dev.yml ps
```

---

## 2. Umgebungsvariablen einrichten

```bash
# .env.local.example als Vorlage in backend/.env kopieren
cp .env.local.example backend/.env
```

Alle Provider laufen im **Mock-Modus** — kein API-Key wird benötigt. Mailpit
übernimmt den Mail-Versand.

---

## 3. Abhängigkeiten installieren

```bash
# Root (Workspaces — nur root-Dependencies)
npm install --workspaces=false

# Backend
cd backend && npm install && cd ..

# Admin-Dashboard
cd admin-dashboard && npm install && cd ..

# Landingpage
cd landingpage && npm install && cd ..
```

---

## 4. Datenbankmigrationen + Seed

```bash
cd backend

# Migrationen ausführen
npx prisma migrate deploy

# (Optional) Prisma-Client neu generieren
npx prisma generate

# Seed-Daten laden
npm run seed
```

Der Seed legt folgende Testkonten an:

| E-Mail | Passwort | Rolle | Hinweis |
|--------|----------|-------|---------|
| `admin@tanklotse.local` | `ADMIN_SEED_PASSWORD` aus `.env` | SuperAdmin | Zugang Admin-Dashboard |
| `demo@tanklotse.local` | `Demo1234!dev` | User | vollständig verifiziert, hat Fahrzeug + Route |
| `user2@tanklotse.local` | `Test1234!unverified` | User | **unverifiziert** — testet Onboarding-Flow |

Zusätzlich werden angelegt:
- 5 Musterstationen im Raum München (mit aktuellen Beispielpreisen)
- 1 Favorit, 1 gespeicherte Route, 1 Preisalarm, 1 Push-Token für `demo@`
- 6 Feature-Flags (Standardkonfiguration)

---

## 5. Backend starten

```bash
cd backend
npm run start:dev
```

Backend läuft auf **http://localhost:3000**

- API: http://localhost:3000/api
- Swagger-UI: http://localhost:3000/docs/api
- Health: http://localhost:3000/health
- Ready: http://localhost:3000/ready

---

## 6. Frontend-Apps starten

In separaten Terminals:

```bash
# Landingpage
cd landingpage && npm run dev
# → http://localhost:3001

# Admin-Dashboard
cd admin-dashboard && npm run dev
# → http://localhost:3002
```

---

## 7. Nützliche URLs

| URL | Beschreibung |
|-----|--------------|
| http://localhost:3000/docs/api | Swagger UI — alle API-Endpunkte |
| http://localhost:3002 | Admin-Dashboard |
| http://localhost:3001 | Landingpage |
| http://localhost:8026 | **Mailpit** — alle Test-Mails |
| http://localhost:8081 | **Adminer** — DB-Browser |

**Adminer-Login:**
- Server: `postgres`
- Benutzer: `tanklotse`
- Passwort: `tanklotse`
- Datenbank: `tanklotse`

---

## 8. Mails testen (Mailpit)

Alle ausgehenden Mails (Registrierung, Passwort-Reset, Verifizierung) landen in
Mailpit. **Es werden niemals echte Mails verschickt.**

1. Backend mit `SMTP_ENABLED=true`, `SMTP_HOST=localhost`, `SMTP_PORT=1026` starten (aus `.env.local.example` schon voreingestellt)
2. Aktion auslösen (z. B. Registrierung via Swagger UI oder Frontend)
3. http://localhost:8026 aufrufen → Mail erscheint sofort

---

## 9. Tests ausführen

```bash
# Alle Tests (Backend Unit + Lint + Flutter + E2E)
bash scripts/test-all.sh

# Ohne E2E (schneller, kein laufendes Frontend nötig)
bash scripts/test-all.sh --no-e2e

# Nur Backend
bash scripts/test-all.sh --only-backend

# Backend-Tests direkt
cd backend && npm test
cd backend && npm run test:cov   # mit Coverage-Report
```

Test-Logs werden in `audit/test-runs/YYYYMMDD-HHMMSS/` gespeichert.

---

## 10. E2E-Tests (Playwright)

```bash
# Alle Services müssen laufen (Backend + Landing + Admin)
npx playwright test --project=chromium
npx playwright test --project=webkit
npx playwright show-report
```

---

## 11. Flutter-Tests (Mobile-App)

```bash
cd mobile-app
flutter analyze   # 0 Issues erwartet
flutter test      # 34 Tests erwartet
flutter test --coverage
```

### Mobile-App gegen den lokalen Stack laufen lassen

Die App liest die Backend-URL aus `--dart-define=API_BASE_URL`
(Default: `http://10.0.2.2:3000` = Android-Emulator → Host).

| Ziel | Befehl |
|------|--------|
| Android-Emulator | `flutter run` (Default passt — 10.0.2.2 ist der Host) |
| Windows-Desktop / Chrome | `flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000` |
| Echtes Gerät im WLAN | `flutter run --dart-define=API_BASE_URL=http://<PC-IP>:3000` |

> Bei echtem Gerät: Windows-Firewall muss Port 3000 freigeben und
> `CORS_ORIGINS` in `backend/.env` ggf. um die Geräte-Origin ergänzt werden.

---

## 12. Production-Builds lokal testen (launch-realistisch)

Die Dev-Server verhalten sich anders als Production (Hydration-Timing, CSP,
eingebackene `NEXT_PUBLIC_*`-Variablen). Vor einem Deploy lohnt der Test
gegen echte Prod-Builds:

```bash
# Landing (Port 3001)
cd landingpage
rm -rf .next && npm run build
npx next start -p 3001

# Admin (Port 3002) — NEXT_PUBLIC_API_URL ist PFLICHT beim Build:
# sie steuert API-Basis UND CSP connect-src. Ohne sie blockt die CSP
# alle API-Calls und der Login ist tot.
cd admin-dashboard
rm -rf .next && NEXT_PUBLIC_API_URL=http://localhost:3000 npm run build
npx next start -p 3002
```

Danach läuft die komplette E2E-Suite unverändert gegen die Prod-Server
(`cd tests && npx playwright test --project=chromium`).

---

## 13. Stack stoppen

```bash
# Stack stoppen (Volumes behalten)
docker compose -p tanklotse -f infrastructure/docker-compose.dev.yml down

# Stack stoppen + Volumes löschen (Daten weg!)
docker compose -p tanklotse -f infrastructure/docker-compose.dev.yml down -v
```

---

## 14. Häufige Probleme

### Backend startet nicht (DB-Fehler)

```
Error: P1001: Can't reach database server at localhost:5435
```

→ Docker-Stack nicht gestartet oder Postgres-Healthcheck noch nicht OK.

```bash
docker compose -p tanklotse -f infrastructure/docker-compose.dev.yml ps
# postgres sollte "healthy" zeigen
```

### Port 5435 bereits belegt

```bash
# Welcher Prozess belegt den Port?
netstat -ano | findstr :5435   # Windows
lsof -i :5435                  # macOS/Linux
```

### Adminer zeigt leere Tabellen

→ Seed wurde noch nicht ausgeführt. `cd backend && npm run seed`

### Mailpit empfängt keine Mails

→ Prüfe `SMTP_ENABLED=true` und `SMTP_PORT=1026` in `backend/.env`.
Mailpit hört nur auf Port **1026** (nicht 587 oder 25).

### Auf Port 3001/3002 antwortet eine FREMDE App

Andere Dev-Projekte auf demselben Rechner können sich die Ports schnappen.
Symptom: E2E-Tests scheitern, obwohl der Port HTTP 200 liefert — es antwortet
nur die falsche App (prüfen: `curl -s localhost:3002/login | grep -i tanklotse`).

```bash
# TankLotse-Admin auf Ausweich-Port starten:
cd admin-dashboard && npx next start -p 3004
# Backend-CORS um den Port ergänzen (backend/.env):  ...,http://localhost:3004
# E2E mit Override fahren:
cd tests && ADMIN_URL=http://localhost:3004 npx playwright test --project=chromium
```

### E2E-Tests schlagen plötzlich fehl (Seiten ohne title/lang)

→ Wahrscheinlich lief `npm run build`, während der Dev-Server derselben App
aktiv war. `next build` leert `.next` und korrumpiert den laufenden Dev-Server.

```bash
# Dev-Server stoppen, Cache löschen, neu starten:
rm -rf landingpage/.next admin-dashboard/.next
cd landingpage && npm run dev      # bzw. admin-dashboard
```

**Regel:** Production-Builds nie parallel zum laufenden Dev-Server derselben App.

### Docker Desktop (Win11) Daemon-Absturz

Docker Desktop auf Win11 mit WSL2 kann instabil sein.
Workaround: Task-Manager → `com.docker.service` neu starten, danach:

```bash
docker compose -p tanklotse -f infrastructure/docker-compose.dev.yml up -d
```

---

## 15. Architekturüberblick

```
┌─────────────────────────────────────────────────────┐
│  Host (Node-Prozesse, Hot-Reload)                   │
│                                                     │
│  Backend :3000  ←──→  Landing :3001                 │
│       ↕                    ↕                        │
│  Admin :3002    ←──→  (Swagger :3000/docs/api)      │
└──────────────┬──────────────────────────────────────┘
               │ localhost Ports
┌──────────────▼──────────────────────────────────────┐
│  Docker-Container                                   │
│                                                     │
│  Postgres+PostGIS :5435   Redis :6381               │
│  Mailpit SMTP :1026        Mailpit UI :8026          │
│  Adminer :8081                                      │
└─────────────────────────────────────────────────────┘
```

**Provider-Modi (lokal):**
- `FUEL_PROVIDER_MODE=mock` → Tankpreise aus `MockFuelProvider` (In-Memory)
- `GEOCODER_PROVIDER_MODE=mock` → Geocoding aus `MockGeocoderProvider`
- `ROUTING_PROVIDER_MODE=mock` → Routing aus `MockRoutingDistanceService`
- `PUSH_PROVIDER_MODE=disabled` → Keine Push-Notifications

Kein externer API-Key wird benötigt. Mocks liefern realistische Testdaten.

---

*Letzte Aktualisierung: Iteration 2 (2026-05-14)*
