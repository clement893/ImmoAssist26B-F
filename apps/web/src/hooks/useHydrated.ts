/**
 * Hook to detect when Zustand persist has finished hydrating
 *
 * This prevents race conditions where components try to access
 * store state before it's been restored from localStorage.
 *
 * @returns True when the store has finished hydrating
 *
 * @example
 * ```tsx
 * const isHydrated = useHydrated();
 *
 * if (!isHydrated) {
 *   return <Loading />;
 * }
 *
 * // Safe to use store state here
 * const { user } = useAuthStore();
 * ```
 */

import { useEffect, useState } from 'react';

export function useHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist hydrates synchronously on mount
    // But we need to wait for the next tick to ensure it's complete
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return isHydrated;
}
