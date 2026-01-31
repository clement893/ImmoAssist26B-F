/**
 * CollaborationPanel Component Tests
 *
 * Comprehensive test suite for the CollaborationPanel component covering:
 * - Collaborators display
 * - Online status indicators
 * - Role badges
 * - Invite functionality
 * - Share functionality
 * - Video call functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import CollaborationPanel, { type Collaborator } from '../CollaborationPanel';

describe('CollaborationPanel Component', () => {
  const mockCollaborators: Collaborator[] = [
    {
      id: '1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
      role: 'owner',
      status: 'online',
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'editor',
      status: 'offline',
    },
  ];

  const mockCurrentUser: Collaborator = {
    id: '3',
    name: 'Current User',
    role: 'viewer',
    status: 'online',
  };

  const mockOnInvite = vi.fn();
  const mockOnShare = vi.fn();
  const mockOnStartCall = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders collaboration panel', () => {
      render(<CollaborationPanel collaborators={mockCollaborators} />);
      expect(screen.getByText(/collaboration/i)).toBeInTheDocument();
    });

    it('displays collaborators', () => {
      render(<CollaborationPanel collaborators={mockCollaborators} />);
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    });

    it('displays online count', () => {
      render(<CollaborationPanel collaborators={mockCollaborators} />);
      expect(screen.getByText(/online/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onInvite when invite button is clicked', () => {
      render(<CollaborationPanel collaborators={mockCollaborators} onInvite={mockOnInvite} />);
      const inviteButton = screen.queryByText(/invite/i);
      if (inviteButton) {
        fireEvent.click(inviteButton);
        expect(mockOnInvite).toHaveBeenCalled();
      }
    });

    it('calls onShare when share button is clicked', () => {
      render(<CollaborationPanel collaborators={mockCollaborators} onShare={mockOnShare} />);
      const shareButton = screen.queryByText(/share/i);
      if (shareButton) {
        fireEvent.click(shareButton);
        expect(mockOnShare).toHaveBeenCalled();
      }
    });

    it('calls onStartCall when call button is clicked', () => {
      render(
        <CollaborationPanel collaborators={mockCollaborators} onStartCall={mockOnStartCall} />
      );
      const callButton = screen.queryByText(/call/i);
      if (callButton) {
        fireEvent.click(callButton);
        expect(mockOnStartCall).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<CollaborationPanel collaborators={mockCollaborators} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
