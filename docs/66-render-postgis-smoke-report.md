# 66 — Render PostGIS Smoke Report

**Datum:** 2026-05-07 · **PR:** #15 · **Audit-Bezug:** §2 Befund 6.

> Ziel: bevor das Backend auf Render deployed wird, muss feststehen,
> dass die `postgis`-Extension in der Render-managed-PostgreSQL-Instanz
> verfuegbar und korrekt aktiviert ist. Andernfalls scheitert Prisma-
> Migrate beim ersten `CREATE EXTENSION`-Versuch und der Container
> startet nicht.

## 1. Hintergrund

`prisma/schema.prisma` definiert:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}
```

Lokal lauft `postgis/postgis:16-3.4` im `infrastructure/docker-compose.yml`,
in dem die Extension automatisch verfuegbar ist. Render-managed-Postgres
unterstuetzt PostGIS, aber die Extension muss im Service-Panel explizit
aktiviert werden ODER per `CREATE EXTENSION IF NOT EXISTS postgis;` in
einer Migration.

## 2. Smoke-Skript

Datei: `backend/scripts/smoke-postgis.ts`. Aufruf:

```bash
DATABASE_URL=postgresql://<render-host>/<db>?sslmode=require \
  npm run smoke:postgis
```

Skript fuehrt drei Checks durch:

1. `SELECT extname, extversion FROM pg_extension WHERE extname='postgis'`
   → liefert die installierte Version oder schlaegt mit Exit 1 fehl.
2. `SELECT postgis_version()` → liefert die Funktions-Version
   (Exit 2 bei leerer Antwort).
3. `SELECT ST_DistanceSphere(MakePoint(Koeln-Innenstadt), MakePoint(Rodenkirchen)) / 1000`
   → Sanity-Check, ob die Geo-Funktionen wirklich rechnen.

Exit-Codes:

| Code | Bedeutung |
|---|---|
| 0 | PostGIS installiert + Funktionen ausfuehrbar — live ready |
| 1 | Extension fehlt oder Verbindung gescheitert |
| 2 | Extension installiert, aber Funktionen liefern keine Werte |

Sicherheitsgarantie: das Skript redactet die `DATABASE_URL` — User-/
Passwort-Anteil erscheint nie in der Konsolen-Ausgabe.

## 3. Erwartete Ausgabe (lokales Compose)

```
[smoke-postgis] Verbinde zu postgresql://localhost:5432/tanklotse ...
[smoke-postgis] postgis-Extension installiert: v3.4.x ✅
[smoke-postgis] postgis_version() = 3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1 ✅
[smoke-postgis] ST_DistanceSphere(Koeln-Innenstadt → Rodenkirchen) = 6.05 km ✅
[smoke-postgis] Alle Checks bestanden — PostGIS ist live ready.
```

## 4. Render-Lauf — bisheriges Ergebnis

| Feld | Wert |
|---|---:|
| **Bisheriger Lauf** | nicht ausgefuehrt — kein Render-Deployment in dieser Code-Session |
| **Erwartet bei ausfuehrlichem Lauf** | Exit 0, Versions-String aehnlich „3.x USE_GEOS=1" |

> **Wahrheits-Hinweis (vgl. `docs/65`):** Solange dieser Smoke nicht gegen
> die echte Render-Datenbank gelaufen ist, gilt: **Render-PostGIS ist
> nicht live verifiziert.** Diese Datei ist kein Beleg fuer „getestet"
> — sie ist die Anleitung + das Skript dafuer.

## 5. Nach erfolgreichem Lauf

1. Output redigieren (keine Zugangsdaten).
2. In `docs/59-live-smoke-result-<datum>.md` festhalten.
3. In `docs/65 §1` Zeile „Render-PostGIS-Extension" auf `✅` setzen.
4. In `docs/58 §1.4` Zeile „Render PostGIS" auf `🟢` setzen.

## 6. Was das Skript NICHT testet

- Keine Schreib-Performance.
- Keine geographischen Indices (`GIST`).
- Keine Migrations-Idempotenz (Prisma-Migrate-Sache).
- Kein Connection-Pooling (Prisma-Sache).

Das ist Absicht — die drei Checks sind genau die minimale Wahrheit, die
fuer „PostGIS-Funktionen sind aufrufbar" reicht.

## 7. Verweise

- `backend/scripts/smoke-postgis.ts`
- `backend/prisma/schema.prisma`
- `infrastructure/docker-compose.yml` (lokales `postgis/postgis:16-3.4`)
- `render.yaml` (managed Postgres-Service-Definition)
- `docs/65-truth-status-reconciliation.md`
