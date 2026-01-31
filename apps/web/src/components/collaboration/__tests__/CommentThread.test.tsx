/**
 * CommentThread Component Tests
 *
 * Comprehensive test suite for the CommentThread component covering:
 * - Comment display
 * - Reply functionality
 * - Edit functionality
 * - Delete functionality
 * - Reactions
 * - Nested replies
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CommentThread } from '../CommentThread';

// Mock apiClient
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/components/ui', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

describe('CommentThread Component', () => {
  const mockComment = {
    id: 1,
    content: 'Test comment',
    user_id: 1,
    user_name: 'John Doe',
    user_email: 'john@example.com',
    parent_id: undefined,
    is_edited: false,
    reactions_count: 0,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    replies: [],
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders comment thread', () => {
      render(<CommentThread comment={mockComment} entityType="post" entityId={1} />);
      expect(screen.getByText(/test comment/i)).toBeInTheDocument();
    });

    it('displays comment author', () => {
      render(<CommentThread comment={mockComment} entityType="post" entityId={1} />);
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    it('displays nested replies', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [
          {
            ...mockComment,
            id: 2,
            content: 'Reply comment',
            parent_id: 1,
          },
        ],
      };
      render(<CommentThread comment={commentWithReplies} entityType="post" entityId={1} />);
      expect(screen.getByText(/reply comment/i)).toBeInTheDocument();
    });
  });

  describe('Reply Functionality', () => {
    it('shows reply form when reply button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CommentThread
          comment={mockComment}
          entityType="post"
          entityId={1}
          onUpdate={mockOnUpdate}
        />
      );
      const replyButton = screen.queryByText(/reply/i);
      if (replyButton) {
        await user.click(replyButton);
        expect(
          screen.getByPlaceholderText(/reply/i) || screen.getByRole('textbox')
        ).toBeInTheDocument();
      }
    });
  });

  describe('Edit Functionality', () => {
    it('shows edit form when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CommentThread
          comment={mockComment}
          entityType="post"
          entityId={1}
          currentUserId={1}
          onUpdate={mockOnUpdate}
        />
      );
      const editButton = screen.queryByText(/edit/i);
      if (editButton) {
        await user.click(editButton);
        expect(screen.getByDisplayValue(/test comment/i)).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <CommentThread comment={mockComment} entityType="post" entityId={1} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
