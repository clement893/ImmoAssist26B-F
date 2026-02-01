/**
 * Accordion Component
 * Collapsible content component for ERP applications
 */
'use client';

import { type ReactNode, useState } from 'react';
import { clsx } from 'clsx';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export default function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.defaultOpen).map((item) => item.id))
  );

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div key={item.id} className="border border-border rounded-lg overflow-hidden">
            <button
              id={`accordion-header-${item.id}`}
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              className={clsx(
                'w-full px-4 py-3 flex items-center justify-between',
                'text-left font-medium text-foreground',
                'hover:bg-muted',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span>{item.title}</span>
              </div>
              <svg
                className={clsx('w-5 h-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div
                id={`accordion-content-${item.id}`}
                role="region"
                aria-labelledby={`accordion-header-${item.id}`}
                className={clsx(
                  'px-4 py-3 border-t border-border bg-muted/50',
                  'animate-slide-down', // Accordion slide-down animation (UX/UI improvements - Batch 16)
                  'transition-modern' // UI Revamp - Transition moderne
                )}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
