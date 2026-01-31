import type { Meta, StoryObj } from '@storybook/react';
import Autocomplete from './Autocomplete';
import type { AutocompleteOption } from './Autocomplete';

const meta: Meta<typeof Autocomplete> = {
  title: 'UI/Autocomplete',
  component: Autocomplete,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Autocomplete>;

const options: AutocompleteOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];

export const Default: Story = {
  args: {
    options,
    placeholder: 'Search fruits...',
    label: 'Select a fruit',
  },
};

export const WithGroups: Story = {
  args: {
    options: [
      { label: 'Apple', value: 'apple', group: 'Fruits' },
      { label: 'Banana', value: 'banana', group: 'Fruits' },
      { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
      { label: 'Potato', value: 'potato', group: 'Vegetables' },
    ],
    placeholder: 'Search...',
  },
};

export const Loading: Story = {
  args: {
    options,
    loading: true,
    placeholder: 'Loading...',
  },
};

export const WithMinChars: Story = {
  args: {
    options,
    minChars: 2,
    placeholder: 'Type at least 2 characters...',
  },
};
