/**
 * ThemeToggle Component Tests
 *
 * Comprehensive test suite for the ThemeToggle component covering:
 * - Rendering
 * - Theme switching
 * - Accessibility
 * - ClientOnly wrapper
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import ThemeToggle, { ThemeToggleWithIcon } from '../ThemeToggle';

// Mock ThemeContext
const mockToggleTheme = vi.fn();
const mockUseTheme = vi.fn(() => ({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: vi.fn(),
  toggleTheme: mockToggleTheme,
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

// Mock ClientOnly to render children directly in tests
vi.mock('../ClientOnly', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: vi.fn(),
      toggleTheme: mockToggleTheme,
    });
  });

  describe('Rendering', () => {
    it('renders theme toggle button', () => {
      render(<ThemeToggle />);
      const toggleButton = screen.getByLabelText('Toggle theme');
      expect(toggleButton).toBeInTheDocument();
    });

    it('renders toggle switch', () => {
      const { container } = render(<ThemeToggle />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeInTheDocument();
    });

    it('renders toggle thumb', () => {
      const { container } = render(<ThemeToggle />);
      const thumb = container.querySelector('.inline-block.h-4.w-4');
      expect(thumb).toBeInTheDocument();
    });
  });

  describe('Theme State', () => {
    it('shows light theme state when resolvedTheme is light', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      const { container } = render(<ThemeToggle />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('shows dark theme state when resolvedTheme is dark', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      const { container } = render(<ThemeToggle />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('applies correct classes for light theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      const { container } = render(<ThemeToggle />);
      const thumb = container.querySelector('.inline-block.h-4.w-4');
      expect(thumb).toHaveClass('translate-x-1');
    });

    it('applies correct classes for dark theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      const { container } = render(<ThemeToggle />);
      const thumb = container.querySelector('.inline-block.h-4.w-4');
      expect(thumb).toHaveClass('translate-x-6');
    });
  });

  describe('Theme Toggle Interaction', () => {
    it('calls toggleTheme when button is clicked', () => {
      render(<ThemeToggle />);
      const toggleButton = screen.getByLabelText('Toggle theme');

      fireEvent.click(toggleButton);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('calls toggleTheme multiple times on multiple clicks', () => {
      render(<ThemeToggle />);
      const toggleButton = screen.getByLabelText('Toggle theme');

      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      expect(mockToggleTheme).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ThemeToggle />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has aria-label', () => {
      render(<ThemeToggle />);
      const toggleButton = screen.getByLabelText('Toggle theme');
      expect(toggleButton).toBeInTheDocument();
    });

    it('has role="switch"', () => {
      const { container } = render(<ThemeToggle />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeInTheDocument();
    });

    it('has aria-checked attribute', () => {
      const { container } = render(<ThemeToggle />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('aria-checked');
    });

    it('has screen reader text', () => {
      render(<ThemeToggle />);
      const srText = screen.getByText('Toggle theme', { selector: '.sr-only' });
      expect(srText).toBeInTheDocument();
    });
  });

  describe('ThemeToggleWithIcon Component', () => {
    it('renders theme toggle with icon', () => {
      render(<ThemeToggleWithIcon />);
      const toggleButton = screen.getByLabelText('Toggle theme');
      expect(toggleButton).toBeInTheDocument();
    });

    it('shows sun icon when theme is dark', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      const { container } = render(<ThemeToggleWithIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('shows moon icon when theme is light', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      const { container } = render(<ThemeToggleWithIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('calls toggleTheme when icon button is clicked', () => {
      render(<ThemeToggleWithIcon />);
      const toggleButton = screen.getByLabelText('Toggle theme');

      fireEvent.click(toggleButton);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<ThemeToggleWithIcon />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles system theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        resolvedTheme: 'light',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);
      const toggleButton = screen.getByLabelText('Toggle theme');
      expect(toggleButton).toBeInTheDocument();
    });

    it('handles theme changes', () => {
      const { rerender } = render(<ThemeToggle />);

      mockUseTheme.mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: mockToggleTheme,
      });

      rerender(<ThemeToggle />);

      const { container } = render(<ThemeToggle />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });
});
