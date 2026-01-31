'use client';

import { useEffect } from 'react';
import { initGoogleAnalytics, trackPageView } from '@/lib/marketing/analytics';
import { usePathname } from 'next/navigation';

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Google Analytics
    initGoogleAnalytics(measurementId);
  }, [measurementId]);

  useEffect(() => {
    // Track page views on route change
    if (pathname && typeof window !== 'undefined' && window.gtag) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}
