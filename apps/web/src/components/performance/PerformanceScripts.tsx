/**
 * Performance Scripts Component
 * Adds performance-related scripts and service worker registration
 */
'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { registerServiceWorker } from '@/lib/performance/serviceWorker';
import { initializePreloading } from '@/lib/performance/preloading';

export function PerformanceScripts() {
  useEffect(() => {
    // Register service worker (with error handling for browser extension conflicts)
    try {
      registerServiceWorker();
    } catch (error) {
      // Silently handle errors from browser extensions interfering with service worker
      // This is a common issue with browser extensions that inject message listeners
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[SW] Service worker registration skipped due to browser extension conflict');
      }
    }

    // Initialize preloading for critical resources
    initializePreloading();

    // Preconnect to external domains for faster loading
    const preconnectDomains = [
      process.env.NEXT_PUBLIC_API_URL,
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ].filter(Boolean);

    preconnectDomains.forEach((domain) => {
      if (domain && typeof document !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, []);

  return null;
}
