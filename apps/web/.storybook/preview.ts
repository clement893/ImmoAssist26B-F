import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Configuration accessibilité complète
    a11y: {
      element: '#storybook-root',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
          {
            id: 'aria-required-attr',
            enabled: true,
          },
          {
            id: 'aria-roles',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'heading-order',
            enabled: true,
          },
          {
            id: 'image-alt',
            enabled: true,
          },
          {
            id: 'link-name',
            enabled: true,
          },
          {
            id: 'button-name',
            enabled: true,
          },
          {
            id: 'form-field-multiple-labels',
            enabled: true,
          },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
      manual: true,
    },
    // Thèmes dark/light
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f2937',
        },
      ],
    },
  },
  // Décorateurs globaux
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
