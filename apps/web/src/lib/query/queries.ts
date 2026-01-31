/**
 * React Query Hooks for API Calls
 *
 * Provides typed React Query hooks for all API endpoints
 * with automatic caching, error handling, and refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, subscriptionsAPI, teamsAPI, invitationsAPI } from '@/lib/api';
import { TokenStorage } from '@/lib/auth/tokenStorage';

// Query Keys Factory
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    me: ['users', 'me'] as const,
  },
  subscriptions: {
    plans: (activeOnly?: boolean) => ['subscriptions', 'plans', activeOnly] as const,
    plan: (id: number) => ['subscriptions', 'plans', id] as const,
    me: ['subscriptions', 'me'] as const,
    payments: ['subscriptions', 'payments'] as const,
  },
  teams: {
    all: ['teams'] as const,
    detail: (id: string) => ['teams', id] as const,
    members: (id: string) => ['teams', id, 'members'] as const,
  },
  invitations: {
    all: (params?: { status?: string }) => ['invitations', params] as const,
    detail: (id: string) => ['invitations', id] as const,
  },
  resources: {
    all: ['resources'] as const,
    detail: (id: string) => ['resources', id] as const,
  },
} as const;

// Auth Hooks
export function useAuth() {
  // Only enable query if we're in browser and have a token
  const hasToken = typeof window !== 'undefined' && !!TokenStorage.getToken();

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => usersAPI.getMe(),
    enabled: typeof window !== 'undefined' && !!hasToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry if token is missing
  });
}

// User Hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => usersAPI.getUsers(),
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => usersAPI.getUser(userId),
    enabled: !!userId,
  });
}

export function useMe() {
  // Only enable query if we're in browser and have a token
  const hasToken = typeof window !== 'undefined' && !!TokenStorage.getToken();

  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => usersAPI.getMe(),
    enabled: typeof window !== 'undefined' && !!hasToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry if token is missing
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => usersAPI.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

// Subscription Hooks
export function useSubscriptionPlans(activeOnly: boolean = true) {
  return useQuery({
    queryKey: queryKeys.subscriptions.plans(activeOnly),
    queryFn: () => subscriptionsAPI.getPlans(activeOnly),
    staleTime: 1000 * 60 * 5, // 5 minutes - reduced from 30 minutes for better data freshness
  });
}

export function useSubscriptionPlan(planId: number) {
  return useQuery({
    queryKey: queryKeys.subscriptions.plan(planId),
    queryFn: () => subscriptionsAPI.getPlan(planId),
    enabled: !!planId,
    staleTime: 1000 * 60 * 5, // 5 minutes - reduced from 30 minutes for better data freshness
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: queryKeys.subscriptions.me,
    queryFn: () => subscriptionsAPI.getMySubscription(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (no subscription)
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 404) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

export function useSubscriptionPayments() {
  return useQuery({
    queryKey: queryKeys.subscriptions.payments,
    queryFn: () => subscriptionsAPI.getPayments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 404) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (data: {
      plan_id: number;
      success_url: string;
      cancel_url: string;
      trial_days?: number;
    }) => subscriptionsAPI.createCheckoutSession(data),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionsAPI.cancelSubscription(),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: queryKeys.subscriptions.me });
    },
  });
}

// Teams Hooks
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => teamsAPI.list(),
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => teamsAPI.get(teamId),
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: queryKeys.teams.members(teamId),
    queryFn: () => teamsAPI.getMembers(teamId),
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; organization_id?: string }) =>
      teamsAPI.create(data),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: { name?: string; description?: string };
    }) => teamsAPI.update(teamId, data),
    onSuccess: (_, variables) => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: queryKeys.teams.detail(variables.teamId) });
      queryClient.refetchQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamsAPI.delete(teamId),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

// Invitations Hooks
export function useInvitations(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.invitations.all(params),
    queryFn: () => invitationsAPI.list(params),
  });
}

export function useInvitation(invitationId: string) {
  return useQuery({
    queryKey: queryKeys.invitations.detail(invitationId),
    queryFn: () => invitationsAPI.get(invitationId),
    enabled: !!invitationId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; role: string; organization_id?: string }) =>
      invitationsAPI.create(data),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: queryKeys.invitations.all() });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => invitationsAPI.cancel(invitationId),
    onSuccess: () => {
      // Use refetchQueries to force immediate refetch instead of just marking as stale
      queryClient.refetchQueries({ queryKey: queryKeys.invitations.all() });
    },
  });
}

export function useResendInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) => invitationsAPI.resend(invitationId),
  });
}
