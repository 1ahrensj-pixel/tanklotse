#!/usr/bin/env ts-node
/**
 * PR #15 Befund 6 — Render/PostGIS Smoke.
 *
 * Pruefung, ob die `postgis`-Extension in der Ziel-Datenbank verfuegbar
 * und aktiviert ist. Pflicht, weil `prisma/schema.prisma`
 * `extensions = [postgis]` voraussetzt — ohne Extension scheitern die
 * Migrationen still beim ersten `CREATE EXTENSION`-Versuch.
 *
 * Aufruf:
 *
 *   DATABASE_URL=postgresql://... npm run smoke:postgis
 *
 * Exit-Codes:
 *   0  PostGIS verfuegbar + Geo-Funktion erfolgreich
 *   1  PostGIS-Extension fehlt oder Verbindung fehlgeschlagen
 *   2  Verbindung ok, aber `postgis_version()` lieferte kein Ergebnis
 *
 * Sicherheits-Garantie: die DATABASE_URL wird nie roh ausgegeben — nur
 * Host und Datenbankname werden geloggt.
 */
import { PrismaClient } from '@prisma/client';

function redactDbUrl(url: string): string {
  try {
    const u = new URL(url);
    const db = (u.pathname || '').replace(/^\//, '') || '<no-db>';
    return `${u.protocol}//${u.hostname}:${u.port || '5432'}/${db}`;
  } catch {
    return '<unparseable>';
  }
}

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[smoke-postgis] DATABASE_URL ist nicht gesetzt.');
    return 1;
  }

  console.log(`[smoke-postgis] Verbinde zu ${redactDbUrl(databaseUrl)} ...`);

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
  } catch (e) {
    console.error(`[smoke-postgis] Verbindung fehlgeschlagen: ${(e as Error).message}`);
    await prisma.$disconnect().catch(() => undefined);
    return 1;
  }

  try {
    // 1. Extension-Check.
    const extRes = await prisma.$queryRaw<Array<{ extname: string; extversion: string }>>`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis'
    `;
    if (extRes.length === 0) {
      console.error(
        "[smoke-postgis] Extension 'postgis' ist nicht installiert. " +
          'Auf Render: Postgres-Service-Settings → Extensions → postgis aktivieren ' +
          '(oder per Migration `CREATE EXTENSION IF NOT EXISTS postgis;`).',
      );
      return 1;
    }
    console.log(`[smoke-postgis] postgis-Extension installiert: v${extRes[0].extversion} ✅`);

    // 2. postgis_version() ausfuehrbar.
    const verRes = await prisma.$queryRaw<Array<{ postgis_version: string }>>`
      SELECT postgis_version() AS postgis_version
    `;
    if (verRes.length === 0 || !verRes[0].postgis_version) {
      console.error('[smoke-postgis] postgis_version() lieferte kein Ergebnis.');
      return 2;
    }
    console.log(`[smoke-postgis] postgis_version() = ${verRes[0].postgis_version} ✅`);

    // 3. Sanity-Check Geodistanz: Koeln Innenstadt <-> Koeln Rodenkirchen.
    const distRes = await prisma.$queryRaw<Array<{ km: number | string }>>`
      SELECT ROUND(
        (ST_DistanceSphere(
          ST_MakePoint(6.9583, 50.9413),
          ST_MakePoint(6.9946, 50.8913)
        ) / 1000.0)::numeric, 2
      ) AS km
    `;
    const km = distRes[0]?.km;
    if (km == null) {
      console.error('[smoke-postgis] ST_DistanceSphere lieferte kein Ergebnis.');
      return 2;
    }
    console.log(`[smoke-postgis] ST_DistanceSphere(Koeln-Innenstadt → Rodenkirchen) = ${km} km ✅`);
  } finally {
    await prisma.$disconnect();
  }

  console.log('[smoke-postgis] Alle Checks bestanden — PostGIS ist live ready.');
  return 0;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error(`[smoke-postgis] Unerwarteter Fehler: ${(e as Error).message}`);
      process.exit(1);
    });
}
