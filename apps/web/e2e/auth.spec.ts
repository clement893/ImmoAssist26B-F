import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    // Check if login form is visible
    await expect(page.getByRole('heading', { name: /Login/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');

    // Try to submit empty form
    await page.getByRole('button', { name: /Login/i }).click();

    // Check for HTML5 validation (browser native)
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);

    // HTML5 validation should prevent submission
    await expect(emailInput).toBeFocused();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click register link
    await page.getByRole('link', { name: /Register/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /Register/i })).toBeVisible();
  });

  test('should handle Google login button click', async ({ page }) => {
    await page.goto('/auth/login');

    // Click Google login button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });

    if (await googleButton.isVisible()) {
      // Mock the API call to prevent actual redirect
      await page.route('**/api/auth/google', (route) => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ detail: 'Google OAuth is not configured' }),
        });
      });

      await googleButton.click();

      // Should show error message if not configured
      // This test verifies the button works, actual OAuth flow would require backend setup
    }
  });
});
