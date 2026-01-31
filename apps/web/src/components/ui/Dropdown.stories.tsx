import type { Meta, StoryObj } from '@storybook/react';
import Dropdown from './Dropdown';
import Button from './Button';
import type { DropdownItem } from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

const items: DropdownItem[] = [
  { label: 'Edit', onClick: () => console.log('Edit') },
  { label: 'Duplicate', onClick: () => console.log('Duplicate') },
  { label: 'Delete', onClick: () => console.log('Delete'), variant: 'danger' },
];

export const Default: Story = {
  args: {
    trigger: <Button>Actions</Button>,
    items,
  },
};

export const WithIcon: Story = {
  args: {
    trigger: (
      <Button variant="ghost" size="sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </Button>
    ),
    items,
  },
};

export const KeyboardNavigation: Story = {
  args: {
    trigger: <Button>Menu</Button>,
    items,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
  },
};
