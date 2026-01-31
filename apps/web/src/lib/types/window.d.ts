/**
 * Extended Window interface for browser-specific APIs
 */

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface Performance {
  memory?: PerformanceMemory;
}

interface Window {
  Sentry?: {
    captureException: (error: Error, options?: Record<string, unknown>) => void;
    captureMessage: (message: string, options?: Record<string, unknown>) => void;
    metrics?: {
      distribution: (name: string, value: number, options?: Record<string, unknown>) => void;
    };
  };
  gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void;
}
