/**
 * Health Dashboard Types
 * Centralized type definitions for the template health dashboard
 */

// Local type for API response handling
export type ApiResponseWrapper<T> = {
  data?: T;
  [key: string]: unknown;
};

export interface ConnectionStatus {
  success: boolean;
  frontend?: {
    total: number;
    connected: number;
    partial: number;
    needsIntegration: number;
    static: number;
    error?: string;
    message?: string;
    note?: string;
  };
  backend?: {
    registered: number;
    unregistered: number;
    error?: string;
    message?: string;
    totalEndpoints?: number;
  };
  timestamp?: number;
}

export interface EndpointTestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
  responseTime?: number;
  category?: string;
}

export interface CheckResult {
  success: boolean;
  summary?: {
    total?: number;
    connected?: number;
    partial?: number;
    needsIntegration?: number;
    static?: number;
    registered?: number;
    unregistered?: number;
    totalEndpoints?: number;
  };
  output?: string;
  reportPath?: string;
  reportContent?: string;
  error?: string;
  message?: string;
  hint?: string;
  useFrontendAnalysis?: boolean;
  source?: 'node_script' | 'frontend_client';
  pages?: Array<{ path: string; apiCalls: Array<{ method: string; endpoint: string }> }>;
}

export interface ComponentTestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export interface EndpointToTest {
  endpoint: string;
  method: string;
  requiresAuth?: boolean;
  category?: string;
}

export interface HealthMetrics {
  healthScore: number; // 0-100
  connectionRate: number; // 0-100
  performanceRate: number; // 0-100
  securityRate: number; // 0-100
  totalFeatures: number;
  activeFeatures: number;
  partialFeatures: number;
  inactiveFeatures: number;
  errorFeatures: number;
}

export interface TestProgress {
  total: number;
  completed: number;
  success: number;
  error: number;
  pending: number;
  percentage: number; // 0-100
}
