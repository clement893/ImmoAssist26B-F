/**
 * Appointments API client
 * Rendez-vous and calendar connections
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

export const appointmentsAPI = {
  list: (params?: {
    skip?: number;
    limit?: number;
    status?: AppointmentStatus;
    transaction_id?: number;
    date_from?: string;
    date_to?: string;
  }) => apiClient.get<AppointmentListResponse>('/v1/appointments/', { params }),

  get: (id: number) => apiClient.get<AppointmentResponse>(`/v1/appointments/${id}`),

  create: (data: AppointmentCreate) =>
    apiClient.post<AppointmentResponse>('/v1/appointments/', data),

  update: (id: number, data: AppointmentUpdate) =>
    apiClient.put<AppointmentResponse>(`/v1/appointments/${id}`, data),

  delete: (id: number) => apiClient.delete(`/v1/appointments/${id}`),

  getAvailability: (params: {
    date_from: string;
    date_to: string;
    duration_minutes?: number;
  }) =>
    apiClient.get<AvailabilityResponse>('/v1/appointments/availability', {
      params,
    }),

  listCalendarConnections: () =>
    apiClient.get<{ connections: CalendarConnectionResponse[] }>(
      '/v1/calendar/connections/'
    ),

  disconnectCalendar: (provider?: 'google' | 'outlook') =>
    apiClient.delete('/v1/calendar/connections/', {
      params: provider ? { provider } : undefined,
    }),
};
