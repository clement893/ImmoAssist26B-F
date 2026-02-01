'use client';

import useSWR from 'swr';
import type {
  AppointmentListResponse,
  AppointmentResponse,
  AvailabilityResponse,
  AppointmentCreate,
  AppointmentUpdate,
  CalendarConnectionResponse,
} from '@/lib/api/appointments';
import { appointmentsAPI } from '@/lib/api/appointments';

const appointmentsListKey = (params?: Record<string, unknown>) =>
  ['appointments', 'list', params ?? {}] as const;
const appointmentKey = (id: number | null) => ['appointments', id] as const;
const availabilityKey = (params: {
  date_from: string;
  date_to: string;
  duration_minutes?: number;
}) => ['appointments', 'availability', params] as const;
const calendarConnectionsKey = () => ['calendar', 'connections'] as const;

export function useAppointmentsList(params?: {
  skip?: number;
  limit?: number;
  status?: string;
  transaction_id?: number;
  date_from?: string;
  date_to?: string;
}) {
  const { data, error, mutate } = useSWR<{ data: AppointmentListResponse }>(
    appointmentsListKey(params),
    async () => appointmentsAPI.list(params)
  );
  return {
    appointments: data?.data?.appointments ?? [],
    total: data?.data?.total ?? 0,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

export function useAppointment(id: number | null, enabled = true) {
  const { data, error, mutate } = useSWR<{ data: AppointmentResponse }>(
    enabled && id ? appointmentKey(id) : null,
    () => appointmentsAPI.get(id!)
  );
  return {
    appointment: data?.data ?? null,
    isLoading: enabled && id ? !error && !data : false,
    error,
    mutate,
  };
}

export function useAvailability(params: {
  date_from: string;
  date_to: string;
  duration_minutes?: number;
} | null) {
  const { data, error, mutate } = useSWR<{ data: AvailabilityResponse }>(
    params ? availabilityKey(params) : null,
    () => appointmentsAPI.getAvailability(params!)
  );
  return {
    slots: data?.data?.slots ?? [],
    isLoading: !!params && !error && !data,
    error,
    mutate,
  };
}

export function useCalendarConnections() {
  const { data, error, mutate } = useSWR<{
    data: { connections: CalendarConnectionResponse[] };
  }>(calendarConnectionsKey(), () => appointmentsAPI.listCalendarConnections());
  return {
    connections: data?.data?.connections ?? [],
    isLoading: !error && !data,
    error,
    mutate,
  };
}

export function useAppointmentsMutations() {
  const createAppointment = async (data: AppointmentCreate) => {
    const res = await appointmentsAPI.create(data);
    return res.data;
  };
  const updateAppointment = async (id: number, data: AppointmentUpdate) => {
    const res = await appointmentsAPI.update(id, data);
    return res.data;
  };
  const deleteAppointment = async (id: number) => {
    await appointmentsAPI.delete(id);
  };
  return {
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
