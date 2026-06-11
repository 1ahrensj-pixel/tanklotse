import { test, expect } from '@playwright/test';

const API = process.env.API_URL ?? 'http://localhost:3000';

test.describe('Backend API', () => {
  test('/health antwortet 200', async ({ request }) => {
    const r = await request.get(`${API}/health`);
    expect(r.ok()).toBeTruthy();
    const json = await r.json();
    expect(json.status).toBe('ok');
  });

  test('Detour-Berechnung liefert verständliche Empfehlung', async ({ request }) => {
    const r = await request.post(`${API}/api/recommendations/detour-calculation`, {
      data: {
        comparisonPricePerLiter: 1.689,
        targetPricePerLiter: 1.629,
        detourKm: 4.8,
        consumptionLPer100Km: 8,
        tankLiters: 50,
      },
    });
    expect(r.ok()).toBeTruthy();
    const json = await r.json();
    expect(json.realSavingsEur).toBeGreaterThan(0);
    expect(json.verdict).toBe('lohnt_sich');
    expect(json.explanation).toContain('Empfehlung');
  });

  test('Stations-Suche validiert ungültige Eingaben', async ({ request }) => {
    const r = await request.get(`${API}/api/stations/search?lat=200&lng=6.95&radius=5&fuelType=DIESEL`);
    expect(r.status()).toBe(400);
  });
});
