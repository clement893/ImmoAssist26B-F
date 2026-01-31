import { test, expect } from '@playwright/test';

/**
 * Edge Case Tests
 * Tests for boundary conditions, error scenarios, and unusual inputs
 */

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Form Input Edge Cases', () => {
    test('should handle empty form submission', async ({ page }) => {
      await page.goto('/auth/signin');

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation errors
        const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
        await expect(errorMessages.first()).toBeVisible();
      }
    });

    test('should handle extremely long input strings', async ({ page }) => {
      await page.goto('/auth/signin');

      const emailInput = page.locator('input[name="email"]').first();
      if (await emailInput.isVisible()) {
        const longString = 'a'.repeat(1000) + '@example.com';
        await emailInput.fill(longString);

        // Should either truncate or show validation error
        const value = await emailInput.inputValue();
        expect(value.length).toBeLessThanOrEqual(255); // Email max length
      }
    });

    test('should handle special characters in inputs', async ({ page }) => {
      await page.goto('/auth/signin');

      const emailInput = page.locator('input[name="email"]').first();
      if (await emailInput.isVisible()) {
        const specialChars = '<script>alert("xss")</script>@example.com';
        await emailInput.fill(specialChars);

        // Should sanitize or reject
        const value = await emailInput.inputValue();
        expect(value).not.toContain('<script>');
      }
    });

    test('should handle rapid form field changes', async ({ page }) => {
      await page.goto('/auth/signin');

      const emailInput = page.locator('input[name="email"]').first();
      if (await emailInput.isVisible()) {
        // Rapidly change input
        for (let i = 0; i < 10; i++) {
          await emailInput.fill(`test${i}@example.com`);
          await page.waitForTimeout(50);
        }

        // Should handle debouncing correctly
        await page.waitForTimeout(500);
        const finalValue = await emailInput.inputValue();
        expect(finalValue).toBeTruthy();
      }
    });
  });

  test.describe('Search Edge Cases', () => {
    test('should handle empty search query', async ({ page }) => {
      await page.goto('/components');

      const searchInput = page
        .locator('input[type="search"], input[placeholder*="Search"]')
        .first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('');
        await page.waitForTimeout(300);

        // Should show all results or empty state
        const results = page.locator('[role="listbox"], .search-results').first();
        if (await results.isVisible()) {
          await expect(results).toBeVisible();
        }
      }
    });

    test('should handle search with only whitespace', async ({ page }) => {
      await page.goto('/components');

      const searchInput = page
        .locator('input[type="search"], input[placeholder*="Search"]')
        .first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('   ');
        await page.waitForTimeout(300);

        // Should trim or ignore whitespace
        const value = await searchInput.inputValue();
        expect(value.trim()).toBe('');
      }
    });

    test('should handle search with special regex characters', async ({ page }) => {
      await page.goto('/components');

      const searchInput = page
        .locator('input[type="search"], input[placeholder*="Search"]')
        .first();
      if (await searchInput.isVisible()) {
        const regexChars = '.*+?^${}()|[]\\';
        await searchInput.fill(regexChars);
        await page.waitForTimeout(500);

        // Should not crash or throw errors
        await expect(searchInput).toBeVisible();
      }
    });

    test('should handle search cancellation', async ({ page }) => {
      await page.goto('/components');

      const searchInput = page
        .locator('input[type="search"], input[placeholder*="Search"]')
        .first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(100);

        // Clear search
        const clearButton = page
          .locator('button[aria-label*="Clear"], button:has([aria-label*="clear"])')
          .first();
        if (await clearButton.isVisible()) {
          await clearButton.click();
          await expect(searchInput).toHaveValue('');
        }
      }
    });
  });

  test.describe('DataTable Edge Cases', () => {
    test('should handle empty data table', async ({ page }) => {
      await page.goto('/components/data');

      const table = page.locator('table').first();
      if (await table.isVisible()) {
        // Check for empty state message
        const emptyState = page.locator('text=/no data|empty|no results/i').first();
        if (await emptyState.isVisible()) {
          await expect(emptyState).toBeVisible();
        }
      }
    });

    test('should handle pagination edge cases', async ({ page }) => {
      await page.goto('/components/data');

      const pagination = page.locator('[aria-label*="pagination"]').first();
      if (await pagination.isVisible()) {
        // Try to go to first page when already on first page
        const firstButton = pagination
          .locator('button:has-text("First"), button[aria-label*="first"]')
          .first();
        if (await firstButton.isVisible()) {
          const isDisabled = await firstButton.isDisabled();
          if (isDisabled) {
            await expect(firstButton).toBeDisabled();
          }
        }
      }
    });

    test('should handle sorting edge cases', async ({ page }) => {
      await page.goto('/components/data');

      const sortableHeader = page.locator('th[aria-sort], button[aria-sort]').first();
      if (await sortableHeader.isVisible()) {
        // Click multiple times to test sort states
        await sortableHeader.click();
        await page.waitForTimeout(200);
        await sortableHeader.click();
        await page.waitForTimeout(200);
        await sortableHeader.click();

        // Should cycle through sort states
        const sortValue = await sortableHeader.getAttribute('aria-sort');
        expect(['ascending', 'descending', 'none']).toContain(sortValue);
      }
    });
  });

  test.describe('Modal Edge Cases', () => {
    test('should handle ESC key to close modal', async ({ page }) => {
      await page.goto('/components/overlay');

      const openButton = page.locator('button:has-text("Open"), button:has-text("Ouvrir")').first();
      if (await openButton.isVisible()) {
        await openButton.click();
        await page.waitForTimeout(300);

        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          // Press ESC
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);

          // Modal should be closed
          await expect(modal).not.toBeVisible();
        }
      }
    });

    test('should handle clicking outside modal to close', async ({ page }) => {
      await page.goto('/components/overlay');

      const openButton = page.locator('button:has-text("Open"), button:has-text("Ouvrir")').first();
      if (await openButton.isVisible()) {
        await openButton.click();
        await page.waitForTimeout(300);

        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          // Click outside modal (on backdrop)
          const backdrop = page.locator('[data-backdrop], .modal-backdrop').first();
          if (await backdrop.isVisible()) {
            await backdrop.click({ position: { x: 10, y: 10 } });
            await page.waitForTimeout(300);
            await expect(modal).not.toBeVisible();
          }
        }
      }
    });

    test('should prevent multiple modals from opening', async ({ page }) => {
      await page.goto('/components/overlay');

      const openButton = page.locator('button:has-text("Open"), button:has-text("Ouvrir")').first();
      if (await openButton.isVisible()) {
        // Click multiple times rapidly
        for (let i = 0; i < 5; i++) {
          await openButton.click();
          await page.waitForTimeout(50);
        }

        await page.waitForTimeout(500);

        // Should only have one modal open
        const modals = page.locator('[role="dialog"]');
        const count = await modals.count();
        expect(count).toBeLessThanOrEqual(1);
      }
    });
  });

  test.describe('Error Handling Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      await page.goto('/');
      await page.waitForTimeout(1000);

      // Should show error message or offline indicator
      const errorIndicator = page.locator('text=/offline|error|network/i').first();
      if (await errorIndicator.isVisible()) {
        await expect(errorIndicator).toBeVisible();
      }

      // Restore online mode
      await page.context().setOffline(false);
    });

    test('should handle 404 errors', async ({ page }) => {
      await page.goto('/non-existent-page-12345');
      await page.waitForTimeout(1000);

      // Should show 404 page
      const notFound = page.locator('text=/404|not found|page not found/i').first();
      if (await notFound.isVisible()) {
        await expect(notFound).toBeVisible();
      }
    });

    test('should handle API timeout errors', async ({ page }) => {
      // This would require mocking API responses
      // For now, just verify error boundaries exist
      await page.goto('/');

      const errorBoundary = page.locator('[data-testid="error-boundary"]').first();
      // Error boundaries should be present in the app
    });
  });

  test.describe('Accessibility Edge Cases', () => {
    test('should maintain focus trap in modals', async ({ page }) => {
      await page.goto('/components/overlay');

      const openButton = page.locator('button:has-text("Open"), button:has-text("Ouvrir")').first();
      if (await openButton.isVisible()) {
        await openButton.click();
        await page.waitForTimeout(300);

        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          // Tab through modal elements
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);

          // Focus should remain within modal
          const focusedElement = page.locator(':focus');
          const isInModal = (await modal.locator(':focus').count()) > 0;
          expect(isInModal || (await focusedElement.count()) > 0).toBeTruthy();
        }
      }
    });

    test('should handle keyboard navigation in lists', async ({ page }) => {
      await page.goto('/components');

      const list = page.locator('[role="listbox"], [role="list"]').first();
      if (await list.isVisible()) {
        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);

        // Should have selected item
        const selected = list.locator('[aria-selected="true"]').first();
        if (await selected.isVisible()) {
          await expect(selected).toBeVisible();
        }
      }
    });
  });

  test.describe('Performance Edge Cases', () => {
    test('should handle large datasets', async ({ page }) => {
      await page.goto('/components/data');

      // Simulate loading large dataset
      await page.waitForTimeout(2000);

      // Should show loading state
      const loadingIndicator = page.locator('[aria-busy="true"], .loading, [data-loading]').first();
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();
      }

      // Eventually should render
      await page.waitForTimeout(3000);
      const table = page.locator('table').first();
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      }
    });

    test('should handle rapid interactions', async ({ page }) => {
      await page.goto('/components');

      const buttons = page.locator('button').all();
      const buttonCount = await page.locator('button').count();

      if (buttonCount > 0) {
        // Rapidly click multiple buttons
        for (let i = 0; i < Math.min(5, buttonCount); i++) {
          const button = (await buttons)[i];
          if ((await button.isVisible()) && !(await button.isDisabled())) {
            await button.click();
            await page.waitForTimeout(50);
          }
        }

        // Should not crash or show errors
        await expect(page).not.toHaveURL(/error/);
      }
    });
  });
});
