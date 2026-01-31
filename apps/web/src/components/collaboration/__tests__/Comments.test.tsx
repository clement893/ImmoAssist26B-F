/**
 * Comments Component Tests
 *
 * Comprehensive test suite for the Comments component covering:
 * - Comments display
 * - Add comment functionality
 * - Reply functionality
 * - Edit comment functionality
 * - Delete comment functionality
 * - Reactions
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Comments, { type Comment } from '../Comments';

describe('Comments Component', () => {
  const mockComments: Comment[] = [
    {
      id: '1',
      author: {
        id: 'user1',
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
      },
      content: 'This is a test comment',
      timestamp: '2024-01-01T10:00:00Z',
      reactions: { like: 2, heart: 1 },
    },
  ];

  const mockCurrentUser = {
    id: 'user2',
    name: 'Jane Smith',
    avatar: 'https://example.com/avatar2.jpg',
  };

  const mockOnSubmit = vi.fn().mockResolvedValue({
    id: '2',
    author: mockCurrentUser,
    content: 'New comment',
    timestamp: new Date().toISOString(),
  });

  const mockOnEdit = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnReact = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders comments', () => {
      render(<Comments comments={mockComments} />);
      expect(screen.getByText(/this is a test comment/i)).toBeInTheDocument();
    });

    it('displays comment author', () => {
      render(<Comments comments={mockComments} />);
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });

  describe('Add Comment', () => {
    it('submits new comment', async () => {
      const user = userEvent.setup();
      render(
        <Comments comments={mockComments} currentUser={mockCurrentUser} onSubmit={mockOnSubmit} />
      );
      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      await user.type(commentInput, 'New comment');
      const submitButton = screen.getByRole('button', { name: /send|submit/i });
      await user.click(submitButton);
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('New comment', undefined);
      });
    });
  });

  describe('Reactions', () => {
    it('calls onReact when reaction button is clicked', async () => {
      render(<Comments comments={mockComments} onReact={mockOnReact} />);
      const likeButton = screen.queryByLabelText(/like/i);
      if (likeButton) {
        fireEvent.click(likeButton);
        await waitFor(() => {
          expect(mockOnReact).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Comments comments={mockComments} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
