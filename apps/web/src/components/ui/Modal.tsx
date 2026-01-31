/**
 * Modal Component
 *
 * Full-featured modal dialog component with overlay, keyboard support, and accessibility features.
 * Supports multiple sizes and custom footer content.
 *
 * @example
 * ```tsx
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm">
 *   <p>Are you sure?</p>
 * </Modal>
 *
 * // Modal with footer
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Delete Item"
 *   footer={
 *     <>
 *       <Button onClick={handleClose}>Cancel</Button>
 *       <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   <p>This action cannot be undone.</p>
 * </Modal>
 * ```
 */
'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import Button from './Button';
import { useEffects } from '@/lib/theme/use-effects';

export interface ModalProps {
  /** Control modal visibility */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Footer content (buttons, actions, etc.) */
  footer?: ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Close modal when clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Close modal on Escape key */
  closeOnEscape?: boolean;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Overlay CSS classes */
  overlayClassName?: string;
  /** ARIA label ID */
  'aria-labelledby'?: string;
  /** ARIA description ID */
  'aria-describedby'?: string;
}

const sizeClasses = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
  full: 'md:max-w-full md:mx-4',
};

function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  const { getGlassmorphismPanelStyles, hasEffect } = useEffects();
  const glassmorphismStyles = hasEffect('glassmorphism') ? getGlassmorphismPanelStyles() : {};

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
        // Use setTimeout to ensure the modal is fully removed from DOM
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

  // Focus management: move focus to modal when it opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Find the first focusable element in the modal
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] || modalRef.current;

      // Use setTimeout to ensure the modal is fully rendered
      setTimeout(() => {
        firstFocusable.focus();
      }, 0);
    }
  }, [isOpen]);

  // Focus trapping: keep focus within the modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current!.querySelectorAll<HTMLElement>(
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

    modalRef.current.addEventListener('keydown', handleTabKey);
    return () => {
      modalRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        'p-0 md:p-4',
        'bg-foreground/50 dark:bg-foreground/70',
        'animate-fade-in', // Overlay fade-in animation
        overlayClassName
      )}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={modalRef}
        className={clsx(
          // Use glassmorphism background if enabled, otherwise use default
          hasEffect('glassmorphism') ? '' : 'bg-background',
          'shadow-xl',
          'w-full h-full',
          'md:w-auto md:h-auto md:rounded-lg',
          sizeClasses[size],
          'md:max-h-[90vh] flex flex-col',
          'animate-scale-in', // Modal scale-in animation (UX/UI improvements - Batch 16)
          className
        )}
        style={glassmorphismStyles}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            {title && <h2 className="text-lg md:text-xl font-semibold text-foreground pr-2">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center p-2 -mr-2"
                aria-label="Close"
              >
                <svg className="w-6 h-6 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border flex-shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}

// Modal variants
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-muted-foreground">{message}</p>
    </Modal>
  );
}

// Export Modal as both default and named export for compatibility
export default Modal;
export { Modal };
