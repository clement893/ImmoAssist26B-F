/**
 * WorkflowBuilder Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import WorkflowBuilder from './WorkflowBuilder';

const meta: Meta<typeof WorkflowBuilder> = {
  title: 'Workflow/WorkflowBuilder',
  component: WorkflowBuilder,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowBuilder>;

export const Default: Story = {
  args: {
    onSave: async (workflow) => {
      console.log('Save workflow:', workflow);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onTest: async (workflow) => {
      console.log('Test workflow:', workflow);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};

export const WithExistingWorkflow: Story = {
  args: {
    workflow: {
      name: 'User Onboarding',
      description: 'Automated user onboarding workflow',
      enabled: true,
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          label: 'User Created',
          config: { event: 'user.created' },
        },
        {
          id: 'action-1',
          type: 'action',
          label: 'Send Welcome Email',
          config: { action: 'email.send' },
        },
      ],
      connections: [{ from: 'trigger-1', to: 'action-1' }],
    },
    onSave: async (workflow) => {
      console.log('Save workflow:', workflow);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onTest: async (workflow) => {
      console.log('Test workflow:', workflow);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};
