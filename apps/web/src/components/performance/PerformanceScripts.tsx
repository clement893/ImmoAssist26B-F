/**
 * Performance Scripts Component
 * Adds performance-related scripts and service worker registration
 */
'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { registerServiceWorker } from '@/lib/performance/serviceWorker';

export function PerformanceScripts() {
  useEffect(() => {
    try {
      registerServiceWorker();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[SW] Service worker registration skipped due to browser extension conflict');
      }
    }
    // Preconnect is handled in layout <head> and preloading.ts; avoid duplicate calls here
  }, []);

  return null;
}
