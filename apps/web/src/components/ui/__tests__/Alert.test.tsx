import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '../Alert';

describe('Alert', () => {
  it('renders alert with text', () => {
    render(<Alert variant="info">Test message</Alert>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders alert with title', () => {
    render(
      <Alert variant="info" title="Test Title">
        Test message
      </Alert>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Alert variant="info">Info</Alert>);
    expect(screen.getByText('Info')).toBeInTheDocument();

    rerender(<Alert variant="success">Success</Alert>);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Alert variant="warning">Warning</Alert>);
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<Alert variant="error">Error</Alert>);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Alert variant="info" onClose={handleClose}>
        Test message
      </Alert>
    );

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when onClose is not provided', () => {
    render(<Alert variant="info">Test message</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const customIcon = <span data-testid="custom-icon">Custom</span>;
    render(
      <Alert variant="info" icon={customIcon}>
        Test message
      </Alert>
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Alert variant="info" className="custom-class">
        Test message
      </Alert>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
