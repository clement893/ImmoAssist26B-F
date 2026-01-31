/**
 * UsageMeter Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import UsageMeter from './UsageMeter';

const meta: Meta<typeof UsageMeter> = {
  title: 'Billing/UsageMeter',
  component: UsageMeter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof UsageMeter>;

export const Default: Story = {
  args: {
    label: 'API Calls',
    current: 750,
    limit: 1000,
    unit: 'calls',
  },
};

export const LowUsage: Story = {
  args: {
    label: 'Storage',
    current: 2.5,
    limit: 10,
    unit: 'GB',
  },
};

export const WarningThreshold: Story = {
  args: {
    label: 'API Calls',
    current: 750,
    limit: 1000,
    unit: 'calls',
    thresholds: { warning: 70, critical: 90 },
  },
};

export const CriticalUsage: Story = {
  args: {
    label: 'Team Members',
    current: 12,
    limit: 15,
    unit: 'members',
    thresholds: { warning: 80, critical: 90 },
  },
};

export const AtLimit: Story = {
  args: {
    label: 'API Calls',
    current: 1000,
    limit: 1000,
    unit: 'calls',
    thresholds: { warning: 70, critical: 90 },
  },
};

export const OverLimit: Story = {
  args: {
    label: 'API Calls',
    current: 1100,
    limit: 1000,
    unit: 'calls',
    thresholds: { warning: 70, critical: 90 },
  },
};
