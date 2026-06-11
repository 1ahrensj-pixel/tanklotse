#!/usr/bin/env bash
# Tägliches Datenbank-Backup. Anbinden über Cron:
#   0 3 * * * /opt/tanklotse/backup.sh >> /var/log/tanklotse-backup.log 2>&1
set -euo pipefail

TS=$(date +"%Y%m%d_%H%M%S")
OUT_DIR="${BACKUP_DIR:-/var/backups/tanklotse}"
mkdir -p "$OUT_DIR"

PGURL="${DATABASE_URL:?DATABASE_URL muss gesetzt sein}"
pg_dump --format=custom --file "$OUT_DIR/tanklotse_${TS}.dump" "$PGURL"

# 14 Tage Aufbewahrung
find "$OUT_DIR" -name 'tanklotse_*.dump' -mtime +14 -delete
echo "Backup geschrieben: $OUT_DIR/tanklotse_${TS}.dump"
