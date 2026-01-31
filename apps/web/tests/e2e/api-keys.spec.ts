/**
 * E2E tests for API key management user journey
 */

import { test, expect } from '@playwright/test';

test.describe('API Key Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Login (adjust credentials as needed)
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should create a new API key', async ({ page }) => {
    // Navigate to API keys page
    await page.goto('/admin/settings');
    await page.click('text=API Keys');

    // Click create button
    await page.click('button:has-text("Create API Key")');

    // Fill form
    await page.fill('input[name="name"]', 'Test API Key');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="rotation_policy"]', '90d');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=API key created successfully')).toBeVisible();

    // Verify key is displayed (masked)
    await expect(page.locator('text=sk_live_')).toBeVisible();
  });

  test('should list API keys', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.click('text=API Keys');

    // Verify API keys list is displayed
    await expect(page.locator('table')).toBeVisible();

    // Check for table headers
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Created')).toBeVisible();
    await expect(page.locator('text=Last Used')).toBeVisible();
  });

  test('should rotate an API key', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.click('text=API Keys');

    // Find first API key and click rotate
    const firstKey = page.locator('tbody tr').first();
    await firstKey.locator('button:has-text("Rotate")').click();

    // Confirm rotation
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await expect(page.locator('text=API key rotated successfully')).toBeVisible();

    // Verify old key is marked as revoked
    await expect(firstKey.locator('text=Revoked')).toBeVisible();
  });

  test('should revoke an API key', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.click('text=API Keys');

    // Find first API key and click revoke
    const firstKey = page.locator('tbody tr').first();
    await firstKey.locator('button:has-text("Revoke")').click();

    // Fill revocation reason
    await page.fill('input[name="reason"]', 'No longer needed');

    // Confirm revocation
    await page.click('button:has-text("Confirm Revocation")');

    // Verify success message
    await expect(page.locator('text=API key revoked successfully')).toBeVisible();

    // Verify key is marked as revoked
    await expect(firstKey.locator('text=Revoked')).toBeVisible();
  });

  test('should display API key only once on creation', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.click('text=API Keys');

    // Create new key
    await page.click('button:has-text("Create API Key")');
    await page.fill('input[name="name"]', 'One-Time Display Key');
    await page.click('button[type="submit"]');

    // Verify key is shown
    const keyDisplay = page.locator('[data-testid="api-key-display"]');
    await expect(keyDisplay).toBeVisible();

    // Navigate away and back
    await page.goto('/dashboard');
    await page.goto('/admin/settings');
    await page.click('text=API Keys');

    // Verify key is now masked
    const maskedKey = page.locator('text=sk_live_');
    await expect(maskedKey).toBeVisible();

    // Verify full key is not shown
    await expect(keyDisplay).not.toBeVisible();
  });
});
