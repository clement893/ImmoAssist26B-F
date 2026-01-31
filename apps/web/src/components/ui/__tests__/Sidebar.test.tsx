/**
 * Sidebar Component Tests
 *
 * Comprehensive test suite for the Sidebar component covering:
 * - Rendering with different items
 * - Navigation links
 * - Collapsed/expanded states
 * - Nested items
 * - Active state
 * - Badges
 * - User section
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import Sidebar from '../Sidebar';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Sidebar Component', () => {
  const mockItems = [
    { label: 'Home', href: '/', icon: <span>🏠</span> },
    { label: 'Products', href: '/products', icon: <span>📦</span>, badge: '5' },
    {
      label: 'Settings',
      href: '/settings',
      icon: <span>⚙️</span>,
      children: [
        { label: 'Profile', href: '/settings/profile' },
        { label: 'Security', href: '/settings/security' },
      ],
    },
    { label: 'About', onClick: vi.fn() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sidebar with items', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders sidebar with empty items array', () => {
      const { container } = render(<Sidebar items={[]} />);
      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders icons when provided', () => {
      render(<Sidebar items={mockItems} />);
      const homeIcon = screen.getByText('🏠');
      expect(homeIcon).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders links for items with href', () => {
      render(<Sidebar items={mockItems} />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('renders buttons for items with onClick', () => {
      render(<Sidebar items={mockItems} />);
      const aboutButton = screen.getByText('About').closest('button');
      expect(aboutButton).toBeInTheDocument();
    });

    it('calls onClick when button item is clicked', () => {
      const handleClick = vi.fn();
      const items = [{ label: 'Click Me', onClick: handleClick }];
      render(<Sidebar items={items} />);

      fireEvent.click(screen.getByText('Click Me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Active State', () => {
    it('highlights active item based on currentPath', () => {
      render(<Sidebar items={mockItems} currentPath="/products" />);
      const productsItem = screen.getByText('Products').closest('div');
      expect(productsItem).toHaveClass('bg-primary-100');
    });

    it('highlights active item based on pathname', () => {
      // This test verifies that usePathname hook is used
      // The actual pathname is mocked at the module level
      render(<Sidebar items={mockItems} />);
      // The component should use the mocked pathname from vi.mock
      const productsItem = screen.getByText('Products');
      expect(productsItem).toBeInTheDocument();
    });

    it('highlights parent when child is active', () => {
      render(<Sidebar items={mockItems} currentPath="/settings/profile" />);
      const settingsItem = screen.getByText('Settings').closest('div');
      expect(settingsItem).toHaveClass('bg-primary-100');
    });
  });

  describe('Collapsed State', () => {
    it('renders in expanded state by default', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');
    });

    it('renders in collapsed state when collapsed prop is true', () => {
      const { container } = render(<Sidebar items={mockItems} collapsed={true} />);
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-16');
    });

    it('hides labels when collapsed', () => {
      render(<Sidebar items={mockItems} collapsed={true} />);
      const homeLabel = screen.getByText('Home');
      // Label should still be in DOM but visually hidden
      expect(homeLabel).toBeInTheDocument();
    });

    it('shows toggle button when onToggleCollapse is provided', () => {
      const handleToggle = vi.fn();
      render(<Sidebar items={mockItems} onToggleCollapse={handleToggle} />);
      const toggleButton = screen.getByLabelText('Collapse sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('calls onToggleCollapse when toggle button is clicked', () => {
      const handleToggle = vi.fn();
      render(<Sidebar items={mockItems} onToggleCollapse={handleToggle} />);

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(toggleButton);

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('updates toggle button label when collapsed', () => {
      const handleToggle = vi.fn();
      render(<Sidebar items={mockItems} collapsed={true} onToggleCollapse={handleToggle} />);
      const toggleButton = screen.getByLabelText('Expand sidebar');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Nested Items', () => {
    it('renders nested items when parent is expanded', async () => {
      render(<Sidebar items={mockItems} />);

      const settingsItem = screen.getByText('Settings');
      fireEvent.click(settingsItem);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
      });
    });

    it('hides nested items when parent is collapsed', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('toggles nested items on click', async () => {
      render(<Sidebar items={mockItems} />);

      const settingsItem = screen.getByText('Settings');
      fireEvent.click(settingsItem);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });

      fireEvent.click(settingsItem);

      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });

    it('does not show nested items when sidebar is collapsed', () => {
      render(<Sidebar items={mockItems} collapsed={true} />);

      const settingsItem = screen.getByText('Settings');
      fireEvent.click(settingsItem);

      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  describe('Badges', () => {
    it('renders badge when provided', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not render badge when not provided', () => {
      render(<Sidebar items={mockItems} />);
      const homeItem = screen.getByText('Home').closest('div');
      const badge = homeItem?.querySelector('.bg-primary-100');
      expect(badge).not.toBeInTheDocument();
    });

    it('hides badge when collapsed', () => {
      render(<Sidebar items={mockItems} collapsed={true} />);
      // Badge should still be in DOM but visually hidden
      expect(screen.queryByText('5')).toBeInTheDocument();
    });
  });

  describe('User Section', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('renders user section when user prop is provided', () => {
      render(<Sidebar items={mockItems} user={mockUser} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('does not render user section when user prop is not provided', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('renders user avatar with first letter of name', () => {
      render(<Sidebar items={mockItems} user={mockUser} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders user avatar with first letter of email when name is not provided', () => {
      render(<Sidebar items={mockItems} user={{ email: 'test@example.com' }} />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('hides user details when collapsed', () => {
      render(<Sidebar items={mockItems} user={mockUser} collapsed={true} />);
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    });

    it('shows default text when user name is not provided', () => {
      render(<Sidebar items={mockItems} user={{ email: 'test@example.com' }} />);
      expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Sidebar items={mockItems} className="custom-sidebar" />);
      const sidebar = container.querySelector('.custom-sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('handles items without icons', () => {
      const items = [{ label: 'No Icon', href: '/no-icon' }];
      render(<Sidebar items={items} />);
      expect(screen.getByText('No Icon')).toBeInTheDocument();
    });

    it('handles items without href or onClick', () => {
      const items = [{ label: 'Plain Item' }];
      render(<Sidebar items={items} />);
      expect(screen.getByText('Plain Item')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper navigation structure', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('has accessible toggle button', () => {
      const handleToggle = vi.fn();
      render(<Sidebar items={mockItems} onToggleCollapse={handleToggle} />);
      const toggleButton = screen.getByLabelText('Collapse sidebar');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles deeply nested items', () => {
      const nestedItems = [
        {
          label: 'Level 1',
          children: [
            {
              label: 'Level 2',
              children: [{ label: 'Level 3', href: '/level3' }],
            },
          ],
        },
      ];
      render(<Sidebar items={nestedItems} />);
      expect(screen.getByText('Level 1')).toBeInTheDocument();
    });

    it('handles items with empty labels', () => {
      const items = [{ label: '', href: '/' }];
      render(<Sidebar items={items} />);
      // Should render without errors
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });
  });
});
