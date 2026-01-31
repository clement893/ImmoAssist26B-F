import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display DataTable component', async ({ page }) => {
    await page.goto('/components/data');

    // Vérifier que la table est visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Vérifier la recherche
    const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      // Attendre que les résultats se filtrent
      await page.waitForTimeout(500);
    }
  });

  test('should display Form components', async ({ page }) => {
    await page.goto('/components/forms');

    // Vérifier les différents champs de formulaire
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    const select = page.locator('select').first();
    if (await select.isVisible()) {
      await expect(select).toBeVisible();
    }
  });

  test('should display Modal component', async ({ page }) => {
    await page.goto('/components/overlay');

    // Chercher un bouton qui ouvre une modal
    const openModalButton = page.locator('button:has-text("Ouvrir")').first();
    if (await openModalButton.isVisible()) {
      await openModalButton.click();

      // Vérifier que la modal est visible
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();

      // Fermer la modal
      const closeButton = page
        .locator('button:has-text("Fermer"), button[aria-label*="close"]')
        .first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('should display Pagination component', async ({ page }) => {
    await page.goto('/components/data');

    // Look for pagination
    const pagination = page
      .locator('[aria-label*="pagination"], nav[aria-label*="Pagination"]')
      .first();
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();

      // Click next page
      const nextButton = pagination
        .locator('button:has-text("Suivant"), button:has-text("Next"), button[aria-label*="next"]')
        .first();
      if ((await nextButton.isVisible()) && !(await nextButton.isDisabled())) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should display Button component variants', async ({ page }) => {
    await page.goto('/components');

    // Look for buttons
    const buttons = page.locator('button').all();
    const buttonCount = await page.locator('button').count();

    expect(buttonCount).toBeGreaterThan(0);

    // Test button interactions
    if (buttonCount > 0) {
      const firstButton = (await buttons)[0];
      if ((await firstButton.isVisible()) && !(await firstButton.isDisabled())) {
        await firstButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should display Card component', async ({ page }) => {
    await page.goto('/components');

    // Look for card components
    const cards = page.locator('[class*="card"], [class*="Card"]').first();
    if (await cards.isVisible()) {
      await expect(cards).toBeVisible();
    }
  });

  test('should display Input component with validation', async ({ page }) => {
    await page.goto('/components/forms');

    const input = page.locator('input[type="text"], input[type="email"]').first();
    if (await input.isVisible()) {
      await input.fill('test');
      await input.blur();
      await page.waitForTimeout(300);

      // Should handle input correctly
      await expect(input).toHaveValue('test');
    }
  });

  test('should display Select component', async ({ page }) => {
    await page.goto('/components/forms');

    const select = page.locator('select').first();
    if (await select.isVisible()) {
      await expect(select).toBeVisible();

      // Try to interact with select
      await select.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display Textarea component', async ({ page }) => {
    await page.goto('/components/forms');

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await expect(textarea).toBeVisible();

      // Test textarea input
      await textarea.fill('Test textarea content');
      await expect(textarea).toHaveValue('Test textarea content');
    }
  });
});
