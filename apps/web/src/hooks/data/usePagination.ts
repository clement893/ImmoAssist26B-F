/**
 * usePagination Hook
 * Pagination automatique pour listes de données
 */

import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
  maxVisiblePages?: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  visiblePages: number[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
  getPageData: <T>(data: T[]) => T[];
}

export function usePagination(options: UsePaginationOptions): UsePaginationReturn {
  const {
    totalItems,
    pageSize: initialPageSize = 10,
    initialPage = 1,
    maxVisiblePages = 5,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize, totalItems);
  }, [startIndex, pageSize, totalItems]);

  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback(
    (size: number) => {
      const newPageSize = Math.max(1, size);
      setPageSizeState(newPageSize);
      // Adjust current page if necessary
      const newTotalPages = Math.ceil(totalItems / newPageSize);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    },
    [totalItems, currentPage]
  );

  const getPageData = useCallback(
    <T>(data: T[]): T[] => {
      return data.slice(startIndex, endIndex);
    },
    [startIndex, endIndex]
  );

  return {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    visiblePages,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    getPageData,
  };
}
