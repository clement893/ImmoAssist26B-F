import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(500);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('cancels previous timeout when value changes quickly', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 500 },
    });

    rerender({ value: 'second', delay: 500 });
    vi.advanceTimersByTime(200);

    rerender({ value: 'third', delay: 500 });
    vi.advanceTimersByTime(200);

    expect(result.current).toBe('first');

    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(result.current).toBe('third');
    });
  });

  it('works with different types', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 300 },
    });

    rerender({ value: 100, delay: 300 });
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('respects delay parameter', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'test', delay: 1000 },
    });

    rerender({ value: 'updated', delay: 1000 });
    vi.advanceTimersByTime(500);
    expect(result.current).toBe('test');

    vi.advanceTimersByTime(500);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('cleans up timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('test', 500));
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
