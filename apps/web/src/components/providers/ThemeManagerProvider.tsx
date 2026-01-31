/**
 * Theme Manager Provider
 * Initializes and applies theme from localStorage globally
 * This ensures theme preferences are loaded on every page
 */
'use client';

import { useThemeManager } from '@/components/theme/hooks';

/**
 * Provider that initializes theme from localStorage
 * This component doesn't render anything, it just initializes the theme
 */
export default function ThemeManagerProvider({ children }: { children: React.ReactNode }) {
  useThemeManager(); // The hook automatically loads theme from localStorage and applies it
  // We just need to mount it globally so it runs on every page
  return <>{children}</>;
}
