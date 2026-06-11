# Datenbank

Das produktive Datenbank-Schema lebt im **Backend-Modul**:

- **Prisma-Schema:** [`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)
- **Migrationen:** [`../backend/prisma/migrations/`](../backend/prisma/migrations/)
- **Seed-Skript:** [`../backend/prisma/seed.ts`](../backend/prisma/seed.ts)
- **Beschreibung:** [`../docs/04-database.md`](../docs/04-database.md)

Diese Trennung hält das Backend in sich abgeschlossen (eigene `npm install`, eigenes Dockerfile)
und vermeidet doppelte Pflege.

## Schnellstart

```bash
cd ../backend
DATABASE_URL='postgresql://tanklotse:tanklotse@localhost:5432/tanklotse' \
  npx prisma migrate deploy
ADMIN_SEED_EMAIL=admin@tanklotse.local \
ADMIN_SEED_PASSWORD='change-me-strong-12+' \
DATABASE_URL='postgresql://tanklotse:tanklotse@localhost:5432/tanklotse' \
  npm run seed
```

## Stack

- PostgreSQL 16
- PostGIS 3.4 (`geography(Point, 4326)` für Tankstellen-Standorte, GIST-Index)
- Auto-Trigger pflegt `location` aus `lat`/`lng`
- Prisma 5.22 als ORM
