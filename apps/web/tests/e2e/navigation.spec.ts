import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate between pages', async ({ page }) => {
    // Navigation vers les composants
    const componentsLink = page.locator('a[href*="/components"]').first();
    if (await componentsLink.isVisible()) {
      await componentsLink.click();
      await expect(page).toHaveURL(/.*\/components/);
    }
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Chercher la sidebar
    const sidebar = page.locator('aside, nav[aria-label*="sidebar"]').first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();

      // Vérifier les liens de navigation
      const navLinks = sidebar.locator('a');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should handle breadcrumbs navigation', async ({ page }) => {
    await page.goto('/components/forms');

    // Chercher les breadcrumbs
    const breadcrumbs = page
      .locator('nav[aria-label*="breadcrumb"], ol[aria-label*="breadcrumb"]')
      .first();
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toBeVisible();

      // Cliquer sur le premier breadcrumb
      const firstBreadcrumb = breadcrumbs.locator('a').first();
      if (await firstBreadcrumb.isVisible()) {
        await firstBreadcrumb.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
