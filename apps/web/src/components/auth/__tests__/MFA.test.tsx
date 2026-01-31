/**
 * MFA Component Tests
 *
 * Comprehensive test suite for the MFA component covering:
 * - Verification flow
 * - Setup flow
 * - Code input handling
 * - QR code display
 * - Error handling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import MFA from '../MFA';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('MFA Component', () => {
  const mockOnVerify = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Verification Flow', () => {
    it('renders verification form', () => {
      render(<MFA onVerify={mockOnVerify} />);
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();
    });

    it('renders 6 code input fields', () => {
      render(<MFA onVerify={mockOnVerify} />);
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    it('auto-submits when 6 digits are entered', async () => {
      const user = userEvent.setup();
      render(<MFA onVerify={mockOnVerify} />);
      const inputs = screen.getAllByRole('textbox');

      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], String(i + 1));
      }

      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalledWith('123456');
      });
    });

    it('calls onVerify with correct code', async () => {
      const user = userEvent.setup();
      render(<MFA onVerify={mockOnVerify} />);
      const inputs = screen.getAllByRole('textbox');

      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.type(inputs[2], '3');
      await user.type(inputs[3], '4');
      await user.type(inputs[4], '5');
      await user.type(inputs[5], '6');

      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalledWith('123456');
      });
    });

    it('displays error when verification fails', async () => {
      const user = userEvent.setup();
      mockOnVerify.mockRejectedValue(new Error('Invalid code'));
      render(<MFA onVerify={mockOnVerify} />);
      const inputs = screen.getAllByRole('textbox');

      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '1');
      }

      await waitFor(() => {
        expect(screen.getByText(/invalid/i)).toBeInTheDocument();
      });
    });
  });

  describe('Setup Flow', () => {
    it('renders setup form when qrCodeUrl is provided', () => {
      render(<MFA onVerify={mockOnVerify} qrCodeUrl="https://example.com/qr.png" />);
      expect(screen.getByText(/set up two-factor authentication/i)).toBeInTheDocument();
    });

    it('displays QR code when qrCodeUrl is provided', () => {
      render(<MFA onVerify={mockOnVerify} qrCodeUrl="https://example.com/qr.png" />);
      const qrImage = screen.getByAltText(/qr code/i);
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', 'https://example.com/qr.png');
    });

    it('displays secret key when secret is provided', () => {
      render(<MFA onVerify={mockOnVerify} secret="ABC123XYZ" />);
      expect(screen.getByText('ABC123XYZ')).toBeInTheDocument();
    });

    it('copies secret to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<MFA onVerify={mockOnVerify} secret="ABC123XYZ" />);
      const copyButton = screen.getByText(/copy/i);
      await user.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123XYZ');
    });
  });

  describe('Code Input Handling', () => {
    it('only accepts digits', async () => {
      const user = userEvent.setup();
      render(<MFA onVerify={mockOnVerify} />);
      const input = screen.getAllByRole('textbox')[0];
      await user.type(input, 'a');
      expect(input).toHaveValue('');
    });

    it('handles paste event', async () => {
      const user = userEvent.setup();
      render(<MFA onVerify={mockOnVerify} />);
      const input = screen.getAllByRole('textbox')[0];
      await user.click(input);
      await user.paste('123456');

      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalledWith('123456');
      });
    });

    it('handles backspace navigation', async () => {
      const user = userEvent.setup();
      render(<MFA onVerify={mockOnVerify} />);
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.keyboard('{Backspace}');
      // Second input should be focused
      expect(document.activeElement).toBe(inputs[1]);
    });
  });

  describe('Actions', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<MFA onVerify={mockOnVerify} onCancel={mockOnCancel} />);
      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(<MFA onVerify={mockOnVerify} />);
      expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles email prop for display', () => {
      render(<MFA onVerify={mockOnVerify} email="user@example.com" />);
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    });

    it('disables inputs when loading', async () => {
      const user = userEvent.setup();
      mockOnVerify.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<MFA onVerify={mockOnVerify} />);
      const inputs = screen.getAllByRole('textbox');

      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '1');
      }

      await waitFor(() => {
        inputs.forEach((input) => {
          expect(input).toBeDisabled();
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MFA onVerify={mockOnVerify} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
