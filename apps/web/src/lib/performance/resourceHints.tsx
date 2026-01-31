/**
 * Resource Hints Component
 * Adds resource hints to the document head for better performance
 */

'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { initializePreloading } from './preloading';

export function ResourceHints() {
  useEffect(() => {
    try {
      // Initialize preloading for critical resources
      initializePreloading();

      // Preload critical routes on hover using Next.js prefetch API
      // Note: We can't use useRouter hook here, so we use the router.prefetch method directly
      // This is done via link prefetching which Next.js handles automatically
      // For manual prefetching, we'd need to use the router in a component context

      return () => {
        // Cleanup if needed
      };
    } catch (error) {
      // Silently fail - resource hints are performance optimizations, not critical
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Failed to initialize resource hints:', error);
      }
      return () => {
        // Return cleanup function even if initialization failed
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
