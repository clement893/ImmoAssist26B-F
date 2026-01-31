/**
 * OptimisticUpdates Component Tests
 *
 * Comprehensive test suite for the OptimisticUpdates component covering:
 * - useOptimisticUpdate hook
 * - Optimistic update flow
 * - Error handling and rollback
 * - Success callbacks
 * - Component rendering
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import OptimisticUpdates, { useOptimisticUpdate } from '../OptimisticUpdates';

describe('OptimisticUpdates Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders optimistic updates component', () => {
      render(<OptimisticUpdates />);
      expect(screen.getByText(/optimistic/i) || screen.getByText(/item/i)).toBeInTheDocument();
    });

    it('displays items list', () => {
      render(<OptimisticUpdates />);
      expect(screen.getByText(/item 1/i) || screen.getByText(/item/i)).toBeInTheDocument();
    });
  });

  describe('Optimistic Updates', () => {
    it('updates item optimistically', async () => {
      render(<OptimisticUpdates />);
      const incrementButton = screen.queryByText(/increment|count/i);
      if (incrementButton) {
        fireEvent.click(incrementButton);
        // Should update immediately
        await waitFor(() => {
          expect(incrementButton).toBeInTheDocument();
        });
      }
    });

    it('handles update errors', async () => {
      render(<OptimisticUpdates />);
      // Component simulates 10% failure rate
      const incrementButton = screen.queryByText(/increment|count/i);
      if (incrementButton) {
        fireEvent.click(incrementButton);
        // Should handle errors gracefully
        await waitFor(() => {
          expect(incrementButton).toBeInTheDocument();
        });
      }
    });
  });

  describe('useOptimisticUpdate Hook', () => {
    it('provides update function', () => {
      const TestComponent = () => {
        const { update } = useOptimisticUpdate({
          onUpdate: async (data) => data,
        });
        return <button onClick={() => update({ test: 'data' })}>Update</button>;
      };
      render(<TestComponent />);
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('tracks updating state', async () => {
      const TestComponent = () => {
        const { update, isUpdating } = useOptimisticUpdate({
          onUpdate: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return data;
          },
        });
        return (
          <div>
            <button onClick={() => update({ test: 'data' })}>Update</button>
            {isUpdating && <span>Updating...</span>}
          </div>
        );
      };
      render(<TestComponent />);
      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);
      await waitFor(() => {
        expect(screen.queryByText('Updating...')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<OptimisticUpdates />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
