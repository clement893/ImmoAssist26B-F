/**
 * Settings API Client
 *
 * API functions for user settings endpoints.
 *
 * @module SettingsAPI
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

/**
 * Notification Settings
 */
export interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
    types: {
      marketing: boolean;
      product: boolean;
      security: boolean;
      billing: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      marketing: boolean;
      product: boolean;
      security: boolean;
      billing: boolean;
      system: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    types: {
      marketing: boolean;
      product: boolean;
      security: boolean;
      billing: boolean;
      system: boolean;
    };
  };
}

/**
 * General Settings
 */
export interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  theme: 'light' | 'dark' | 'system';
  weekStartsOn?: 'monday' | 'sunday';
  enableNotifications?: boolean;
  enableEmailNotifications?: boolean;
}

/**
 * Security Settings
 */
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
}

/**
 * Billing Settings
 */
export interface BillingSettings {
  currency: string;
  taxId?: string;
  billingEmail?: string;
}

/**
 * Organization Settings
 */
export interface OrganizationSettings {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  timezone?: string;
  locale?: string;
}

/**
 * Settings API
 */
export const settingsAPI = {
  /**
   * Get notification settings
   */
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await apiClient.get<NotificationSettings>('/v1/settings/notifications');
    if (!response.data) {
      throw new Error('Failed to fetch notification settings: no data returned');
    }
    return response.data;
  },

  /**
   * Update notification settings
   */
  updateNotificationSettings: async (
    settings: NotificationSettings
  ): Promise<NotificationSettings> => {
    const response = await apiClient.put<NotificationSettings>(
      '/v1/settings/notifications',
      settings
    );
    if (!response.data) {
      throw new Error('Failed to update notification settings: no data returned');
    }
    return response.data;
  },

  /**
   * Get general settings
   */
  getGeneralSettings: async (): Promise<GeneralSettings> => {
    const response = await apiClient.get<GeneralSettings>('/v1/settings/general');
    const data = extractApiData(response);
    if (!data || typeof data !== 'object' || !('language' in data)) {
      throw new Error('Failed to fetch general settings: invalid response format');
    }
    return data as GeneralSettings;
  },

  /**
   * Update general settings
   */
  updateGeneralSettings: async (settings: GeneralSettings): Promise<GeneralSettings> => {
    const response = await apiClient.put<GeneralSettings>('/v1/settings/general', settings);
    const data = extractApiData(response);
    if (!data || typeof data !== 'object' || !('language' in data)) {
      throw new Error('Failed to update general settings: invalid response format');
    }
    return data as GeneralSettings;
  },

  /**
   * Get security settings
   */
  getSecuritySettings: async (): Promise<SecuritySettings> => {
    const response = await apiClient.get<SecuritySettings>('/v1/settings/security');
    if (!response.data) {
      throw new Error('Failed to fetch security settings: no data returned');
    }
    return response.data;
  },

  /**
   * Update security settings
   */
  updateSecuritySettings: async (settings: SecuritySettings): Promise<SecuritySettings> => {
    const response = await apiClient.put<SecuritySettings>('/v1/settings/security', settings);
    if (!response.data) {
      throw new Error('Failed to update security settings: no data returned');
    }
    return response.data;
  },

  /**
   * Get billing settings
   */
  getBillingSettings: async (): Promise<BillingSettings> => {
    const response = await apiClient.get<BillingSettings>('/v1/settings/billing');
    if (!response.data) {
      throw new Error('Failed to fetch billing settings: no data returned');
    }
    return response.data;
  },

  /**
   * Update billing settings
   */
  updateBillingSettings: async (settings: BillingSettings): Promise<BillingSettings> => {
    const response = await apiClient.put<BillingSettings>('/v1/settings/billing', settings);
    if (!response.data) {
      throw new Error('Failed to update billing settings: no data returned');
    }
    return response.data;
  },

  /**
   * Get organization settings
   */
  getOrganizationSettings: async (): Promise<{ settings: OrganizationSettings }> => {
    const response = await apiClient.get<{ settings: OrganizationSettings }>(
      '/v1/settings/organization/'
    );
    // apiClient.get returns response.data from axios
    // FastAPI returns data directly, so response might be { settings: {...} } or ApiResponse<{ settings: {...} }>
    if (!response) {
      throw new Error('Failed to fetch organization settings: no data returned');
    }
    // Handle ApiResponse wrapper case
    if (typeof response === 'object' && 'data' in response && response.data) {
      return response.data as { settings: OrganizationSettings };
    }
    // Handle direct FastAPI response case
    if (typeof response === 'object' && 'settings' in response) {
      return response as { settings: OrganizationSettings };
    }
    throw new Error('Failed to fetch organization settings: invalid response format');
  },

  /**
   * Update organization settings
   */
  updateOrganizationSettings: async (
    settings: OrganizationSettings
  ): Promise<{ settings: OrganizationSettings }> => {
    const response = await apiClient.put<{ settings: OrganizationSettings }>(
      '/v1/settings/organization/',
      settings
    );
    // apiClient.put returns response.data from axios
    // FastAPI returns data directly, so response might be { settings: {...} } or ApiResponse<{ settings: {...} }>
    if (!response) {
      throw new Error('Failed to update organization settings: no data returned');
    }
    // Handle ApiResponse wrapper case
    if (typeof response === 'object' && 'data' in response && response.data) {
      return response.data as { settings: OrganizationSettings };
    }
    // Handle direct FastAPI response case
    if (typeof response === 'object' && 'settings' in response) {
      return response as { settings: OrganizationSettings };
    }
    throw new Error('Failed to update organization settings: invalid response format');
  },
};
