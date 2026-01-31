import {
  formatPrice,
  formatDate,
  formatInterval,
  isSubscriptionActive,
  isSubscriptionExpired,
} from '../subscriptions';

describe('subscriptions utils', () => {
  describe('formatPrice', () => {
    it('should format price in cents to currency string', () => {
      expect(formatPrice(2900, 'USD')).toBe('$29.00');
      expect(formatPrice(999, 'USD')).toBe('$9.99');
      expect(formatPrice(100000, 'USD')).toBe('$1,000.00');
    });

    it('should return "Free" for zero amount', () => {
      expect(formatPrice(0)).toBe('Free');
    });

    it('should handle different currencies', () => {
      expect(formatPrice(2900, 'EUR')).toContain('29');
      expect(formatPrice(2900, 'GBP')).toContain('29');
    });

    it('should handle decimal amounts', () => {
      expect(formatPrice(2999, 'USD')).toBe('$29.99');
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2025-01-15T00:00:00Z';
      const formatted = formatDate(dateString);

      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should handle different date formats', () => {
      const dateString = '2025-12-25';
      const formatted = formatDate(dateString);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('formatInterval', () => {
    it('should format monthly interval', () => {
      expect(formatInterval('MONTH', 1)).toBe('/month');
    });

    it('should format yearly interval', () => {
      expect(formatInterval('YEAR', 1)).toBe('/year');
    });

    it('should format custom intervals', () => {
      expect(formatInterval('MONTH', 3)).toBe('/3 months');
      expect(formatInterval('WEEK', 2)).toBe('/2 weeks');
    });

    it('should handle default interval count', () => {
      expect(formatInterval('MONTH')).toBe('/month');
    });
  });

  describe('isSubscriptionActive', () => {
    it('should return true for ACTIVE status', () => {
      expect(isSubscriptionActive('ACTIVE')).toBe(true);
    });

    it('should return true for TRIALING status', () => {
      expect(isSubscriptionActive('TRIALING')).toBe(true);
    });

    it('should return false for CANCELED status', () => {
      expect(isSubscriptionActive('CANCELED')).toBe(false);
    });

    it('should return false for PAST_DUE status', () => {
      expect(isSubscriptionActive('PAST_DUE')).toBe(false);
    });

    it('should return false for UNPAID status', () => {
      expect(isSubscriptionActive('UNPAID')).toBe(false);
    });
  });

  describe('isSubscriptionExpired', () => {
    it('should return false for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      expect(isSubscriptionExpired(futureDate.toISOString())).toBe(false);
    });

    it('should return true for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      expect(isSubscriptionExpired(pastDate.toISOString())).toBe(true);
    });

    it('should return false for null date', () => {
      expect(isSubscriptionExpired(null)).toBe(false);
    });

    it('should handle current date', () => {
      const now = new Date().toISOString();
      // May be false or true depending on exact timing, but should not crash
      expect(typeof isSubscriptionExpired(now)).toBe('boolean');
    });
  });
});
