import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCSRF, withCSRF } from '../useCSRF';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('useCSRF', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches CSRF token on mount', async () => {
    const mockToken = 'test-csrf-token';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ csrfToken: mockToken }),
    } as Response);

    const { result } = renderHook(() => useCSRF());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.csrfToken).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith('/api/csrf');
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCSRF());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.csrfToken).toBeNull();
  });

  it('sets loading to false after fetch completes', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ csrfToken: 'token' }),
    } as Response);

    const { result } = renderHook(() => useCSRF());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
  });
});

describe('withCSRF', () => {
  beforeEach(() => {
    // Clear cookies
    document.cookie = '';
  });

  it('adds CSRF token to headers when token exists', () => {
    document.cookie = 'csrf-token=test-token-123';

    const [url, options] = withCSRF('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(url).toBe('/api/test');
    expect(options.headers).toBeInstanceOf(Headers);
    const headers = options.headers as Headers;
    expect(headers.get('X-CSRF-Token')).toBe('test-token-123');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('does not add CSRF token when token does not exist', () => {
    document.cookie = '';

    const [url, options] = withCSRF('/api/test', {
      method: 'POST',
    });

    expect(url).toBe('/api/test');
    const headers = options.headers as Headers;
    expect(headers.get('X-CSRF-Token')).toBeNull();
  });

  it('preserves existing headers', () => {
    document.cookie = 'csrf-token=test-token';

    const [url, options] = withCSRF('/api/test', {
      headers: { Authorization: 'Bearer token' },
    });

    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token');
    expect(headers.get('X-CSRF-Token')).toBe('test-token');
  });

  it('handles multiple cookies correctly', () => {
    document.cookie = 'other-cookie=value; csrf-token=correct-token; another=value';

    const [url, options] = withCSRF('/api/test');

    const headers = options.headers as Headers;
    expect(headers.get('X-CSRF-Token')).toBe('correct-token');
  });
});
