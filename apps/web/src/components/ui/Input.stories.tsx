import type { Meta, StoryObj } from '@storybook/react';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    value: 'Cannot edit',
    disabled: true,
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Search"
        placeholder="Search..."
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
      />
      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
      />
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input label="Text" type="text" placeholder="Text input" />
      <Input label="Email" type="email" placeholder="email@example.com" />
      <Input label="Password" type="password" placeholder="Password" />
      <Input label="Number" type="number" placeholder="123" />
      <Input label="Tel" type="tel" placeholder="+33 6 12 34 56 78" />
      <Input label="URL" type="url" placeholder="https://example.com" />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Required Field"
        type="text"
        required
        aria-required="true"
        aria-label="Required email field"
      />
      <Input
        label="With ARIA Description"
        type="text"
        helperText="This field is required for account creation"
        aria-describedby="email-description"
      />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'aria-required-attr',
            enabled: true,
          },
          {
            id: 'aria-valid-attr-value',
            enabled: true,
          },
        ],
      },
    },
  },
};
