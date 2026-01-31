import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getThemeColor, getStatusColor, getChartColorByStatus } from '../colors';

describe('getThemeColor', () => {
  beforeEach(() => {
    // Mock window for SSR
    global.window = undefined as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns CSS variable reference in SSR', () => {
    const result = getThemeColor('--color-primary-500');
    expect(result).toBe('var(--color-primary-500)');
  });

  it('returns CSS variable with fallback in SSR', () => {
    const result = getThemeColor('--color-primary-500', '#3b82f6');
    expect(result).toBe('var(--color-primary-500, #3b82f6)');
  });

  it('returns computed value in browser', () => {
    global.window = {
      document: {
        documentElement: {
          style: {} as CSSStyleDeclaration,
        },
      },
    } as unknown as Window & typeof globalThis;

    const mockGetComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('  #3b82f6  '),
    } as CSSStyleDeclaration);

    global.getComputedStyle = mockGetComputedStyle;

    const result = getThemeColor('--color-primary-500');
    expect(result).toBe('#3b82f6');
  });

  it('returns CSS variable reference when value is empty in browser', () => {
    global.window = {
      document: {
        documentElement: {
          style: {} as CSSStyleDeclaration,
        },
      },
    } as unknown as Window & typeof globalThis;

    const mockGetComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue(''),
    } as CSSStyleDeclaration);

    global.getComputedStyle = mockGetComputedStyle;

    const result = getThemeColor('--color-primary-500', '#3b82f6');
    expect(result).toBe('var(--color-primary-500, #3b82f6)');
  });
});

describe('getStatusColor', () => {
  it('returns correct color for todo status', () => {
    const result = getStatusColor('todo');
    expect(result).toBe('var(--color-status-todo)');
  });

  it('returns correct color for in-progress status', () => {
    const result = getStatusColor('in-progress');
    expect(result).toBe('var(--color-status-in-progress)');
  });

  it('returns correct color for done status', () => {
    const result = getStatusColor('done');
    expect(result).toBe('var(--color-status-done)');
  });

  it('returns correct color for error status', () => {
    const result = getStatusColor('error');
    expect(result).toBe('var(--color-status-error)');
  });
});

describe('getChartColorByStatus', () => {
  it('returns default color when no threshold provided', () => {
    const result = getChartColorByStatus(50);
    expect(result).toBe('var(--color-chart-default)');
  });

  it('returns danger color when value exceeds critical threshold', () => {
    const result = getChartColorByStatus(90, { critical: 80 });
    expect(result).toBe('var(--color-chart-danger)');
  });

  it('returns warning color when value exceeds warning threshold but not critical', () => {
    const result = getChartColorByStatus(70, { warning: 60, critical: 80 });
    expect(result).toBe('var(--color-chart-warning)');
  });

  it('returns success color when value is below thresholds', () => {
    const result = getChartColorByStatus(50, { warning: 60, critical: 80 });
    expect(result).toBe('var(--color-chart-success)');
  });

  it('returns success color when only warning threshold is provided and value is below', () => {
    const result = getChartColorByStatus(50, { warning: 60 });
    expect(result).toBe('var(--color-chart-success)');
  });

  it('prioritizes critical over warning', () => {
    const result = getChartColorByStatus(90, { warning: 50, critical: 80 });
    expect(result).toBe('var(--color-chart-danger)');
  });
});
