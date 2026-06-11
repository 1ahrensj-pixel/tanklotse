# 08 – Deployment

## Empfohlene Topologie (klein → mittel)

- 1 Server (8 GB RAM reichen für Start) bei Hetzner Cloud / AWS Lightsail / Fly.io
- Postgres + PostGIS managed (Hetzner Postgres oder Supabase) ODER auf demselben Server (Backup-Strategie!)
- Redis managed ODER auf demselben Server
- Nginx als Reverse-Proxy mit Let's Encrypt

## Schritt-für-Schritt (Self-Hosted, Docker)

```bash
# Server vorbereiten (Beispiel Ubuntu 24.04)
apt update && apt install -y docker.io docker-compose-plugin
mkdir -p /opt/tanklotse && cd /opt/tanklotse
git clone <repo-url> .
cp .env.example .env
$EDITOR .env

# HTTPS einrichten (separat zu Compose):
#   certbot --nginx -d tanklotse.de -d www.tanklotse.de -d admin.tanklotse.de
# oder Caddy als TLS-Proxy davor.

docker compose -f infrastructure/docker-compose.yml up -d --build
docker compose -f infrastructure/docker-compose.yml exec backend npx prisma migrate deploy
docker compose -f infrastructure/docker-compose.yml exec backend npm run seed
```

## Backups

`infrastructure/backup.sh` erstellt einen täglichen `pg_dump`-Snapshot.
Cron-Eintrag siehe Skript-Header. 14 Tage Retention. Persistente Volumes:
`postgres-data`, `redis-data`.

## Monitoring & Error-Tracking

- `SENTRY_DSN` setzen → 5xx und uncaught Exceptions landen automatisch dort.
- Health-Check: `GET /health` und `GET /ready` (für Loadbalancer).
- Tankerkönig-Monitoring: Admin-Dashboard → API-Nutzung / Fehler.

## Rollback

Frühere Version per Git-Tag deployen:

```bash
git fetch --tags
git checkout v1.0.3
docker compose -f infrastructure/docker-compose.yml up -d --build
docker compose -f infrastructure/docker-compose.yml exec backend npx prisma migrate deploy
```

Datenbank-Rollback nur über Backup-Restore (`pg_restore`).
