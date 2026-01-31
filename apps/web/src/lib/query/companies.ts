/**
 * React Query Hooks for Companies API
 * Provides typed React Query hooks for companies endpoints
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesAPI, type CompanyCreate, type CompanyUpdate } from '@/lib/api/companies';

// Query Keys
export const companiesQueryKeys = {
  all: ['companies'] as const,
  lists: () => [...companiesQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...companiesQueryKeys.lists(), filters] as const,
  details: () => [...companiesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...companiesQueryKeys.details(), id] as const,
} as const;

/**
 * Infinite query hook for fetching companies with pagination
 */
export function useInfiniteCompanies(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: companiesQueryKeys.list(filters),
    queryFn: ({ pageParam = 0 }) => companiesAPI.list(pageParam, 50),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length * 50;
    },
    initialPageParam: 0,
  });
}

/**
 * Mutation hook for creating a company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyCreate) => companiesAPI.create(data),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: companiesQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook for updating a company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompanyUpdate }) =>
      companiesAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: companiesQueryKeys.detail(variables.id) });
      queryClient.refetchQueries({ queryKey: companiesQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook for deleting a company
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companiesAPI.delete(id),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: companiesQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook for deleting all companies
 */
export function useDeleteAllCompanies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all companies and delete them one by one
      const companies = await companiesAPI.list(0, 10000);
      await Promise.all(companies.map((company) => companiesAPI.delete(company.id)));
      return {
        deleted_count: companies.length,
        message: `${companies.length} entreprise(s) supprimée(s) avec succès`,
      };
    },
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: companiesQueryKeys.lists() });
    },
  });
}

// Re-export API client
export { companiesAPI };
