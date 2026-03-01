import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: /ImmoAssist/i })).toBeVisible();
  });

  test('should navigate to components page', async ({ page }) => {
    await page.goto('/');

    // Click on components link
    await page.getByRole('link', { name: /composants/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/.*components/);
  });

  test('should have working theme toggle', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });

    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Check if dark mode class is applied
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');

    // Scroll to features section
    await page.getByRole('heading', { name: /Fonctionnalités/i }).scrollIntoViewIfNeeded();

    // Verify features are visible
    await expect(page.getByText(/Next.js 16/i)).toBeVisible();
  });
});
