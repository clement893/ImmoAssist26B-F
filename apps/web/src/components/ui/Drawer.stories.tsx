import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Drawer from './Drawer';
import type { DrawerProps } from './Drawer';
import Button from './Button';

const meta: Meta<typeof Drawer> = {
  title: 'UI/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['left', 'right', 'top', 'bottom'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

const DrawerWrapper = (args: Partial<DrawerProps>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
      <Drawer {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="space-y-4">
          <p>This is the drawer content.</p>
          <p>You can put anything here.</p>
        </div>
      </Drawer>
    </>
  );
};

export const Right: Story = {
  render: () => <DrawerWrapper position="right" title="Right Drawer" />,
};

export const Left: Story = {
  render: () => <DrawerWrapper position="left" title="Left Drawer" />,
};

export const Top: Story = {
  render: () => <DrawerWrapper position="top" title="Top Drawer" size="md" />,
};

export const Bottom: Story = {
  render: () => <DrawerWrapper position="bottom" title="Bottom Drawer" size="md" />,
};

export const WithContent: Story = {
  render: () => (
    <DrawerWrapper position="right" title="Drawer with Content" size="lg">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Section 1</h3>
        <p>Content goes here...</p>
        <h3 className="text-lg font-semibold">Section 2</h3>
        <p>More content...</p>
      </div>
    </DrawerWrapper>
  ),
};
