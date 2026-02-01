/**
 * Drawer Component
 * Slide-out panel for mobile navigation and side content
 */
'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  overlay?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

const positionClasses = {
  left: 'left-0 top-0 bottom-0',
  right: 'right-0 top-0 bottom-0',
  top: 'top-0 left-0 right-0',
  bottom: 'bottom-0 left-0 right-0',
};

const sizeClasses = {
  sm: {
    left: 'w-64',
    right: 'w-64',
    top: 'h-64',
    bottom: 'h-64',
  },
  md: {
    left: 'w-80',
    right: 'w-80',
    top: 'h-80',
    bottom: 'h-80',
  },
  lg: {
    left: 'w-96',
    right: 'w-96',
    top: 'h-96',
    bottom: 'h-96',
  },
  xl: {
    left: 'w-[32rem]',
    right: 'w-[32rem]',
    top: 'h-[32rem]',
    bottom: 'h-[32rem]',
  },
  full: {
    left: 'w-full',
    right: 'w-full',
    top: 'h-full',
    bottom: 'h-full',
  },
};

const slideAnimations = {
  left: {
    enter: 'translate-x-0',
    exit: '-translate-x-full',
  },
  right: {
    enter: 'translate-x-0',
    exit: 'translate-x-full',
  },
  top: {
    enter: 'translate-y-0',
    exit: '-translate-y-full',
  },
  bottom: {
    enter: 'translate-y-0',
    exit: 'translate-y-full',
  },
};

export default function Drawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'right',
  size = 'md',
  showCloseButton = true,
  overlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body overflow and aria-hidden on main content
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Find the main content element (usually <main> or the root layout element)
      const mainContent =
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        (document.body.querySelector(':not([role="dialog"]):not([aria-modal="true"])') as HTMLElement);

      if (mainContent) {
        mainContentRef.current = mainContent as HTMLElement;
        mainContent.setAttribute('aria-hidden', 'true');
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore aria-hidden on main content
      if (mainContentRef.current) {
        mainContentRef.current.removeAttribute('aria-hidden');
      }

      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus to the previously focused element
      if (previousActiveElementRef.current) {
        // Use setTimeout to ensure the drawer is fully removed from DOM
        setTimeout(() => {
          previousActiveElementRef.current?.focus();
        }, 0);
      }
    }

    return () => {
      // Cleanup: ensure aria-hidden is removed and body scroll is restored
      if (mainContentRef.current) {
        mainContentRef.current.removeAttribute('aria-hidden');
      }
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus management: move focus to drawer when it opens
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      // Find the first focusable element in the drawer
      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] || drawerRef.current;

      // Use setTimeout to ensure the drawer is fully rendered
      setTimeout(() => {
        firstFocusable.focus();
      }, 0);
    }
  }, [isOpen]);

  // Focus trapping: keep focus within the drawer
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = drawerRef.current!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey) {
        // Shift + Tab: if focus is on first element, move to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: if focus is on last element, move to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    drawerRef.current.addEventListener('keydown', handleTabKey);
    return () => {
      drawerRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const animation = slideAnimations[position];
  const sizeClass = sizeClasses[size][position];

  return (
    <div
      className={clsx('fixed inset-0 z-50', overlay && 'bg-foreground/50 dark:bg-foreground/70', overlayClassName)}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={drawerRef}
        className={clsx(
          'fixed bg-background shadow-standard-xl', // UI Revamp - Nouveau système d'ombres (remplace shadow-strong)
          'flex flex-col',
          positionClasses[position],
          sizeClass,
          isOpen ? animation.enter : animation.exit,
          'transition-modern', // UI Revamp - Transition moderne
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            {title && (
              <h2 id="drawer-title" className="text-lg font-semibold text-foreground">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground transition-modern" // UI Revamp - Transition moderne
                aria-label="Close drawer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
