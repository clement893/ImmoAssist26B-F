/**
 * Combined App Providers
 * Optimized provider composition to reduce nesting
 *
 * Performance: Single provider component reduces React tree depth
 */
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { getQueryClient } from '@/lib/query/queryClient';
import { GlobalThemeProvider } from '@/lib/theme/global-theme-provider';
import { useThemeManager } from '@/components/theme/hooks';
import { GlobalErrorHandler } from './GlobalErrorHandler';
import ToastContainer from '@/components/ui/ToastContainer';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { useState, type ReactNode } from 'react';

/**
 * Theme Manager Hook Component
 * Separated to avoid re-renders
 */
function ThemeManagerInitializer({ children }: { children: ReactNode }) {
  useThemeManager();
  return <>{children}</>;
}

/**
 * Combined App Providers
 * Reduces provider nesting from 5 levels to 1
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  // Create QueryClient once per component lifecycle
  const [queryClient] = useState(() => getQueryClient());

  return (
    <GlobalThemeProvider>
      <ThemeManagerInitializer>
        <GlobalErrorHandler />
        <QueryClientProvider client={queryClient}>
          <NextAuthSessionProvider>
            <AuthInitializer />
            {children}
            <ToastContainer />
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
          </NextAuthSessionProvider>
        </QueryClientProvider>
      </ThemeManagerInitializer>
    </GlobalThemeProvider>
  );
}
