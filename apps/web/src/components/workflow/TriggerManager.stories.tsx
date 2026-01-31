/**
 * TriggerManager Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import TriggerManager from './TriggerManager';
import type { Trigger } from './TriggerManager';

const meta: Meta<typeof TriggerManager> = {
  title: 'Workflow/TriggerManager',
  component: TriggerManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof TriggerManager>;

const sampleTriggers: Trigger[] = [
  {
    id: '1',
    name: 'User Created Event',
    type: 'event',
    event: 'user.created',
    enabled: true,
    workflows: ['workflow-1', 'workflow-2'],
    lastTriggered: '2024-03-20T14:30:00Z',
    triggerCount: 45,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Daily Report',
    type: 'schedule',
    schedule: '0 9 * * *',
    enabled: true,
    workflows: ['workflow-3'],
    triggerCount: 30,
    createdAt: '2024-02-01T10:00:00Z',
  },
];

export const Default: Story = {
  args: {
    triggers: sampleTriggers,
    onCreate: async (trigger) => {
      console.log('Create trigger:', trigger);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...trigger,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        triggerCount: 0,
      };
    },
    onUpdate: async (id, trigger) => {
      console.log('Update trigger:', { id, trigger });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDelete: async (id) => {
      console.log('Delete trigger:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onToggle: async (id, enabled) => {
      console.log('Toggle trigger:', { id, enabled });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Empty: Story = {
  args: {
    triggers: [],
    onCreate: async (trigger) => {
      console.log('Create trigger:', trigger);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ...trigger,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        triggerCount: 0,
      };
    },
  },
};
