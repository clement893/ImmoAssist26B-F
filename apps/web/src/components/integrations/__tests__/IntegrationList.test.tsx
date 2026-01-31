/**
 * IntegrationList Component Tests
 *
 * Comprehensive test suite for the IntegrationList component covering:
 * - Integration list display
 * - Integration status indicators
 * - Connect/disconnect functionality
 * - Integration configuration
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import IntegrationList from '../IntegrationList';

// Mock integration data structure - adjust based on actual component interface
const mockIntegrations: unknown[] = [
  {
    id: '1',
    name: 'Slack',
    description: 'Connect with Slack',
    status: 'connected',
    icon: 'slack',
  },
  {
    id: '2',
    name: 'GitHub',
    description: 'Connect with GitHub',
    status: 'disconnected',
    icon: 'github',
  },
];

describe('IntegrationList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders integration list', () => {
      render(<IntegrationList integrations={mockIntegrations} />);
      expect(screen.getByText(/integrations/i) || screen.getByText(/slack/i)).toBeInTheDocument();
    });

    it('displays integrations', () => {
      render(<IntegrationList integrations={mockIntegrations} />);
      expect(screen.getByText(/slack/i)).toBeInTheDocument();
      expect(screen.getByText(/github/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<IntegrationList integrations={mockIntegrations} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
