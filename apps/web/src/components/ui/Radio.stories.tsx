import type { Meta, StoryObj } from '@storybook/react';
import Radio from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'Components/UI/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A radio button component with label and error handling support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the radio button',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the radio is checked',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  args: {
    label: 'Option 1',
    name: 'radio-group',
  },
};

export const Checked: Story = {
  args: {
    label: 'Option 1',
    name: 'radio-group',
    checked: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Option 1',
    name: 'radio-group',
    error: 'Please select an option',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Option 1',
    name: 'radio-group',
    disabled: true,
  },
};

export const RadioGroup: Story = {
  render: () => (
    <div className="space-y-2">
      <Radio label="Option 1" name="group" value="1" />
      <Radio label="Option 2" name="group" value="2" checked />
      <Radio label="Option 3" name="group" value="3" />
      <Radio label="Option 4" name="group" value="4" disabled />
    </div>
  ),
};
