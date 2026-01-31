/** * Popover Component * Contextual menu/popover component */ 'use client';
import { type ReactNode, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
export interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  contentClassName?: string;
  offset?: number;
  arrow?: boolean;
}
const placementClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  'top-start': 'bottom-full left-0 mb-2',
  'top-end': 'bottom-full right-0 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  'bottom-start': 'top-full left-0 mt-2',
  'bottom-end': 'top-full right-0 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  'left-start': 'right-full top-0 mr-2',
  'left-end': 'right-full bottom-0 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  'right-start': 'left-full top-0 ml-2',
  'right-end': 'left-full bottom-0 ml-2',
};
const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-200 dark:border-t-gray-700',
  'top-start': 'top-full left-4 border-t-gray-200 dark:border-t-gray-700',
  'top-end': 'top-full right-4 border-t-gray-200 dark:border-t-gray-700',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-200 dark:border-b-gray-700',
  'bottom-start': 'bottom-full left-4 border-b-gray-200 dark:border-b-gray-700',
  'bottom-end': 'bottom-full right-4 border-b-gray-200 dark:border-b-gray-700',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-200 dark:border-l-gray-700',
  'left-start': 'left-full top-4 border-l-gray-200 dark:border-l-gray-700',
  'left-end': 'left-full bottom-4 border-l-gray-200 dark:border-l-gray-700',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-200 dark:border-r-gray-700',
  'right-start': 'right-full top-4 border-r-gray-200 dark:border-r-gray-700',
  'right-end': 'right-full bottom-4 border-r-gray-200 dark:border-r-gray-700',
};
export default function Popover({
  trigger,
  content,
  placement = 'bottom',
  open: controlledOpen,
  onOpenChange,
  closeOnClickOutside = true,
  closeOnEscape = true,
  className,
  contentClassName,
  offset = 0,
  arrow = true,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside]);
  const handleTriggerClick = () => {
    setOpen(!isOpen);
  };
  return (
    <div className={clsx('relative inline-block', className)}>
      {' '}
      <div ref={containerRef} onClick={handleTriggerClick}>
        {' '}
        {trigger}{' '}
      </div>{' '}
      {isOpen && (
        <>
          {' '}
          <div
            ref={contentRef}
            className={clsx(
              'absolute z-50',
              'bg-background',
              'border border-border',
              'rounded-lg shadow-strong',
              'min-w-[200px]',
              placementClasses[placement],
              contentClassName
            )}
            style={{
              marginTop: placement.startsWith('bottom') ? offset : undefined,
              marginBottom: placement.startsWith('top') ? offset : undefined,
              marginLeft: placement.startsWith('right') ? offset : undefined,
              marginRight: placement.startsWith('left') ? offset : undefined,
            }}
            role="dialog"
            aria-modal="true"
          >
            {' '}
            {arrow && (
              <div
                className={clsx(
                  'absolute w-0 h-0',
                  arrowClasses[placement],
                  placement.startsWith('top') &&
                    'border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800',
                  placement.startsWith('bottom') &&
                    'border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800',
                  placement.startsWith('left') &&
                    'border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white dark:border-l-gray-800',
                  placement.startsWith('right') &&
                    'border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white dark:border-r-gray-800'
                )}
              />
            )}{' '}
            <div className="p-2">{content}</div>{' '}
          </div>{' '}
        </>
      )}{' '}
    </div>
  );
}
