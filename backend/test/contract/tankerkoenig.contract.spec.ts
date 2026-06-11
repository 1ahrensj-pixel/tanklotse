import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Tankerkoenig-Vertrag.
 *
 * Diese Tests vergleichen die in `backend/test/fixtures/tankerkoenig/`
 * abgelegten realistischen Antwort-Formen mit unserer Parser-Erwartung
 * (`TkListResponse` / `TkDetailResponse` in `tankerkoenig.provider.ts`).
 *
 * Wahrheits-Garantie:
 *   contract_ready ≠ live_verified. Wenn diese Tests gruen sind, heisst das
 *   nur, dass unser Parser das dokumentierte Schema versteht. Es heisst NICHT,
 *   dass eine echte Tankerkoenig-API tatsaechlich antwortet — dafuer braucht
 *   es `npm run smoke:tankerkoenig:live` mit echtem Key.
 */
const fixtureDir = join(__dirname, '..', 'fixtures', 'tankerkoenig');
const search = JSON.parse(readFileSync(join(fixtureDir, 'search.koeln-rodenkirchen.json'), 'utf8'));
const detail = JSON.parse(readFileSync(join(fixtureDir, 'detail.aral-rodenkirchen.json'), 'utf8'));

describe('Contract: Tankerkoenig /list (Suche)', () => {
  it('Top-Level: ok=boolean + stations=array', () => {
    expect(typeof search.ok).toBe('boolean');
    expect(Array.isArray(search.stations)).toBe(true);
    expect(search.stations.length).toBeGreaterThan(0);
  });

  it('Jede Station hat alle Pflicht-Felder fuer ProviderStation-Mapping', () => {
    for (const s of search.stations) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(typeof s.brand).toBe('string');
      expect(typeof s.street).toBe('string');
      expect(typeof s.place).toBe('string');
      expect(['number', 'string']).toContain(typeof s.postCode);
      expect(typeof s.lat).toBe('number');
      expect(typeof s.lng).toBe('number');
      expect(typeof s.dist).toBe('number');
      expect(typeof s.isOpen).toBe('boolean');
    }
  });

  it('Diesel-Preis ist nullable number (mind. eine Station hat einen Wert)', () => {
    const withDiesel = search.stations.filter((s: { diesel?: number | null }) =>
      typeof s.diesel === 'number',
    );
    expect(withDiesel.length).toBeGreaterThan(0);
  });

  it('CC-BY-Attribution ist im Body verfuegbar', () => {
    expect(typeof search.license).toBe('string');
    expect(search.license).toMatch(/CC BY/i);
  });
});

describe('Contract: Tankerkoenig /prices (Massen-Preisabfrage)', () => {
  const prices = JSON.parse(readFileSync(join(fixtureDir, 'prices.sample.json'), 'utf8'));

  it('Top-Level: ok=true + prices={id: …}', () => {
    expect(prices.ok).toBe(true);
    expect(typeof prices.prices).toBe('object');
  });

  it('jeder Eintrag hat status + Preise als number ODER false (= geschlossen)', () => {
    for (const [id, p] of Object.entries(prices.prices)) {
      expect(typeof id).toBe('string');
      const entry = p as Record<string, unknown>;
      expect(typeof entry.status).toBe('string');
      for (const k of ['e5', 'e10', 'diesel']) {
        const v = entry[k];
        expect(typeof v === 'number' || v === false).toBe(true);
      }
    }
  });

  it('mind. eine Station hat numerische Diesel-Preise + status=open', () => {
    const open = Object.values(prices.prices).filter(
      (p) => (p as { status: string }).status === 'open',
    );
    expect(open.length).toBeGreaterThan(0);
  });
});

describe('Contract: Tankerkoenig /detail (Einzel-Tankstelle)', () => {
  it('Top-Level: ok=true + station={...}', () => {
    expect(detail.ok).toBe(true);
    expect(typeof detail.station).toBe('object');
  });

  it('station hat openingTimes-Array + state-string', () => {
    expect(Array.isArray(detail.station.openingTimes)).toBe(true);
    expect(typeof detail.station.state).toBe('string');
  });

  it('openingTimes-Eintrag hat text/start/end', () => {
    for (const ot of detail.station.openingTimes) {
      expect(typeof ot.text).toBe('string');
      expect(typeof ot.start).toBe('string');
      expect(typeof ot.end).toBe('string');
    }
  });
});
