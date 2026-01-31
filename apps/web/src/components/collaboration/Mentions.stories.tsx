/**
 * Mentions Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import Mentions from './Mentions';
import { useState } from 'react';

const meta: Meta<typeof Mentions> = {
  title: 'Collaboration/Mentions',
  component: Mentions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Mentions>;

const sampleUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Editor',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'Viewer',
  },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [mentions, setMentions] = useState<
      Array<{ userId: string; userName: string; position: number }>
    >([]);
    return (
      <Mentions
        users={sampleUsers}
        value={value}
        onChange={(val, ments) => {
          setValue(val);
          setMentions(ments);
        }}
      />
    );
  },
};

export const WithInitialValue: Story = {
  render: () => {
    const [value, setValue] = useState('Hello @John Doe, how are you?');
    const [mentions, setMentions] = useState<
      Array<{ userId: string; userName: string; position: number }>
    >([]);
    return (
      <Mentions
        users={sampleUsers}
        value={value}
        onChange={(val, ments) => {
          setValue(val);
          setMentions(ments);
        }}
      />
    );
  },
};
