/**
 * Theme Constants
 * Centralized theme configuration constants
 */

import type { SelectOption } from '@/components/ui/Select';

// Color constants - Using CSS variables from theme
// These will adapt automatically to light/dark mode
export const COLORS = {
  BLUE_500: 'var(--color-primary-500)',
  GREEN_500: 'var(--color-secondary-500)',
  RED_500: 'var(--color-danger-500)',
  YELLOW_500: 'var(--color-warning-500)',
  CYAN_500: 'var(--color-info-500)',
  GRAY_900: 'var(--color-gray-900)',
  GRAY_700: 'var(--color-gray-700)',
  GRAY_800: 'var(--color-gray-800)',
  GRAY_500: 'var(--color-gray-500)',
  RED_50: 'var(--color-danger-50)',
  GREEN_50: 'var(--color-secondary-50)',
  INDIGO_500: 'var(--color-primary-600)', // Using primary-600 as indigo alternative
  VIOLET_500: 'var(--color-primary-700)', // Using primary-700 as violet alternative
  BLUE_800: 'var(--color-primary-800)',
  EMERALD_600: 'var(--color-secondary-600)',
  PINK_500: 'var(--color-primary-400)', // Using primary-400 as pink alternative
  AMBER_500: 'var(--color-warning-500)',
  BLACK: 'var(--color-gray-900)', // Using gray-900 instead of pure black for better dark mode support
} as const;

// Font options
export const FONT_OPTIONS: SelectOption[] = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Merriweather', value: 'Merriweather' },
];

// Border radius options
export const BORDER_RADIUS_OPTIONS: SelectOption[] = [
  { label: 'Petit (0.25rem)', value: '0.25rem' },
  { label: 'Moyen (0.5rem)', value: '0.5rem' },
  { label: 'Grand (0.75rem)', value: '0.75rem' },
  { label: 'Très grand (1rem)', value: '1rem' },
];
