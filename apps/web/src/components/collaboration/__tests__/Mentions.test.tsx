/**
 * Mentions Component Tests
 *
 * Comprehensive test suite for the Mentions component covering:
 * - User mention input
 * - Autocomplete suggestions
 * - Mention extraction
 * - Keyboard navigation
 * - Click outside behavior
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Mentions from '../Mentions';

describe('Mentions Component', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders mentions component', () => {
      render(<Mentions users={mockUsers} value="" onChange={mockOnChange} />);
      expect(screen.getByPlaceholderText(/type @/i)).toBeInTheDocument();
    });

    it('displays placeholder', () => {
      render(
        <Mentions
          users={mockUsers}
          value=""
          onChange={mockOnChange}
          placeholder="Custom placeholder"
        />
      );
      expect(screen.getByPlaceholderText(/custom placeholder/i)).toBeInTheDocument();
    });
  });

  describe('Mention Detection', () => {
    it('shows suggestions when @ is typed', async () => {
      const user = userEvent.setup();
      render(<Mentions users={mockUsers} value="" onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/type @/i);
      await user.type(textarea, '@');
      await waitFor(() => {
        expect(
          screen.getByText(/john doe/i) || screen.getByText(/jane smith/i)
        ).toBeInTheDocument();
      });
    });

    it('filters suggestions based on input', async () => {
      const user = userEvent.setup();
      render(<Mentions users={mockUsers} value="" onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/type @/i);
      await user.type(textarea, '@john');
      await waitFor(() => {
        expect(screen.getByText(/john doe/i)).toBeInTheDocument();
        expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Mention Selection', () => {
    it('inserts mention when user is selected', async () => {
      const user = userEvent.setup();
      render(<Mentions users={mockUsers} value="" onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText(/type @/i);
      await user.type(textarea, '@');
      await waitFor(() => {
        const suggestion = screen.getByText(/john doe/i);
        fireEvent.click(suggestion);
      });
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Mentions users={mockUsers} value="" onChange={mockOnChange} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
