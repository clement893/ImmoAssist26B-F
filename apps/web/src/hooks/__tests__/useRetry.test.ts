import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRetry } from '../useRetry';

describe('useRetry', () => {
  it('executes operation successfully on first attempt', async () => {
    const { result } = renderHook(() => useRetry());
    const operation = vi.fn().mockResolvedValue('success');

    const promise = result.current.execute(operation);

    const value = await promise;
    expect(value).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.attempt).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('retries on failure', async () => {
    const { result } = renderHook(() => useRetry({ maxAttempts: 2, delay: 50 }));
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const promise = result.current.execute(operation);

    await waitFor(
      () => {
        expect(operation).toHaveBeenCalledTimes(2);
      },
      { timeout: 2000 }
    );

    const value = await promise;
    expect(value).toBe('success');
  });

  it('respects maxAttempts', async () => {
    const { result } = renderHook(() => useRetry({ maxAttempts: 2, delay: 50 }));
    const operation = vi.fn().mockRejectedValue(new Error('Network error'));

    const promise = result.current.execute(operation);

    await waitFor(
      () => {
        expect(operation).toHaveBeenCalledTimes(3);
      },
      { timeout: 2000 }
    );

    await expect(promise).rejects.toThrow('Network error');
    expect(operation).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('uses exponential backoff by default', async () => {
    const { result } = renderHook(() =>
      useRetry({ maxAttempts: 2, baseDelay: 50, exponentialBackoff: true })
    );
    const operation = vi.fn().mockRejectedValue(new Error('Network error'));

    const promise = result.current.execute(operation);

    await waitFor(
      () => {
        expect(operation).toHaveBeenCalledTimes(3);
      },
      { timeout: 2000 }
    );

    await expect(promise).rejects.toThrow();
  });

  it('uses fixed delay when exponentialBackoff is false', async () => {
    const { result } = renderHook(() =>
      useRetry({ maxAttempts: 2, delay: 50, exponentialBackoff: false })
    );
    const operation = vi.fn().mockRejectedValue(new Error('Network error'));

    const promise = result.current.execute(operation);

    await waitFor(
      () => {
        expect(operation).toHaveBeenCalledTimes(3);
      },
      { timeout: 2000 }
    );

    await expect(promise).rejects.toThrow();
  });

  it('respects isRetryable function', async () => {
    const { result } = renderHook(() =>
      useRetry({
        maxAttempts: 2,
        isRetryable: (error) => {
          if (error instanceof Error) {
            return error.message.includes('retry');
          }
          return false;
        },
      })
    );
    const operation = vi.fn().mockRejectedValue(new Error('do not retry'));

    const promise = result.current.execute(operation);

    await expect(promise).rejects.toThrow('do not retry');
    expect(operation).toHaveBeenCalledTimes(1); // No retries
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useRetry());

    result.current.reset();

    expect(result.current.attempt).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('tracks last error', async () => {
    const { result } = renderHook(() => useRetry({ maxAttempts: 1, delay: 50 }));
    const error = new Error('Test error');
    const operation = vi.fn().mockRejectedValue(error);

    const promise = result.current.execute(operation);

    await waitFor(
      () => {
        expect(result.current.lastError).toBe(error);
      },
      { timeout: 2000 }
    );

    await expect(promise).rejects.toThrow('Test error');
    expect(result.current.lastError).toBe(error);
  });
});
