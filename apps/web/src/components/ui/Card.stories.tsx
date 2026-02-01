import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';
import Button from './Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: 'Card content goes here',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Card Title',
    children: 'This card has a title and content.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Card with Actions',
    children: 'This card includes action buttons in the footer.',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </div>
    ),
  },
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Card Header</h3>
        <Button variant="ghost" size="sm">
          More
        </Button>
      </div>
      <p>Card content with custom header.</p>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card
      className="cursor-pointer hover:shadow-standard-lg transition-modern" // UI Revamp - Nouveau système d'ombres et transition moderne
      onClick={() => alert('Card clicked!')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          alert('Card activated!');
        }
      }}
      aria-label="Clickable card"
    >
      <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
      <p>Click or press Enter/Space to activate.</p>
    </Card>
  ),
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
