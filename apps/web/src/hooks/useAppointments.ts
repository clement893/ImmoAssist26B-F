'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AppointmentListResponse,
  AppointmentResponse,
  AvailabilityResponse,
  AppointmentCreate,
  AppointmentUpdate,
  CalendarConnectionResponse,
  AppointmentStatus,
} from '@/lib/api/appointments';
import { appointmentsAPI } from '@/lib/api/appointments';

export function useAppointmentsList(params?: {
  skip?: number;
  limit?: number;
  status?: AppointmentStatus;
  transaction_id?: number;
  date_from?: string;
  date_to?: string;
}) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['appointments', 'list', params ?? {}],
    queryFn: async () => {
      const res = await appointmentsAPI.list(params);
      return res.data as AppointmentListResponse;
    },
  });
  return {
    appointments: data?.appointments ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate: refetch,
  };
}

export function useAppointment(id: number | null, enabled = true) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['appointments', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await appointmentsAPI.get(id);
      return res.data as AppointmentResponse;
    },
    enabled: enabled && !!id,
  });
  return {
    appointment: data ?? null,
    isLoading: enabled && !!id ? isLoading : false,
    error,
    mutate: refetch,
  };
}

export function useAvailability(params: {
  date_from: string;
  date_to: string;
  duration_minutes?: number;
} | null) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['appointments', 'availability', params],
    queryFn: async () => {
      if (!params) return { slots: [] };
      const res = await appointmentsAPI.getAvailability(params);
      return res.data as AvailabilityResponse;
    },
    enabled: !!params,
  });
  return {
    slots: data?.slots ?? [],
    isLoading: !!params && isLoading,
    error,
    mutate: refetch,
  };
}

export function useCalendarConnections() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['calendar', 'connections'],
    queryFn: async () => {
      const res = await appointmentsAPI.listCalendarConnections();
      return res.data as { connections: CalendarConnectionResponse[] };
    },
  });
  return {
    connections: data?.connections ?? [],
    isLoading,
    error,
    mutate: refetch,
  };
}

export function useAppointmentsMutations() {
  const queryClient = useQueryClient();

  const createAppointment = async (data: AppointmentCreate) => {
    const res = await appointmentsAPI.create(data);
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    return res.data;
  };
  const updateAppointment = async (id: number, data: AppointmentUpdate) => {
    const res = await appointmentsAPI.update(id, data);
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    return res.data;
  };
  const deleteAppointment = async (id: number) => {
    await appointmentsAPI.delete(id);
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
  };
  return {
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
