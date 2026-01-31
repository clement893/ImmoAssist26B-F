/**
 * React Query Hooks for Réseau Contacts API
 * Provides typed React Query hooks for network contacts endpoints
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reseauContactsAPI,
  type ContactCreate,
  type ContactUpdate,
} from '@/lib/api/reseau-contacts';

// Query Keys
export const reseauContactsQueryKeys = {
  all: ['reseau-contacts'] as const,
  lists: () => [...reseauContactsQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...reseauContactsQueryKeys.lists(), filters] as const,
  details: () => [...reseauContactsQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...reseauContactsQueryKeys.details(), id] as const,
} as const;

/**
 * Infinite query hook for fetching contacts with pagination
 */
export function useInfiniteReseauContacts(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: reseauContactsQueryKeys.list(filters),
    queryFn: ({ pageParam = 0 }) => reseauContactsAPI.list(pageParam, 50),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length * 50;
    },
    initialPageParam: 0,
  });
}

/**
 * Mutation hook for creating a contact
 */
export function useCreateReseauContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContactCreate) => reseauContactsAPI.create(data),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: reseauContactsQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook for updating a contact
 */
export function useUpdateReseauContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUpdate }) =>
      reseauContactsAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: reseauContactsQueryKeys.detail(variables.id) });
      queryClient.refetchQueries({ queryKey: reseauContactsQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook for deleting a contact
 */
export function useDeleteReseauContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reseauContactsAPI.delete(id),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: reseauContactsQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook for deleting all contacts
 */
export function useDeleteAllReseauContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all contacts and delete them one by one
      const contacts = await reseauContactsAPI.list(0, 10000);
      await Promise.all(contacts.map((contact) => reseauContactsAPI.delete(contact.id)));
      return {
        deleted_count: contacts.length,
        message: `${contacts.length} contact(s) supprimé(s) avec succès`,
      };
    },
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: reseauContactsQueryKeys.lists() });
    },
  });
}

// Re-export API client
export { reseauContactsAPI };
