import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken, extractTokenFromHeader, isTokenExpired, getUserIdFromPayload } from '../jwt';
import { jwtVerify } from 'jose';

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn(),
}));

describe('JWT Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('returns payload for valid token', async () => {
      const mockPayload = { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 };
      vi.mocked(jwtVerify).mockResolvedValue({ payload: mockPayload } as never);

      const result = await verifyToken('valid-token');
      expect(result).toEqual(mockPayload);
    });

    it('returns null for invalid token', async () => {
      vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid token'));

      const result = await verifyToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('extracts token from Bearer header', () => {
      expect(extractTokenFromHeader('Bearer token123')).toBe('token123');
    });

    it('returns null for invalid header', () => {
      expect(extractTokenFromHeader('Invalid token123')).toBeNull();
      expect(extractTokenFromHeader(null)).toBeNull();
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('returns true for expired token', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      expect(isTokenExpired(expiredPayload)).toBe(true);
    });

    it('returns false for valid token', () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      expect(isTokenExpired(validPayload)).toBe(false);
    });

    it('returns true for token without exp', () => {
      expect(isTokenExpired({})).toBe(true);
    });
  });

  describe('getUserIdFromPayload', () => {
    it('extracts user ID from sub', () => {
      expect(getUserIdFromPayload({ sub: 'user123' })).toBe('user123');
    });

    it('extracts user ID from userId', () => {
      expect(getUserIdFromPayload({ userId: 'user456' })).toBe('user456');
    });

    it('extracts user ID from id', () => {
      expect(getUserIdFromPayload({ id: 'user789' })).toBe('user789');
    });

    it('returns null if no user ID found', () => {
      expect(getUserIdFromPayload({})).toBeNull();
    });
  });
});
