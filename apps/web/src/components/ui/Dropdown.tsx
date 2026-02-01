'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useEffects } from '@/lib/theme/use-effects';

export type DropdownItem =
  | {
      label: string;
      onClick: () => void;
      icon?: ReactNode;
      disabled?: boolean;
      variant?: 'default' | 'danger';
      divider?: false;
    }
  | { divider: true };

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export default function Dropdown({ trigger, items, position = 'bottom', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { getGlassmorphismPanelStyles, hasEffect } = useEffects();
  const glassmorphismStyles = hasEffect('glassmorphism') ? getGlassmorphismPanelStyles() : {};

  // Get enabled items indices (excluding dividers and disabled items)
  const enabledIndices = items
    .map((item, index) => {
      if ('divider' in item && item.divider) return null;
      if ((item as Exclude<DropdownItem, { divider: true }>).disabled) return null;
      return index;
    })
    .filter((index): index is number => index !== null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const positions = {
    bottom: 'top-full left-0 mt-1',
    top: 'bottom-full left-0 mb-1',
    left: 'right-full top-0 mr-1',
    right: 'left-full top-0 ml-1',
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle arrow key navigation in menu
  useEffect(() => {
    if (!isOpen || !menuRef.current || enabledIndices.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentEnabledIndex = enabledIndices.indexOf(focusedIndex);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextEnabledIndex = currentEnabledIndex < enabledIndices.length - 1 ? currentEnabledIndex + 1 : 0;
        const nextIndex = enabledIndices[nextEnabledIndex];
        if (nextIndex !== undefined) {
          setFocusedIndex(nextIndex);
          itemRefs.current[nextEnabledIndex]?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevEnabledIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledIndices.length - 1;
        const prevIndex = enabledIndices[prevEnabledIndex];
        if (prevIndex !== undefined) {
          setFocusedIndex(prevIndex);
          itemRefs.current[prevEnabledIndex]?.focus();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        const firstIndex = enabledIndices[0];
        if (firstIndex !== undefined) {
          setFocusedIndex(firstIndex);
          itemRefs.current[0]?.focus();
        }
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastIndex = enabledIndices[enabledIndices.length - 1];
        if (lastIndex !== undefined) {
          setFocusedIndex(lastIndex);
          itemRefs.current[enabledIndices.length - 1]?.focus();
        }
      }
    };

    menuRef.current.addEventListener('keydown', handleKeyDown);
    return () => {
      menuRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, enabledIndices, focusedIndex]);

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && menuRef.current && enabledIndices.length > 0) {
      setTimeout(() => {
        const firstIndex = enabledIndices[0];
        if (firstIndex !== undefined) {
          setFocusedIndex(firstIndex);
          itemRefs.current[0]?.focus();
        }
      }, 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, enabledIndices]);

  return (
    <div className={clsx('relative inline-block', className)} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={clsx(
            'absolute z-50 rounded-lg shadow-standard-lg border py-1 min-w-[200px]', // UI Revamp - Nouveau système d'ombres
            // Use glassmorphism background if enabled, otherwise use default
            hasEffect('glassmorphism') ? '' : 'bg-background border-border',
            positions[position]
          )}
          style={glassmorphismStyles}
        >
          {items.map((item, index) => {
            if ('divider' in item && item.divider) {
              return <div key={index} className="border-t border-border my-1" role="separator" />;
            }

            const dropdownItem = item as Exclude<DropdownItem, { divider: true }>;
            const enabledIndex = enabledIndices.indexOf(index);

            return (
              <button
                key={index}
                ref={(el) => {
                  if (enabledIndex >= 0) {
                    itemRefs.current[enabledIndex] = el;
                  }
                }}
                role="menuitem"
                onClick={() => {
                  if (!dropdownItem.disabled) {
                    dropdownItem.onClick();
                    setIsOpen(false);
                    setFocusedIndex(-1);
                  }
                }}
                disabled={dropdownItem.disabled}
                className={clsx(
                  'w-full px-4 py-2 text-left text-sm flex items-center space-x-2',
                  'transition-modern focus:outline-none', // UI Revamp - Transition moderne
                  dropdownItem.variant === 'danger'
                    ? 'text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-700 dark:hover:text-error-300 focus:bg-error-50 dark:focus:bg-error-900/20 focus:ring-2 focus:ring-error-500 dark:focus:ring-error-400'
                    : 'text-foreground hover:bg-muted dark:hover:bg-muted focus:bg-muted dark:focus:bg-muted focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
                  dropdownItem.disabled && 'opacity-50 cursor-not-allowed',
                  className
                )}
                aria-disabled={dropdownItem.disabled}
              >
                {dropdownItem.icon && (
                  <span className="flex-shrink-0" aria-hidden="true">
                    {dropdownItem.icon}
                  </span>
                )}
                <span>{dropdownItem.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
