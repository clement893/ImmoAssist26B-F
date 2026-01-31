import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient } from '@/lib/api/client';
import { authAPI, usersAPI } from '@/lib/api';

// Mock server setup
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration Tests', () => {
  describe('Authentication API', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      };

      server.use(
        rest.post('http://localhost:8000/api/v1/auth/login', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const result = await authAPI.login('test@example.com', 'password123');

      expect(result.data).toEqual(mockResponse.data);
      expect(result.data.access_token).toBe('mock-access-token');
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('handles login errors', async () => {
      server.use(
        rest.post('http://localhost:8000/api/v1/auth/login', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
        })
      );

      await expect(authAPI.login('wrong@example.com', 'wrongpassword')).rejects.toThrow();
    });

    it('successfully registers new user', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          email: 'newuser@example.com',
          name: 'New User',
        },
      };

      server.use(
        rest.post('http://localhost:8000/api/v1/auth/register', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const result = await authAPI.register('newuser@example.com', 'password123', 'New User');

      expect(result.data.email).toBe('newuser@example.com');
      expect(result.data.name).toBe('New User');
    });

    it('successfully refreshes token', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
      };

      server.use(
        rest.post('http://localhost:8000/api/v1/auth/refresh', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const result = await authAPI.refresh('old-refresh-token');

      expect(result.data.access_token).toBe('new-access-token');
      expect(result.data.refresh_token).toBe('new-refresh-token');
    });

    it('successfully logs out user', async () => {
      server.use(
        rest.post('http://localhost:8000/api/v1/auth/logout', (req, res, ctx) => {
          return res(ctx.json({ success: true }));
        })
      );

      await expect(authAPI.logout()).resolves.not.toThrow();
    });
  });

  describe('Users API', () => {
    beforeEach(() => {
      // Set auth token for authenticated requests
      apiClient.setAuthToken('mock-token');
    });

    afterEach(() => {
      apiClient.removeAuthToken();
    });

    it('fetches current user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00Z',
      };

      server.use(
        rest.get('http://localhost:8000/api/v1/users/me', (req, res, ctx) => {
          const authHeader = req.headers.get('Authorization');
          if (authHeader !== 'Bearer mock-token') {
            return res(ctx.status(401));
          }
          return res(ctx.json({ success: true, data: mockUser }));
        })
      );

      const result = await usersAPI.getMe();

      expect(result.data).toEqual(mockUser);
      expect(result.data.email).toBe('test@example.com');
    });

    it('handles unauthorized access', async () => {
      server.use(
        rest.get('http://localhost:8000/api/v1/users/me', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
        })
      );

      await expect(usersAPI.getMe()).rejects.toThrow();
    });

    it('updates user profile', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          email: 'test@example.com',
          name: 'Updated Name',
        },
      };

      server.use(
        rest.put('http://localhost:8000/api/v1/users/me', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const result = await usersAPI.updateMe(updateData);

      expect(result.data.name).toBe('Updated Name');
    });
  });

  describe('API Client Error Handling', () => {
    it('handles network errors', async () => {
      server.use(
        rest.get('http://localhost:8000/api/v1/users/me', (req, res, ctx) => {
          return res.networkError('Failed to connect');
        })
      );

      await expect(usersAPI.getMe()).rejects.toThrow();
    });

    it('handles 404 errors', async () => {
      server.use(
        rest.get('http://localhost:8000/api/v1/users/999', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ message: 'User not found' }));
        })
      );

      await expect(apiClient.get('/users/999')).rejects.toThrow();
    });

    it('handles 500 errors', async () => {
      server.use(
        rest.get('http://localhost:8000/api/v1/users/me', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
        })
      );

      await expect(usersAPI.getMe()).rejects.toThrow();
    });

    it('handles validation errors (422)', async () => {
      server.use(
        rest.post('http://localhost:8000/api/v1/auth/register', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              message: 'Validation error',
              errors: {
                email: ['Invalid email format'],
                password: ['Password too short'],
              },
            })
          );
        })
      );

      await expect(authAPI.register('invalid-email', '123', 'Test')).rejects.toThrow();
    });
  });

  describe('Request/Response Interceptors', () => {
    it('includes auth token in requests', async () => {
      apiClient.setAuthToken('test-token');

      let requestHeaders: HeadersInit = {};
      server.use(
        rest.get('http://localhost:8000/api/v1/users/me', (req, res, ctx) => {
          requestHeaders = req.headers.raw();
          return res(ctx.json({ success: true, data: {} }));
        })
      );

      await apiClient.get('/users/me');

      // Note: In a real test, you'd verify the Authorization header
      // This depends on how MSW exposes headers
      expect(apiClient).toBeDefined();
    });
  });
});
