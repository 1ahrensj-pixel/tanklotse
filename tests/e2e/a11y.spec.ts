import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LANDING = process.env.LANDING_URL ?? 'http://localhost:3001';
const ADMIN = process.env.ADMIN_URL ?? 'http://127.0.0.1:3002';

const landingPages = [
  '/',
  '/funktionen',
  '/privat',
  '/firmen',
  '/preise',
  '/blog',
  '/datenschutz',
  '/impressum',
  '/datenquelle',
  '/kontakt',
  '/no-such-page',
];

const adminPages = ['/', '/login', '/2fa'];

test.describe('Landingpage a11y (axe-core, WCAG 2.1 AA)', () => {
  for (const path of landingPages) {
    test(`keine schweren a11y-Fehler auf ${path}`, async ({ page }) => {
      await page.goto(`${LANDING}${path}`);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Wir akzeptieren Warnungen, aber keine SCHWEREN Verstoesse.
      const seriousAndUp = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      if (seriousAndUp.length > 0) {
        // Output erleichtert Debugging in der CI.
        console.error(
          `\nA11y violations on ${path}:\n` +
            seriousAndUp
              .map(
                (v) =>
                  `  [${v.impact}] ${v.id}: ${v.help}\n    → ${v.nodes
                    .slice(0, 3)
                    .map((n) => n.target.join(' '))
                    .join(' | ')}`,
              )
              .join('\n'),
        );
      }
      expect(seriousAndUp).toEqual([]);
    });
  }
});

test.describe('Admin a11y (axe-core, WCAG 2.1 AA)', () => {
  for (const path of adminPages) {
    test(`keine schweren a11y-Fehler auf admin ${path}`, async ({ page }) => {
      await page.goto(`${ADMIN}${path}`);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const seriousAndUp = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      if (seriousAndUp.length > 0) {
        console.error(
          `\nA11y violations on admin${path}:\n` +
            seriousAndUp
              .map(
                (v) =>
                  `  [${v.impact}] ${v.id}: ${v.help}\n    → ${v.nodes
                    .slice(0, 3)
                    .map((n) => n.target.join(' '))
                    .join(' | ')}`,
              )
              .join('\n'),
        );
      }
      expect(seriousAndUp).toEqual([]);
    });
  }
});
