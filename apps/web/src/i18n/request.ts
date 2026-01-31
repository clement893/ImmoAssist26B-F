/**
 * i18n Request Configuration
 * Configures next-intl for Next.js 16 App Router
 */

import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
