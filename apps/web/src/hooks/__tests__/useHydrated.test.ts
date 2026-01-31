/**
 * useHydrated Hook Tests
 *
 * Tests for the useHydrated hook covering:
 * - Initial hydration state
 * - Hydration completion
 * - Timing behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHydrated } from '../useHydrated';

describe('useHydrated Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false initially', () => {
    const { result } = renderHook(() => useHydrated());

    expect(result.current).toBe(false);
  });

  it('returns true after hydration completes', async () => {
    const { result } = renderHook(() => useHydrated());

    // Fast-forward to next tick
    vi.advanceTimersByTime(0);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('completes hydration on next tick', async () => {
    const { result } = renderHook(() => useHydrated());

    expect(result.current).toBe(false);

    // Advance timers
    vi.advanceTimersByTime(0);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('cleans up timeout on unmount', () => {
    const { unmount } = renderHook(() => useHydrated());

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('maintains true state after hydration', async () => {
    const { result } = renderHook(() => useHydrated());

    // Complete hydration
    vi.advanceTimersByTime(0);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // State should remain true
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
