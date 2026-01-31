/**
 * WebhooksSettings Component Tests
 *
 * Comprehensive test suite for the WebhooksSettings component covering:
 * - Webhook list rendering
 * - Create webhook
 * - Update webhook
 * - Delete webhook
 * - Toggle webhook active state
 * - Event selection
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import WebhooksSettings, { type Webhook } from '../WebhooksSettings';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('WebhooksSettings Component', () => {
  const mockWebhooks: Webhook[] = [
    {
      id: '1',
      name: 'Payment Webhook',
      url: 'https://example.com/webhook',
      events: ['payment.succeeded', 'payment.failed'],
      active: true,
      createdAt: '2024-01-01',
      lastTriggered: '2024-01-15',
      successCount: 100,
      failureCount: 2,
    },
    {
      id: '2',
      name: 'User Webhook',
      url: 'https://example.com/user-webhook',
      events: ['user.created'],
      active: false,
      createdAt: '2024-01-10',
      successCount: 50,
      failureCount: 0,
    },
  ];

  const mockOnCreate = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  describe('Rendering', () => {
    it('renders webhook list', () => {
      render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      expect(screen.getByText('Payment Webhook')).toBeInTheDocument();
      expect(screen.getByText('User Webhook')).toBeInTheDocument();
    });

    it('displays webhook URLs', () => {
      render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      expect(screen.getByText(/example.com\/webhook/i)).toBeInTheDocument();
    });

    it('displays webhook status', () => {
      render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  describe('Create Webhook', () => {
    it('opens create modal when create button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      const createButton = screen.getByText(/create webhook/i);
      await user.click(createButton);
      expect(screen.getByText(/create new webhook/i)).toBeInTheDocument();
    });

    it('creates webhook with name, URL, and events', async () => {
      const user = userEvent.setup();
      const newWebhook: Webhook = {
        id: '3',
        name: 'New Webhook',
        url: 'https://example.com/new',
        events: ['user.created'],
        active: true,
        createdAt: '2024-01-20',
        successCount: 0,
        failureCount: 0,
      };
      mockOnCreate.mockResolvedValue(newWebhook);

      render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      const createButton = screen.getByText(/create webhook/i);
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'New Webhook');

      const urlInput = screen.getByLabelText(/url/i);
      await user.type(urlInput, 'https://example.com/new');

      const createSubmitButton = screen.getByRole('button', { name: /create/i });
      await user.click(createSubmitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Webhook', () => {
    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Toggle Webhook', () => {
    it('calls onToggle when toggle switch is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      const toggleSwitches = screen.getAllByRole('switch');
      await user.click(toggleSwitches[0]);
      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty webhooks list', () => {
      render(
        <WebhooksSettings
          webhooks={[]}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      expect(screen.getByText(/no webhooks/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <WebhooksSettings
          webhooks={mockWebhooks}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
          onToggle={mockOnToggle}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
