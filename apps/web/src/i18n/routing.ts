/**
 * i18n Routing Configuration
 * Defines supported locales and routing behavior
 */

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

// Supported locales
export const locales = ['en', 'fr', 'ar', 'he'] as const;
export type Locale = (typeof locales)[number];

// RTL locales
export const rtlLocales: Locale[] = ['ar', 'he'];

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  he: 'עברית',
};

// Locale native names
export const localeNativeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  he: 'עברית',
};

// Check if locale is RTL
export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Routing configuration
export const routing = defineRouting({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Locale prefix strategy
  localePrefix: {
    mode: 'as-needed', // Only show locale prefix when not default
    prefixes: {
      en: '', // English has no prefix
      fr: '/fr',
      ar: '/ar',
      he: '/he',
    },
  },
});

// Typed navigation helpers
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
