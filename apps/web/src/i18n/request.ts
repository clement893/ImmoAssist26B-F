/**
 * i18n Request Configuration
 * Configures next-intl for Next.js 16 App Router
 * Uses unstable_cache to avoid re-reading message JSON on every request (performance).
 */

import { getRequestConfig } from 'next-intl/server';
import { unstable_cache } from 'next/cache';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = await unstable_cache(
    async () => (await import(`../../messages/${locale}.json`)).default,
    ['intl-messages', locale],
    { revalidate: 3600, tags: [`intl-${locale}`] }
  )();

  return { locale, messages };
});
