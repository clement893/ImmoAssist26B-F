/**
 * Bookings API Client
 *
 * Client for creating and managing bookings
 */

import { apiClient, extractApiData } from '@/lib/api';

export interface AttendeeCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: string;
  experience_level?: string;
  dietary_restrictions?: string;
}

export interface BookingCreate {
  city_event_id: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  ticket_type: 'EARLY_BIRD' | 'REGULAR' | 'GROUP';
  quantity: number;
  attendees?: AttendeeCreate[];
}

export interface AttendeeResponse {
  id: number;
  booking_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: string;
  experience_level?: string;
  dietary_restrictions?: string;
  created_at: string;
}

export interface BookingResponse {
  id: number;
  city_event_id: number;
  booking_reference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  ticket_type: 'EARLY_BIRD' | 'REGULAR' | 'GROUP';
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_intent_id?: string;
  created_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  attendees: AttendeeResponse[];
}

export interface BookingSummaryResponse {
  booking_reference: string;
  city: string;
  city_fr: string;
  venue_name: string;
  venue_address?: string;
  start_date: string;
  end_date: string;
  attendee_name: string;
  attendee_email: string;
  quantity: number;
  total: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

/**
 * Bookings API client
 */
export const bookingsAPI = {
  /**
   * Create a new booking
   */
  create: async (data: BookingCreate): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>('/v1/bookings/create', data);
    const result = extractApiData<BookingResponse>(
      response as unknown as BookingResponse | import('@modele/types').ApiResponse<BookingResponse>
    );
    if (!result) {
      throw new Error('Failed to create booking: no data returned');
    }
    return result;
  },

  /**
   * Get booking by reference
   */
  getByReference: async (reference: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/v1/bookings/${reference}`);
    const data = extractApiData<BookingResponse>(
      response as unknown as BookingResponse | import('@modele/types').ApiResponse<BookingResponse>
    );
    if (!data) {
      throw new Error(`Booking not found: ${reference}`);
    }
    return data;
  },

  /**
   * Get booking summary by reference
   */
  getSummary: async (reference: string): Promise<BookingSummaryResponse> => {
    const response = await apiClient.get<BookingSummaryResponse>(
      `/v1/bookings/${reference}/summary`
    );
    const data = extractApiData<BookingSummaryResponse>(
      response as unknown as
        | BookingSummaryResponse
        | import('@modele/types').ApiResponse<BookingSummaryResponse>
    );
    if (!data) {
      throw new Error(`Booking summary not found: ${reference}`);
    }
    return data;
  },

  /**
   * Cancel a booking
   */
  cancel: async (reference: string): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>(`/v1/bookings/${reference}/cancel`);
    const data = extractApiData<BookingResponse>(
      response as unknown as BookingResponse | import('@modele/types').ApiResponse<BookingResponse>
    );
    if (!data) {
      throw new Error(`Failed to cancel booking: ${reference}`);
    }
    return data;
  },

  /**
   * Create payment intent for a booking
   */
  createPaymentIntent: async (bookingId: number): Promise<PaymentIntentResponse> => {
    const response = await apiClient.post<PaymentIntentResponse>(
      `/v1/bookings/${bookingId}/create-payment-intent`
    );
    const data = extractApiData<PaymentIntentResponse>(
      response as unknown as
        | PaymentIntentResponse
        | import('@modele/types').ApiResponse<PaymentIntentResponse>
    );
    if (!data) {
      throw new Error(`Failed to create payment intent for booking: ${bookingId}`);
    }
    return data;
  },
};
