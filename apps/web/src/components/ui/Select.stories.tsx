import type { Meta, StoryObj } from '@storybook/react';
import Select from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A dropdown select component with label, error handling, helper text, and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the select',
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
      description: 'Helper text below the select',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make select full width',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const countryOptions = [
  { label: 'France', value: 'fr' },
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'Spain', value: 'es' },
];

export const Default: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    placeholder: 'Select a country',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    value: 'fr',
    placeholder: 'Select a country',
  },
};

export const Required: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    placeholder: 'Select a country',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    placeholder: 'Select a country',
    error: 'Please select a country',
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    placeholder: 'Select a country',
    helperText: 'Select your country of residence',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    placeholder: 'Select a country',
    disabled: true,
    value: 'fr',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    placeholder: 'Select a country',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const ManyOptions: Story = {
  args: {
    label: 'Country',
    options: Array.from({ length: 50 }, (_, i) => ({
      label: `Country ${i + 1}`,
      value: `country-${i + 1}`,
    })),
    placeholder: 'Select a country',
  },
};
