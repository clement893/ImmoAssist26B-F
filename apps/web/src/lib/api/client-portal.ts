/**
 * Client Portal API Client
 *
 * API functions for client portal endpoints.
 * All endpoints are scoped to the authenticated client user.
 *
 * @module ClientPortalAPI
 * @see {@link https://docs.example.com/client-portal Client Portal Documentation}
 */

import { apiClient } from './client';

/**
 * Client Dashboard Statistics
 */
export interface ClientDashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  total_projects: number;
  active_projects: number;
  open_tickets: number;
  total_spent: string; // Decimal as string
  pending_amount: string; // Decimal as string
}

/**
 * Client Invoice
 */
export interface ClientInvoice {
  id: number;
  invoice_number: string;
  amount: string;
  amount_paid: string;
  currency: string;
  status: string;
  invoice_date: string;
  due_date?: string;
  paid_at?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Client Invoice List Response
 */
export interface ClientInvoiceListResponse {
  items: ClientInvoice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Client Project
 */
export interface ClientProject {
  id: number;
  name: string;
  description?: string;
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Client Project List Response
 */
export interface ClientProjectListResponse {
  items: ClientProject[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Client Support Ticket
 */
export interface ClientTicket {
  id: number;
  subject: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_reply_at?: string;
}

/**
 * Client Ticket Create Request
 */
export interface ClientTicketCreate {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'technical' | 'billing' | 'feature' | 'general' | 'bug';
}

/**
 * Client Ticket List Response
 */
export interface ClientTicketListResponse {
  items: ClientTicket[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Client Portal API
 *
 * Provides methods to interact with client portal endpoints.
 * All methods require client portal permissions.
 */
export const clientPortalAPI = {
  /**
   * Get client dashboard statistics
   *
   * @returns Dashboard statistics including orders, invoices, projects, and tickets
   * @requires CLIENT_VIEW_PROFILE permission
   * @example
   * ```ts
   * const stats = await clientPortalAPI.getDashboardStats();
   * logger.log('', { message: stats.total_invoices });
   * ```
   */
  getDashboardStats: async (): Promise<ClientDashboardStats> => {
    const response = await apiClient.get<ClientDashboardStats>('/v1/client/dashboard/stats');
    if (!response.data) {
      throw new Error('Failed to fetch dashboard stats: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of client invoices
   *
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of invoices
   * @requires CLIENT_VIEW_INVOICES permission
   */
  getInvoices: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<ClientInvoiceListResponse> => {
    const response = await apiClient.get<ClientInvoiceListResponse>('/v1/client/invoices', {
      params,
    });
    if (!response.data) {
      throw new Error('Failed to fetch invoices: no data returned');
    }
    return response.data;
  },

  /**
   * Get a specific invoice by ID
   *
   * @param invoiceId Invoice ID
   * @returns Invoice details
   * @requires CLIENT_VIEW_INVOICES permission
   * @throws 404 if invoice not found or doesn't belong to client
   */
  getInvoice: async (invoiceId: number): Promise<ClientInvoice> => {
    const response = await apiClient.get<ClientInvoice>(`/v1/client/invoices/${invoiceId}`);
    if (!response.data) {
      throw new Error('Failed to fetch invoice: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of client projects
   *
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of projects
   * @requires CLIENT_VIEW_PROJECTS permission
   */
  getProjects: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<ClientProjectListResponse> => {
    const response = await apiClient.get<ClientProjectListResponse>('/v1/client/projects', {
      params,
    });
    if (!response.data) {
      throw new Error('Failed to fetch projects: no data returned');
    }
    return response.data;
  },

  /**
   * Get a specific project by ID
   *
   * @param projectId Project ID
   * @returns Project details
   * @requires CLIENT_VIEW_PROJECTS permission
   * @throws 404 if project not found or doesn't belong to client
   */
  getProject: async (projectId: number): Promise<ClientProject> => {
    const response = await apiClient.get<ClientProject>(`/v1/client/projects/${projectId}`);
    if (!response.data) {
      throw new Error('Failed to fetch project: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of client support tickets
   *
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of tickets
   * @requires CLIENT_VIEW_TICKETS permission
   */
  getTickets: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<ClientTicketListResponse> => {
    const response = await apiClient.get<ClientTicketListResponse>('/v1/client/tickets', {
      params,
    });
    if (!response.data) {
      throw new Error('Failed to fetch tickets: no data returned');
    }
    return response.data;
  },

  /**
   * Get a specific ticket by ID
   *
   * @param ticketId Ticket ID
   * @returns Ticket details
   * @requires CLIENT_VIEW_TICKETS permission
   * @throws 404 if ticket not found or doesn't belong to client
   */
  getTicket: async (ticketId: number): Promise<ClientTicket> => {
    const response = await apiClient.get<ClientTicket>(`/v1/client/tickets/${ticketId}`);
    if (!response.data) {
      throw new Error('Failed to fetch ticket: no data returned');
    }
    return response.data;
  },

  /**
   * Create a new support ticket
   *
   * @param ticketData Ticket creation data
   * @returns Created ticket
   * @requires CLIENT_SUBMIT_TICKETS permission
   * @example
   * ```ts
   * const ticket = await clientPortalAPI.createTicket({
   *   subject: "Need help with invoice",
   *   description: "I have a question about invoice #123",
   *   priority: "medium",
   *   category: "billing"
   * });
   * ```
   */
  createTicket: async (ticketData: ClientTicketCreate): Promise<ClientTicket> => {
    const response = await apiClient.post<ClientTicket>('/v1/client/tickets', ticketData);
    if (!response.data) {
      throw new Error('Failed to create ticket: no data returned');
    }
    return response.data;
  },
};
