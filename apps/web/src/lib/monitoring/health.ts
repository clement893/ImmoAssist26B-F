/**
 * Health Check Service
 * Vérifie la santé des services de l'application
 */

import type { HealthStatus, ServiceHealth } from './types';
import { logger } from '../logger';
import { getApiUrl } from '../api';

const API_BASE_URL = getApiUrl().replace(/\/$/, '');

async function checkService(
  name: string,
  url: string,
  timeout: number = 5000
): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        name,
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } else {
      return {
        name,
        status: 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        message: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(
      `Health check failed for ${name}`,
      error instanceof Error ? error : new Error(String(error)),
      { service: name }
    );

    return {
      name,
      status: 'down',
      responseTime,
      lastCheck: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkApplicationHealth(): Promise<HealthStatus> {
  const services: ServiceHealth[] = [];

  // Check API
  const apiHealth = await checkService('API', `${API_BASE_URL}/api/v1/health`);
  services.push(apiHealth);

  // Check Database (via API readiness endpoint)
  const dbHealth = await checkService('Database', `${API_BASE_URL}/api/v1/health/ready`);
  services.push(dbHealth);

  // Determine overall status
  const hasDown = services.some((s) => s.status === 'down');
  const hasDegraded = services.some((s) => s.status === 'degraded');

  const overallStatus: HealthStatus['status'] = hasDown
    ? 'down'
    : hasDegraded
      ? 'degraded'
      : 'healthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
  };
}

export async function checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
  const serviceUrls: Record<string, string> = {
    API: `${API_BASE_URL}/api/v1/health`,
    Database: `${API_BASE_URL}/api/v1/health/ready`,
  };

  const url = serviceUrls[serviceName];
  if (!url) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  return checkService(serviceName, url);
}
