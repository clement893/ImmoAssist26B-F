/**
 * UserSettings Component Tests
 *
 * Comprehensive test suite for the UserSettings component covering:
 * - Form rendering
 * - User data display
 * - Form submission
 * - Avatar upload
 * - Validation
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import UserSettings, { type UserSettingsData } from '../UserSettings';

describe('UserSettings Component', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Software developer',
    location: 'New York',
    website: 'https://johndoe.com',
  };

  const mockOnSave = vi.fn();
  const mockOnAvatarChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields', () => {
      render(<UserSettings user={mockUser} onSave={mockOnSave} />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    it('displays user data', () => {
      render(<UserSettings user={mockUser} onSave={mockOnSave} />);
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('displays avatar when provided', () => {
      render(<UserSettings user={mockUser} onSave={mockOnSave} />);
      const avatar = screen.getByAltText(/john doe/i);
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Form Updates', () => {
    it('updates name field', async () => {
      const user = userEvent.setup();
      render(<UserSettings user={mockUser} onSave={mockOnSave} />);
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');
      expect(nameInput).toHaveValue('Jane Doe');
    });

    it('updates email field', async () => {
      const user = userEvent.setup();
      render(<UserSettings user={mockUser} onSave={mockOnSave} />);
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'jane@example.com');
      expect(emailInput).toHaveValue('jane@example.com');
    });
  });

  describe('Avatar Upload', () => {
    it('handles avatar file upload', async () => {
      const user = userEvent.setup();
      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
      render(
        <UserSettings user={mockUser} onSave={mockOnSave} onAvatarChange={mockOnAvatarChange} />
      );
      const fileInput = screen.getByLabelText(/upload avatar/i);
      await user.upload(fileInput, file);
      await waitFor(() => {
        expect(mockOnAvatarChange).toHaveBeenCalledWith(file);
      });
    });

    it('validates file type', async () => {
      const user = userEvent.setup();
      const file = new File(['document'], 'doc.pdf', { type: 'application/pdf' });
      render(
        <UserSettings user={mockUser} onSave={mockOnSave} onAvatarChange={mockOnAvatarChange} />
      );
      const fileInput = screen.getByLabelText(/upload avatar/i);
      await user.upload(fileInput, file);
      await waitFor(() => {
        expect(screen.getByText(/image file/i)).toBeInTheDocument();
      });
    });

    it('validates file size', async () => {
      const user = userEvent.setup();
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      render(
        <UserSettings user={mockUser} onSave={mockOnSave} onAvatarChange={mockOnAvatarChange} />
      );
      const fileInput = screen.getByLabelText(/upload avatar/i);
      await user.upload(fileInput, largeFile);
      await waitFor(() => {
        expect(screen.getByText(/5mb/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form data', async () => {
      const user = userEvent.setup();
      render(<UserSettings user={mockUser} onSave={mockOnSave} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user data', () => {
      render(<UserSettings onSave={mockOnSave} />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('handles optional fields', () => {
      const userWithoutOptional = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      };
      render(<UserSettings user={userWithoutOptional} onSave={mockOnSave} />);
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<UserSettings user={mockUser} onSave={mockOnSave} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
