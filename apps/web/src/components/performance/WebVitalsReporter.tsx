/**
 * Web Vitals Reporter Component
 * Client-side component to track and report Web Vitals
 */
'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/performance/webVitals';

export function WebVitalsReporter() {
  useEffect(() => {
    // Only track in production or when explicitly enabled
    const shouldTrack =
      process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === 'true';

    if (shouldTrack) {
      reportWebVitals();
    }
  }, []);

  return null; // This component doesn't render anything
}
