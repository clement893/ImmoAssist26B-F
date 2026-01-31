import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalPages).toBe(10);
      expect(result.current.totalItems).toBe(100);
    });

    it('initializes with custom page size', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, pageSize: 20 }));

      expect(result.current.pageSize).toBe(20);
      expect(result.current.totalPages).toBe(5);
    });

    it('initializes with custom initial page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 3 }));

      expect(result.current.currentPage).toBe(3);
    });

    it('handles zero total items', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0 }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('goes to specific page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('clamps page to valid range', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.goToPage(0);
      });
      expect(result.current.currentPage).toBe(1);

      act(() => {
        result.current.goToPage(100);
      });
      expect(result.current.currentPage).toBe(10);
    });

    it('goes to next page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('does not go beyond last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 10 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(10);
    });

    it('goes to previous page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 5 }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(4);
    });

    it('does not go before first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('goes to first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 5 }));

      act(() => {
        result.current.firstPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('goes to last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.lastPage();
      });

      expect(result.current.currentPage).toBe(10);
    });
  });

  describe('Page Size', () => {
    it('changes page size', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.setPageSize(20);
      });

      expect(result.current.pageSize).toBe(20);
      expect(result.current.totalPages).toBe(5);
    });

    it('adjusts current page when page size changes', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, initialPage: 5 }));

      act(() => {
        result.current.setPageSize(50);
      });

      // Page 5 with 10 items per page = items 41-50
      // With 50 items per page, that's page 1 (items 1-50)
      expect(result.current.currentPage).toBe(1);
    });

    it('clamps page size to minimum of 1', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.setPageSize(0);
      });

      expect(result.current.pageSize).toBe(1);
    });
  });

  describe('Indices', () => {
    it('calculates start index correctly', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, pageSize: 10 }));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.startIndex).toBe(20);
    });

    it('calculates end index correctly', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, pageSize: 10 }));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.endIndex).toBe(30);
    });

    it('clamps end index to total items', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 25, pageSize: 10 }));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.endIndex).toBe(25);
    });
  });

  describe('Page State', () => {
    it('detects next page availability', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.goToPage(10);
      });

      expect(result.current.hasNextPage).toBe(false);
    });

    it('detects previous page availability', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      expect(result.current.hasPreviousPage).toBe(false);

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.hasPreviousPage).toBe(true);
    });
  });

  describe('Visible Pages', () => {
    it('calculates visible pages correctly', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, maxVisiblePages: 5 }));

      act(() => {
        result.current.goToPage(5);
      });

      // Should show pages 3, 4, 5, 6, 7
      expect(result.current.visiblePages).toEqual([3, 4, 5, 6, 7]);
    });

    it('adjusts visible pages near start', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, maxVisiblePages: 5 }));

      act(() => {
        result.current.goToPage(2);
      });

      // Should show pages 1, 2, 3, 4, 5
      expect(result.current.visiblePages).toEqual([1, 2, 3, 4, 5]);
    });

    it('adjusts visible pages near end', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, maxVisiblePages: 5 }));

      act(() => {
        result.current.goToPage(9);
      });

      // Should show pages 6, 7, 8, 9, 10
      expect(result.current.visiblePages).toEqual([6, 7, 8, 9, 10]);
    });

    it('handles fewer pages than maxVisiblePages', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 20, maxVisiblePages: 10 }));

      expect(result.current.visiblePages).toEqual([1, 2]);
    });
  });

  describe('getPageData', () => {
    it('returns correct page data', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100, pageSize: 10 }));

      const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

      act(() => {
        result.current.goToPage(3);
      });

      const pageData = result.current.getPageData(data);
      expect(pageData).toHaveLength(10);
      expect(pageData[0].id).toBe(21);
      expect(pageData[9].id).toBe(30);
    });

    it('handles empty data array', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0 }));

      const pageData = result.current.getPageData([]);
      expect(pageData).toEqual([]);
    });
  });
});
