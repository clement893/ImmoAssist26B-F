import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'Components/Search/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A search bar component with autocomplete suggestions and keyboard navigation support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    entityType: {
      control: 'select',
      options: ['users', 'projects'],
      description: 'Type of entity to search for',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    showAutocomplete: {
      control: 'boolean',
      description: 'Whether to show autocomplete suggestions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  args: {
    entityType: 'users',
    placeholder: 'Search users...',
    showAutocomplete: true,
  },
};

export const Projects: Story = {
  args: {
    entityType: 'projects',
    placeholder: 'Search projects...',
    showAutocomplete: true,
  },
};

export const WithoutAutocomplete: Story = {
  args: {
    entityType: 'users',
    placeholder: 'Search...',
    showAutocomplete: false,
  },
};

export const CustomPlaceholder: Story = {
  args: {
    entityType: 'users',
    placeholder: 'Type to search...',
    showAutocomplete: true,
  },
};

export const WithResults: Story = {
  args: {
    entityType: 'users',
    placeholder: 'Search users...',
    showAutocomplete: true,
  },
  play: async ({ canvasElement }) => {
    // Simulate typing and showing results
    const input = canvasElement.querySelector('input');
    if (input) {
      input.focus();
      input.value = 'test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
};
