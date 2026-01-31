/**
 * i18n Utilities
 * Helper functions for internationalization
 */

// Note: These hooks are re-exported from hooks.ts to maintain compatibility
// The actual implementation doesn't use next-intl
export { useTranslations, useLocale } from './hooks';

export function formatDate(date: Date | string, locale: string = 'fr'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'fr'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number, locale: string = 'fr'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatRelativeTime(date: Date | string, locale: string = 'fr'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}
