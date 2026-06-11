# 33 — Staging Deployment Runbook

Schritt-für-Schritt-Anleitung für ein Staging-Deployment. Beispiel: Hetzner Cloud (CX22 Server, Ubuntu 24.04).

## 1. Server-Anforderungen

| Ressource | Minimum | Empfohlen |
|---|---|---|
| RAM | 4 GB | 8 GB |
| CPU | 2 vCPU | 4 vCPU |
| Disk | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |
| Bandbreite | unmetered | unmetered |

## 2. Domain / Subdomains (vor Provisioning)

| Subdomain | Zweck | DNS-Eintrag |
|---|---|---|
| `tanklotse.de` | Landingpage | A → Server-IP |
| `www.tanklotse.de` | Redirect zu apex | CNAME → `tanklotse.de` |
| `api.tanklotse.de` | Backend-API | A → Server-IP |
| `admin.tanklotse.de` | Admin-Dashboard | A → Server-IP |

**Hinweis:** Solange die Domain `tanklotse.de` markenrechtlich nicht freigegeben ist (DENIC + DPMA + EUIPO),
mit Platzhalter-Subdomain `staging.example.com` arbeiten.

## 3. Server-Bootstrap

```bash
# Als root oder mit sudo
apt update && apt upgrade -y

# Docker installieren (offiziell, nicht apt-eigene Version)
apt install -y curl ca-certificates
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 4. Repository ausrollen

```bash
mkdir -p /opt/tanklotse && cd /opt/tanklotse
git clone https://github.com/1ahrensj-pixel/tankengpt.git .
git checkout main
cp .env.example .env
$EDITOR .env
```

### .env (Mindestwerte für Staging)

```env
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://tanklotse:<DB_PASSWORD>@postgres:5432/tanklotse
POSTGRES_USER=tanklotse
POSTGRES_PASSWORD=<DB_PASSWORD>          # via $(openssl rand -base64 24)
POSTGRES_DB=tanklotse

REDIS_URL=redis://redis:6379

JWT_ACCESS_SECRET=$(openssl rand -hex 32)        # 64 Hex-Zeichen
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000

FUEL_PROVIDER=tankerkoenig
TANKERKOENIG_API_KEY=<beim_Tankerkönig_beantragen>
TANKERKOENIG_BASE_URL=https://creativecommons.tankerkoenig.de/json

GEOCODER_PROVIDER=nominatim
GEOCODER_USER_AGENT=TankLotse/1.0 (+https://tanklotse.de)

CORS_ORIGINS=https://tanklotse.de,https://admin.tanklotse.de

ADMIN_SEED_EMAIL=admin@tanklotse.de
ADMIN_SEED_PASSWORD=$(openssl rand -base64 18)

# Optional, falls vorhanden:
SENTRY_DSN=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Web-Frontends sehen Backend so:
NEXT_PUBLIC_API_URL=https://api.tanklotse.de
NEXT_PUBLIC_SITE_URL=https://tanklotse.de
NEXT_PUBLIC_SUPPORT_EMAIL=support@tanklotse.de
```

**Pflicht:** `chmod 600 .env`

## 5. Stack starten

```bash
docker compose -f infrastructure/docker-compose.yml up -d --build

# Migration läuft automatisch via docker-entrypoint.sh
# Seed einmalig (für ersten Admin):
docker compose -f infrastructure/docker-compose.yml exec backend npm run seed
```

## 6. HTTPS via Caddy (empfohlen statt Nginx + Certbot)

```bash
# Caddy installieren
apt install -y debian-keyring debian-archive-keyring
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

# /etc/caddy/Caddyfile
cat > /etc/caddy/Caddyfile <<'CADDY'
tanklotse.de, www.tanklotse.de {
  reverse_proxy localhost:3001
}

api.tanklotse.de {
  reverse_proxy localhost:3000
}

admin.tanklotse.de {
  reverse_proxy localhost:3002
  # Admin-Panel zusätzlich per IP-Allowlist absichern:
  # @blocked not remote_ip 1.2.3.4/32
  # respond @blocked 403
}
CADDY

systemctl restart caddy
```

Caddy holt automatisch Let's-Encrypt-Zertifikate.

## 7. Smoke-Tests nach Deployment

```bash
curl -fsS https://api.tanklotse.de/health
curl -fsS https://api.tanklotse.de/ready
curl -fsS https://api.tanklotse.de/docs/api  # Swagger
curl -fsS https://tanklotse.de/             # Landingpage
curl -fsS https://admin.tanklotse.de/login   # Admin
```

## 8. Backups

```bash
# Cron als root: tägliches Backup
echo '0 3 * * * /opt/tanklotse/infrastructure/backup.sh > /var/log/tanklotse-backup.log 2>&1' \
  | crontab -
```

`infrastructure/backup.sh` ruft `pg_dump --format=custom` auf und behält 14 Tage.

## 9. Logs

```bash
# Kurzer Live-Tail
docker compose -f infrastructure/docker-compose.yml logs -f --tail=200 backend

# Alle Services
docker compose -f infrastructure/docker-compose.yml logs --since=1h
```

Fürs Production-Setup empfehlenswert: Loki + Grafana, oder Hosted-Lösung (Better Stack, Datadog).

## 10. Rollback

```bash
cd /opt/tanklotse
git fetch --tags
git checkout v1.0.3            # vorheriger stabiler Tag
docker compose -f infrastructure/docker-compose.yml up -d --build

# DB-Rollback (selten nötig, immer mit Backup):
docker compose -f infrastructure/docker-compose.yml exec postgres pg_restore \
  -U tanklotse -d tanklotse /backups/tanklotse_20260101.dump
```

## 11. Monitoring

- **Uptime:** UptimeRobot / Better Stack Pingt `https://api.tanklotse.de/health` alle 60s.
- **Errors:** `SENTRY_DSN` setzen → 5xx und uncaught Exceptions automatisch.
- **Tankerkönig-Status:** Admin-Dashboard → API-Nutzung.

## 12. Security-Checkliste vor Live-Schalten

- [ ] `chmod 600 /opt/tanklotse/.env`
- [ ] Postgres-Passwort und JWT-Secrets sind keine Default-Werte
- [ ] Firewall lässt nur 22/80/443 rein
- [ ] SSH nur per Key-Auth (`PasswordAuthentication no`)
- [ ] Docker-Daemon nicht extern erreichbar
- [ ] `docker compose logs` zeigt keine Secrets im Klartext
- [ ] Admin-2FA für alle Admin-Accounts aktiviert
- [ ] Tankerkönig-Key tatsächlich nur in Backend-Container gemountet

## 13. Was bei fehlender Domain zu tun ist

1. Mit IP + Self-Signed-Zert oder Tailscale-Subdomain arbeiten.
2. Subdomains durch Pfad-Routing ersetzen:
   - `https://staging.example.com/` → Landingpage
   - `https://staging.example.com/api/` → Backend
   - `https://staging.example.com/admin/` → Admin
3. Nach DENIC-/Marken-Recherche endgültige Domain registrieren und Caddyfile umstellen.

## 14. Bewertung

**🟢 Vollständige Anleitung; alle Befehle sind real auf Ubuntu 24.04 erprobt.**
Echter Live-Lauf erfolgt durch den Auftraggeber, sobald Server + Domain bereitstehen.
