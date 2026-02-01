/**
 * MotionDiv Component
 *
 * Wrapper component for animated divs with consistent transitions.
 * Respects prefers-reduced-motion and provides smooth animations.
 *
 * @example
 * ```tsx
 * <MotionDiv variant="fade" duration="normal">
 *   <div>Content</div>
 * </MotionDiv>
 * ```
 */
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  getAnimationClasses,
  prefersReducedMotion,
  type AnimationConfig,
} from '@/lib/animations';

export interface MotionDivProps extends AnimationConfig {
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'header' | 'footer';
  initial?: boolean;
  className?: string;
}

/**
 * MotionDiv - Animated wrapper component
 */
export default function MotionDiv({
  children,
  variant = 'fade',
  duration = 'normal',
  delay = 0,
  as: Component = 'div',
  initial = false, // Changed default to false so animations trigger by default
  className,
  ...props
}: MotionDivProps) {
  const [shouldAnimate, setShouldAnimate] = useState(initial);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Trigger animation after mount with delay
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [delay]);

  // Skip animation if user prefers reduced motion
  if (reducedMotion || prefersReducedMotion()) {
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  // Get animation classes - start hidden, then animate in
  const animationClasses = shouldAnimate
    ? getAnimationClasses({ variant, duration })
    : 'opacity-0 translate-y-2'; // Start hidden

  return (
    <Component
      className={clsx(
        animationClasses,
        'transition-modern', // UI Revamp - Transition moderne
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
