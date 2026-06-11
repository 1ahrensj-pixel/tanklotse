import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Nominatim-Vertrag.
 *
 * Verifiziert, dass die abgelegten Nominatim-Antwort-Fixtures mit unserer
 * Erwartung in `NominatimProvider` zusammenpassen (Search + Reverse).
 */
const fixtureDir = join(__dirname, '..', 'fixtures', 'nominatim');
const search = JSON.parse(readFileSync(join(fixtureDir, 'search.koeln-rodenkirchen.json'), 'utf8'));
const reverse = JSON.parse(readFileSync(join(fixtureDir, 'reverse.koeln-rodenkirchen.json'), 'utf8'));

describe('Contract: Nominatim /search', () => {
  it('Top-Level: Array mit mind. 1 Eintrag', () => {
    expect(Array.isArray(search)).toBe(true);
    expect(search.length).toBeGreaterThan(0);
  });

  it('Jeder Treffer hat lat/lon als String + display_name als String', () => {
    for (const r of search) {
      expect(typeof r.lat).toBe('string');
      expect(typeof r.lon).toBe('string');
      expect(typeof r.display_name).toBe('string');
      expect(Number.isFinite(Number(r.lat))).toBe(true);
      expect(Number.isFinite(Number(r.lon))).toBe(true);
    }
  });

  it('ODbL-Lizenz ist im ersten Treffer enthalten', () => {
    expect(typeof search[0].licence).toBe('string');
    expect(search[0].licence).toMatch(/OpenStreetMap/i);
  });
});

describe('Contract: Nominatim /reverse', () => {
  it('Top-Level: Objekt mit lat/lon + display_name + address', () => {
    expect(typeof reverse.lat).toBe('string');
    expect(typeof reverse.lon).toBe('string');
    expect(typeof reverse.display_name).toBe('string');
    expect(typeof reverse.address).toBe('object');
  });

  it('address enthaelt postcode + city + country_code', () => {
    expect(typeof reverse.address.postcode).toBe('string');
    expect(typeof reverse.address.city).toBe('string');
    expect(typeof reverse.address.country_code).toBe('string');
    expect(reverse.address.country_code).toBe('de');
  });
});
