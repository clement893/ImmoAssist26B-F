/**
 * ERP/Employee Portal API Client
 *
 * API functions for ERP/Employee portal endpoints.
 * All endpoints provide access to all system data (not scoped to user).
 *
 * @module ERPPortalAPI
 * @see {@link https://docs.example.com/erp-portal ERP Portal Documentation}
 */

import { apiClient } from './client';

/**
 * ERP Dashboard Statistics
 */
export interface ERPDashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  total_clients: number;
  active_clients: number;
  total_products: number;
  low_stock_products: number;
  total_revenue: string; // Decimal as string
  pending_revenue: string; // Decimal as string
  department_stats?: Record<string, unknown>;
}

/**
 * ERP Invoice
 */
export interface ERPInvoice {
  id: number;
  invoice_number: string;
  amount: string;
  amount_paid: string;
  currency: string;
  status: string;
  invoice_date: string;
  due_date?: string;
  paid_at?: string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * ERP Invoice List Response
 */
export interface ERPInvoiceListResponse {
  items: ERPInvoice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Client
 */
export interface ERPClient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: string;
  is_active: boolean;
  total_orders: number;
  total_spent: string; // Decimal as string
  created_at: string;
  updated_at: string;
}

/**
 * ERP Client List Response
 */
export interface ERPClientListResponse {
  items: ERPClient[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Portal API
 *
 * Provides methods to interact with ERP portal endpoints.
 * All methods require ERP portal permissions.
 */
export const erpPortalAPI = {
  /**
   * Get ERP dashboard statistics
   *
   * @param department Optional department filter
   * @returns Dashboard statistics including orders, invoices, clients, products
   * @requires ERP_VIEW_REPORTS permission
   * @example
   * ```ts
   * const stats = await erpPortalAPI.getDashboardStats('sales');
   * logger.log('', { message: stats.total_orders });
   * ```
   */
  getDashboardStats: async (department?: string): Promise<ERPDashboardStats> => {
    const params = department ? { department } : undefined;
    const response = await apiClient.get<ERPDashboardStats>('/v1/erp/dashboard/stats', { params });
    if (!response.data) {
      throw new Error('Failed to fetch dashboard stats: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of all invoices
   *
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of all invoices
   * @requires ERP_VIEW_INVOICES permission
   */
  getInvoices: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    client_id?: number;
  }): Promise<ERPInvoiceListResponse> => {
    const response = await apiClient.get<ERPInvoiceListResponse>('/v1/erp/invoices', { params });
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
   * @requires ERP_VIEW_INVOICES permission
   */
  getInvoice: async (invoiceId: number): Promise<ERPInvoice> => {
    const response = await apiClient.get<ERPInvoice>(`/v1/erp/invoices/${invoiceId}`);
    if (!response.data) {
      throw new Error('Failed to fetch invoice: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of all clients
   *
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of all clients
   * @requires ERP_VIEW_CLIENTS permission
   */
  getClients: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<ERPClientListResponse> => {
    const response = await apiClient.get<ERPClientListResponse>('/v1/erp/clients', { params });
    if (!response.data) {
      throw new Error('Failed to fetch clients: no data returned');
    }
    return response.data;
  },

  /**
   * Get a specific client by ID
   *
   * @param clientId Client ID
   * @returns Client details
   * @requires ERP_VIEW_CLIENTS permission
   */
  getClient: async (clientId: number): Promise<ERPClient> => {
    const response = await apiClient.get<ERPClient>(`/v1/erp/clients/${clientId}`);
    if (!response.data) {
      throw new Error('Failed to fetch client: no data returned');
    }
    return response.data;
  },
};
