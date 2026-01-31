'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main settings page (default to English locale)
    router.replace('/en/settings');
  }, [router]);

  return null;
}
