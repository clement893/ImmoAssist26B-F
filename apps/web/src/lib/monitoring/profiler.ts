/**
 * Performance Profiler
 * Profiling de performance pour identifier les bottlenecks
 */

import { logger } from '../logger';
import { metricsCollector, createMetric } from './metrics';

interface ProfileResult {
  name: string;
  duration: number;
  timestamp: string;
  children?: ProfileResult[];
}

class Profiler {
  private profiles: Map<string, number> = new Map();
  private activeProfiles: Map<string, number> = new Map();

  start(name: string): void {
    this.activeProfiles.set(name, performance.now());
  }

  end(name: string): ProfileResult | null {
    const startTime = this.activeProfiles.get(name);
    if (!startTime) {
      logger.warn(`Profile "${name}" was not started`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.activeProfiles.delete(name);
    this.profiles.set(name, duration);

    const result: ProfileResult = {
      name,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Track as metric
    metricsCollector.addMetric(
      createMetric(`profile.${name}`, duration, 'ms', {
        warning: 1000, // 1s
        critical: 3000, // 3s
      })
    );

    return result;
  }

  async profile<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; profile: ProfileResult }> {
    this.start(name);
    try {
      const result = await fn();
      const profile = this.end(name);
      return { result, profile: profile! };
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  profileSync<T>(name: string, fn: () => T): { result: T; profile: ProfileResult | null } {
    this.start(name);
    try {
      const result = fn();
      const profile = this.end(name);
      return { result, profile };
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  getProfiles(): Record<string, number> {
    return Object.fromEntries(this.profiles);
  }

  clearProfiles(): void {
    this.profiles.clear();
    this.activeProfiles.clear();
  }
}

export const profiler = new Profiler();

// React Hook pour profiler les composants
export function useProfiler(componentName: string) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    metricsCollector.addMetric(createMetric(`component.${componentName}`, duration, 'ms'));
  };
}
