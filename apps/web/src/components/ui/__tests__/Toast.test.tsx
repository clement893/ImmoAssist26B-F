import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Toast from '../Toast';

describe('Toast', () => {
  it('renders message', () => {
    const handleClose = vi.fn();
    render(<Toast id="1" message="Test message" onClose={handleClose} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onClose after duration', async () => {
    const handleClose = vi.fn();
    render(<Toast id="1" message="Test" onClose={handleClose} duration={1000} />);

    // Wait for the duration timeout
    await waitFor(
      () => {
        expect(handleClose).toHaveBeenCalledWith('1');
      },
      { timeout: 2000 }
    );
  });

  it('does not auto-close when duration is 0', async () => {
    const handleClose = vi.fn();
    render(<Toast id="1" message="Test" onClose={handleClose} duration={0} />);

    // Wait a bit to ensure it doesn't close
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(<Toast id="1" message="Test" onClose={handleClose} />);

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledWith('1');
  });

  it('applies variant classes', () => {
    const handleClose = vi.fn();
    const { rerender, container } = render(
      <Toast id="1" message="Test" onClose={handleClose} type="success" />
    );
    let toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-secondary-50');

    rerender(<Toast id="1" message="Test" onClose={handleClose} type="error" />);
    toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-error-50');

    rerender(<Toast id="1" message="Test" onClose={handleClose} type="warning" />);
    toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-warning-50');

    rerender(<Toast id="1" message="Test" onClose={handleClose} type="info" />);
    toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-primary-50');
  });

  it('renders icon when provided', () => {
    const handleClose = vi.fn();
    const icon = <span data-testid="toast-icon">✓</span>;

    render(<Toast id="1" message="Test" onClose={handleClose} icon={icon} />);

    expect(screen.getByTestId('toast-icon')).toBeInTheDocument();
  });

  it('cleans up timer on unmount', async () => {
    const handleClose = vi.fn();
    const { unmount } = render(
      <Toast id="1" message="Test" onClose={handleClose} duration={1000} />
    );

    unmount();

    // Wait to ensure timer was cleaned up
    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('uses default type of info', () => {
    const handleClose = vi.fn();
    const { container } = render(<Toast id="1" message="Test" onClose={handleClose} />);
    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('bg-primary-50');
  });

  it('uses default duration of 5000ms', async () => {
    const handleClose = vi.fn();
    render(<Toast id="1" message="Test" onClose={handleClose} />);

    await waitFor(
      () => {
        expect(handleClose).toHaveBeenCalledWith('1');
      },
      { timeout: 6000 }
    );
  });

  it('handles custom duration', async () => {
    const handleClose = vi.fn();
    render(<Toast id="1" message="Test" onClose={handleClose} duration={2000} />);

    await waitFor(
      () => {
        expect(handleClose).toHaveBeenCalledWith('1');
      },
      { timeout: 3000 }
    );
  });

  it('handles long messages', () => {
    const handleClose = vi.fn();
    const longMessage =
      'This is a very long toast message that might wrap to multiple lines and should still be displayed correctly';
    render(<Toast id="1" message={longMessage} onClose={handleClose} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('applies correct styling for each type', () => {
    const handleClose = vi.fn();
    const { container, rerender } = render(
      <Toast id="1" message="Test" onClose={handleClose} type="success" />
    );
    let toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('border-secondary-200');

    rerender(<Toast id="1" message="Test" onClose={handleClose} type="error" />);
    toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('border-error-200');

    rerender(<Toast id="1" message="Test" onClose={handleClose} type="warning" />);
    toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('border-warning-200');

    rerender(<Toast id="1" message="Test" onClose={handleClose} type="info" />);
    toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('border-primary-200');
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const handleClose = vi.fn();
      const { container } = render(<Toast id="1" message="Test" onClose={handleClose} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible close button', () => {
      const handleClose = vi.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
