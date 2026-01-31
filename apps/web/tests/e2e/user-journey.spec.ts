/**
 * E2E tests for complete user journeys
 */

import { test, expect } from '@playwright/test';

test.describe('User Registration and Onboarding Journey', () => {
  test('complete user registration and onboarding flow', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/MODELE/);

    // 2. Navigate to registration
    await page.click('text=Sign Up');
    await page.waitForURL('/auth/register');

    // 3. Fill registration form
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');

    // 4. Submit registration
    await page.click('button[type="submit"]');

    // 5. Verify redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();

    // 6. Complete onboarding (if exists)
    const onboardingModal = page.locator('[data-testid="onboarding-modal"]');
    if (await onboardingModal.isVisible()) {
      await page.click('button:has-text("Get Started")');
    }

    // 7. Verify dashboard is accessible
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Verify still on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('password reset flow', async ({ page }) => {
    // 1. Go to login
    await page.goto('/auth/login');

    // 2. Click forgot password
    await page.click('text=Forgot Password');
    await page.waitForURL('/auth/forgot-password');

    // 3. Enter email
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // 4. Verify success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });
});

test.describe('Subscription Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('view and upgrade subscription', async ({ page }) => {
    // 1. Navigate to subscriptions
    await page.goto('/subscriptions');

    // 2. View available plans
    await expect(page.locator('text=Pricing Plans')).toBeVisible();

    // 3. Select a plan
    const planCard = page.locator('[data-testid="plan-card"]').first();
    await planCard.locator('button:has-text("Select Plan")').click();

    // 4. Verify redirect to checkout or subscription page
    await expect(page).toHaveURL(/\/subscriptions|\/checkout/);
  });

  test('view subscription details', async ({ page }) => {
    await page.goto('/subscriptions');

    // Verify subscription info is displayed
    await expect(page.locator('text=Current Plan')).toBeVisible();
    await expect(page.locator('text=Next Billing Date')).toBeVisible();
  });
});

test.describe('Admin User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('manage users as admin', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');

    // Verify users list
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Search for a user
    await page.fill('input[placeholder*="Search"]', 'test');
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('manage themes as admin', async ({ page }) => {
    await page.goto('/admin/theme');

    // Verify theme management interface
    await expect(page.locator('text=Theme Management')).toBeVisible();

    // Select a theme
    const themeCard = page.locator('[data-testid="theme-card"]').first();
    await themeCard.click();

    // Verify theme preview
    await expect(page.locator('[data-testid="theme-preview"]')).toBeVisible();
  });
});
