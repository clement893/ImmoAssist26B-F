/** * Tooltip Component * Tooltip component for showing additional information */ 'use client';
import { type ReactNode, useState } from 'react';
import { clsx } from 'clsx';
export interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}
const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};
const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-foreground',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-foreground',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-foreground',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-foreground',
};
export default function Tooltip({
  content,
  children,
  position = 'top',
  className,
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };
  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };
  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {' '}
      {children}{' '}
      {isVisible && (
        <div
          className={clsx(
            'absolute z-50 px-3 py-2 text-sm text-background',
            'bg-foreground rounded-md shadow-standard-lg', // UI Revamp - Nouveau système d'ombres
            'whitespace-nowrap pointer-events-none',
            positionClasses[position],
            className
          )}
        >
          {' '}
          {content}{' '}
          <div
            className={clsx('absolute w-0 h-0 border-4 border-transparent', arrowClasses[position])}
          />{' '}
        </div>
      )}{' '}
    </div>
  );
}
