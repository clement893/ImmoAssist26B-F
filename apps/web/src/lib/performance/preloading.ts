import { logger } from '@/lib/logger';
/**
 * Preloading Utilities
 * Resource hints and preloading strategies for better performance
 */

/**
 * Preload a resource (high priority)
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch' = 'fetch'
) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (as === 'font' || as === 'fetch') {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * Prefetch a resource (low priority, for next navigation)
 */
export function prefetchResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch' = 'fetch'
) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Preconnect to an origin (DNS + TCP + TLS)
 */
export function preconnectOrigin(origin: string, crossOrigin: boolean = false) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * DNS prefetch for an origin
 */
export function dnsPrefetch(origin: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = origin;
  document.head.appendChild(link);
}

/**
 * Preload critical routes for faster navigation
 */
export function preloadRoute(route: string) {
  if (typeof window === 'undefined') return;

  // Use Next.js router prefetch
  import('next/navigation').then(({ useRouter }) => {
    // This will be called in component context
    const router = useRouter();
    router.prefetch(route);
  });
}

/**
 * Preload critical API endpoints
 */
export function preloadAPIEndpoint(endpoint: string) {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_DEFAULT_API_URL ||
      'http://localhost:8000';
    const fullUrl = `${apiUrl}${endpoint}`;
    preloadResource(fullUrl, 'fetch');
  } catch (error) {
    // Silently fail preloading - it's a performance optimization, not critical
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Failed to preload API endpoint', { endpoint, error });
    }
  }
}

/**
 * Initialize preloading for critical resources
 */
export function initializePreloading() {
  if (typeof window === 'undefined') return;

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_DEFAULT_API_URL ||
      'http://localhost:8000';
    const apiHost = apiUrl.replace(/^https?:\/\//, '').split('/')[0];

    // Preconnect to API
    if (apiHost) {
      preconnectOrigin(`https://${apiHost}`, true);
      dnsPrefetch(`//${apiHost}`);
    }

    // Preconnect to common CDNs
    preconnectOrigin('https://fonts.googleapis.com');
    preconnectOrigin('https://fonts.gstatic.com', true);

    // Prefetch (not preload) non-critical API endpoints
    // Using prefetch instead of preload for health endpoint since it's not used immediately
    // Preload is for resources that will be used within seconds, prefetch is for future use
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_DEFAULT_API_URL ||
        'http://localhost:8000';
      const healthUrl = `${apiUrl}/api/v1/health/`;
      prefetchResource(healthUrl, 'fetch');
    } catch (error) {
      // Silently fail - this is a performance optimization
    }
    // Note: /api/v1/auth/me requires authentication, so we don't preload/prefetch it
    // Preloading authenticated endpoints can cause 422 errors if user is not logged in
  } catch (error) {
    // Silently fail preloading - it's a performance optimization, not critical
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Failed to initialize preloading:', error);
    }
  }
}

/**
 * Preload images that are likely to be viewed
 */
export function preloadImage(src: string) {
  preloadResource(src, 'image');
}

/**
 * Preload fonts
 */
export function preloadFont(href: string) {
  preloadResource(href, 'font');
}
