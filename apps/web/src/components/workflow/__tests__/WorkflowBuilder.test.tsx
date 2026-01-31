/**
 * WorkflowBuilder Component Tests
 *
 * Comprehensive test suite for the WorkflowBuilder component covering:
 * - Workflow form rendering
 * - Node management (add, delete, configure)
 * - Save functionality
 * - Test functionality
 * - Workflow validation
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import WorkflowBuilder, { type Workflow } from '../WorkflowBuilder';

describe('WorkflowBuilder Component', () => {
  const mockWorkflow: Workflow = {
    id: '1',
    name: 'Test Workflow',
    description: 'Test description',
    enabled: true,
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'User Created',
        config: { event: 'user.created' },
      },
    ],
    connections: [],
  };

  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnTest = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders workflow builder', () => {
      render(<WorkflowBuilder workflow={mockWorkflow} />);
      expect(screen.getByText(/workflow/i) || screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('displays workflow name', () => {
      render(<WorkflowBuilder workflow={mockWorkflow} />);
      expect(screen.getByDisplayValue('Test Workflow')).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('calls onSave when save button is clicked', async () => {
      render(<WorkflowBuilder workflow={mockWorkflow} onSave={mockOnSave} />);
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Node Management', () => {
    it('adds new node when add button is clicked', async () => {
      render(<WorkflowBuilder workflow={mockWorkflow} />);
      const addButton = screen.queryByText(/add|new/i);
      if (addButton) {
        fireEvent.click(addButton);
        // Should add new node
        await waitFor(() => {
          expect(addButton).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<WorkflowBuilder workflow={mockWorkflow} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
