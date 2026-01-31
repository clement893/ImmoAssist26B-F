/**
 * Accessibility Configuration for Storybook
 *
 * This file configures accessibility testing rules and options
 * for Storybook's a11y addon.
 */

import type { Parameters } from '@storybook/types';

export const a11yParameters: Parameters = {
  a11y: {
    // Element to analyze
    element: '#storybook-root',

    // Manual configuration for axe-core
    config: {
      rules: [
        {
          // Enable color contrast checking
          id: 'color-contrast',
          enabled: true,
        },
        {
          // Enable keyboard navigation checking
          id: 'keyboard',
          enabled: true,
        },
        {
          // Enable ARIA attributes checking
          id: 'aria',
          enabled: true,
        },
        {
          // Enable form labels checking
          id: 'label',
          enabled: true,
        },
        {
          // Enable heading hierarchy checking
          id: 'heading-order',
          enabled: true,
        },
        {
          // Enable image alt text checking
          id: 'image-alt',
          enabled: true,
        },
        {
          // Enable link name checking
          id: 'link-name',
          enabled: true,
        },
        {
          // Enable button name checking
          id: 'button-name',
          enabled: true,
        },
      ],
    },

    // Options for the addon
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },

    // Manual test configuration
    manual: true,
  },
};

// Apply to all stories by default
export const parameters: Parameters = {
  ...a11yParameters,
};
