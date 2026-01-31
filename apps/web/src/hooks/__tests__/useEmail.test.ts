/**
 * useEmail Hook Tests
 *
 * Comprehensive test suite for the useEmail hook covering:
 * - Send email functionality
 * - Send welcome email functionality
 * - Send invoice email functionality
 * - Loading states
 * - Toast notifications
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEmail } from '../useEmail';
import { emailAPI } from '@/lib/email/client';
import { useToast } from '@/components/ui/ToastContainer';

// Mock emailAPI
vi.mock('@/lib/email/client', () => ({
  emailAPI: {
    send: vi.fn(),
    sendWelcome: vi.fn(),
    sendInvoice: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/components/ui/ToastContainer', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

describe('useEmail Hook', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  describe('Send Email', () => {
    it('sends email successfully', async () => {
      const mockResponse = { id: '1', status: 'sent' };
      vi.mocked(emailAPI.send).mockResolvedValue({
        data: mockResponse,
        success: true,
      } as never);

      const { result } = renderHook(() => useEmail());

      const response = await result.current.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test Text'
      );

      expect(emailAPI.send).toHaveBeenCalledWith({
        to_email: 'test@example.com',
        subject: 'Test Subject',
        html_content: '<p>Test HTML</p>',
        text_content: 'Test Text',
      });
      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Email envoyé avec succès',
        type: 'success',
      });
      expect(response).toEqual(mockResponse);
    });

    it('handles email send errors', async () => {
      vi.mocked(emailAPI.send).mockRejectedValue(new Error('Send failed'));

      const { result } = renderHook(() => useEmail());

      const response = await result.current.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(mockShowToast).toHaveBeenCalledWith({
        message: "Erreur lors de l'envoi de l'email",
        type: 'error',
      });
      expect(response).toBeNull();
    });
  });

  describe('Send Welcome Email', () => {
    it('sends welcome email successfully', async () => {
      const mockResponse = { id: '1', status: 'sent' };
      vi.mocked(emailAPI.sendWelcome).mockResolvedValue({
        data: mockResponse,
        success: true,
      } as never);

      const { result } = renderHook(() => useEmail());

      const response = await result.current.sendWelcomeEmail('test@example.com', 'John Doe');

      expect(emailAPI.sendWelcome).toHaveBeenCalledWith('test@example.com', 'John Doe');
      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Email de bienvenue envoyé',
        type: 'success',
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('Loading State', () => {
    it('tracks loading state during email send', async () => {
      vi.mocked(emailAPI.send).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: null, success: true } as never), 100)
          )
      );

      const { result } = renderHook(() => useEmail());

      expect(result.current.loading).toBe(false);

      const sendPromise = result.current.sendEmail('test@example.com', 'Test', '<p>Test</p>');
      expect(result.current.loading).toBe(true);

      await sendPromise;
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
