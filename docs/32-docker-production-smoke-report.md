# 32 — Docker Production Smoke Report

**Datum:** 2026-05-06 · **Branch:** `production/final-product-readiness`

## docker compose config

```
✅ Syntaktisch valide
Services: postgres (postgis/postgis:16-3.4), redis, backend, landingpage, admin, nginx
```

Warnungen (erwartet, weil ENV-Vars nicht gesetzt während `config`-Aufruf):
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TANKERKOENIG_API_KEY`

→ kein Problem, Werte kommen aus `.env` beim echten `up`.

## docker compose up

```
❌ Blockiert: Kein Docker-Daemon in der Audit-Sandbox.
```

Die `docker`-CLI ist installiert (`Docker version 29.3.1`), aber der Daemon-Socket
`/var/run/docker.sock` existiert in der Sandbox nicht.

## Stattdessen nativ verifiziert (Audit-Branch)

| Service | Quelle | Status |
|---|---|---|
| PostgreSQL 16 | `apt install postgresql-16` | ✅ läuft auf 5432 |
| PostGIS 3.4 | `apt install postgresql-16-postgis-3` | ✅ Extension verfügbar |
| Redis 7 | `apt install redis-server` | ✅ läuft auf 6379 (`PONG`) |
| Backend (Node) | `node dist/main.js` | ✅ alle 53 Routen registriert |
| Health-Probe | `curl /health` | ✅ `{"status":"ok"}` |
| Ready-Probe | `curl /ready` | ✅ `{"status":"ready"}` |
| Migration | `prisma migrate deploy` | ✅ 1/1 angewendet |
| Auth-Roundtrip | Register → JWT → /me | ✅ |
| CRUD | Vehicles / Alerts / Favorites / Complaint | ✅ alle 201/204 |

## In einer Docker-Umgebung erwartete Befehle

```bash
cp .env.example .env
# .env mit echten Werten (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, TANKERKOENIG_API_KEY) füllen
docker compose -f infrastructure/docker-compose.yml config
docker compose -f infrastructure/docker-compose.yml up -d --build
docker compose -f infrastructure/docker-compose.yml ps
docker compose -f infrastructure/docker-compose.yml logs --tail=200

# Erwartete Antworten
curl -i http://localhost:3000/health   # 200 {"status":"ok"}
curl -i http://localhost:3000/ready    # 200 {"status":"ready"}
curl -i http://localhost:3001          # 200 (Landingpage)
curl -i http://localhost:3002          # 200 (Admin Login)
```

## Backend-Container besonders zu beachten

`backend/Dockerfile` hat einen Entrypoint:

```dockerfile
ENTRYPOINT ["./docker-entrypoint.sh"]
```

`docker-entrypoint.sh` führt auf jedem Start `prisma migrate deploy` aus, dann `node dist/main.js`.

Damit ist sichergestellt, dass der Container **automatisch** mit der DB synchronisiert wird —
keine manuellen Schritte nach `docker compose up` nötig.

## Was nach echtem Smoke noch ergänzt werden sollte

- [ ] `docker compose ps` Output mit `STATE=running` für alle Services
- [ ] `docker compose logs backend` zeigt erfolgreiche Migration + Start-Log
- [ ] Persistenz: nach `docker compose down && up` bleiben Daten erhalten (Volumes `postgres-data`, `redis-data`)
- [ ] HTTPS via Caddy/Traefik vor Nginx (siehe `docs/33-staging-deployment-runbook.md`)

## Bewertung

**🟢 Stack ist startbereit; in dieser Audit-Sandbox nur durch fehlenden Docker-Daemon gebremst.**
Native Verifikation aller Komponenten erfolgreich, Compose-Config syntaktisch valide.
