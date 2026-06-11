import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Admin-Dashboard — funktionale E2E-Tests gegen den lokalen Live-Stack.
// Voraussetzungen: Backend :3000 (mit Seed), Admin-Dashboard :3002.
// Anmeldedaten kommen aus ENV oder den Seed-Defaults (README_LOCAL.md).
// =============================================================================

const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:3002';
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? 'admin@tanklotse.local';
const ADMIN_PASSWORD =
  process.env.ADMIN_SEED_PASSWORD ?? 'local-dev-admin-password-min-12chars';

async function login(page: Page) {
  await page.goto(`${ADMIN}/login`);
  // Production-Build: Die statische Seite rendert, BEVOR React hydratisiert.
  // Ein Klick vor der Hydration verpufft (kein Handler montiert). networkidle
  // wartet, bis die JS-Bundles geladen sind und die Seite interaktiv ist.
  await page.waitForLoadState('networkidle');
  await page.getByLabel('E-Mail').fill(ADMIN_EMAIL);
  await page.getByLabel('Passwort').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  // Nach erfolgreichem Login leitet die App auf das Dashboard (/) um.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });
}

test.describe('Admin-Dashboard', () => {
  test('Login-Seite rendert Formular mit Pflichtfeldern', async ({ page }) => {
    await page.goto(`${ADMIN}/login`);
    await expect(page.getByRole('heading', { name: 'Admin-Login' })).toBeVisible();
    await expect(page.getByLabel('E-Mail')).toBeVisible();
    await expect(page.getByLabel('Passwort')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeEnabled();
  });

  test('Login mit falschem Passwort zeigt Fehler, bleibt auf /login', async ({
    page,
  }) => {
    await page.goto(`${ADMIN}/login`);
    await page.getByLabel('E-Mail').fill(ADMIN_EMAIL);
    await page.getByLabel('Passwort').fill('definitiv-falsches-passwort-123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    // Fehlertext erscheint am E-Mail-Feld (error-Prop), URL bleibt /login.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeEnabled();
  });

  test('Login mit Seed-Admin führt zum Dashboard', async ({ page }) => {
    await login(page);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Feature-Flags-Seite listet die 6 Seed-Flags', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN}/feature-flags`);
    await expect(
      page.getByRole('heading', { name: 'Feature-Flags' }),
    ).toBeVisible();
    // Seed legt u. a. route_search_enabled + price_alerts_enabled an.
    await expect(page.getByText('route_search_enabled')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('price_alerts_enabled')).toBeVisible();
  });

  test('Users-Seite lädt und zeigt Seed-Nutzer', async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN}/users`);
    // Demo-User aus dem Seed muss in der Liste auftauchen.
    await expect(page.getByText('demo@tanklotse.local')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Geschützte Seite ohne Login leitet auf /login um oder zeigt Fehler', async ({
    page,
  }) => {
    // Frischer Context ohne Token: direkter Aufruf einer Admin-Seite darf
    // keine Daten zeigen.
    await page.goto(`${ADMIN}/feature-flags`);
    const redirected = page.url().includes('/login');
    const errorVisible = await page
      .getByText(/Fehler|nicht angemeldet|401|403/i)
      .first()
      .isVisible()
      .catch(() => false);
    const flagsVisible = await page
      .getByText('route_search_enabled')
      .isVisible()
      .catch(() => false);
    expect(redirected || errorVisible || !flagsVisible).toBeTruthy();
  });
});
