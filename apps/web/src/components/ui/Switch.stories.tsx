import type { Meta, StoryObj } from '@storybook/react';
import Switch from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A toggle switch component for boolean values.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the switch',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the switch is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the switch',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

export const Checked: Story = {
  args: {
    label: 'Enable notifications',
    checked: true,
  },
};

export const Unchecked: Story = {
  args: {
    label: 'Enable notifications',
    checked: false,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Enable notifications',
    disabled: true,
    checked: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Small switch',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium switch',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Large switch',
    size: 'lg',
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Toggle switch',
  },
};

export const MultipleSwitches: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch label="Email notifications" checked />
      <Switch label="SMS notifications" />
      <Switch label="Push notifications" checked />
      <Switch label="Marketing emails" disabled />
    </div>
  ),
};
