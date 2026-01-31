/**
 * A/B Testing Utilities
 * Simple client-side A/B testing for marketing pages
 */

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100, percentage chance of being selected
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
}

/**
 * Get or assign a variant for an A/B test
 */
export function getABTestVariant(testId: string, variants: ABTestVariant[]): string {
  if (typeof window === 'undefined') {
    return variants[0]?.id || 'default';
  }

  // Check if variant is already assigned (persisted in localStorage)
  const storageKey = `ab_test_${testId}`;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    return stored;
  }

  // Assign variant based on weights
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      localStorage.setItem(storageKey, variant.id);
      return variant.id;
    }
  }

  // Fallback to first variant
  const firstVariant = variants[0]?.id || 'default';
  localStorage.setItem(storageKey, firstVariant);
  return firstVariant;
}

/**
 * Track A/B test conversion
 */
export function trackABTestConversion(
  testId: string,
  variantId: string,
  event: string = 'conversion'
): void {
  if (typeof window === 'undefined') return;

  // Store conversion event
  const conversionsKey = `ab_test_conversions_${testId}`;
  const conversions = JSON.parse(localStorage.getItem(conversionsKey) || '[]');

  conversions.push({
    variant: variantId,
    event,
    timestamp: new Date().toISOString(),
  });

  localStorage.setItem(conversionsKey, JSON.stringify(conversions));

  // Send to analytics if available
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'ab_test_conversion', {
      test_id: testId,
      variant_id: variantId,
      event_name: event,
    });
  }
}

/**
 * Get A/B test results
 */
export function getABTestResults(testId: string): {
  variant: string;
  conversions: number;
  conversionRate: number;
} | null {
  if (typeof window === 'undefined') return null;

  const storageKey = `ab_test_${testId}`;
  const conversionsKey = `ab_test_conversions_${testId}`;

  const variant = localStorage.getItem(storageKey);
  const conversions = JSON.parse(localStorage.getItem(conversionsKey) || '[]');

  if (!variant) return null;

  const variantConversions = conversions.filter(
    (c: { variant: string }) => c.variant === variant
  ).length;

  return {
    variant,
    conversions: variantConversions,
    conversionRate: conversions.length > 0 ? (variantConversions / conversions.length) * 100 : 0,
  };
}

/**
 * Reset A/B test (for testing purposes)
 */
export function resetABTest(testId: string): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(`ab_test_${testId}`);
  localStorage.removeItem(`ab_test_conversions_${testId}`);
}
