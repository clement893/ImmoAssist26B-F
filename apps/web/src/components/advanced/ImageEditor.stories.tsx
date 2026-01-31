/**
 * ImageEditor Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import ImageEditor from './ImageEditor';

const meta: Meta<typeof ImageEditor> = {
  title: 'Advanced/ImageEditor',
  component: ImageEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ImageEditor>;

export const Default: Story = {
  args: {
    onSave: async (imageData) => {
      console.log('Save image:', imageData.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const WithImage: Story = {
  args: {
    imageUrl: 'https://via.placeholder.com/400x300',
    onSave: async (imageData) => {
      console.log('Save image:', imageData.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
