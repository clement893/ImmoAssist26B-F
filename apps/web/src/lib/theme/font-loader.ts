/**
 * Font Loader Utilities
 * Functions to preload fonts and prevent FOUT (Flash of Unstyled Text)
 */

import { logger } from '@/lib/logger';
import { getFont } from '@/lib/api/theme-font';
import type { ThemeFont } from '@modele/types';

interface FontLoadOptions {
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
  fallback?: string;
}

/**
 * Preload a font from a URL
 *
 * @param fontUrl Font URL (Google Fonts or custom)
 * @param options Font loading options
 * @returns Promise that resolves when font is loaded
 */
export function preloadFont(fontUrl: string, options: FontLoadOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve(); // SSR, skip
      return;
    }

    const { display = 'swap', preload = true } = options;

    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    // Create link element for font
    const link = document.createElement('link');
    link.rel = preload ? 'preload' : 'stylesheet';
    link.as = 'style';
    link.href = fontUrl;
    link.crossOrigin = 'anonymous';

    // Add display parameter for Google Fonts
    if (fontUrl.includes('fonts.googleapis.com')) {
      const url = new URL(fontUrl);
      url.searchParams.set('display', display);
      link.href = url.toString();
    }

    link.onload = () => {
      // If preload, also load as stylesheet
      if (preload) {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = link.href;
        styleLink.crossOrigin = 'anonymous';
        document.head.appendChild(styleLink);
      }
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load font: ${fontUrl}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Load font with fallback handling
 * Prevents FOUT by loading font asynchronously
 *
 * @param fontUrl Font URL
 * @param fontFamily Font family name
 * @param options Font loading options
 * @returns Promise that resolves when font is ready
 */
export function loadFontWithFallback(
  fontUrl: string,
  fontFamily: string,
  options: FontLoadOptions = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(); // SSR, skip
      return;
    }

    const { fallback = 'sans-serif' } = options;

    // Set fallback font immediately
    const root = document.documentElement;
    root.style.setProperty('--font-family', `${fontFamily}, ${fallback}`);

    // Preload font
    preloadFont(fontUrl, options)
      .then(() => {
        // Font loaded, update CSS variable
        root.style.setProperty('--font-family', `${fontFamily}, ${fallback}`);
        resolve();
      })
      .catch((error) => {
        // Font failed to load, keep fallback
        logger.warn(`[Font Loader] Failed to load font ${fontFamily}, using fallback`, {
          error,
          fontFamily,
        });
        root.style.setProperty('--font-family', fallback);
        resolve(); // Resolve anyway to not block rendering
      });
  });
}

/**
 * Check if a font is loaded
 *
 * @param fontFamily Font family name
 * @returns true if font is available
 */
export function isFontLoaded(fontFamily: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  // Use FontFace API if available
  if ('fonts' in document) {
    const fontFaceSet = (document as { fonts?: { check?: (font: string) => boolean } }).fonts;
    if (fontFaceSet && fontFaceSet.check) {
      return fontFaceSet.check(`12px "${fontFamily}"`);
    }
  }

  // Fallback: check if font is in computed style
  const testElement = document.createElement('span');
  testElement.style.fontFamily = `"${fontFamily}", monospace`;
  testElement.style.position = 'absolute';
  testElement.style.visibility = 'hidden';
  testElement.style.fontSize = '12px';
  testElement.textContent = 'test';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const loaded = computedStyle.fontFamily.includes(fontFamily);

  document.body.removeChild(testElement);
  return loaded;
}

/**
 * Wait for font to be loaded
 *
 * @param fontFamily Font family name
 * @param timeout Timeout in milliseconds (default: 3000)
 * @returns Promise that resolves when font is loaded or timeout
 */
export function waitForFont(fontFamily: string, timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    if (isFontLoaded(fontFamily)) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isFontLoaded(fontFamily)) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Load theme fonts from S3 by font IDs
 * Fetches font metadata and creates @font-face rules to load the fonts
 *
 * @param fontIds Array of font IDs to load
 * @returns Promise that resolves when all fonts are loaded
 */
export async function loadThemeFonts(fontIds: number[]): Promise<void> {
  if (typeof document === 'undefined') {
    return; // SSR, skip
  }

  if (!fontIds || fontIds.length === 0) {
    return;
  }

  try {
    // Fetch all fonts in parallel
    const fontPromises = fontIds.map((id) =>
      getFont(id).catch((error) => {
        logger.warn(`[Font Loader] Failed to fetch font ${id}`, { error, fontId: id });
        return null; // Return null for failed fonts
      })
    );

    const fonts = await Promise.all(fontPromises);
    const validFonts = fonts.filter((font): font is ThemeFont => font !== null);

    if (validFonts.length === 0) {
      logger.warn('[Font Loader] No valid fonts to load', { fontIds });
      return;
    }

    // Create @font-face rules for each font
    const styleId = 'theme-fonts-dynamic';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Build @font-face rules
    const fontFaceRules: string[] = [];

    for (const font of validFonts) {
      const fontFamily = font.font_family;
      const fontUrl = font.url;
      const fontWeight = font.font_weight || 'normal';
      const fontStyle = font.font_style || 'normal';
      const fontFormat = font.font_format || 'woff2';

      // Create @font-face rule
      const fontFaceRule = `
@font-face {
  font-family: "${fontFamily}";
  src: url("${fontUrl}") format("${fontFormat}");
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: swap;
}`;
      fontFaceRules.push(fontFaceRule);
    }

    // Append new rules to style element
    styleElement.textContent += fontFaceRules.join('\n');

    logger.info('[Font Loader] Loaded theme fonts', {
      count: validFonts.length,
      fontIds: validFonts.map((f) => f.id),
      fontFamilies: validFonts.map((f) => f.font_family),
    });
  } catch (error: unknown) {
    logger.error('[Font Loader] Failed to load theme fonts', { error, fontIds });
    throw error;
  }
}
