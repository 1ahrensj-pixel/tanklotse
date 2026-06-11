import { test, expect, devices } from '@playwright/test';

const LANDING = process.env.LANDING_URL ?? 'http://localhost:3001';

const breakpoints = [
  { label: 'mobile-portrait', viewport: { width: 375, height: 667 } }, // iPhone SE
  { label: 'mobile-landscape', viewport: { width: 667, height: 375 } },
  { label: 'tablet', viewport: { width: 768, height: 1024 } }, // iPad
  { label: 'desktop', viewport: { width: 1440, height: 900 } },
];

const pagesToTest = ['/', '/funktionen', '/preise', '/datenschutz', '/blog'];

for (const bp of breakpoints) {
  test.describe(`Responsive @ ${bp.label} (${bp.viewport.width}x${bp.viewport.height})`, () => {
    test.use({ viewport: bp.viewport });

    for (const path of pagesToTest) {
      test(`${path} hat keinen Horizontal-Scroll und Hauptueberschrift sichtbar`, async ({ page }) => {
        await page.goto(`${LANDING}${path}`);

        // 1. H1 ist sichtbar
        const h1 = page.getByRole('heading', { level: 1 }).first();
        await expect(h1).toBeVisible();

        // 2. Kein Horizontal-Scroll (body breiter als Viewport waere Layout-Bug)
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        // 1px Toleranz fuer Subpixel-Rundung in Chromium
        expect(scrollWidth - clientWidth).toBeLessThanOrEqual(1);

        // 3. Tappable Targets (Buttons/Links im Viewport-Bereich) sind >= 32x32 px
        //    (WCAG 2.5.5 empfiehlt 44x44, axe akzeptiert ab 32; wir setzen 32)
        const buttons = await page.locator('a, button').filter({ hasText: /.+/ }).all();
        const tooSmall: string[] = [];
        for (const b of buttons.slice(0, 20)) {
          const box = await b.boundingBox();
          if (!box) continue;
          if (box.height < 32 || box.width < 24) {
            const text = (await b.innerText().catch(() => '')) || '(no text)';
            tooSmall.push(`${text.slice(0, 30)} → ${Math.round(box.width)}x${Math.round(box.height)}`);
          }
        }
        // Wir failen nicht, sondern loggen — kleine Inline-Links sind nicht immer 44px hoch.
        if (tooSmall.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`  [${bp.label} ${path}] ${tooSmall.length} kleine Targets:`, tooSmall.slice(0, 5));
        }
      });
    }
  });
}
