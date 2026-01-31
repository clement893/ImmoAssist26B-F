'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminSettingsPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Redirect to main settings page
    router.replace(`/${locale}/settings`);
  }, [router, locale]);

  return null;
}
