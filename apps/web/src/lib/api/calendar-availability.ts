/**
 * Calendar Availability API
 * API client for calendar availability endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

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

export const calendarAvailabilityAPI = {
  /**
   * Get current user's availabilities
   */
  async getMyAvailabilities(isActive?: boolean): Promise<UserAvailabilityListResponse> {
    const response = await apiClient.get<UserAvailabilityListResponse>('/v1/calendar/availability/me', {
      params: isActive !== undefined ? { is_active: isActive } : undefined,
    });
    return extractApiData<UserAvailabilityListResponse>(response) || { availabilities: [], total: 0 };
  },

  /**
   * List availabilities with optional filters
   */
  async list(params?: ListAvailabilitiesParams): Promise<UserAvailabilityListResponse> {
    const response = await apiClient.get<UserAvailabilityListResponse>('/v1/calendar/availability', { params });
    return extractApiData<UserAvailabilityListResponse>(response) || { availabilities: [], total: 0 };
  },

  /**
   * Get a specific availability by ID
   */
  async get(id: number): Promise<UserAvailability> {
    const response = await apiClient.get<UserAvailability>(`/v1/calendar/availability/${id}`);
    const data = extractApiData<UserAvailability>(response);
    if (!data) {
      throw new Error(`Availability not found: ${id}`);
    }
    return data;
  },

  /**
   * Create a new availability
   */
  async create(data: UserAvailabilityCreate): Promise<UserAvailability> {
    const response = await apiClient.post<UserAvailability>('/v1/calendar/availability', data);
    const result = extractApiData<UserAvailability>(response);
    if (!result) {
      throw new Error('Failed to create availability: no data returned');
    }
    return result;
  },

  /**
   * Update an availability
   */
  async update(id: number, data: UserAvailabilityUpdate): Promise<UserAvailability> {
    const response = await apiClient.put<UserAvailability>(`/v1/calendar/availability/${id}`, data);
    const result = extractApiData<UserAvailability>(response);
    if (!result) {
      throw new Error('Failed to update availability: no data returned');
    }
    return result;
  },

  /**
   * Delete an availability
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/v1/calendar/availability/${id}`);
  },
};
