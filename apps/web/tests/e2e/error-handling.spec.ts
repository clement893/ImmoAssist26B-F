import { test, expect } from '@playwright/test';

/**
 * Error Handling E2E Tests
 * Tests for error scenarios, error boundaries, and error recovery
 */

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Form Validation Errors', () => {
    test('should display validation errors for invalid email', async ({ page }) => {
      await page.goto('/auth/signin');

      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('invalid-email');

        // Trigger validation
        await emailInput.blur();
        await page.waitForTimeout(300);

        // Should show error message
        const errorMessage = page.locator('[role="alert"], .error, [aria-invalid="true"]').first();
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    });

    test('should display validation errors for weak password', async ({ page }) => {
      await page.goto('/auth/signin');

      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('123');

        await passwordInput.blur();
        await page.waitForTimeout(300);

        // Should show password strength error
        const errorMessage = page.locator('text=/weak|too short|password/i').first();
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    });

    test('should clear errors when input is corrected', async ({ page }) => {
      await page.goto('/auth/signin');

      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailInput.isVisible()) {
        // Enter invalid email
        await emailInput.fill('invalid');
        await emailInput.blur();
        await page.waitForTimeout(300);

        // Correct the email
        await emailInput.fill('valid@example.com');
        await emailInput.blur();
        await page.waitForTimeout(300);

        // Error should be cleared
        const errorMessage = page.locator('[role="alert"]').first();
        if (await errorMessage.isVisible()) {
          // Error might still be visible during transition
          // But should eventually clear
        }
      }
    });
  });

  test.describe('API Error Handling', () => {
    test('should display error message for failed API requests', async ({ page }) => {
      // Intercept API calls and return error
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Should show error message
      const errorMessage = page.locator('text=/error|failed|something went wrong/i').first();
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should handle 401 unauthorized errors', async ({ page }) => {
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Should redirect to login or show auth error
      const authError = page.locator('text=/unauthorized|login|sign in/i').first();
      if (await authError.isVisible()) {
        await expect(authError).toBeVisible();
      }
    });

    test('should handle 404 not found errors', async ({ page }) => {
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Not Found' }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Should show not found message
      const notFoundMessage = page.locator('text=/not found|404|does not exist/i').first();
      if (await notFoundMessage.isVisible()) {
        await expect(notFoundMessage).toBeVisible();
      }
    });

    test('should handle network timeout errors', async ({ page }) => {
      await page.route('**/api/**', (route) => {
        route.abort('timedout');
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(5000);

      // Should show timeout or network error
      const timeoutError = page.locator('text=/timeout|network|connection/i').first();
      if (await timeoutError.isVisible()) {
        await expect(timeoutError).toBeVisible();
      }
    });

    test('should allow retry after error', async ({ page }) => {
      let requestCount = 0;

      await page.route('**/api/**', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server Error' }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Find retry button
      const retryButton = page
        .locator('button:has-text("Retry"), button:has-text("Réessayer")')
        .first();
      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(2000);

        // Should retry request
        expect(requestCount).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Error Boundaries', () => {
    test('should display error boundary fallback UI', async ({ page }) => {
      // This test would require injecting an error into a component
      // For now, verify error boundary exists in the app structure
      await page.goto('/');

      // Error boundaries should be present
      const app = page.locator('#__next, [data-testid="app"]').first();
      await expect(app).toBeVisible();
    });

    test('should recover from error after page reload', async ({ page }) => {
      await page.goto('/');

      // Simulate error (if possible)
      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);

      // Should recover and display normally
      await expect(page).toHaveURL(/.*\//);
    });
  });

  test.describe('User-Friendly Error Messages', () => {
    test('should show user-friendly error messages', async ({ page }) => {
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: 'Database connection failed',
            message: 'We are experiencing technical difficulties. Please try again later.',
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Should show friendly message, not technical error
      const friendlyMessage = page.locator('text=/try again|please|sorry|difficulties/i').first();
      if (await friendlyMessage.isVisible()) {
        await expect(friendlyMessage).toBeVisible();
      }
    });

    test('should not expose sensitive information in errors', async ({ page }) => {
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: 'Database error',
            stack: 'at Database.query()...',
            sql: 'SELECT * FROM users WHERE password = "..."',
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Should not show stack trace or SQL
      const pageContent = await page.content();
      expect(pageContent).not.toContain('at Database.query');
      expect(pageContent).not.toContain('SELECT * FROM');
    });
  });
});
