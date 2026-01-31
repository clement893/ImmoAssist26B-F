import type { Meta, StoryObj } from '@storybook/react';
import ErrorReporting from './ErrorReporting';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof ErrorReporting> = {
  title: 'Errors/ErrorReporting',
  component: ErrorReporting,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'User-friendly form for reporting errors and bugs.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorReporting>;

export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      action('submit')(data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const WithoutHandler: Story = {
  args: {},
};
