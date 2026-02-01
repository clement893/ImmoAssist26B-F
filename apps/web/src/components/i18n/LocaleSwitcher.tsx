/**
 * Locale Switcher Component (Updated for next-intl)
 * Allows users to switch between available languages
 * Supports RTL languages (Arabic, Hebrew)
 */
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, localeNativeNames, isRTL, type Locale } from '@/i18n/routing';
import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    setIsOpen(false);

    // Get current pathname without locale
    const pathWithoutLocale = pathname.replace(/^\/(en|fr|ar|he)/, '') || '/';

    // Build new path with locale
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`;

    // Navigate to new locale
    router.push(newPath);

    // Small delay before reload to ensure navigation
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{localeNames[locale]}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-background rounded-lg shadow-standard-lg border border-border z-20"> // UI Revamp - Nouveau système d'ombres
            <div className="py-1">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={clsx(
                    'w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-muted dark:hover:bg-muted transition-modern', // UI Revamp - Transition moderne
                    locale === loc && 'bg-muted'
                  )}
                  dir={isRTL(loc) ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{localeNativeNames[loc]}</span>
                    <span className="text-xs text-muted-foreground">{localeNames[loc]}</span>
                  </div>
                  {locale === loc && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
