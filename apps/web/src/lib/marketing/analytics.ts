/**
 * Google Analytics Integration
 * Provides utilities for tracking events and page views
 */

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Initialize Google Analytics
 */
export function initGoogleAnalytics(measurementId: string): void {
  if (typeof window === 'undefined') return;

  // Load gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
    page_path: path,
    page_title: title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, eventParams);
}

/**
 * Track conversion
 */
export function trackConversion(conversionId: string, value?: number, currency?: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'conversion', {
    send_to: conversionId,
    ...(value && { value }),
    ...(currency && { currency }),
  });
}

/**
 * Track newsletter signup
 */
export function trackNewsletterSignup(source?: string): void {
  trackEvent('newsletter_signup', {
    source: source || 'unknown',
  });
}

/**
 * Track lead capture
 */
export function trackLeadCapture(source?: string, formFields?: string[]): void {
  trackEvent('lead_capture', {
    source: source || 'unknown',
    form_fields: formFields || [],
  });
}

/**
 * Track button click
 */
export function trackButtonClick(buttonName: string, location?: string): void {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location || 'unknown',
  });
}

/**
 * Track form submission
 */
export function trackFormSubmission(formName: string, success: boolean): void {
  trackEvent('form_submit', {
    form_name: formName,
    success,
  });
}
