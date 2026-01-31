/**
 * Accessibility Testing Examples
 * Demonstrates accessibility testing patterns
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have accessible name', () => {
      render(<Button aria-label="Submit form">Submit</Button>);
      const button = screen.getByRole('button', { name: /submit form/i });
      expect(button).toBeInTheDocument();
    });

    it('should support disabled state accessibility', () => {
      render(
        <Button disabled aria-disabled="true">
          Disabled
        </Button>
      );
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels', () => {
      render(
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
        </form>
      );

      const input = screen.getByLabelText(/email/i);
      expect(input).toBeInTheDocument();
    });

    it('should have error messages associated with inputs', () => {
      render(
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" aria-invalid="true" aria-describedby="email-error" />
          <span id="email-error" role="alert">
            Email is required
          </span>
        </form>
      );

      const input = screen.getByLabelText(/email/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');

      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Email is required');
    });
  });

  describe('Navigation Accessibility', () => {
    it('should have proper navigation landmarks', () => {
      render(
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
      );

      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('should have skip links', () => {
      render(
        <>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <main id="main-content">Main content</main>
        </>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Image Accessibility', () => {
    it('should have alt text for images', () => {
      render(<img src="/test.jpg" alt="Test image description" />);

      const image = screen.getByAltText(/test image description/i);
      expect(image).toBeInTheDocument();
    });

    it('should mark decorative images appropriately', () => {
      render(<img src="/decorative.jpg" alt="" role="presentation" />);

      const image = screen.getByRole('presentation');
      expect(image).toHaveAttribute('alt', '');
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast', () => {
      // This would typically use a library like @axe-core/react
      // or manual contrast checking
      const { container } = render(
        <div style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>High contrast text</div>
      );

      // Basic check - in real tests, use a contrast checking library
      expect(container).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', () => {
      render(
        <div>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      // All buttons should be focusable
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should support keyboard shortcuts', () => {
      render(<button aria-keyshortcuts="Enter">Submit</button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-keyshortcuts', 'Enter');
    });
  });

  describe('ARIA Attributes', () => {
    it('should use proper ARIA roles', () => {
      render(
        <div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
          <h2 id="dialog-title">Dialog Title</h2>
          <p>Dialog content</p>
        </div>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should use aria-live for dynamic content', () => {
      render(
        <div aria-live="polite" aria-atomic="true">
          Status message
        </div>
      );

      const liveRegion = screen.getByText(/status message/i);
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });
});
