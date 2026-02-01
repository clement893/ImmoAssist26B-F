/**
 * Calendar Availability API
 * API client for calendar availability endpoints
 */

import { apiClient } from './client';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface UserAvailability {
  id: number;
  user_id: number;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_active: boolean;
  label?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAvailabilityCreate {
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_active?: boolean;
  label?: string;
}

export interface UserAvailabilityUpdate {
  day_of_week?: DayOfWeek;
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  is_active?: boolean;
  label?: string;
}

export interface UserAvailabilityListResponse {
  availabilities: UserAvailability[];
  total: number;
}

export interface ListAvailabilitiesParams {
  skip?: number;
  limit?: number;
  day_of_week?: DayOfWeek;
  is_active?: boolean;
}

function normalizeListResponse(
  response: UserAvailabilityListResponse | { data?: UserAvailabilityListResponse }
): UserAvailabilityListResponse {
  const data =
    response && typeof response === 'object' && 'availabilities' in response
      ? (response as UserAvailabilityListResponse)
      : (response as { data?: UserAvailabilityListResponse }).data;
  return data ?? { availabilities: [], total: 0 };
}

function normalizeItemResponse<T>(response: T | { data?: T }, fallback: string): T {
  const data =
    response && typeof response === 'object' && !('availabilities' in response) && 'data' in response
      ? (response as { data: T }).data
      : (response as T);
  if (!data) {
    throw new Error(fallback);
  }
  return data;
}

export const calendarAvailabilityAPI = {
  /**
   * Get current user's availabilities (all, or filter by is_active).
   * apiClient returns the response body directly.
   */
  async getMyAvailabilities(isActive?: boolean): Promise<UserAvailabilityListResponse> {
    const response = await apiClient.get<UserAvailabilityListResponse>('/v1/calendar/availability/me', {
      params: isActive !== undefined ? { is_active: isActive } : undefined,
    });
    return normalizeListResponse(response);
  },

  /**
   * List availabilities with optional filters
   */
  async list(params?: ListAvailabilitiesParams): Promise<UserAvailabilityListResponse> {
    const response = await apiClient.get<UserAvailabilityListResponse>('/v1/calendar/availability', { params });
    return normalizeListResponse(response);
  },

  /**
   * Get a specific availability by ID
   */
  async get(id: number): Promise<UserAvailability> {
    const response = await apiClient.get<UserAvailability>(`/v1/calendar/availability/${id}`);
    return normalizeItemResponse(response, `Availability not found: ${id}`);
  },

  /**
   * Create a new availability
   */
  async create(data: UserAvailabilityCreate): Promise<UserAvailability> {
    const response = await apiClient.post<UserAvailability>('/v1/calendar/availability', data);
    return normalizeItemResponse(response, 'Failed to create availability: no data returned');
  },

  /**
   * Update an availability
   */
  async update(id: number, data: UserAvailabilityUpdate): Promise<UserAvailability> {
    const response = await apiClient.put<UserAvailability>(`/v1/calendar/availability/${id}`, data);
    return normalizeItemResponse(response, 'Failed to update availability: no data returned');
  },

  /**
   * Delete an availability
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/v1/calendar/availability/${id}`);
  },
};
