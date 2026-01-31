'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query/queryClient';
import { useState } from 'react';

/**
 * Query Provider Component
 *
 * Wraps the application with React Query provider for API state management
 * Includes devtools in development mode
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use useState to ensure we only create one QueryClient instance per component lifecycle
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
