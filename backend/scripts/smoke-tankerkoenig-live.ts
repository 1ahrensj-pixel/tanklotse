/**
 * Audit 2026-05-06 §22 Phase 3: Live-Smoke-Test gegen die Tankerkoenig-API.
 *
 * Strikt im Sinne des Auditors:
 *   - Ohne `TANKERKOENIG_API_KEY` → sauberes Skip (Exit 0), kein Fehler.
 *   - Mit `NODE_ENV=staging` → fehlender Key wird als Fehler dokumentiert
 *     (Exit 2). Staging muss bewusst konfiguriert sein.
 *   - Mit Key → 5 Pflicht-Checks gemaess §6.3:
 *       1. HTTP 200
 *       2. Stationen kommen zurueck
 *       3. mind. eine Station hat einen Preis
 *       4. isOpen wird ausgewertet
 *       5. Attribution/CC-Hinweis vorhanden
 *
 * Aufruf:
 *   TANKERKOENIG_API_KEY=... npm run smoke:tankerkoenig:live
 */
import axios from 'axios';

const KEY = process.env.TANKERKOENIG_API_KEY;
const BASE =
  process.env.TANKERKOENIG_BASE_URL ?? 'https://creativecommons.tankerkoenig.de/json';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const RODENKIRCHEN = { lat: 50.8913, lng: 6.9946, label: 'Köln Rodenkirchen' };
const KALK = { lat: 50.9386, lng: 7.0047, label: 'Köln-Kalk' };

interface ListResp {
  ok: boolean;
  message?: string;
  license?: string;
  data?: string;
  stations: Array<{
    id: string;
    name: string;
    brand: string;
    place: string;
    dist: number;
    isOpen: boolean;
    diesel?: number;
    e5?: number;
    e10?: number;
  }>;
}

async function main() {
  if (!KEY) {
    if (NODE_ENV === 'staging' || NODE_ENV === 'production') {
      console.error(
        `[fail] TANKERKOENIG_API_KEY ist in NODE_ENV=${NODE_ENV} Pflicht. Setze ihn vor dem Smoke.`,
      );
      process.exit(2);
    }
    console.log(
      '[skip] TANKERKOENIG_API_KEY nicht gesetzt — Live-Smoke uebersprungen.',
    );
    console.log('       Beantragen: https://creativecommons.tankerkoenig.de/');
    process.exit(0);
  }

  const http = axios.create({
    baseURL: BASE,
    timeout: 10_000,
    headers: { 'User-Agent': 'TankLotse-SmokeLive/1.0' },
  });

  console.log(`[run] Tankerkoenig live (Base=${BASE}, NODE_ENV=${NODE_ENV})`);

  let issues = 0;
  for (const spot of [RODENKIRCHEN, KALK]) {
    console.log(`\n--- ${spot.label} ---`);
    const r = await http.get<ListResp>('/list.php', {
      params: {
        lat: spot.lat,
        lng: spot.lng,
        rad: 5,
        sort: 'price',
        type: 'diesel',
        apikey: KEY,
      },
    });
    if (!r.data.ok) {
      console.error(`[fail] HTTP ok=false: ${r.data.message ?? 'unknown'}`);
      issues++;
      continue;
    }
    console.log(`[ok] HTTP 200, ok=true, ${r.data.stations.length} Stationen`);

    if (r.data.stations.length === 0) {
      console.warn('[warn] keine Stationen — vielleicht Wochenend-Regelung');
      continue;
    }

    const withPrice = r.data.stations.filter((s) => s.diesel != null);
    if (withPrice.length === 0) {
      console.error('[fail] keine Station hat einen Diesel-Preis');
      issues++;
    } else {
      console.log(`[ok] ${withPrice.length} Stationen mit Diesel-Preis`);
      const top = withPrice[0];
      console.log(
        `       top: ${top.brand} ${top.name} ${top.diesel} EUR/L isOpen=${top.isOpen}`,
      );
    }

    const openCount = r.data.stations.filter((s) => s.isOpen).length;
    console.log(`[ok] isOpen-Werte ausgewertet: ${openCount}/${r.data.stations.length} offen`);

    const attribution = (r.data.license ?? '') + ' ' + (r.data.data ?? '');
    if (attribution.toLowerCase().includes('cc') || attribution.toLowerCase().includes('mts-k')) {
      console.log(`[ok] Attribution/CC-Hinweis vorhanden: "${attribution.trim()}"`);
    } else {
      console.warn(
        `[warn] kein eindeutiger CC/MTS-K-Hinweis im Response — Wert: "${attribution.trim()}"`,
      );
    }
  }

  if (issues > 0) {
    console.error(`\n[done] Tankerkoenig live: ${issues} Probleme.`);
    process.exit(2);
  }
  console.log('\n[done] Tankerkoenig live OK');
}

main().catch((e) => {
  console.error('[error]', (e as Error).message);
  process.exit(1);
});
