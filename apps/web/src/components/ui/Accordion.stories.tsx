import type { Meta, StoryObj } from '@storybook/react';
import Accordion from './Accordion';
import type { AccordionItem } from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

const items: AccordionItem[] = [
  {
    id: '1',
    title: 'What is this?',
    content: 'This is an accordion component for displaying collapsible content.',
  },
  {
    id: '2',
    title: 'How does it work?',
    content:
      'Click on a header to expand or collapse the content. Only one item can be open at a time by default.',
  },
  {
    id: '3',
    title: 'Can multiple items be open?',
    content:
      'Yes, you can set allowMultiple to true to allow multiple items to be open simultaneously.',
  },
];

export const Default: Story = {
  args: {
    items,
  },
};

export const AllowMultiple: Story = {
  args: {
    items,
    allowMultiple: true,
  },
};

export const DefaultOpen: Story = {
  args: {
    items: items.map((item, index) => ({
      ...item,
      defaultOpen: index === 0, // First item open by default
    })),
  },
};

export const KeyboardNavigation: Story = {
  args: {
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
