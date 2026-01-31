/**
 * Subscription Utilities
 * Helper functions for subscription-related operations
 */

export function formatPrice(amount: number, currency: string = 'USD'): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatInterval(interval: string, intervalCount: number = 1): string {
  if (interval === 'MONTH' && intervalCount === 1) return '/month';
  if (interval === 'YEAR' && intervalCount === 1) return '/year';
  return `/${intervalCount} ${interval.toLowerCase()}s`;
}

export function isSubscriptionActive(status: string): boolean {
  return status === 'ACTIVE' || status === 'TRIALING';
}

export function isSubscriptionExpired(currentPeriodEnd: string | null): boolean {
  if (!currentPeriodEnd) return false;
  return new Date(currentPeriodEnd) < new Date();
}
