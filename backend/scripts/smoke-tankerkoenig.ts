/**
 * Live-Smoke-Test gegen die Tankerkoenig-API.
 *
 * Laeuft NUR, wenn TANKERKOENIG_API_KEY gesetzt ist.
 * Ohne Key: sauberes Skip (Exit-Code 0), KEIN Fehler.
 *
 * Aufruf:
 *   TANKERKOENIG_API_KEY=xxx npm run smoke:tankerkoenig
 *
 * Es werden ausschliesslich nutzerbezogene Testabfragen ausgefuehrt — keine
 * Massendaten-Sync-Versuche.
 */
import axios from 'axios';

const KEY = process.env.TANKERKOENIG_API_KEY;
const BASE = process.env.TANKERKOENIG_BASE_URL ?? 'https://creativecommons.tankerkoenig.de/json';

interface ListResp {
  ok: boolean;
  message?: string;
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

interface DetailResp {
  ok: boolean;
  station?: { id: string; name: string; brand: string; isOpen: boolean };
}

async function main() {
  if (!KEY) {
    console.log('[skip] TANKERKOENIG_API_KEY nicht gesetzt — Live-Smoke uebersprungen.');
    console.log('       Beantragen: https://creativecommons.tankerkoenig.de/');
    process.exit(0);
  }

  const http = axios.create({
    baseURL: BASE,
    timeout: 10_000,
    headers: { 'User-Agent': 'TankLotse-SmokeTest/1.0' },
  });

  console.log(`[run] Tankerkoenig live (Base=${BASE})`);

  // 1) Suche Koeln-Rodenkirchen, Diesel, 5 km
  const list = await http.get<ListResp>('/list.php', {
    params: { lat: 50.8946, lng: 6.9981, rad: 5, sort: 'price', type: 'diesel', apikey: KEY },
  });
  if (!list.data.ok) {
    console.error(`[fail] list.php: ${list.data.message ?? 'unknown'}`);
    process.exit(2);
  }
  console.log(`[ok] list.php: ${list.data.stations.length} Stationen in Koeln-Rodenkirchen (Diesel)`);
  if (list.data.stations.length === 0) {
    console.warn('[warn] Keine Stationen — entweder Wochenendregelungen oder Ortsproblem.');
    process.exit(0);
  }

  const top = list.data.stations[0];
  console.log(`       Top: ${top.brand} ${top.name} (${top.place}) Diesel=${top.diesel} dist=${top.dist}km open=${top.isOpen}`);

  // 2) Detail einer Station
  const detail = await http.get<DetailResp>('/detail.php', {
    params: { id: top.id, apikey: KEY },
  });
  if (!detail.data.ok || !detail.data.station) {
    console.error('[fail] detail.php');
    process.exit(2);
  }
  console.log(`[ok] detail.php: ${detail.data.station.name} (${detail.data.station.brand})`);

  // 3) E5/E10/Diesel-Sanity
  const sample = list.data.stations.slice(0, 3);
  for (const s of sample) {
    console.log(`       ${s.name}: E5=${s.e5 ?? '–'} E10=${s.e10 ?? '–'} Diesel=${s.diesel ?? '–'}`);
  }

  console.log('[done] Tankerkoenig live OK');
}

main().catch((e) => {
  console.error('[error]', (e as Error).message);
  process.exit(1);
});
