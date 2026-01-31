/**
 * Performance E2E tests
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('page load performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
  });

  test('dashboard load performance', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    const startTime = Date.now();
    await page.waitForURL('/dashboard');
    const loadTime = Date.now() - startTime;

    // Dashboard should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('API response time', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');

    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    const responseTime = Date.now() - startTime;

    // API response should be under 1 second
    expect(responseTime).toBeLessThan(1000);
  });

  test('image loading performance', async ({ page }) => {
    await page.goto('/');

    // Measure image load time
    const images = await page.$$eval('img', (imgs) =>
      Promise.all(
        imgs.map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(0);
            } else {
              const start = Date.now();
              img.onload = () => resolve(Date.now() - start);
            }
          });
        })
      )
    );

    // All images should load in under 2 seconds
    images.forEach((loadTime) => {
      expect(loadTime).toBeLessThan(2000);
    });
  });

  test('large list rendering performance', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/admin/users');

    const startTime = Date.now();
    await page.waitForSelector('table tbody tr');
    const renderTime = Date.now() - startTime;

    // Table should render in under 1 second
    expect(renderTime).toBeLessThan(1000);
  });
});
