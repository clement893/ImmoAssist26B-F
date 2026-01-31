/**
 * App Component avec Web Vitals
 * Monitoring des Core Web Vitals
 */

'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { reportWebVitals } from '@/lib/performance';
import { logger } from '@/lib/logger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if it's an internal page (dashboard, admin, profile, settings, etc.)
  // Works with locales: /fr/dashboard, /en/dashboard, etc.
  const isInternalPage =
    pathname?.includes('/dashboard') ||
    pathname?.includes('/admin') ||
    pathname?.includes('/profile') ||
    pathname?.includes('/settings');

  // Check if it's an auth page (login, register, etc.) - these should have their own backgrounds
  const isAuthPage = pathname?.includes('/auth/');

  useEffect(() => {
    // Track page views
    logger.info('Page view', {
      pathname,
      searchParams: searchParams.toString(),
      type: 'page_view',
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observers: PerformanceObserver[] = [];

      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };
        if (lastEntry.renderTime || lastEntry.loadTime) {
          const value = (lastEntry.renderTime || lastEntry.loadTime || 0) / 1000;
          reportWebVitals({
            id: 'lcp',
            name: 'LCP',
            value,
            label: 'largest-contentful-paint',
          });
          logger.performance('LCP', value, 's');
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const perfEntry = entry as PerformanceEventTiming;
          if ('processingStart' in perfEntry && 'startTime' in perfEntry) {
            const value = perfEntry.processingStart - perfEntry.startTime;
            reportWebVitals({
              id: 'fid',
              name: 'FID',
              value: value / 1000,
              label: 'first-input-delay',
            });
            logger.performance('FID', value / 1000, 's');
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as LayoutShift;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });
        reportWebVitals({
          id: 'cls',
          name: 'CLS',
          value: clsValue,
          label: 'cumulative-layout-shift',
        });
        logger.performance('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);

      // Cleanup function - always return cleanup
      return () => {
        observers.forEach((observer) => observer.disconnect());
      };
    }

    // Return empty cleanup if PerformanceObserver not available
    return () => {};
  }, []);

  // For internal pages (dashboard), don't show Header/Footer (handled by InternalLayout)
  if (isInternalPage) {
    return <>{children}</>;
  }

  // For auth pages, don't wrap with Header/Footer or background - let them handle their own styling
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For public pages, show Header and Footer
  // Note: Background is handled by body tag in layout.tsx, so we don't override it here
  // This allows individual pages to set their own backgrounds (gradients, etc.)
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export const App = React.memo(({ children }: { children: React.ReactNode }) => {
  // Removed Suspense wrapper - usePathname and useSearchParams are already wrapped by Next.js
  // This prevents unnecessary loading states and re-renders
  return <AppContent>{children}</AppContent>;
});

App.displayName = 'App';
