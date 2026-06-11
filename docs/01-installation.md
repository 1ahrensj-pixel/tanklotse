# 01 – Installation

Diese Anleitung richtet sich an Entwicklerinnen und Entwickler, die TankLotse lokal aufsetzen oder erstmals
auf einem Server in Betrieb nehmen wollen.

## Voraussetzungen

- Docker 24+ und Docker Compose v2
- Node.js 20 LTS
- Flutter 3.24+ (für Mobile-Entwicklung)
- Git
- Postgres 16 mit PostGIS (in Compose mitgeliefert)
- Redis 7 (in Compose mitgeliefert)
- Tankerkönig-API-Key (kostenlos beantragbar unter <https://creativecommons.tankerkoenig.de/>)

## 1. Repository clonen und `.env` anlegen

```bash
git clone <repo-url>
cd tankengpt
cp .env.example .env
$EDITOR .env
```

Pflicht-Variablen, ohne die nichts startet:

| Variable | Bedeutung |
|---|---|
| `DATABASE_URL` | Postgres-Connection-String |
| `REDIS_URL` | Redis-Verbindung |
| `JWT_ACCESS_SECRET` | min. 32 Zeichen |
| `JWT_REFRESH_SECRET` | min. 32 Zeichen |
| `TANKERKOENIG_API_KEY` | wenn `FUEL_PROVIDER=tankerkoenig` |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | für den ersten Admin (≥12 Zeichen) |

## 2. Stack starten (Docker)

```bash
docker compose -f infrastructure/docker-compose.yml up -d --build
```

Das startet Postgres, Redis, Backend, Landingpage, Admin und Nginx als Reverse-Proxy.

## 3. Migrationen + Seed (im Backend-Container)

```bash
docker compose -f infrastructure/docker-compose.yml exec backend npx prisma migrate deploy
docker compose -f infrastructure/docker-compose.yml exec backend npm run seed
```

## 4. Smoke-Tests

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/stations/search?lat=50.93&lng=6.95&radius=5&fuelType=DIESEL"
```

Wenn der zweite Aufruf eine Liste echter Tankstellen zurückgibt, läuft Tankerkönig korrekt.

## 5. Mobile-App lokal

```bash
cd mobile-app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000   # Android-Emulator
flutter run --dart-define=API_BASE_URL=http://localhost:3000  # iOS-Simulator
```

## 6. Was nach Session-Ende noch manuell zu tun ist

Siehe `docs/09-store-release.md` und `docs/08-deployment.md`.
