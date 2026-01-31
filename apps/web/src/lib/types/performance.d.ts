/**
 * Extended Performance API types for Web Vitals
 */

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}
