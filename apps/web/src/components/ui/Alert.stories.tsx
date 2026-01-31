import type { Meta, StoryObj } from '@storybook/react';
import Alert from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An alert component for displaying important messages to users.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      description: 'The variant/type of alert',
    },
    title: {
      control: 'text',
      description: 'Optional title for the alert',
    },
    onClose: {
      action: 'closed',
      description: 'Callback function when alert is closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational alert message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    children: 'Your action was completed successfully!',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please review this information before proceeding.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'An error occurred while processing your request.',
  },
};

export const WithoutTitle: Story = {
  args: {
    variant: 'info',
    children: 'This alert does not have a title.',
  },
};

export const Closable: Story = {
  args: {
    variant: 'info',
    title: 'Closable Alert',
    children: 'This alert can be closed by clicking the X button.',
    onClose: () => {},
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <Alert variant="info" title="Info">
        This is an informational message.
      </Alert>
      <Alert variant="success" title="Success">
        Operation completed successfully!
      </Alert>
      <Alert variant="warning" title="Warning">
        Please review this information.
      </Alert>
      <Alert variant="error" title="Error">
        An error occurred.
      </Alert>
    </div>
  ),
};
