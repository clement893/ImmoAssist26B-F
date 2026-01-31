import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCsrfToken, fetchCsrfToken, addCsrfHeader, createCsrfHeaders } from '../csrf';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('getCsrfToken', () => {
  beforeEach(() => {
    global.window = undefined as unknown as Window & typeof globalThis;
    document.querySelector = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null in SSR', () => {
    const result = getCsrfToken();
    expect(result).toBeNull();
  });

  it('returns token from meta tag', () => {
    global.window = {} as unknown as Window & typeof globalThis;
    const mockMeta = {
      getAttribute: vi.fn().mockReturnValue('test-csrf-token'),
    };
    (document.querySelector as ReturnType<typeof vi.fn>).mockReturnValue(mockMeta);

    const result = getCsrfToken();
    expect(result).toBe('test-csrf-token');
    expect(document.querySelector).toHaveBeenCalledWith('meta[name="csrf-token"]');
  });

  it('returns null when meta tag does not exist', () => {
    global.window = {} as unknown as Window & typeof globalThis;
    (document.querySelector as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const result = getCsrfToken();
    expect(result).toBeNull();
  });
});

describe('fetchCsrfToken', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    global.window = {} as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null in SSR', async () => {
    global.window = undefined as unknown as Window & typeof globalThis;
    const result = await fetchCsrfToken();
    expect(result).toBeNull();
  });

  it('fetches and returns CSRF token', async () => {
    const mockToken = 'test-csrf-token';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrfToken: mockToken }),
    } as Response);

    const result = await fetchCsrfToken();
    expect(result).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('returns null when response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const result = await fetchCsrfToken();
    expect(result).toBeNull();
  });

  it('returns null when response has no csrfToken', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const result = await fetchCsrfToken();
    expect(result).toBeNull();
  });

  it('handles fetch errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchCsrfToken();
    expect(result).toBeNull();
  });
});

describe('addCsrfHeader', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    global.window = {} as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds CSRF token to Headers object', async () => {
    const mockToken = 'test-token';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrfToken: mockToken }),
    } as Response);

    const headers = new Headers({ 'Content-Type': 'application/json' });
    const result = await addCsrfHeader(headers);

    expect(result).toBeInstanceOf(Headers);
    const resultHeaders = result as Headers;
    expect(resultHeaders.get('X-CSRF-Token')).toBe(mockToken);
    expect(resultHeaders.get('Content-Type')).toBe('application/json');
  });

  it('adds CSRF token to plain object headers', async () => {
    const mockToken = 'test-token';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrfToken: mockToken }),
    } as Response);

    const headers = { 'Content-Type': 'application/json' };
    const result = await addCsrfHeader(headers);

    expect(result).toBeInstanceOf(Headers);
    const resultHeaders = result as Headers;
    expect(resultHeaders.get('X-CSRF-Token')).toBe(mockToken);
  });

  it('does not add CSRF token when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const headers = new Headers();
    const result = await addCsrfHeader(headers);

    const resultHeaders = result as Headers;
    expect(resultHeaders.get('X-CSRF-Token')).toBeNull();
  });
});

describe('createCsrfHeaders', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    global.window = {} as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates headers with CSRF token', async () => {
    const mockToken = 'test-token';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrfToken: mockToken }),
    } as Response);

    const result = await createCsrfHeaders();

    expect(result).toEqual({
      'Content-Type': 'application/json',
      'X-CSRF-Token': mockToken,
    });
  });

  it('includes additional headers', async () => {
    const mockToken = 'test-token';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrfToken: mockToken }),
    } as Response);

    const result = await createCsrfHeaders({ Authorization: 'Bearer token' });

    expect(result).toEqual({
      'Content-Type': 'application/json',
      'X-CSRF-Token': mockToken,
      Authorization: 'Bearer token',
    });
  });

  it('does not include CSRF token when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const result = await createCsrfHeaders();

    expect(result).toEqual({
      'Content-Type': 'application/json',
    });
    expect(result).not.toHaveProperty('X-CSRF-Token');
  });
});
