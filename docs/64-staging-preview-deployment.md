# 64 — Staging Preview Deployment

**Datum:** 2026-05-07 · **PR:** #14 · **Branch:** `deploy/staging-preview-mock`

> **Wahrheits-Garantie:** Diese Staging-Preview laeuft im Mock-/Contract-Modus.
> Sie ist **keine** Live-Verifikation der Anbieter-APIs.
> `mock_ready ≠ live_ready`. `contract_ready ≠ live_verified`.

## 1. Ziel

Das System soll erstmals sichtbar im Browser laufen — ohne echte
API-Keys, ohne falsche Live-Behauptungen. Stakeholder und Tester
koennen die Tank-Empfehlungen mit Mock-Daten fuer Koeln durchspielen.

**Was diese Preview leistet:**
- Backend laeuft, beantwortet `/health` mit 200.
- Mock-Tankstellen Koeln (Rodenkirchen, Kalk, Marsdorf, Innenstadt) sind abrufbar.
- Recommendations-Engine liefert Empfehlungen mit `distanceEstimateMode=haversine_approximation`.
- Admin-Dashboard zeigt System-Status (`providerSimulation` aus PR #11/#12).
- Landingpage ist erreichbar.

**Was diese Preview NICHT leistet:**
- kein echter Tankerkoenig-Call.
- kein echter Mapbox-Routing-Call.
- kein echter Push.
- kein Login mit Apple/Google (Auth deaktiviert).
- kein echtes Payment (Subscription deaktiviert).

## 2. Plattformen

| Komponente | Plattform | Konfiguration |
|---|---|---|
| Backend (NestJS) | Render oder Railway | `render.yaml` / `railway.json` |
| PostgreSQL | Render-managed / Railway-managed | Im jeweiligen Blueprint enthalten |
| Redis | Render-managed / Railway-managed | dito |
| Admin-Dashboard | Vercel | `admin-dashboard/vercel.json` |
| Landingpage | Vercel | `landingpage/vercel.json` |
| Flutter Web | Folge-PR (offen) | siehe §10 |

Diese PR liefert **die Konfiguration**. Den eigentlichen Deploy-Trigger
(Repo verbinden, Secrets setzen, Branch waehlen) macht der Betreiber im
jeweiligen Plattform-Panel — siehe §6 Schritt-fuer-Schritt.

### 2.1 Alternative: Bare-Metal-Deploy via Docker Compose (PR #18 / Slice B)

Wenn statt SaaS-Hosting ein eigener Server (Hetzner, eigenes Rechenzentrum)
genutzt werden soll, liegen seit Slice B (PR #18) Compose-Override-Dateien
bereit:

- `infrastructure/docker-compose.yml` — Basis mit allen sechs Services
  (postgres, redis, backend, landingpage, admin, nginx). Alle Services
  haben Healthchecks, nginx wartet auf `service_healthy`.
- `infrastructure/docker-compose.staging.yml` — Staging-Override:
  `NODE_ENV=staging`, `NEXT_PUBLIC_APP_ENV=staging-preview`,
  `NEXT_PUBLIC_PROVIDER_SIMULATION_ACTIVE=true` (Demo-Banner sichtbar),
  Swagger-Default an.
- `infrastructure/docker-compose.production.yml` — Production-Override:
  `NODE_ENV=production`, Swagger hart `false`,
  `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION` hart `false`,
  json-file-Log-Rotation (`max-size: 10m`, `max-file: 3`).

Aufruf:

```bash
# Konfig validieren (CI / lokal)
docker compose -f infrastructure/docker-compose.yml \
               -f infrastructure/docker-compose.staging.yml config

docker compose -f infrastructure/docker-compose.yml \
               -f infrastructure/docker-compose.production.yml config

# Echter Stack-Start (auf dem Server)
docker compose -f infrastructure/docker-compose.yml \
               -f infrastructure/docker-compose.production.yml up -d
```

> **Resource-Limits**: in beiden Override-Dateien sind `mem_limit` und
> `cpus` als Kommentar mit empfohlenen Hetzner-Werten enthalten — der
> Operator setzt sie anhand des Zielservers, **nicht** geraten in
> dieser Codebasis.
>
> **DB-Ports**: postgres/redis exposen in der Base-Datei `5432:5432` /
> `6379:6379` nach aussen. Production-Override kann das nicht
> subtrahieren (Compose-Listen sind additiv). Operator muss entweder
> die Base-Datei lokal anpassen oder vor `up -d` per Firewall absichern
> (`ufw deny 5432`, `ufw deny 6379`).

## 3. URLs

| Dienst | URL | Status |
|---|---|---|
| Backend | TBD nach Render/Railway-Deploy | nicht deployed |
| Admin-Dashboard | TBD nach Vercel-Deploy | nicht deployed |
| Landingpage | TBD nach Vercel-Deploy | nicht deployed |
| Flutter Web | offen — Folge-PR | nicht deployed |

> **Hinweis:** Diese Tabelle ist die Quelle der Wahrheit. Sobald die
> Preview deployed ist, **muss** der Betreiber die URLs hier eintragen
> + Status auf „live (Mock-Modus)" setzen.

## 4. Environment

Vorlage liegt in `.env.staging-preview.example`. Wichtig:

- Alle `*_PROVIDER_MODE` stehen auf `mock` (fuel/routing/geocoder) bzw.
  `disabled` (push/auth/payment).
- `ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=false` — der Production-Guard
  greift nicht, weil `NODE_ENV=staging`, nicht production.
- Secrets (`JWT_*_SECRET`, `COOKIE_SECRET`, `DATABASE_URL`, `REDIS_URL`,
  `CORS_ORIGINS`) setzt der Betreiber im Plattform-Panel — niemals in
  git committen.

## 5. Provider-Modi

| Adapter | Modus | Status (`ProviderReadinessStatus`) |
|---|---|---|
| fuel | `mock` | `mock_ready` |
| routing | `mock` | `mock_ready` |
| geocoder | `mock` | `mock_ready` |
| push | `disabled` | `disabled` |
| auth | `disabled` | `disabled` |
| payment | `disabled` | `disabled` |

`hasOnlyMockOrContractProviders=true`, `hasLiveVerifiedProviders=false`.

## 6. Schritt-fuer-Schritt

### 6.1 Backend auf Render

1. Render-Dashboard → New → Blueprint.
2. Repository `1ahrensj-pixel/tankengpt` verbinden.
3. Branch `deploy/staging-preview-mock` waehlen.
4. Render erkennt `render.yaml`, erstellt Backend + Postgres + Redis.
5. Im Backend-Service: ENV-Variablen `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `CORS_ORIGINS` ausfuellen
   (sync=false). Vorschlag fuer JWT/Cookie:
   `openssl rand -base64 48`.
6. Deploy abwarten, Health-Check `https://<service>.onrender.com/health`
   pruefen → 200.
7. URL in §3 dieses Dokuments eintragen.

Alternativ Railway: `railway.json` zeigt `backend/Dockerfile` als
Build-Pfad. Im Railway-Panel die gleichen ENV-Variablen setzen.

### 6.2 Frontends auf Vercel

1. Vercel-Dashboard → New Project → Repository verbinden.
2. **Admin-Dashboard:** Root-Directory `admin-dashboard/`. Branch
   `deploy/staging-preview-mock`. ENV: `NEXT_PUBLIC_API_URL` =
   Backend-Render-URL aus §6.1.
3. **Landingpage:** Root-Directory `landingpage/`. Branch
   `deploy/staging-preview-mock`. Keine Backend-ENVs noetig (statisch).
4. Deploy starten, URLs in §3 eintragen.

### 6.3 Health-Checks nach Deploy

Manuell:

```bash
curl -i https://<backend-url>/health
# Erwartung: HTTP/2 200, Body { "status": "ok", ... }
```

```bash
curl -s https://<backend-url>/api/admin/system/api-readiness \
  -H "Authorization: Bearer <admin-jwt>"
# Erwartung: providerSimulation.fuel.status="mock_ready", liveVerified=false
```

### 6.4 Self-Service-Verifier (PR #17)

Statt jeden Curl per Hand zu kopieren, gibt es das Skript
`scripts/verify-staging-preview.sh`. Es macht alle Health-/Ready-/Mock-
Stations-Checks, optional einen PostGIS-Smoke, und schreibt zwei
Artefakte:

- `docs/smoke-results/YYYY-MM-DD-staging-preview-api.json` — maschinell
  auswertbarer Bericht (Schema in `docs/smoke-results/README.md`).
- `docs/smoke-results/YYYY-MM-DD-staging-preview-docs64-snippet.md` —
  Markdown-Block, der direkt in §3 dieses Dokuments eingeklebt werden kann.

**Aufruf nach dem Render-/Vercel-Deploy:**

```bash
export BACKEND_URL=https://tanklotse-backend-staging.onrender.com
export ADMIN_URL=https://tanklotse-admin-preview.vercel.app
export LANDING_URL=https://tanklotse-preview.vercel.app
# optional fuer PostGIS-Smoke:
export DATABASE_URL=postgresql://<render-host>/<db>?sslmode=require

bash scripts/verify-staging-preview.sh
```

**Exit-Codes:**

| Code | Bedeutung |
|---|---|
| 0 | alle Pflicht-Checks bestanden, PostGIS bestanden oder bewusst geskippt |
| 1 | mindestens ein Pflicht-Check rot — Plattform-Logs pruefen, ENV-Vars vergleichen, Skript erneut laufen |
| 2 | `BACKEND_URL` nicht gesetzt — Pflicht-ENV |

**Sicherheits-Garantie:**
- Das Skript bekommt **keine** API-Keys uebergeben — es prueft nur Endpoints, die ohne Auth oeffentlich sind, plus die Mock-Stationen-Suche.
- `DATABASE_URL` wird vor jeder Log-Ausgabe redactet (User/Passwort raus).
- Die JSON-Artefakte enthalten `secretsRedacted: true` als explizite Selbst-Zertifizierung; sie sollen vor dem Commit kurz visuell gepruft werden.

**Pflicht nach erfolgreichem Lauf:**

1. JSON-Artefakt + Snippet committen (z.B. `docs/smoke-results/2026-06-15-staging-preview-api.json`).
2. Snippet-Block in §3 dieses Dokuments einkleben + Status-Spalte fuellen.
3. In `docs/65 §1` und `docs/67 §5` die zugehoerigen Zeilen auf
   „live (Mock-Modus)" / 🟢 setzen.

## 7. API-Readiness-Sicht

`/api/admin/system/api-readiness` ist nur fuer Rollen
`SUPERADMIN | DEVELOPER` erreichbar (Helmet + JWT). Im Mock-Modus
liefert es:

```jsonc
{
  "fuel":     { "mode": "mock", "status": "mock_ready", "liveVerified": false, ... },
  "routing":  { "mode": "mock", "status": "mock_ready", "liveVerified": false, ... },
  "geocoder": { "mode": "mock", "status": "mock_ready", "liveVerified": false },
  "providerSimulation": {
    "anyMockActive": true,
    "anyContractActive": false,
    "hasLiveVerifiedProviders": false,
    "hasOnlyMockOrContractProviders": true,
    "providers": [...]
  }
}
```

Keine Secret-Werte — nur Variablen-Namen + Status.

## 8. Mock-Daten

Vier reproduzierbare Koeln-Stationen:

| ID | Lage | Lat / Lng | Diesel | E5 | E10 | Status |
|---|---|---|---:|---:|---:|---|
| `mock-rodenkirchen-1` | Hauptstrasse 1 | 50.8913 / 6.9946 | 1.659 | 1.789 | 1.729 | open |
| `mock-kalk-1` | Kalker Hauptstrasse 12 | 50.9386 / 7.0047 | 1.629 | 1.769 | 1.709 | open |
| `mock-marsdorf-1` | Toyota-Allee 3 | 50.9244 / 6.8498 | 1.669 | 1.799 | 1.739 | open |
| `mock-innenstadt-1` | Hohenzollernring 50 | 50.9413 / 6.9583 | 1.689 | 1.819 | 1.759 | closed |

## 9. Bekannte Einschraenkungen

- **Push-Notifications nicht testbar** — `PUSH_PROVIDER_MODE=disabled`.
- **Login nicht testbar** — `AUTH_PROVIDER_MODE=disabled`.
- **Subscriptions nicht testbar** — `PAYMENT_PROVIDER_MODE=disabled`.
- **Routing-Distanzen sind Schaetzungen** — `MockRouting` liefert
  `precise=false`, `reason=mock_provider`, `source=mock_fixture`.
- **Mobile-App-Web-Build nicht deployed** — Folge-PR (siehe §10).
- **Datenschutzerklaerung im Mock-Modus** — entsprechend angepasst,
  da kein echter Datenfluss zu Tankerkoenig/Mapbox/Nominatim.

## 10. Was noch nicht live ist

Bewusst NICHT Teil dieses PRs:

- Echter Tankerkoenig-Live-Test (`docs/63 §2`).
- Echter Mapbox-Live-Test (`docs/63 §3`).
- Firebase-Push-Verifikation.
- Apple/Google-Login-Verifikation.
- Stripe/IAP-Verifikation.
- App-Store-/TestFlight-Submission.
- Flutter-Web-Hosting (offen — entweder Vercel oder Firebase-Hosting,
  in eigenem Folge-PR).
- Pen-Test extern.

## 11. Naechster Schritt

Nach gruener Staging-Preview:

| Weg | Folge-PR |
|---|---|
| **A** Mit echten Keys live schalten | „PR #15 — Switch providers to live and run real smoke tests" |
| **B** Frontend ausbauen, Mocks weiter nutzen | „PR #15 — Admin Provider Readiness UI + Simulation Banner" oder „PR #15 — Flutter Web Preview Hosting" |

Empfehlung: erst **Weg B** (Sichtbarkeit + UI), dann **Weg A** (Live-
Verifikation), wenn die echten Keys vorliegen.

## 12. Verweise

- `docs/56-staging-live-api-test-report.md` — Statussprache
- `docs/58-beta-launch-readiness-matrix.md` — Beta-Status
- `docs/61-provider-simulation-and-adapter-readiness.md` — Provider-Modi
- `docs/62-provider-simulation-post-merge-verification.md` — PR #11/#12/#13 Stand
- `docs/63-api-key-onboarding-runbook.md` — Wenn echte Keys da sind
- `.env.staging-preview.example` — ENV-Vorlage
- `render.yaml`, `railway.json` — Backend-Deploy-Config
- `admin-dashboard/vercel.json`, `landingpage/vercel.json` — Frontend-Deploy-Config
