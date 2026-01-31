/** * Skip Link Component * * Provides a skip link for keyboard users to jump to main content. * Essential for accessibility (WCAG 2.1 Level A). * * @example * ```tsx * <SkipLink href="#main-content" /> * ``` */ 'use client';
import Link from 'next/link';
import { clsx } from 'clsx';
interface SkipLinkProps {
  /** Target ID to skip to */ href?: string;
  /** Custom label text */ label?: string;
  /** Additional CSS classes */ className?: string;
}
export default function SkipLink({
  href = '#main-content',
  label = 'Aller au contenu principal',
  className,
}: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'sr-only focus:not-sr-only',
        'focus:absolute focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2',
        'focus:bg-primary-600 focus:text-background',
        'focus:rounded-lg focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {' '}
      {label}{' '}
    </Link>
  );
}
