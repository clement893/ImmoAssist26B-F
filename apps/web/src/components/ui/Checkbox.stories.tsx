import type { Meta, StoryObj } from '@storybook/react';
import Checkbox from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A checkbox input component with label, error handling, and indeterminate state support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the checkbox',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Show indeterminate state (partially checked)',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make checkbox full width',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'Accept terms and conditions',
    checked: true,
  },
};

export const Unchecked: Story = {
  args: {
    label: 'Accept terms and conditions',
    checked: false,
  },
};

export const WithError: Story = {
  args: {
    label: 'Accept terms and conditions',
    error: 'You must accept the terms',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Accept terms and conditions',
    disabled: true,
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all items',
    indeterminate: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Accept terms and conditions',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Checkbox without visible label',
  },
};

export const MultipleCheckboxes: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox label="Option 1" />
      <Checkbox label="Option 2" checked />
      <Checkbox label="Option 3" indeterminate />
      <Checkbox label="Option 4" disabled />
    </div>
  ),
};
