/**
 * APIDocumentation Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import APIDocumentation from './APIDocumentation';

const meta: Meta<typeof APIDocumentation> = {
  title: 'Integrations/APIDocumentation',
  component: APIDocumentation,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof APIDocumentation>;

export const Default: Story = {
  args: {
    baseUrl: 'https://api.example.com',
    onTryIt: (endpoint) => console.log('Try endpoint:', endpoint),
  },
};

export const CustomBaseUrl: Story = {
  args: {
    baseUrl: 'https://custom-api.example.com/v1',
    onTryIt: (endpoint) => console.log('Try endpoint:', endpoint),
  },
};
