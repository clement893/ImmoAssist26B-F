/**
 * Card Component Tests
 *
 * Comprehensive test suite for the Card component covering:
 * - Rendering with different props
 * - Header and footer rendering
 * - Click handlers
 * - Hover effects
 * - Padding options
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Card from '../Card';

expect.extend(toHaveNoViolations);

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders card with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(<Card title="Card Title">Content</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders with subtitle', () => {
      render(
        <Card title="Title" subtitle="Subtitle">
          Content
        </Card>
      );
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });

    it('renders with custom header', () => {
      render(<Card header={<div>Custom Header</div>}>Content</Card>);
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(<Card footer={<button>Footer Button</button>}>Content</Card>);
      expect(screen.getByText('Footer Button')).toBeInTheDocument();
    });

    it('renders with actions (alias for footer)', () => {
      render(<Card actions={<button>Action Button</button>}>Content</Card>);
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when card is clicked', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = screen.getByText('Clickable Card').closest('div');
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies cursor-pointer class when onClick is provided', () => {
      const { container } = render(<Card onClick={() => {}}>Clickable</Card>);
      const card = container.querySelector('div');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover styles when hover prop is true', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.querySelector('div');
      expect(card).toHaveClass('transition-modern', 'hover:shadow-standard-md'); // UI Revamp - Transition moderne et nouveau système d'ombres
    });

    it('does not apply hover styles when hover prop is false', () => {
      const { container } = render(<Card hover={false}>Content</Card>);
      const card = container.querySelector('div');
      expect(card).not.toHaveClass('hover:shadow-standard-md'); // UI Revamp - Nouveau système d'ombres
    });
  });

  describe('Padding', () => {
    it('applies padding by default', () => {
      const { container } = render(<Card>Content</Card>);
      const contentDiv = container.querySelector('.p-6');
      expect(contentDiv).toBeInTheDocument();
    });

    it('removes padding when padding prop is false', () => {
      const { container } = render(<Card padding={false}>Content</Card>);
      const contentDiv = container.querySelector('.p-6');
      expect(contentDiv).not.toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('merges custom className with default classes', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.querySelector('div');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('bg-white'); // Default class
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Card title="Test Card">Content</Card>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains semantic structure with header and footer', () => {
      render(
        <Card title="Title" footer={<button>Action</button>}>
          Content
        </Card>
      );
      // Card should have proper structure
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('Header Priority', () => {
    it('uses custom header over title/subtitle', () => {
      render(
        <Card title="Title" subtitle="Subtitle" header={<div>Custom Header</div>}>
          Content
        </Card>
      );
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
    });
  });

  describe('Footer Priority', () => {
    it('uses footer over actions when both are provided', () => {
      render(
        <Card footer={<button>Footer</button>} actions={<button>Actions</button>}>
          Content
        </Card>
      );
      expect(screen.getByText('Footer')).toBeInTheDocument();
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });
  });
});
