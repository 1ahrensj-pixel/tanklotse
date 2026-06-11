import { test, expect } from '@playwright/test';

const BASE = process.env.LANDING_URL ?? 'http://localhost:3001';

test.describe('Landingpage', () => {
  test('Startseite lädt mit Datenquelle-Hinweis', async ({ page }) => {
    await page.goto(BASE);
    // H1 traegt aktuell die Marketing-Headline "Die Spritpreis-App mit Lohnt-sich-Check."
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Lohnt-sich-Check');
    // Datenquelle-Hinweis steht im Footer: "Datenquelle: Tankerkönig ..."
    await expect(page.locator('footer')).toContainText('Tankerkönig');
  });

  test('Datenschutzseite ist erreichbar', async ({ page }) => {
    await page.goto(`${BASE}/datenschutz`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Datenschutz');
  });

  test('Sitemap und Robots werden bereitgestellt', async ({ request }) => {
    const sitemap = await request.get(`${BASE}/sitemap.xml`);
    expect(sitemap.ok()).toBeTruthy();
    const robots = await request.get(`${BASE}/robots.txt`);
    expect(robots.ok()).toBeTruthy();
  });
});
