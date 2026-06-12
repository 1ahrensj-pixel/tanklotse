# TankLotse — Live-Deployment (Produktion)

**Plattform:** Render (Frankfurt) · **Status:** 🟢 LIVE seit Erst-Launch

## Live-URLs

| Service | URL |
|---------|-----|
| Landingpage | https://tanklotse-landing.onrender.com |
| Admin-Dashboard | https://tanklotse-admin.onrender.com/login |
| Backend / API | https://tanklotse-backend.onrender.com |
| Health | https://tanklotse-backend.onrender.com/health |

## Render-Ressourcen

| Ressource | Render-ID | Plan |
|-----------|-----------|------|
| Backend (Web) | srv-d8lp3ogjs32c73b38sd0 | starter |
| Landingpage (Web) | srv-d8lp3p3eo5us7386vhog | starter |
| Admin (Web) | srv-d8lp3pkvikkc73bnijv0 | starter |
| Postgres+PostGIS | dpg-d8lp3nreo5us7386vg40-a | basic_256mb |
| Redis/KeyValue | red-d8lp3o4m0tmc73am41sg | free |

## Provider-Konfiguration (live)

- **Spritpreise:** Tankerkönig (`FUEL_PROVIDER_MODE=live`) — echte MTS-K-Daten
- **Geocoding:** Nominatim (`GEOCODER_PROVIDER_MODE=live`, kostenlos)
- **Mail:** Resend (`smtp.resend.com:465`, Absender `onboarding@resend.dev`)
- **Routing/Push/Payments:** deaktiviert (Phase 2)

## Secrets

Liegen ausschließlich als Render-Env-Variablen (sync:false) — **nicht im Repo**.
- Admin-Login: `info@ahrens-re.de` (Passwort beim Seed generiert, im Render-Panel + Chat-Übergabe)
- JWT-/Cookie-Secrets: zufällig generiert beim Deploy (`audit/render-deploy-state.json`, gitignored)

## DB-Anbindung — wichtige Lessons

Per Render-API einzeln angelegte Services werden **nicht** automatisch ins
private Netz mit DB/Redis verlinkt (anders als beim Blueprint-Deploy). Daher:
- `DATABASE_URL` = **externe** Postgres-URL + `?sslmode=require`
- `REDIS_URL` = **externe** `rediss://`-URL (TLS)
- IP-Allowlist beider auf `0.0.0.0/0` (SSL/TLS-verschlüsselt)
- Prisma-Engine: `binaryTargets += linux-musl-openssl-3.0.x` (Alpine-Container)

## Deploy-Workflow

Künftige Code-Pushes deployen NICHT automatisch (öffentliches Repo ohne
GitHub-App-Webhook). Manueller Trigger:
```
POST https://api.render.com/v1/services/srv-d8lp3ogjs32c73b38sd0/deploys
```
Oder Repo einmalig im Render-Dashboard verbinden für echte Auto-Webhooks.

## Offene Punkte (Post-Launch)

- [ ] **HRB-Nummer + Registergericht** ins Impressum (`landingpage/lib/legal-identity.ts` → `registerInfo`) — GmbH-Pflicht (§5 DDG)
- [ ] **Google-Maps-Key** in Cloud Console nach Paketname/Bundle-ID beschränken (App-Phase)
- [ ] **Paid-Plan** erwägen: Free-Web-Services schlafen nach 15 Min ein (Cold-Start ~30-60s)
- [ ] **Demo-Seed-Daten** (München-Teststationen, demo@/user2@) bei Bedarf aus Prod-DB entfernen
- [ ] **Sentry/Uptime-Monitoring** aktivieren
