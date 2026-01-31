import type { Meta, StoryObj } from '@storybook/react';
import OfflineSupport from './OfflineSupport';

const meta: Meta<typeof OfflineSupport> = {
  title: 'Performance/OfflineSupport',
  component: OfflineSupport,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Component for managing offline support, service worker registration, and data synchronization.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OfflineSupport>;

export const Default: Story = {
  args: {},
};

export const WithDetails: Story = {
  args: {
    showDetails: true,
  },
};
