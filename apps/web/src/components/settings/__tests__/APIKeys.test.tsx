/**
 * APIKeys Component Tests
 *
 * Comprehensive test suite for the APIKeys component covering:
 * - API key list rendering
 * - Create API key
 * - Delete API key
 * - Key visibility toggle
 * - Copy to clipboard
 * - Scopes selection
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import APIKeys, { type APIKey } from '../APIKeys';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('APIKeys Component', () => {
  const mockAPIKeys: APIKey[] = [
    {
      id: '1',
      name: 'Production Key',
      key: 'sk_live_1234567890abcdef',
      prefix: 'sk_live_',
      lastUsed: '2024-01-15',
      createdAt: '2024-01-01',
      scopes: ['read', 'write'],
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_abcdef1234567890',
      prefix: 'sk_test_',
      createdAt: '2024-01-10',
      scopes: ['read'],
    },
  ];

  const mockOnCreate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  describe('Rendering', () => {
    it('renders API key list', () => {
      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      expect(screen.getByText('Production Key')).toBeInTheDocument();
      expect(screen.getByText('Development Key')).toBeInTheDocument();
    });

    it('masks API keys by default', () => {
      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      expect(screen.getByText(/sk_live_.*cdef/i)).toBeInTheDocument();
    });

    it('displays scopes', () => {
      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      expect(screen.getByText(/read/i)).toBeInTheDocument();
      expect(screen.getByText(/write/i)).toBeInTheDocument();
    });
  });

  describe('Create API Key', () => {
    it('opens create modal when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      const createButton = screen.getByText(/create/i);
      await user.click(createButton);
      expect(screen.getByText(/create api key/i)).toBeInTheDocument();
    });

    it('creates API key with name and scopes', async () => {
      const user = userEvent.setup();
      const newKey: APIKey = {
        id: '3',
        name: 'New Key',
        key: 'sk_new_123',
        prefix: 'sk_new_',
        createdAt: '2024-01-20',
        scopes: ['read'],
      };
      mockOnCreate.mockResolvedValue(newKey);

      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      const createButton = screen.getByText(/create/i);
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'New Key');

      const createSubmitButton = screen.getByRole('button', { name: /create key/i });
      await user.click(createSubmitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled();
      });
    });
  });

  describe('Delete API Key', () => {
    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Key Visibility', () => {
    it('toggles key visibility', async () => {
      const user = userEvent.setup();
      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      const visibilityButtons = screen.getAllByLabelText(/show|hide/i);
      await user.click(visibilityButtons[0]);
      // Key should be visible
      expect(screen.getByText(/sk_live_1234567890abcdef/i)).toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard', () => {
    it('copies key to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      const visibilityButtons = screen.getAllByLabelText(/show|hide/i);
      await user.click(visibilityButtons[0]); // Show key first
      const copyButtons = screen.getAllByLabelText(/copy/i);
      await user.click(copyButtons[0]);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty API keys list', () => {
      render(<APIKeys apiKeys={[]} onCreate={mockOnCreate} onDelete={mockOnDelete} />);
      expect(screen.getByText(/no api keys/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <APIKeys apiKeys={mockAPIKeys} onCreate={mockOnCreate} onDelete={mockOnDelete} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
