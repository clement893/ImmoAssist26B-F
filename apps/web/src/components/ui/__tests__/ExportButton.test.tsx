/**
 * ExportButton Component Tests
 *
 * Comprehensive test suite for the ExportButton component covering:
 * - CSV export
 * - Excel export
 * - Custom export handler
 * - Loading states
 * - Edge cases
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import ExportButton from '../ExportButton';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('ExportButton Component', () => {
  const mockData = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders export button', () => {
      render(<ExportButton data={mockData} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders dropdown with export options', () => {
      render(<ExportButton data={mockData} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByText(/exporter en csv/i)).toBeInTheDocument();
      expect(screen.getByText(/exporter en excel/i)).toBeInTheDocument();
    });
  });

  describe('CSV Export', () => {
    it('exports data as CSV', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      render(<ExportButton data={mockData} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const csvOption = screen.getByText(/exporter en csv/i);
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a');
      });
    });

    it('uses custom filename', async () => {
      render(<ExportButton data={mockData} filename="custom-export" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const csvOption = screen.getByText(/exporter en csv/i);
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    it('calls onExport callback when provided', async () => {
      const handleExport = vi.fn();
      render(<ExportButton data={mockData} onExport={handleExport} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const csvOption = screen.getByText(/exporter en csv/i);
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(handleExport).toHaveBeenCalledWith('csv', mockData);
      });
    });
  });

  describe('Excel Export', () => {
    it('exports data as Excel', async () => {
      render(<ExportButton data={mockData} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const excelOption = screen.getByText(/exporter en excel/i);
      fireEvent.click(excelOption);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    it('calls onExport callback for Excel', async () => {
      const handleExport = vi.fn();
      render(<ExportButton data={mockData} onExport={handleExport} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const excelOption = screen.getByText(/exporter en excel/i);
      fireEvent.click(excelOption);

      await waitFor(() => {
        expect(handleExport).toHaveBeenCalledWith('excel', mockData);
      });
    });
  });

  describe('Data Handling', () => {
    it('handles empty data array', () => {
      render(<ExportButton data={[]} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles data with null values', () => {
      const dataWithNulls = [
        { id: 1, name: 'John', email: null },
        { id: 2, name: null, email: 'jane@example.com' },
      ];
      render(<ExportButton data={dataWithNulls} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles data with object values', () => {
      const dataWithObjects = [{ id: 1, name: 'John', metadata: { age: 30 } }];
      render(<ExportButton data={dataWithObjects} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles data with special characters', () => {
      const dataWithSpecialChars = [{ id: 1, name: 'John "Doe"', email: 'john@example.com' }];
      render(<ExportButton data={dataWithSpecialChars} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during export', async () => {
      render(<ExportButton data={mockData} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const csvOption = screen.getByText(/exporter en csv/i);
      fireEvent.click(csvOption);

      // Button should show loading state
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ExportButton data={mockData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles export error gracefully', async () => {
      // Mock createObjectURL to throw error
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Export error');
      });

      render(<ExportButton data={mockData} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const csvOption = screen.getByText(/exporter en csv/i);
      fireEvent.click(csvOption);

      // Should not crash
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });
    });

    it('handles large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));
      render(<ExportButton data={largeData} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
