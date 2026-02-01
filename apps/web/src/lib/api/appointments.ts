/**
 * Appointments API client
 * Rendez-vous and calendar connections
 * apiClient returns the response body directly (no .data wrapper).
 */

import { apiClient } from '@/lib/api';

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled';
export type AttendeeStatus = 'accepted' | 'declined' | 'tentative' | 'needs_action';

export interface AppointmentAttendeeResponse {
  id: number;
  appointment_id: number;
  email: string;
  name: string | null;
  contact_id: number | null;
  status: AttendeeStatus;
}

export interface AppointmentResponse {
  id: number;
  broker_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  transaction_id: number | null;
  created_at: string;
  updated_at: string;
  attendees: AppointmentAttendeeResponse[];
}

export interface AppointmentListResponse {
  appointments: AppointmentResponse[];
  total: number;
}

export interface AppointmentAttendeeCreate {
  email: string;
  name?: string | null;
  contact_id?: number | null;
  status?: AttendeeStatus;
}

export interface AppointmentCreate {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  transaction_id?: number | null;
  attendees?: AppointmentAttendeeCreate[];
}

export interface AppointmentUpdate {
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  status?: AppointmentStatus;
  transaction_id?: number | null;
  attendees?: AppointmentAttendeeCreate[];
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  slots: AvailabilitySlot[];
}

export interface CalendarConnectionResponse {
  id: number;
  user_id: number;
  provider: 'google' | 'outlook';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeListResponse(
  res: AppointmentListResponse | { data?: AppointmentListResponse }
): AppointmentListResponse {
  if (res && typeof res === 'object' && 'appointments' in res) return res as AppointmentListResponse;
  return (res as { data?: AppointmentListResponse })?.data ?? { appointments: [], total: 0 };
}

function normalizeAppointmentResponse(
  res: AppointmentResponse | { data?: AppointmentResponse } | null | undefined
): AppointmentResponse | null {
  if (!res) return null;
  if (typeof res === 'object' && 'id' in res && 'title' in res) return res as AppointmentResponse;
  return (res as { data?: AppointmentResponse })?.data ?? null;
}

function normalizeAvailabilityResponse(
  res: AvailabilityResponse | { data?: AvailabilityResponse }
): AvailabilityResponse {
  if (res && typeof res === 'object' && 'slots' in res) return res as AvailabilityResponse;
  return (res as { data?: AvailabilityResponse })?.data ?? { slots: [] };
}

function normalizeConnectionsResponse(
  res: { connections: CalendarConnectionResponse[] } | { data?: { connections: CalendarConnectionResponse[] } }
): { connections: CalendarConnectionResponse[] } {
  if (res && typeof res === 'object' && 'connections' in res) return res as { connections: CalendarConnectionResponse[] };
  return (res as { data?: { connections: CalendarConnectionResponse[] } })?.data ?? { connections: [] };
}

export const appointmentsAPI = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    status?: AppointmentStatus;
    transaction_id?: number;
    date_from?: string;
    date_to?: string;
  }) => {
    const res = await apiClient.get<AppointmentListResponse>('/v1/appointments/', { params });
    return normalizeListResponse(res);
  },

  get: async (id: number) => {
    const res = await apiClient.get<AppointmentResponse>(`/v1/appointments/${id}`);
    const out = normalizeAppointmentResponse(res);
    if (!out) throw new Error('Rendez-vous non trouvé');
    return out;
  },

  create: async (data: AppointmentCreate) => {
    const res = await apiClient.post<AppointmentResponse>('/v1/appointments/', data);
    const out = normalizeAppointmentResponse(res);
    if (!out) throw new Error('Échec de la création du rendez-vous');
    return out;
  },

  update: async (id: number, data: AppointmentUpdate) => {
    const res = await apiClient.put<AppointmentResponse>(`/v1/appointments/${id}`, data);
    const out = normalizeAppointmentResponse(res);
    if (!out) throw new Error('Échec de la mise à jour du rendez-vous');
    return out;
  },

  delete: (id: number) => apiClient.delete(`/v1/appointments/${id}`),

  getAvailability: async (params: {
    date_from: string;
    date_to: string;
    duration_minutes?: number;
  }) => {
    const res = await apiClient.get<AvailabilityResponse>('/v1/appointments/availability', { params });
    return normalizeAvailabilityResponse(res);
  },

  listCalendarConnections: async () => {
    const res = await apiClient.get<{ connections: CalendarConnectionResponse[] }>('/v1/calendar/connections/');
    return normalizeConnectionsResponse(res);
  },

  disconnectCalendar: (provider?: 'google' | 'outlook') =>
    apiClient.delete('/v1/calendar/connections/', {
      params: provider ? { provider } : undefined,
    }),
};
