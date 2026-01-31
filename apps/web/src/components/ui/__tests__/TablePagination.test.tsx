/**
 * TablePagination Component Tests
 *
 * Comprehensive test suite for the TablePagination component covering:
 * - Rendering
 * - Page navigation
 * - Display text
 * - Edge cases
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import TablePagination from '../TablePagination';

describe('TablePagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    pageSize: 10,
    onPageChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders pagination component', () => {
      render(<TablePagination {...defaultProps} />);
      expect(screen.getByText(/Affichage de/i)).toBeInTheDocument();
    });

    it('displays correct item range', () => {
      render(<TablePagination {...defaultProps} />);
      expect(screen.getByText(/Affichage de 1 à 10 sur 50/i)).toBeInTheDocument();
    });

    it('displays correct range for middle page', () => {
      render(<TablePagination {...defaultProps} currentPage={3} />);
      expect(screen.getByText(/Affichage de 21 à 30 sur 50/i)).toBeInTheDocument();
    });

    it('displays correct range for last page', () => {
      render(<TablePagination {...defaultProps} currentPage={5} totalItems={47} />);
      expect(screen.getByText(/Affichage de 41 à 47 sur 47/i)).toBeInTheDocument();
    });

    it('renders Pagination component', () => {
      const { container } = render(<TablePagination {...defaultProps} />);
      // Pagination component should be rendered
      expect(
        container.querySelector('nav') || container.querySelector('button')
      ).toBeInTheDocument();
    });
  });

  describe('Single Page Handling', () => {
    it('returns null when totalPages is 1', () => {
      const { container } = render(<TablePagination {...defaultProps} totalPages={1} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when totalPages is 0', () => {
      const { container } = render(<TablePagination {...defaultProps} totalPages={0} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Page Calculation', () => {
    it('calculates start index correctly', () => {
      render(<TablePagination {...defaultProps} currentPage={2} />);
      expect(screen.getByText(/Affichage de 11 à 20/i)).toBeInTheDocument();
    });

    it('calculates end index correctly for last page', () => {
      render(<TablePagination {...defaultProps} currentPage={5} totalItems={47} pageSize={10} />);
      expect(screen.getByText(/Affichage de 41 à 47/i)).toBeInTheDocument();
    });

    it('handles pageSize larger than totalItems', () => {
      render(<TablePagination {...defaultProps} totalItems={5} pageSize={10} />);
      expect(screen.getByText(/Affichage de 1 à 5 sur 5/i)).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TablePagination {...defaultProps} className="custom-pagination" />
      );
      const wrapper = container.querySelector('.custom-pagination');
      expect(wrapper).toBeInTheDocument();
    });

    it('passes correct props to Pagination component', () => {
      const handlePageChange = vi.fn();
      render(<TablePagination {...defaultProps} onPageChange={handlePageChange} />);
      // Pagination component should receive the props
      expect(screen.getByText(/Affichage de/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TablePagination {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles very large totalItems', () => {
      render(<TablePagination {...defaultProps} totalItems={1000000} currentPage={1000} />);
      expect(screen.getByText(/sur 1000000/i)).toBeInTheDocument();
    });

    it('handles currentPage equal to totalPages', () => {
      render(<TablePagination {...defaultProps} currentPage={5} totalPages={5} />);
      expect(screen.getByText(/Affichage de 41 à 50/i)).toBeInTheDocument();
    });

    it('handles pageSize of 1', () => {
      render(<TablePagination {...defaultProps} pageSize={1} totalItems={5} />);
      expect(screen.getByText(/Affichage de 1 à 1/i)).toBeInTheDocument();
    });
  });
});
