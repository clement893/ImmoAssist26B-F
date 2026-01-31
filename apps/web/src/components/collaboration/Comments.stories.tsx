/**
 * Comments Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import Comments from './Comments';
import type { Comment } from './Comments';

const meta: Meta<typeof Comments> = {
  title: 'Collaboration/Comments',
  component: Comments,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Comments>;

const sampleComments: Comment[] = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'John Doe',
    },
    content: 'This looks great! Nice work on the implementation.',
    timestamp: new Date().toISOString(),
    reactions: {
      like: 3,
      heart: 1,
    },
    replies: [
      {
        id: '2',
        author: {
          id: '2',
          name: 'Jane Smith',
        },
        content: 'Thanks! I appreciate the feedback.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        reactions: {
          like: 1,
          heart: 0,
        },
      },
    ],
  },
];

export const Default: Story = {
  args: {
    comments: sampleComments,
    currentUser: {
      id: 'current',
      name: 'You',
    },
    onSubmit: async (content) => {
      console.log('Submit comment:', content);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onEdit: async (id, content) => {
      console.log('Edit comment:', { id, content });
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onDelete: async (id) => {
      console.log('Delete comment:', id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onReact: async (id, reaction) => {
      console.log('React:', { id, reaction });
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

export const Empty: Story = {
  args: {
    comments: [],
    currentUser: {
      id: 'current',
      name: 'You',
    },
    onSubmit: async (content) => {
      console.log('Submit comment:', content);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};
