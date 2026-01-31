/**
 * Drawer Component Tests
 *
 * Comprehensive test suite for the Drawer component covering:
 * - Rendering with different props
 * - Position variations (left, right, top, bottom)
 * - Size variations (sm, md, lg, xl, full)
 * - Open/close behavior
 * - Overlay interactions
 * - Escape key handling
 * - Body scroll lock
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Drawer from '../Drawer';

describe('Drawer Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Drawer Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders drawer when isOpen is true', () => {
      render(<Drawer {...defaultProps} />);
      expect(screen.getByText('Drawer Content')).toBeInTheDocument();
    });

    it('does not render drawer when isOpen is false', () => {
      render(<Drawer {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
    });

    it('renders drawer with title', () => {
      render(<Drawer {...defaultProps} title="Drawer Title" />);
      expect(screen.getByText('Drawer Title')).toBeInTheDocument();
    });

    it('renders drawer without title', () => {
      render(<Drawer {...defaultProps} />);
      expect(screen.queryByText('Drawer Title')).not.toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<Drawer {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close drawer');
      expect(closeButton).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<Drawer {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByLabelText('Close drawer')).not.toBeInTheDocument();
    });
  });

  describe('Position Variations', () => {
    const positions: Array<'left' | 'right' | 'top' | 'bottom'> = [
      'left',
      'right',
      'top',
      'bottom',
    ];

    positions.forEach((position) => {
      it(`renders drawer at ${position} position`, () => {
        const { container } = render(<Drawer {...defaultProps} position={position} />);
        const drawer = container.querySelector('[role="dialog"]');
        expect(drawer).toBeInTheDocument();
        // Check for position-specific classes
        if (position === 'left' || position === 'right') {
          expect(drawer?.className).toContain(position === 'left' ? 'left-0' : 'right-0');
        } else {
          expect(drawer?.className).toContain(position === 'top' ? 'top-0' : 'bottom-0');
        }
      });
    });
  });

  describe('Size Variations', () => {
    const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];

    sizes.forEach((size) => {
      it(`renders drawer with ${size} size`, () => {
        const { container } = render(<Drawer {...defaultProps} size={size} position="right" />);
        const drawer = container.querySelector('[role="dialog"]');
        expect(drawer).toBeInTheDocument();
      });
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const handleClose = vi.fn();
      render(<Drawer {...defaultProps} onClose={handleClose} />);

      const closeButton = screen.getByLabelText('Close drawer');
      fireEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked and closeOnOverlayClick is true', async () => {
      const handleClose = vi.fn();
      const { container } = render(
        <Drawer {...defaultProps} onClose={handleClose} closeOnOverlayClick={true} />
      );

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();

      if (overlay) {
        fireEvent.click(overlay);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when overlay is clicked and closeOnOverlayClick is false', async () => {
      const handleClose = vi.fn();
      const { container } = render(
        <Drawer {...defaultProps} onClose={handleClose} closeOnOverlayClick={false} />
      );

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();

      if (overlay) {
        fireEvent.click(overlay);
        expect(handleClose).not.toHaveBeenCalled();
      }
    });

    it('does not close when drawer content is clicked', async () => {
      const handleClose = vi.fn();
      const { container } = render(
        <Drawer {...defaultProps} onClose={handleClose} closeOnOverlayClick={true} />
      );

      const drawerContent = screen.getByText('Drawer Content');
      fireEvent.click(drawerContent);

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key Handling', () => {
    it('closes drawer on Escape key when closeOnEscape is true', async () => {
      const handleClose = vi.fn();
      render(<Drawer {...defaultProps} onClose={handleClose} closeOnEscape={true} />);

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not close drawer on Escape key when closeOnEscape is false', async () => {
      const handleClose = vi.fn();
      render(<Drawer {...defaultProps} onClose={handleClose} closeOnEscape={false} />);

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(handleClose).not.toHaveBeenCalled();
      });
    });

    it('does not close drawer on other keys', async () => {
      const handleClose = vi.fn();
      render(<Drawer {...defaultProps} onClose={handleClose} closeOnEscape={true} />);

      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when drawer is open', () => {
      render(<Drawer {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('unlocks body scroll when drawer is closed', () => {
      const { rerender } = render(<Drawer {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Drawer {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = render(<Drawer {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Overlay', () => {
    it('renders overlay by default', () => {
      const { container } = render(<Drawer {...defaultProps} />);
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('hides overlay when overlay prop is false', () => {
      const { container } = render(<Drawer {...defaultProps} overlay={false} />);
      const overlay = container.querySelector('.bg-black\\/50');
      expect(overlay).not.toBeInTheDocument();
    });

    it('applies custom overlay className', () => {
      const { container } = render(<Drawer {...defaultProps} overlayClassName="custom-overlay" />);
      const overlay = container.querySelector('.custom-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Drawer {...defaultProps} className="custom-drawer" />);
      const drawer = container.querySelector('.custom-drawer');
      expect(drawer).toBeInTheDocument();
    });

    it('renders complex children', () => {
      render(
        <Drawer {...defaultProps}>
          <div>
            <h2>Title</h2>
            <p>Paragraph</p>
            <button>Button</button>
          </div>
        </Drawer>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Drawer {...defaultProps} title="Drawer Title" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has role="dialog"', () => {
      const { container } = render(<Drawer {...defaultProps} />);
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      const { container } = render(<Drawer {...defaultProps} />);
      const dialog = container.querySelector('[aria-modal="true"]');
      expect(dialog).toBeInTheDocument();
    });

    it('has aria-labelledby when title is provided', () => {
      const { container } = render(<Drawer {...defaultProps} title="Drawer Title" />);
      const dialog = container.querySelector('[aria-labelledby="drawer-title"]');
      expect(dialog).toBeInTheDocument();
    });

    it('does not have aria-labelledby when title is not provided', () => {
      const { container } = render(<Drawer {...defaultProps} />);
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('has accessible close button', () => {
      render(<Drawer {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close drawer');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid open/close toggles', () => {
      const handleClose = vi.fn();
      const { rerender } = render(<Drawer {...defaultProps} isOpen={true} onClose={handleClose} />);

      rerender(<Drawer {...defaultProps} isOpen={false} onClose={handleClose} />);
      rerender(<Drawer {...defaultProps} isOpen={true} onClose={handleClose} />);
      rerender(<Drawer {...defaultProps} isOpen={false} onClose={handleClose} />);

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('handles multiple drawers', () => {
      render(
        <>
          <Drawer {...defaultProps} title="Drawer 1">
            <div>Content 1</div>
          </Drawer>
          <Drawer {...defaultProps} isOpen={false} title="Drawer 2">
            <div>Content 2</div>
          </Drawer>
        </>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });
  });
});
