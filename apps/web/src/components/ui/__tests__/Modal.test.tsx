import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Modal from '../Modal';

describe('Modal', () => {
  beforeEach(() => {
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });
  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
        footer={<button>Footer Button</button>}
      >
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });

  it('does not close when clicking inside modal', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modalContent = screen.getByText('Modal content');
    fireEvent.click(modalContent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when clicking overlay', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const overlay = container.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not close when closeOnOverlayClick is false', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal" closeOnOverlayClick={false}>
        <p>Modal content</p>
      </Modal>
    );

    const overlay = container.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('does not close on Escape when closeOnEscape is false', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal" closeOnEscape={false}>
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders without title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" showCloseButton={false}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container, rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="sm">
        <p>Content</p>
      </Modal>
    );
    let modal = container.querySelector('.md\\:max-w-md');
    expect(modal).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="lg">
        <p>Content</p>
      </Modal>
    );
    modal = container.querySelector('.md\\:max-w-2xl');
    expect(modal).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="xl">
        <p>Content</p>
      </Modal>
    );
    modal = container.querySelector('.md\\:max-w-4xl');
    expect(modal).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="full">
        <p>Content</p>
      </Modal>
    );
    modal = container.querySelector('.md\\:max-w-full');
    expect(modal).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test" className="custom-modal">
        <p>Content</p>
      </Modal>
    );
    const modal = container.querySelector('.custom-modal');
    expect(modal).toBeInTheDocument();
  });

  it('applies custom overlayClassName', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test" overlayClassName="custom-overlay">
        <p>Content</p>
      </Modal>
    );
    const overlay = container.querySelector('.custom-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('locks body scroll when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('unlocks body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('has proper ARIA attributes', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
      >
        <p id="modal-desc">Content</p>
      </Modal>
    );
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(modal).toHaveAttribute('aria-describedby', 'modal-desc');
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
