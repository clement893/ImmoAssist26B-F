/**
 * Animation Variants
 *
 * Centralized animation variants for consistent transitions across the application.
 * Uses Tailwind CSS classes and respects prefers-reduced-motion.
 */

export type AnimationVariant = 'fade' | 'slideUp' | 'slideDown' | 'scale' | 'none';

export interface AnimationConfig {
  variant?: AnimationVariant;
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
  className?: string;
}

/**
 * Animation variants mapping
 * Maps variant names to Tailwind animation classes
 */
export const animationVariants: Record<AnimationVariant, string> = {
  fade: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scale: 'animate-scale-in',
  none: '',
};

/**
 * Duration classes mapping
 */
export const durationClasses: Record<'fast' | 'normal' | 'slow', string> = {
  fast: 'duration-fast',
  normal: 'duration-normal',
  slow: 'duration-slow',
};

/**
 * Page transition variants
 * Used for page-level animations
 */
export const pageVariants: Record<string, string> = {
  initial: 'opacity-0 translate-y-4',
  animate: 'opacity-100 translate-y-0 transition-all duration-normal ease-smooth',
  exit: 'opacity-0 translate-y-4 transition-all duration-fast ease-in',
};

/**
 * Modal transition variants
 * Used for modal animations
 */
export const modalVariants: Record<string, string> = {
  initial: 'opacity-0 scale-95',
  animate: 'opacity-100 scale-100 transition-all duration-normal ease-smooth',
  exit: 'opacity-0 scale-95 transition-all duration-fast ease-in',
};

/**
 * Accordion transition variants
 * Used for accordion expand/collapse animations
 */
export const accordionVariants: Record<string, string> = {
  initial: 'max-h-0 opacity-0',
  animate: 'max-h-[1000px] opacity-100 transition-all duration-normal ease-smooth',
  exit: 'max-h-0 opacity-0 transition-all duration-normal ease-in',
};

/**
 * Get animation classes based on variant and config
 */
export function getAnimationClasses(config: AnimationConfig = {}): string {
  const { variant = 'fade', duration = 'normal', className = '' } = config;

  const variantClass = animationVariants[variant];
  const durationClass = durationClasses[duration];

  return [variantClass, durationClass, className].filter(Boolean).join(' ');
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
