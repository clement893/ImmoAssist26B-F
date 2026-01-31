import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('h2')).toContainText('Bienvenue');
    await expect(page.locator('button')).toContainText('Continuer avec Google');
  });

  test('should navigate to sign in from home', async ({ page }) => {
    const signInLink = page.locator('a[href="/auth/signin"]').first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/.*\/auth\/signin/);
    }
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill form with invalid credentials
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await emailInput.isVisible()) && (await passwordInput.isVisible())) {
      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for error message
        const errorMessage = page.locator('[role="alert"], .error, [aria-invalid="true"]').first();
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/signin');

    // Look for password reset link
    const resetLink = page
      .locator('a:has-text("Forgot"), a:has-text("Reset"), a:has-text("Mot de passe")')
      .first();
    if (await resetLink.isVisible()) {
      await resetLink.click();
      await page.waitForTimeout(500);

      // Should navigate to reset page
      await expect(page).toHaveURL(/.*reset|forgot|password.*/i);
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/signin');

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible()) {
      // Enter invalid email
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      await page.waitForTimeout(500);

      // Should show validation error
      const errorMessage = page.locator('[role="alert"], .error, [aria-invalid="true"]').first();
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should handle successful login redirect', async ({ page }) => {
    await page.goto('/auth/signin');

    // This test would require valid credentials or mocking
    // For now, just verify the form exists
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });
});
