/**
 * AutomationRules Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import AutomationRules from './AutomationRules';
import type { AutomationRule } from './AutomationRules';

const meta: Meta<typeof AutomationRules> = {
  title: 'Workflow/AutomationRules',
  component: AutomationRules,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof AutomationRules>;

const sampleRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Welcome Email',
    description: 'Send welcome email when user signs up',
    enabled: true,
    trigger: {
      event: 'user.created',
    },
    actions: [{ type: 'email.send', config: { template: 'welcome' } }],
    createdAt: '2024-01-15T10:00:00Z',
    lastTriggered: '2024-03-20T14:30:00Z',
    triggerCount: 45,
  },
];

export const Default: Story = {
  args: {
    rules: sampleRules,
    onCreate: async (rule) => {
      console.log('Create rule:', rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...rule,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        triggerCount: 0,
      };
    },
    onUpdate: async (id, rule) => {
      console.log('Update rule:', { id, rule });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDelete: async (id) => {
      console.log('Delete rule:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onToggle: async (id, enabled) => {
      console.log('Toggle rule:', { id, enabled });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Empty: Story = {
  args: {
    rules: [],
    onCreate: async (rule) => {
      console.log('Create rule:', rule);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...rule,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        triggerCount: 0,
      };
    },
  },
};
