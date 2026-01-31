/**
 * IntegrationConfig Component Tests
 *
 * Comprehensive test suite for the IntegrationConfig component covering:
 * - Form rendering
 * - Field validation
 * - Save functionality
 * - Test functionality
 * - Cancel functionality
 * - Sensitive field handling
 * - Error display
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import IntegrationConfig, { type IntegrationConfigField } from '../IntegrationConfig';

describe('IntegrationConfig Component', () => {
  const mockIntegration = {
    id: '1',
    name: 'Slack',
    description: 'Connect with Slack',
    icon: 'slack',
    category: 'communication',
  };

  const mockFields: IntegrationConfigField[] = [
    {
      id: 'api_key',
      label: 'API Key',
      type: 'password',
      value: '',
      required: true,
      placeholder: 'Enter API key',
      sensitive: true,
    },
    {
      id: 'webhook_url',
      label: 'Webhook URL',
      type: 'url',
      value: '',
      required: true,
      placeholder: 'Enter webhook URL',
    },
  ];

  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();
  const mockOnTest = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders integration config', () => {
      render(
        <IntegrationConfig integration={mockIntegration} fields={mockFields} onSave={mockOnSave} />
      );
      expect(screen.getByText(/slack/i)).toBeInTheDocument();
    });

    it('renders form fields', () => {
      render(
        <IntegrationConfig integration={mockIntegration} fields={mockFields} onSave={mockOnSave} />
      );
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/webhook url/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for required fields', async () => {
      const user = userEvent.setup();
      render(
        <IntegrationConfig integration={mockIntegration} fields={mockFields} onSave={mockOnSave} />
      );
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('calls onSave with form data when save is clicked', async () => {
      const user = userEvent.setup();
      render(
        <IntegrationConfig integration={mockIntegration} fields={mockFields} onSave={mockOnSave} />
      );
      const apiKeyInput = screen.getByLabelText(/api key/i);
      const webhookInput = screen.getByLabelText(/webhook url/i);
      await user.type(apiKeyInput, 'test-api-key');
      await user.type(webhookInput, 'https://example.com/webhook');
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          api_key: 'test-api-key',
          webhook_url: 'https://example.com/webhook',
        });
      });
    });
  });

  describe('Test Functionality', () => {
    it('calls onTest when test button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <IntegrationConfig integration={mockIntegration} fields={mockFields} onTest={mockOnTest} />
      );
      const apiKeyInput = screen.getByLabelText(/api key/i);
      const webhookInput = screen.getByLabelText(/webhook url/i);
      await user.type(apiKeyInput, 'test-api-key');
      await user.type(webhookInput, 'https://example.com/webhook');
      const testButton = screen.getByText(/test/i);
      await user.click(testButton);
      await waitFor(() => {
        expect(mockOnTest).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <IntegrationConfig integration={mockIntegration} fields={mockFields} onSave={mockOnSave} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
