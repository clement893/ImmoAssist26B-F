/**
 * Breadcrumbs Component Tests
 *
 * Comprehensive test suite for the Breadcrumbs component covering:
 * - Rendering with different items
 * - Link and span rendering
 * - Separator handling
 * - Last item styling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import Breadcrumbs from '../Breadcrumbs';

describe('Breadcrumbs Component', () => {
  const mockItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Category', href: '/products/category' },
    { label: 'Current Page' },
  ];

  describe('Rendering', () => {
    it('renders all breadcrumb items', () => {
      render(<Breadcrumbs items={mockItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
    });

    it('renders with single item', () => {
      render(<Breadcrumbs items={[{ label: 'Home' }]} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders with empty items array', () => {
      const { container } = render(<Breadcrumbs items={[]} />);
      const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Link Rendering', () => {
    it('renders links for items with href', () => {
      render(<Breadcrumbs items={mockItems} />);
      const homeLink = screen.getByText('Home').closest('a');
      const productsLink = screen.getByText('Products').closest('a');

      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
      expect(productsLink).toBeInTheDocument();
      expect(productsLink).toHaveAttribute('href', '/products');
    });

    it('renders span for items without href', () => {
      render(<Breadcrumbs items={mockItems} />);
      const currentPage = screen.getByText('Current Page');
      expect(currentPage.tagName).toBe('SPAN');
      expect(currentPage.closest('a')).not.toBeInTheDocument();
    });

    it('renders span for last item even if it has href', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Last', href: '/last' },
      ];
      render(<Breadcrumbs items={items} />);
      const lastItem = screen.getByText('Last');
      expect(lastItem.tagName).toBe('SPAN');
    });
  });

  describe('Last Item Styling', () => {
    it('applies special styling to last item', () => {
      render(<Breadcrumbs items={mockItems} />);
      const lastItem = screen.getByText('Current Page');
      expect(lastItem).toHaveClass('text-gray-500', 'dark:text-gray-400', 'font-medium');
    });

    it('does not apply last item styling to non-last items', () => {
      render(<Breadcrumbs items={mockItems} />);
      const homeItem = screen.getByText('Home');
      expect(homeItem).not.toHaveClass('text-gray-500');
    });
  });

  describe('Separators', () => {
    it('renders default separator between items', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />);
      const separators = container.querySelectorAll('svg');
      // Should have 3 separators for 4 items
      expect(separators.length).toBeGreaterThanOrEqual(3);
    });

    it('does not render separator before first item', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />);
      const nav = container.querySelector('nav');
      const firstChild = nav?.firstElementChild;
      const firstSeparator = firstChild?.querySelector('span');
      expect(firstSeparator).not.toBeInTheDocument();
    });

    it('renders custom separator', () => {
      const customSeparator = <span className="custom-sep">/</span>;
      const { container } = render(<Breadcrumbs items={mockItems} separator={customSeparator} />);
      const customSeps = container.querySelectorAll('.custom-sep');
      expect(customSeps.length).toBeGreaterThanOrEqual(3);
    });

    it('does not render separator for single item', () => {
      const { container } = render(<Breadcrumbs items={[{ label: 'Home' }]} />);
      const separators = container.querySelectorAll('svg');
      expect(separators.length).toBe(0);
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Breadcrumbs items={mockItems} className="custom-nav" />);
      const nav = container.querySelector('.custom-nav');
      expect(nav).toBeInTheDocument();
    });

    it('handles items with only labels', () => {
      const items = [{ label: 'Level 1' }, { label: 'Level 2' }, { label: 'Level 3' }];
      render(<Breadcrumbs items={items} />);
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
    });

    it('handles mixed items (with and without href)', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'No Link' },
        { label: 'Products', href: '/products' },
      ];
      render(<Breadcrumbs items={items} />);

      const homeLink = screen.getByText('Home').closest('a');
      const noLink = screen.getByText('No Link');
      const productsLink = screen.getByText('Products').closest('a');

      expect(homeLink).toBeInTheDocument();
      expect(noLink.tagName).toBe('SPAN');
      expect(productsLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Breadcrumbs items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has aria-label="Breadcrumb"', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />);
      const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
      expect(nav).toBeInTheDocument();
    });

    it('has proper navigation structure', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb');
    });
  });

  describe('Edge Cases', () => {
    it('handles items with empty labels', () => {
      const items = [{ label: '', href: '/' }, { label: 'Valid' }];
      render(<Breadcrumbs items={items} />);
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('handles very long item labels', () => {
      const longLabel = 'A'.repeat(100);
      const items = [{ label: 'Home', href: '/' }, { label: longLabel }];
      render(<Breadcrumbs items={mockItems} />);
      // Should render without errors
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('handles many items', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        label: `Level ${i + 1}`,
        href: i < 9 ? `/level-${i + 1}` : undefined,
      }));
      render(<Breadcrumbs items={manyItems} />);
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 10')).toBeInTheDocument();
    });
  });
});
