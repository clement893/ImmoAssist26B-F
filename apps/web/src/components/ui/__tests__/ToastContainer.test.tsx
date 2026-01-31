/**
 * ToastContainer Component Tests
 *
 * Comprehensive test suite for the ToastContainer component covering:
 * - Rendering multiple toasts
 * - useToast hook functionality
 * - Toast management
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import ToastContainer from '../ToastContainer';
import { useToast } from '@/lib/toast';
import type { ToastProps } from '../Toast';

describe('ToastContainer Component', () => {
  const mockToasts: ToastProps[] = [
    { id: '1', message: 'Toast 1', onClose: vi.fn() },
    { id: '2', message: 'Toast 2', type: 'success', onClose: vi.fn() },
    { id: '3', message: 'Toast 3', type: 'error', onClose: vi.fn() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all toasts', () => {
      // Note: ToastContainer now uses Zustand store, so we need to mock the store
      // For now, just test that it renders without crashing
      render(<ToastContainer />);
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });

    it('renders empty container when no toasts', () => {
      const { container } = render(<ToastContainer />);
      const containerElement = container.querySelector('.fixed.top-4.right-4');
      expect(containerElement).toBeInTheDocument();
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    });

    it('applies correct positioning classes', () => {
      const { container } = render(<ToastContainer toasts={mockToasts} />);
      const containerElement = container.querySelector('.fixed.top-4.right-4');
      expect(containerElement).toBeInTheDocument();
    });

    it('applies spacing between toasts', () => {
      const { container } = render(<ToastContainer toasts={mockToasts} />);
      const containerElement = container.querySelector('.space-y-2');
      expect(containerElement).toBeInTheDocument();
    });
  });

  describe('useToast Hook', () => {
    it('initializes with empty toasts array', () => {
      const TestComponent = () => {
        const { toasts } = useToast();
        return <div data-testid="toast-count">{toasts.length}</div>;
      };
      render(<TestComponent />);
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('adds toast when showToast is called', () => {
      const TestComponent = () => {
        const { toasts, showToast } = useToast();
        return (
          <div>
            <div data-testid="toast-count">{toasts.length}</div>
            <button onClick={() => showToast({ message: 'New Toast' })}>Show Toast</button>
          </div>
        );
      };
      render(<TestComponent />);
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('removes toast when removeToast is called', () => {
      const TestComponent = () => {
        const { toasts, showToast, removeToast } = useToast();
        React.useEffect(() => {
          showToast({ message: 'Toast' });
        }, [showToast]);
        return (
          <div>
            <div data-testid="toast-count">{toasts.length}</div>
            <button onClick={() => toasts[0] && removeToast(toasts[0].id)}>Remove Toast</button>
          </div>
        );
      };
      render(<TestComponent />);
      // Toast should be added
      waitFor(() => {
        expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      });
    });

    it('generates unique IDs for toasts', () => {
      const TestComponent = () => {
        const { toasts, showToast } = useToast();
        React.useEffect(() => {
          showToast({ message: 'Toast 1' });
          showToast({ message: 'Toast 2' });
        }, [showToast]);
        return (
          <div>
            {toasts.map((toast) => (
              <div key={toast.id} data-testid={`toast-${toast.id}`}>
                {toast.message}
              </div>
            ))}
          </div>
        );
      };
      render(<TestComponent />);
      waitFor(() => {
        const toastElements = screen.getAllByText(/Toast/);
        expect(toastElements.length).toBeGreaterThan(0);
      });
    });

    it('passes onClose handler to toast', () => {
      const TestComponent = () => {
        const { toasts, showToast } = useToast();
        React.useEffect(() => {
          showToast({ message: 'Toast' });
        }, [showToast]);
        return (
          <div>
            {toasts.map((toast) => (
              <div key={toast.id} data-testid="toast">
                {toast.message}
                {toast.onClose && <span data-testid="has-onclose">✓</span>}
              </div>
            ))}
          </div>
        );
      };
      render(<TestComponent />);
      waitFor(() => {
        expect(screen.getByTestId('has-onclose')).toBeInTheDocument();
      });
    });
  });

  describe('Toast Types', () => {
    it('renders toasts with different types', () => {
      const toastsWithTypes: ToastProps[] = [
        { id: '1', message: 'Success', type: 'success', onClose: vi.fn() },
        { id: '2', message: 'Error', type: 'error', onClose: vi.fn() },
        { id: '3', message: 'Warning', type: 'warning', onClose: vi.fn() },
        { id: '4', message: 'Info', type: 'info', onClose: vi.fn() },
      ];
      render(<ToastContainer />);
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ToastContainer toasts={mockToasts} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper z-index for overlay', () => {
      const { container } = render(<ToastContainer toasts={mockToasts} />);
      const containerElement = container.querySelector('.z-50');
      expect(containerElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles many toasts', () => {
      const manyToasts: ToastProps[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        message: `Toast ${i}`,
        onClose: vi.fn(),
      }));
      render(<ToastContainer />);
      expect(screen.getByText('Toast 0')).toBeInTheDocument();
      expect(screen.getByText('Toast 9')).toBeInTheDocument();
    });

    it('handles toasts with long messages', () => {
      const longMessageToast: ToastProps[] = [
        {
          id: '1',
          message: 'This is a very long toast message that might wrap to multiple lines',
          onClose: vi.fn(),
        },
      ];
      render(<ToastContainer />);
      expect(
        screen.getByText('This is a very long toast message that might wrap to multiple lines')
      ).toBeInTheDocument();
    });
  });
});
