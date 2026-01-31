import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Popover from './Popover';
import Button from './Button';

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Bottom: Story = {
  render: () => (
    <Popover
      trigger={<Button>Open Popover</Button>}
      content={
        <div className="space-y-2">
          <div className="font-semibold">Popover Title</div>
          <div>This is the popover content.</div>
        </div>
      }
      placement="bottom"
    />
  ),
};

export const Top: Story = {
  render: () => (
    <Popover
      trigger={<Button>Open Popover</Button>}
      content={<div>Content at the top</div>}
      placement="top"
    />
  ),
};

export const Right: Story = {
  render: () => (
    <Popover
      trigger={<Button>Open Popover</Button>}
      content={<div>Content on the right</div>}
      placement="right"
    />
  ),
};

export const WithArrow: Story = {
  render: () => (
    <Popover
      trigger={<Button>With Arrow</Button>}
      content={<div>This popover has an arrow</div>}
      arrow={true}
    />
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(!open)}>Toggle Popover</Button>
        <Popover
          trigger={<div />}
          content={<div>Controlled popover</div>}
          open={open}
          onOpenChange={setOpen}
        />
      </>
    );
  },
};
