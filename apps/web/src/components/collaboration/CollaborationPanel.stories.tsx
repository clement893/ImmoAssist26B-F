/**
 * CollaborationPanel Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import CollaborationPanel from './CollaborationPanel';
import type { Collaborator } from './CollaborationPanel';

const meta: Meta<typeof CollaborationPanel> = {
  title: 'Collaboration/CollaborationPanel',
  component: CollaborationPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof CollaborationPanel>;

const sampleCollaborators: Collaborator[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'owner',
    status: 'online',
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'editor',
    status: 'online',
    isTyping: true,
  },
  {
    id: '3',
    name: 'Bob Wilson',
    role: 'viewer',
    status: 'away',
  },
];

export const Default: Story = {
  args: {
    collaborators: sampleCollaborators,
    currentUser: sampleCollaborators[0],
    onInvite: () => console.log('Invite'),
    onShare: () => console.log('Share'),
    onStartCall: () => console.log('Start call'),
  },
};

export const Empty: Story = {
  args: {
    collaborators: [],
    onInvite: () => console.log('Invite'),
  },
};

export const SingleCollaborator: Story = {
  args: {
    collaborators: [sampleCollaborators[0]],
    currentUser: sampleCollaborators[0],
    onInvite: () => console.log('Invite'),
  },
};
