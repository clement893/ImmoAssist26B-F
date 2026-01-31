/**
 * Request Signing Tests
 *
 * Comprehensive test suite for request signing utilities covering:
 * - computeSignature function
 * - createSignedHeaders function
 * - signedFetch function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeSignature, createSignedHeaders, signedFetch } from '../requestSigning';

// Mock crypto-js
vi.mock('crypto-js', () => ({
  default: {
    HmacSHA256: vi.fn((data: string, key: string) => ({
      toString: (encoding: string) => {
        if (encoding === 'Hex') {
          return 'mocked-signature-hex';
        }
        return 'mocked-signature';
      },
    })),
    enc: {
      Hex: 'Hex',
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Request Signing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeSignature', () => {
    it('computes signature for request', () => {
      const signature = computeSignature(
        'POST',
        '/api/test',
        '{"data":"test"}',
        '1234567890',
        'secret-key'
      );
      expect(signature).toBe('mocked-signature-hex');
    });

    it('handles empty body', () => {
      const signature = computeSignature('GET', '/api/test', '', '1234567890', 'secret-key');
      expect(signature).toBeTruthy();
    });
  });

  describe('createSignedHeaders', () => {
    it('creates signed headers with default names', () => {
      const headers = createSignedHeaders('POST', '/api/test', '{"data":"test"}', {
        secretKey: 'secret-key',
      });
      expect(headers['X-Signature']).toBeTruthy();
      expect(headers['X-Timestamp']).toBeTruthy();
    });

    it('creates signed headers with custom names', () => {
      const headers = createSignedHeaders('POST', '/api/test', '{"data":"test"}', {
        secretKey: 'secret-key',
        headerName: 'Custom-Signature',
        timestampHeader: 'Custom-Timestamp',
      });
      expect(headers['Custom-Signature']).toBeTruthy();
      expect(headers['Custom-Timestamp']).toBeTruthy();
    });
  });

  describe('signedFetch', () => {
    it('makes signed fetch request', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await signedFetch(
        'https://api.example.com/test',
        {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        },
        {
          secretKey: 'secret-key',
        }
      );

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[0]).toBe('https://api.example.com/test');
      expect(callArgs[1]?.headers).toHaveProperty('X-Signature');
      expect(callArgs[1]?.headers).toHaveProperty('X-Timestamp');
    });

    it('handles GET request without body', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await signedFetch(
        'https://api.example.com/test',
        {
          method: 'GET',
        },
        {
          secretKey: 'secret-key',
        }
      );

      expect(global.fetch).toHaveBeenCalled();
    });

    it('throws error when response is not ok', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(
        signedFetch(
          'https://api.example.com/test',
          {},
          {
            secretKey: 'secret-key',
          }
        )
      ).rejects.toThrow();
    });

    it('handles fetch errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        signedFetch(
          'https://api.example.com/test',
          {},
          {
            secretKey: 'secret-key',
          }
        )
      ).rejects.toThrow();
    });
  });
});
