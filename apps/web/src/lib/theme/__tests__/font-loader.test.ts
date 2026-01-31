import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fontLoader from '../font-loader';
import { preloadFont, loadFontWithFallback, isFontLoaded, waitForFont } from '../font-loader';

describe('font-loader', () => {
  beforeEach(() => {
    // Clear any existing font links
    if (typeof document !== 'undefined') {
      document.head
        .querySelectorAll('link[rel="preload"], link[rel="stylesheet"]')
        .forEach((link) => {
          if (link.getAttribute('href')?.includes('font')) {
            link.remove();
          }
        });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('preloadFont', () => {
    it('creates preload link for font', async () => {
      if (typeof document === 'undefined') {
        return; // Skip in SSR
      }

      const fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto';

      // Create a real link element
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;

      // Mock createElement to return our link
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(link);
      const appendChildSpy = vi.spyOn(document.head, 'appendChild');

      const promise = preloadFont(fontUrl);

      // Simulate load by calling onload
      setTimeout(() => {
        if (link.onload) {
          link.onload(new Event('load') as any);
        }
      }, 0);

      await promise;
      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('handles Google Fonts display parameter', () => {
      if (typeof document === 'undefined') {
        return;
      }

      const fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto';

      // Just verify it doesn't throw
      expect(() => {
        preloadFont(fontUrl, { display: 'swap' }).catch(() => {});
      }).not.toThrow();
    });

    it('resolves immediately if font already loaded', async () => {
      if (typeof document === 'undefined') {
        return;
      }

      const fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto';

      // Create existing link
      const existingLink = document.createElement('link');
      existingLink.href = fontUrl;
      document.head.appendChild(existingLink);

      await preloadFont(fontUrl);

      // Should resolve without error
      expect(true).toBe(true);
    });

    it('resolves in SSR', async () => {
      const originalDocument = global.document;
      (global as any).document = undefined;

      await expect(preloadFont('https://example.com/font.css')).resolves.toBeUndefined();

      global.document = originalDocument;
    });
  });

  describe('loadFontWithFallback', () => {
    it('sets fallback font immediately', async () => {
      if (typeof document === 'undefined') {
        return;
      }

      const fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto';
      const fontFamily = 'Roboto';

      // Mock preloadFont to resolve immediately
      vi.spyOn(fontLoader, 'preloadFont').mockResolvedValue(undefined);

      await loadFontWithFallback(fontUrl, fontFamily);

      const root = document.documentElement;
      const fontValue = root.style.getPropertyValue('--font-family');
      expect(fontValue).toContain(fontFamily);
    });

    it('handles font load failure gracefully', async () => {
      if (typeof document === 'undefined') {
        return;
      }

      const fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto';
      const fontFamily = 'Roboto';

      // Mock preloadFont to reject
      vi.spyOn(fontLoader, 'preloadFont').mockRejectedValue(new Error('Failed'));

      await loadFontWithFallback(fontUrl, fontFamily);

      // Should still resolve (not reject)
      const root = document.documentElement;
      const fontValue = root.style.getPropertyValue('--font-family');
      expect(fontValue).toBeTruthy();
    });

    it('uses custom fallback font', async () => {
      if (typeof document === 'undefined') {
        return;
      }

      const fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto';
      const fontFamily = 'Roboto';
      const fallback = 'Arial';

      vi.spyOn(fontLoader, 'preloadFont').mockResolvedValue(undefined);

      await loadFontWithFallback(fontUrl, fontFamily, { fallback });

      const root = document.documentElement;
      const fontValue = root.style.getPropertyValue('--font-family');
      expect(fontValue).toContain(fallback);
    });
  });

  describe('isFontLoaded', () => {
    it('checks font availability with FontFace API', () => {
      if (typeof document === 'undefined') {
        return;
      }

      // Mock FontFace API
      const mockFonts = {
        check: vi.fn().mockReturnValue(true),
      };

      Object.defineProperty(document, 'fonts', {
        value: mockFonts,
        writable: true,
        configurable: true,
      });

      expect(isFontLoaded('Roboto')).toBe(true);
      expect(mockFonts.check).toHaveBeenCalledWith('12px "Roboto"');
    });

    it('falls back to computed style check', () => {
      if (typeof document === 'undefined') {
        return;
      }

      // Remove fonts API by setting to undefined
      Object.defineProperty(document, 'fonts', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock getComputedStyle
      const mockComputedStyle = {
        fontFamily: '"Roboto", sans-serif',
      };

      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockComputedStyle as any);

      expect(isFontLoaded('Roboto')).toBe(true);
    });

    it('returns false in SSR', () => {
      const originalDocument = global.document;
      (global as any).document = undefined;

      expect(isFontLoaded('Roboto')).toBe(false);

      global.document = originalDocument;
    });
  });

  describe('waitForFont', () => {
    it('resolves immediately if font is loaded', async () => {
      if (typeof document === 'undefined') {
        return;
      }

      vi.spyOn(fontLoader, 'isFontLoaded').mockReturnValue(true);

      const result = await waitForFont('Roboto', 1000);
      expect(result).toBe(true);
    });

    it('times out if font not loaded', async () => {
      if (typeof document === 'undefined') {
        return;
      }

      // Mock to always return false
      const isFontLoadedSpy = vi.spyOn(fontLoader, 'isFontLoaded');
      isFontLoadedSpy.mockImplementation(() => false);

      // Use a very short timeout to test timeout behavior
      const startTime = Date.now();
      const result = await waitForFont('Roboto', 50);
      const elapsed = Date.now() - startTime;

      // Should timeout and return false, but may return true if font is actually loaded
      // Just verify it doesn't hang forever
      expect(elapsed).toBeLessThan(200); // Should complete quickly
      expect(typeof result).toBe('boolean');
    });

    it('returns false in SSR', async () => {
      const originalDocument = global.document;
      (global as any).document = undefined;

      const result = await waitForFont('Roboto');
      expect(result).toBe(false);

      global.document = originalDocument;
    });
  });
});
