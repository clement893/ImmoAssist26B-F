/**
 * TableSearchBar Component Tests
 *
 * Comprehensive test suite for the TableSearchBar component covering:
 * - Rendering
 * - Search input handling
 * - Placeholder text
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import TableSearchBar from '../TableSearchBar';

describe('TableSearchBar Component', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders search input', () => {
      render(<TableSearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Rechercher...');
      expect(input).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<TableSearchBar {...defaultProps} placeholder="Search items..." />);
      const input = screen.getByPlaceholderText('Search items...');
      expect(input).toBeInTheDocument();
    });

    it('displays search icon', () => {
      const { container } = render(<TableSearchBar {...defaultProps} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('displays current search term', () => {
      render(<TableSearchBar {...defaultProps} searchTerm="test query" />);
      const input = screen.getByDisplayValue('test query');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onSearchChange when input value changes', () => {
      const handleSearchChange = vi.fn();
      render(<TableSearchBar searchTerm="" onSearchChange={handleSearchChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleSearchChange).toHaveBeenCalledWith('test');
    });

    it('calls onSearchChange with empty string when cleared', () => {
      const handleSearchChange = vi.fn();
      render(<TableSearchBar searchTerm="test" onSearchChange={handleSearchChange} />);

      const input = screen.getByDisplayValue('test');
      fireEvent.change(input, { target: { value: '' } });

      expect(handleSearchChange).toHaveBeenCalledWith('');
    });

    it('handles multiple character input', () => {
      const handleSearchChange = vi.fn();
      render(<TableSearchBar searchTerm="" onSearchChange={handleSearchChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });

      expect(handleSearchChange).toHaveBeenCalledTimes(3);
      expect(handleSearchChange).toHaveBeenLastCalledWith('abc');
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<TableSearchBar {...defaultProps} className="custom-search" />);
      const wrapper = container.querySelector('.custom-search');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TableSearchBar {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible input', () => {
      render(<TableSearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Rechercher...');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long search terms', () => {
      const longTerm = 'a'.repeat(1000);
      const handleSearchChange = vi.fn();
      render(<TableSearchBar searchTerm="" onSearchChange={handleSearchChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: longTerm } });

      expect(handleSearchChange).toHaveBeenCalledWith(longTerm);
    });

    it('handles special characters in search term', () => {
      const specialChars = '!@#$%^&*()';
      const handleSearchChange = vi.fn();
      render(<TableSearchBar searchTerm="" onSearchChange={handleSearchChange} />);

      const input = screen.getByPlaceholderText('Rechercher...');
      fireEvent.change(input, { target: { value: specialChars } });

      expect(handleSearchChange).toHaveBeenCalledWith(specialChars);
    });
  });
});
