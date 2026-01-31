import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * Screenshot comparisons for UI consistency
 */

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Homepage', () => {
    test('homepage should match snapshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await expect(page).toHaveScreenshot('homepage.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('homepage mobile view should match snapshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Components', () => {
    test('Button component should match snapshot', async ({ page }) => {
      await page.goto('/components');
      await page.waitForLoadState('networkidle');

      const buttonSection = page.locator('section:has-text("Button")').first();
      if (await buttonSection.isVisible()) {
        await expect(buttonSection).toHaveScreenshot('button-component.png', {
          animations: 'disabled',
        });
      }
    });

    test('DataTable component should match snapshot', async ({ page }) => {
      await page.goto('/components/data');
      await page.waitForLoadState('networkidle');

      const table = page.locator('table').first();
      if (await table.isVisible()) {
        await expect(table).toHaveScreenshot('datatable-component.png', {
          animations: 'disabled',
        });
      }
    });

    test('Modal component should match snapshot', async ({ page }) => {
      await page.goto('/components/overlay');
      await page.waitForLoadState('networkidle');

      const openButton = page.locator('button:has-text("Open"), button:has-text("Ouvrir")').first();
      if (await openButton.isVisible()) {
        await openButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          await expect(modal).toHaveScreenshot('modal-component.png', {
            animations: 'disabled',
          });
        }
      }
    });

    test('Form components should match snapshot', async ({ page }) => {
      await page.goto('/components/forms');
      await page.waitForLoadState('networkidle');

      const formSection = page.locator('section').first();
      if (await formSection.isVisible()) {
        await expect(formSection).toHaveScreenshot('form-components.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Dark Mode', () => {
    test('homepage dark mode should match snapshot', async ({ page }) => {
      await page.goto('/');

      // Toggle dark mode if available
      const darkModeToggle = page.locator('[aria-label*="dark"], [aria-label*="theme"]').first();
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);
      }

      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Error States', () => {
    test('error page should match snapshot', async ({ page }) => {
      await page.goto('/non-existent-page-12345');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('error-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('form validation errors should match snapshot', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.waitForLoadState('networkidle');

      // Trigger validation errors
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('form-validation-errors.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Loading States', () => {
    test('loading state should match snapshot', async ({ page }) => {
      // Slow down network to capture loading state
      await page.route('**/api/**', (route) => {
        setTimeout(() => route.continue(), 1000);
      });

      await page.goto('/dashboard');

      // Capture loading state
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('loading-state.png', {
        animations: 'disabled',
      });
    });
  });
});
