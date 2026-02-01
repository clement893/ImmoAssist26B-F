'use client';
import { useDarkMode } from '@/hooks/useDarkMode';
import { clsx } from 'clsx';
export default function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-modern', // UI Revamp - Transition moderne
        'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2',
        '',
        isDark ? 'bg-primary-600 dark:bg-primary-500' : 'bg-muted'
      )}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={isDark}
    >
      {' '}
      <span
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
          isDark ? 'translate-x-6' : 'translate-x-1'
        )}
      />{' '}
      <span className="sr-only">Toggle theme</span>{' '}
    </button>
  );
}
export function ThemeToggleWithIcon() {
  const { isDark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      className={clsx(
        'p-2 rounded-lg transition-modern', // UI Revamp - Transition moderne
        'text-foreground',
        'hover:bg-muted',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2',
        ''
      )}
      aria-label="Toggle theme"
    >
      {' '}
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {' '}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />{' '}
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {' '}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />{' '}
        </svg>
      )}{' '}
    </button>
  );
}
