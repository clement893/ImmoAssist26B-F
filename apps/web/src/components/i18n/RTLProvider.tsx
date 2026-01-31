/**
 * RTL Provider Component
 * Handles RTL (Right-to-Left) layout for Arabic and Hebrew languages
 */
'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import { isRTL, type Locale } from '@/i18n/routing';

export default function RTLProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as Locale;
  const rtl = isRTL(locale);

  useEffect(() => {
    // Set dir attribute on html element
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);

    // Add RTL class to body for CSS targeting
    if (rtl) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Cleanup
    return () => {
      document.body.classList.remove('rtl', 'ltr');
    };
  }, [locale, rtl]);

  return <>{children}</>;
}
