import type { Meta, StoryObj } from '@storybook/react';
import Textarea from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A multi-line text input component with label, error handling, and helper text support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the textarea',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below the textarea',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make textarea full width',
    },
    rows: {
      control: 'number',
      description: 'Number of visible rows',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Description',
    value: 'This is a sample description text.',
    placeholder: 'Enter description...',
  },
};

export const Required: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    error: 'Description is required',
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    helperText: 'Provide a detailed description of your item',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Description',
    value: 'This textarea is disabled',
    placeholder: 'Enter description...',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const CustomRows: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    rows: 10,
  },
};

export const WithIcons: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    leftIcon: <span>📝</span>,
    rightIcon: <span>✓</span>,
  },
};
