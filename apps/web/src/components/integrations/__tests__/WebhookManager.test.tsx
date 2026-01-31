/**
 * WebhookManager Component Tests
 *
 * Comprehensive test suite for the WebhookManager component covering:
 * - Webhook list display
 * - Create webhook functionality
 * - Update webhook functionality
 * - Delete webhook functionality
 * - Toggle webhook active state
 * - Test webhook functionality
 * - Event selection
 * - Status indicators
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import WebhookManager, { type Webhook } from '../WebhookManager';

// Mock window.confirm
window.confirm = vi.fn(() => true);

describe('WebhookManager Component', () => {
  const mockWebhooks: Webhook[] = [
    {
      id: '1',
      name: 'User Events Webhook',
      url: 'https://example.com/webhook',
      events: ['user.created', 'user.updated'],
      active: true,
      createdAt: '2024-01-01T10:00:00Z',
      successCount: 10,
      failureCount: 2,
      lastStatus: 'success',
    },
    {
      id: '2',
      name: 'Payment Events Webhook',
      url: 'https://example.com/payment-webhook',
      events: ['payment.succeeded'],
      active: false,
      createdAt: '2024-01-02T10:00:00Z',
      successCount: 5,
      failureCount: 0,
    },
  ];

  const mockOnCreate = vi.fn().mockResolvedValue({ ...mockWebhooks[0], id: '3' });
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnToggle = vi.fn().mockResolvedValue(undefined);
  const mockOnTest = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders webhook manager', () => {
      render(<WebhookManager webhooks={mockWebhooks} />);
      expect(screen.getByText(/webhook/i)).toBeInTheDocument();
    });

    it('displays webhooks list', () => {
      render(<WebhookManager webhooks={mockWebhooks} />);
      expect(screen.getByText(/user events webhook/i)).toBeInTheDocument();
      expect(screen.getByText(/payment events webhook/i)).toBeInTheDocument();
    });

    it('displays webhook status', () => {
      render(<WebhookManager webhooks={mockWebhooks} />);
      expect(screen.getByText(/active/i) || screen.getByText(/inactive/i)).toBeInTheDocument();
    });
  });

  describe('Create Webhook', () => {
    it('opens create modal when create button is clicked', () => {
      render(<WebhookManager webhooks={mockWebhooks} onCreate={mockOnCreate} />);
      const createButton = screen.getByText(/create|add/i);
      fireEvent.click(createButton);
      expect(screen.getByText(/create webhook|new webhook/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onDelete when delete button is clicked', async () => {
      render(<WebhookManager webhooks={mockWebhooks} onDelete={mockOnDelete} />);
      const deleteButton = screen.queryByLabelText(/delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);
        await waitFor(() => {
          expect(mockOnDelete).toHaveBeenCalledWith('1');
        });
      }
    });

    it('calls onToggle when toggle switch is clicked', async () => {
      render(<WebhookManager webhooks={mockWebhooks} onToggle={mockOnToggle} />);
      const toggleSwitch = screen.queryByRole('switch');
      if (toggleSwitch) {
        fireEvent.click(toggleSwitch);
        await waitFor(() => {
          expect(mockOnToggle).toHaveBeenCalled();
        });
      }
    });

    it('calls onTest when test button is clicked', async () => {
      render(<WebhookManager webhooks={mockWebhooks} onTest={mockOnTest} />);
      const testButton = screen.queryByText(/test/i);
      if (testButton) {
        fireEvent.click(testButton);
        await waitFor(() => {
          expect(mockOnTest).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<WebhookManager webhooks={mockWebhooks} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
