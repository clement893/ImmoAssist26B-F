/**
 * Bundle Optimization Utilities
 * Provides utilities for optimizing bundle size and loading
 */

/**
 * Lazy load heavy libraries only when needed
 */
export const lazyLoadHeavyLibraries = {
  // Chart libraries - only load when charts are needed
  chart: async () => {
    try {
      return await import('recharts');
    } catch {
      return null;
    }
  },

  // Rich text editor - only load when editor is needed
  editor: () => import('@/components/ui/RichTextEditor'),

  // Large UI components
  dataTable: () => import('@/components/ui/DataTable'),
  kanban: () => import('@/components/ui/KanbanBoard'),

  // Form builders
  formBuilder: () => import('@/components/ui/FormBuilder'),
};

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') {
    return;
  }

  // Preload critical API endpoints
  const criticalEndpoints = ['/api/auth/me', '/api/user/profile'];

  criticalEndpoints.forEach((endpoint) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = endpoint;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Defer non-critical JavaScript
 */
export function deferNonCriticalScripts() {
  if (typeof window === 'undefined') {
    return;
  }

  // Defer analytics and other non-critical scripts
  const scripts = document.querySelectorAll('script[data-defer]');
  scripts.forEach((script) => {
    script.setAttribute('defer', '');
  });
}

/**
 * Optimize image loading
 */
export function optimizeImageLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  // Lazy load images using Intersection Observer
  const images = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Remove unused CSS (for dynamic imports)
 */
export function removeUnusedCSS() {
  // This would typically be handled by build tools
  // But we can add runtime cleanup for dynamically loaded styles
  if (typeof window === 'undefined') {
    return;
  }

  // Remove stylesheets that are no longer needed
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"][data-remove]');
  stylesheets.forEach((sheet) => {
    sheet.remove();
  });
}
