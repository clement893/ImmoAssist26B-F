/**
 * ServiceTestCard Component Tests
 *
 * Comprehensive test suite for the ServiceTestCard component covering:
 * - Rendering with different props
 * - Color variants
 * - Link navigation
 * - Icon rendering
 * - Hover effects
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ServiceTestCard from '../ServiceTestCard';

expect.extend(toHaveNoViolations);

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

describe('ServiceTestCard Component', () => {
  describe('Rendering', () => {
    it('renders card with all required props', () => {
      render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders as a link with correct href', () => {
      render(
        <ServiceTestCard
          href="/test/service"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/test/service');
    });

    it('renders icon correctly', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders arrow icon', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const arrow = container.querySelector('svg[viewBox="0 0 24 24"]');
      expect(arrow).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    const colors: Array<'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = [
      'primary',
      'secondary',
      'info',
      'success',
      'warning',
      'error',
    ];

    colors.forEach((color) => {
      it(`applies correct classes for ${color} color variant`, () => {
        const { container } = render(
          <ServiceTestCard
            href="/test"
            title="Test Service"
            description="Test description"
            icon={mockIcon}
            color={color}
          />
        );

        const link = container.querySelector('a');
        expect(link).toHaveClass(`border-${color === 'error' ? 'danger' : color}-200`);
      });
    });

    it('defaults to info color when color prop is not provided', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
        />
      );

      const link = container.querySelector('a');
      expect(link).toHaveClass('border-info-200');
    });
  });

  describe('Styling', () => {
    it('applies base classes correctly', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = container.querySelector('a');
      expect(link).toHaveClass('group');
      expect(link).toHaveClass('p-6');
      expect(link).toHaveClass('border-2');
      expect(link).toHaveClass('rounded-lg');
      expect(link).toHaveClass('hover:shadow-lg');
      expect(link).toHaveClass('transition-all');
      expect(link).toHaveClass('duration-200');
    });

    it('applies color-specific border classes', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="success"
        />
      );

      const link = container.querySelector('a');
      expect(link).toHaveClass('border-success-200');
    });

    it('applies color-specific background gradient classes', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="warning"
        />
      );

      const link = container.querySelector('a');
      expect(link).toHaveClass('bg-gradient-to-br');
      expect(link).toHaveClass('from-warning-100');
      expect(link).toHaveClass('to-warning-200');
    });

    it('applies color-specific icon background classes', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="secondary"
        />
      );

      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toHaveClass('bg-secondary-600');
    });

    it('applies color-specific text classes to title', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="info"
        />
      );

      const title = container.querySelector('h3');
      expect(title).toHaveClass('text-info-900');
    });

    it('applies color-specific text classes to description', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="error"
        />
      );

      const description = container.querySelector('p');
      expect(description).toHaveClass('text-error-800');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover border color classes', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = container.querySelector('a');
      expect(link).toHaveClass('hover:border-primary-400');
    });

    it('applies arrow hover transform classes', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const arrow = container.querySelector('svg[viewBox="0 0 24 24"]');
      expect(arrow).toHaveClass('group-hover:translate-x-1');
      expect(arrow).toHaveClass('transition-transform');
    });
  });

  describe('Structure', () => {
    it('renders title as h3 element', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const title = container.querySelector('h3');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Test Service');
    });

    it('renders description as p element', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const description = container.querySelector('p');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Test description');
    });

    it('has correct icon container structure', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('rounded-lg');
      expect(iconContainer).toHaveClass('flex');
      expect(iconContainer).toHaveClass('items-center');
      expect(iconContainer).toHaveClass('justify-center');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses semantic HTML structure', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();

      const title = container.querySelector('h3');
      expect(title).toBeInTheDocument();

      const description = container.querySelector('p');
      expect(description).toBeInTheDocument();
    });

    it('has accessible link with descriptive text', () => {
      render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Test Service');
      expect(link).toHaveTextContent('Test description');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      render(
        <ServiceTestCard
          href="/test"
          title=""
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('handles empty description gracefully', () => {
      render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description=""
          icon={mockIcon}
          color="primary"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('handles long href paths', () => {
      const longHref = '/very/long/path/to/test/service/endpoint';
      render(
        <ServiceTestCard
          href={longHref}
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', longHref);
    });

    it('handles complex icon components', () => {
      const complexIcon = (
        <div>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );

      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={complexIcon}
          color="primary"
        />
      );

      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes for borders', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="primary"
        />
      );

      const link = container.querySelector('a');
      expect(link).toHaveClass('dark:border-primary-800');
    });

    it('applies dark mode classes for backgrounds', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="success"
        />
      );

      const link = container.querySelector('a');
      expect(link).toHaveClass('dark:from-success-900/60');
      expect(link).toHaveClass('dark:to-success-800/60');
    });

    it('applies dark mode classes for text', () => {
      const { container } = render(
        <ServiceTestCard
          href="/test"
          title="Test Service"
          description="Test description"
          icon={mockIcon}
          color="warning"
        />
      );

      const title = container.querySelector('h3');
      expect(title).toHaveClass('dark:text-warning-100');

      const description = container.querySelector('p');
      expect(description).toHaveClass('dark:text-warning-200');
    });
  });
});
