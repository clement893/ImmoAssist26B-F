import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Banner from '../Banner';

describe('Banner', () => {
  it('renders banner with children', () => {
    render(<Banner>Test message</Banner>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders banner with title and children', () => {
    render(<Banner title="Test Title">Test message</Banner>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <Banner>
        <div>Custom content</div>
      </Banner>
    );
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Banner onClose={onClose} dismissible>
        Test
      </Banner>
    );

    const closeButton = screen.getByRole('button', { name: /fermer/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when dismissible is false', () => {
    render(<Banner>Test</Banner>);
    expect(screen.queryByRole('button', { name: /fermer/i })).not.toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    const { container: infoContainer } = render(<Banner variant="info">Info</Banner>);
    expect(infoContainer.firstChild).toHaveClass('bg-info-50');

    const { container: successContainer } = render(<Banner variant="success">Success</Banner>);
    expect(successContainer.firstChild).toHaveClass('bg-success-50');

    const { container: warningContainer } = render(<Banner variant="warning">Warning</Banner>);
    expect(warningContainer.firstChild).toHaveClass('bg-warning-50');

    const { container: errorContainer } = render(<Banner variant="error">Error</Banner>);
    expect(errorContainer.firstChild).toHaveClass('bg-error-50');
  });

  it('applies custom className', () => {
    const { container } = render(<Banner className="custom-class">Test</Banner>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
