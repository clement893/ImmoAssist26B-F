/**
 * Hooks i18n
 * Hooks React pour utiliser les traductions
 */

'use client';

import { useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { messages, type Locale } from './messages';
import { defaultLocale } from './config';

export function useLocale(): Locale {
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') as Locale | null;
  return locale && locale in messages ? locale : defaultLocale;
}

export function useTranslations(namespace?: keyof typeof messages.fr) {
  const locale = useLocale();
  const t = useMemo(() => {
    const localeMessages = messages[locale];
    if (namespace) {
      return localeMessages[namespace];
    }
    return localeMessages;
  }, [locale, namespace]);

  return t;
}

export function useSwitchLocale() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (newLocale: Locale) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', newLocale);
    return `${pathname}?${params.toString()}`;
  };
}
