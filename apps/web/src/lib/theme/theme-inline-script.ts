/**
 * Inline script to apply theme before React hydration
 * This prevents FOUC (Flash of Unstyled Content) on hard refresh
 *
 * IMPORTANT: This script must execute IMMEDIATELY and SYNCHRONOUSLY
 * to prevent any color flash. It applies default colors first, then
 * loads the actual theme asynchronously.
 */

export const themeInlineScript = `
(function() {
  'use strict';
  
  // Execute immediately - don't wait for DOMContentLoaded
  // This ensures colors are applied before any CSS is rendered
  
  // Function to generate color shades using HSL-based approach (preserves hue)
  function generateColorShades(hex) {
    function hexToRgb(hex) {
      const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    
    function rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
    
    function rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) {
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
          h = ((b - r) / d + 2) / 6;
        } else {
          h = ((r - g) / d + 4) / 6;
        }
      }
      return { h: h * 360, s: s * 100, l: l * 100 };
    }
    
    function hslToRgb(h, s, l) {
      h /= 360;
      s /= 100;
      l /= 100;
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = function(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    }
    
    const rgb = hexToRgb(hex);
    if (!rgb) return {};
    
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const baseLightness = hsl.l;
    const baseSaturation = hsl.s;
    const baseHue = hsl.h;
    
    function generateShade(targetLightness) {
      // Improved saturation adjustment for better contrast
      // Ensures lighter shades maintain minimum saturation for visibility
      var adjustedSaturation = baseSaturation;
      if (targetLightness > baseLightness) {
        // Lighter shades: maintain minimum saturation for contrast
        // For very light shades (90+), maintain higher saturation for better contrast
        if (targetLightness >= 90) {
          // Keep at least 30% saturation for very light shades to ensure visibility
          var reduction = (targetLightness - baseLightness) / 200; // Even less aggressive reduction
          adjustedSaturation = Math.max(30, baseSaturation * (1 - reduction * 0.5)); // Minimum 30% saturation
        } else {
          // For medium-light shades, reduce more gradually
          var reduction = (targetLightness - baseLightness) / 150;
          adjustedSaturation = Math.max(25, baseSaturation * (1 - reduction)); // Minimum 25% saturation
        }
      } else {
        // Darker shades: increase saturation for richer colors
        adjustedSaturation = Math.min(100, baseSaturation * (1 + (baseLightness - targetLightness) / 150));
      }
      var shadeRgb = hslToRgb(baseHue, adjustedSaturation, targetLightness);
      return rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b);
    }
    
    // Improved lightness values for better contrast
    // Increased gaps between shades for better contrast
    const shades = {
      50: generateShade(98),   // Very light (increased for maximum contrast)
      100: generateShade(93),  // Light (increased gap from 50)
      200: generateShade(86),  // Lighter (increased gap from 100)
      300: generateShade(76),  // Light (increased gap from 200)
      400: generateShade(66),  // Medium-light (increased gap from 300)
      500: hex,                // Base color
      600: generateShade(46),  // Medium-dark (increased gap from 500)
      700: generateShade(36),  // Dark (increased gap from 600)
      800: generateShade(26),  // Darker (increased gap from 700)
      900: generateShade(16),  // Very dark (increased gap from 800)
      950: generateShade(9)    // Darkest (increased gap from 900)
    };
    
    return shades;
  }
  
  function generateRgb(hex) {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? result[1] + ', ' + result[2] + ', ' + result[3] : '';
  }
  
  function applyThemeConfig(config) {
    const root = document.documentElement;
    
    // Support both flat format (primary_color) and nested format (colors.primary)
    const colorsConfig = config.colors || {};
    const primaryColor = config.primary_color || colorsConfig.primary_color || colorsConfig.primary;
    const secondaryColor = config.secondary_color || colorsConfig.secondary_color || colorsConfig.secondary;
    const dangerColor = config.danger_color || colorsConfig.danger_color || colorsConfig.destructive || colorsConfig.danger;
    const warningColor = config.warning_color || colorsConfig.warning_color || colorsConfig.warning;
    const infoColor = config.info_color || colorsConfig.info_color || colorsConfig.info;
    const successColor = config.success_color || colorsConfig.success_color || colorsConfig.success;
    
    // Apply primary colors
    if (primaryColor) {
      const shades = generateColorShades(primaryColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-primary-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-primary-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply secondary colors
    if (secondaryColor) {
      const shades = generateColorShades(secondaryColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-secondary-' + shade, color);
        if (!successColor) {
          root.style.setProperty('--color-success-' + shade, color);
        }
        if (shade === '500') {
          root.style.setProperty('--color-secondary-rgb', generateRgb(color));
          if (!successColor) {
            root.style.setProperty('--color-success-rgb', generateRgb(color));
          }
        }
      });
    }
    
    // Apply danger colors
    if (dangerColor) {
      const shades = generateColorShades(dangerColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-danger-' + shade, color);
        root.style.setProperty('--color-error-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-danger-rgb', generateRgb(color));
          root.style.setProperty('--color-error-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply warning colors
    if (warningColor) {
      const shades = generateColorShades(warningColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-warning-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-warning-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply info colors
    if (infoColor) {
      const shades = generateColorShades(infoColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-info-' + shade, color);
      });
    }
    
    // Apply success colors
    if (successColor) {
      const shades = generateColorShades(successColor);
      Object.entries(shades).forEach(function([shade, color]) {
        root.style.setProperty('--color-success-' + shade, color);
        if (shade === '500') {
          root.style.setProperty('--color-success-rgb', generateRgb(color));
        }
      });
    }
    
    // Apply other colors from nested colors object
    // Note: We only set CSS variables, not body styles directly, to prevent hydration mismatches
    // Body styles are handled via CSS in layout.tsx using these CSS variables
    if (colorsConfig.background) {
      root.style.setProperty('--color-background', colorsConfig.background);
    }
    if (colorsConfig.foreground) {
      root.style.setProperty('--color-foreground', colorsConfig.foreground);
    }
    if (colorsConfig.muted) {
      root.style.setProperty('--color-muted', colorsConfig.muted);
    }
    if (colorsConfig.mutedForeground) {
      root.style.setProperty('--color-muted-foreground', colorsConfig.mutedForeground);
    }
    if (colorsConfig.border) {
      root.style.setProperty('--color-border', colorsConfig.border);
    }
    if (colorsConfig.input) {
      root.style.setProperty('--color-input', colorsConfig.input);
    }
    if (colorsConfig.ring) {
      root.style.setProperty('--color-ring', colorsConfig.ring);
    }
    
    // Apply fonts - Only set CSS variables, don't modify body directly to avoid hydration issues
    if (config.font_family) {
      const fontFamily = config.font_family.trim();
      root.style.setProperty('--font-family', fontFamily + ', sans-serif');
      root.style.setProperty('--font-family-heading', fontFamily + ', sans-serif');
      root.style.setProperty('--font-family-subheading', fontFamily + ', sans-serif');
      // Don't modify document.body directly - let CSS handle it via var(--font-family)
    }
    
    // Apply fonts from typography config if available
    if (config.typography && config.typography.fontFamily) {
      const fontFamily = String(config.typography.fontFamily).trim();
      root.style.setProperty('--font-family', fontFamily);
      if (config.typography.fontFamilyHeading) {
        root.style.setProperty('--font-family-heading', String(config.typography.fontFamilyHeading));
      }
      if (config.typography.fontFamilySubheading) {
        root.style.setProperty('--font-family-subheading', String(config.typography.fontFamilySubheading));
      }
      // Don't modify document.body directly - let CSS handle it via var(--font-family)
    }
    
    // Load font URL if configured
    if (config.font_url || (config.typography && config.typography.fontUrl)) {
      const fontUrl = config.font_url || config.typography.fontUrl;
      const existingLink = document.querySelector('link[data-theme-font]');
      if (existingLink) {
        existingLink.remove();
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      link.setAttribute('data-theme-font', 'true');
      document.head.appendChild(link);
    }
    
    // Apply border radius (support both string and object formats)
    if (config.border_radius) {
      root.style.setProperty('--border-radius', config.border_radius);
    }
    
    // Support borderRadius object format (sm, md, lg, xl, full)
    if (config.borderRadius) {
      Object.entries(config.borderRadius).forEach(function([key, value]) {
        root.style.setProperty('--border-radius-' + key, String(value));
      });
    }
    
    // Apply typography fontSize
    if (config.typography && config.typography.fontSize) {
      Object.entries(config.typography.fontSize).forEach(function([key, value]) {
        root.style.setProperty('--font-size-' + key, String(value));
      });
    }
    
    // Apply spacing
    if (config.spacing) {
      Object.entries(config.spacing).forEach(function([key, value]) {
        root.style.setProperty('--spacing-' + key, String(value));
      });
    }
  }
  
  // NOTE: We NO LONGER apply default theme colors or fetch from API here.
  // This was causing the "green buttons flash" issue because:
  // 1. Default colors were applied immediately (including success_color: '#059669')
  // 2. Then a fetch API call was made (async, takes time)
  // 3. During this delay, buttons showed green colors
  // 4. Finally, React hydrated and GlobalThemeProvider applied the correct theme
  //
  // SOLUTION: Let the CSS inline styles in layout.tsx handle default colors,
  // and let GlobalThemeProvider handle theme loading from cache (sync) and API (async).
  // This eliminates the race condition and prevents the color flash.
})();
`;
