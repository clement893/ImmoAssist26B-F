import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useAuth } from '@/hooks/useAuth';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { useAuthStore } from '@/lib/store';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/lib/auth/tokenStorage');
vi.mock('@/lib/store');

// Mock server setup
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe('Authentication Integration Tests', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockSetUser = vi.fn();
  const mockSetError = vi.fn();
  const mockSetToken = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: () => false,
      login: mockLogin,
      logout: mockLogout,
      setUser: mockSetUser,
      setError: mockSetError,
      error: null,
    } as any);

    vi.mocked(TokenStorage.setToken).mockResolvedValue(undefined);
    vi.mocked(TokenStorage.removeTokens).mockReturnValue(undefined);
    vi.mocked(TokenStorage.getToken).mockReturnValue(null);
    vi.mocked(TokenStorage.getRefreshToken).mockReturnValue(null);
  });

  describe('Login Flow', () => {
    it('successfully logs in user and stores tokens', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      server.use(
        rest.post('http://localhost:8000/api/v1/auth/login', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                access_token: 'access-token-123',
                refresh_token: 'refresh-token-456',
                user: mockUser,
              },
            })
          );
        })
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(loginResult.success).toBe(true);
      });

      await waitFor(() => {
        expect(TokenStorage.setToken).toHaveBeenCalledWith('access-token-123', 'refresh-token-456');
        expect(mockLogin).toHaveBeenCalledWith(mockUser, 'access-token-123', 'refresh-token-456');
      });
    });

    it('handles login errors', async () => {
      server.use(
        rest.post('http://localhost:8000/api/v1/auth/login', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
        })
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const loginResult = await result.current.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });
        expect(loginResult.success).toBe(false);
      });

      expect(mockSetError).toHaveBeenCalled();
    });
  });

  describe('Registration Flow', () => {
    it('successfully registers and auto-logs in user', async () => {
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        name: 'New User',
      };

      server.use(
        rest.post('http://localhost:8000/api/v1/auth/register', (req, res, ctx) => {
          return res(ctx.json({ success: true, data: mockUser }));
        }),
        rest.post('http://localhost:8000/api/v1/auth/login', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                access_token: 'access-token-123',
                refresh_token: 'refresh-token-456',
                user: mockUser,
              },
            })
          );
        })
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const registerResult = await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });
        expect(registerResult.success).toBe(true);
      });

      await waitFor(() => {
        expect(TokenStorage.setToken).toHaveBeenCalled();
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Logout Flow', () => {
    it('successfully logs out user and clears tokens', async () => {
      server.use(
        rest.post('http://localhost:8000/api/v1/auth/logout', (req, res, ctx) => {
          return res(ctx.json({ success: true }));
        })
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(TokenStorage.removeTokens).toHaveBeenCalled();
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('handles logout errors gracefully', async () => {
      server.use(
        rest.post('http://localhost:8000/api/v1/auth/logout', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear tokens and logout locally
      expect(TokenStorage.removeTokens).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Token Refresh Flow', () => {
    it('successfully refreshes access token', async () => {
      vi.mocked(TokenStorage.getRefreshToken).mockReturnValue('refresh-token-456');

      server.use(
        rest.post('http://localhost:8000/api/v1/auth/refresh', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                access_token: 'new-access-token-789',
                refresh_token: 'new-refresh-token-012',
              },
            })
          );
        })
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const refreshResult = await result.current.refreshToken();
        expect(refreshResult.success).toBe(true);
      });

      await waitFor(() => {
        expect(TokenStorage.setToken).toHaveBeenCalledWith(
          'new-access-token-789',
          'new-refresh-token-012'
        );
      });
    });

    it('logs out user when refresh fails', async () => {
      vi.mocked(TokenStorage.getRefreshToken).mockReturnValue('invalid-refresh-token');

      server.use(
        rest.post('http://localhost:8000/api/v1/auth/refresh', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Invalid refresh token' }));
        })
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const refreshResult = await result.current.refreshToken();
        expect(refreshResult.success).toBe(false);
      });

      // Should trigger logout
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Authentication State', () => {
    it('returns authentication state correctly', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: 1, email: 'test@example.com' },
        token: 'token-123',
        isAuthenticated: () => true,
        login: mockLogin,
        logout: mockLogout,
        setUser: mockSetUser,
        setError: mockSetError,
        error: null,
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
      expect(result.current.token).toBe('token-123');
    });

    it('returns error state when present', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: () => false,
        login: mockLogin,
        logout: mockLogout,
        setUser: mockSetUser,
        setError: mockSetError,
        error: 'Authentication failed',
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBe('Authentication failed');
    });
  });
});
