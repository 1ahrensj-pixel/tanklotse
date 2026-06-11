#!/bin/sh
set -e

echo "[entrypoint] Pruefe Datenbank-Migrationen..."
npx prisma migrate deploy

echo "[entrypoint] Starte Backend..."
exec node dist/main.js
