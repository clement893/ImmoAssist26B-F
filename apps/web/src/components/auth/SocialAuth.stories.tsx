import type { Meta, StoryObj } from '@storybook/react';
import SocialAuth from './SocialAuth';
import type { SocialProvider } from './SocialAuth';

const meta: Meta<typeof SocialAuth> = {
  title: 'Auth/SocialAuth',
  component: SocialAuth,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Social authentication buttons for OAuth providers (Google, GitHub, Microsoft).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    providers: {
      control: 'object',
      description: 'Array of social providers to display',
    },
    onSignIn: {
      action: 'signed-in',
      description: 'Callback fired when user clicks a provider',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make buttons full width',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SocialAuth>;

export const AllProviders: Story = {
  args: {
    providers: ['google', 'github', 'microsoft'],
    onSignIn: (provider: SocialProvider) => {
      console.log(`Sign in with ${provider}`);
    },
  },
};

export const GoogleOnly: Story = {
  args: {
    providers: ['google'],
    onSignIn: (provider: SocialProvider) => {
      console.log(`Sign in with ${provider}`);
    },
  },
};

export const GitHubOnly: Story = {
  args: {
    providers: ['github'],
    onSignIn: (provider: SocialProvider) => {
      console.log(`Sign in with ${provider}`);
    },
  },
};

export const MicrosoftOnly: Story = {
  args: {
    providers: ['microsoft'],
    onSignIn: (provider: SocialProvider) => {
      console.log(`Sign in with ${provider}`);
    },
  },
};

export const GoogleAndGitHub: Story = {
  args: {
    providers: ['google', 'github'],
    onSignIn: (provider: SocialProvider) => {
      console.log(`Sign in with ${provider}`);
    },
  },
};

export const FullWidth: Story = {
  args: {
    providers: ['google', 'github', 'microsoft'],
    fullWidth: true,
    onSignIn: (provider: SocialProvider) => {
      console.log(`Sign in with ${provider}`);
    },
  },
  render: (args) => (
    <div className="w-96">
      <SocialAuth {...args} />
    </div>
  ),
};

export const InCard: Story = {
  args: {
    providers: ['google', 'github', 'microsoft'],
    onSignIn: (provider: SocialProvider) => {
      console.log(`Sign in with ${provider}`);
    },
  },
  render: (args) => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-subtle-sm max-w-md"> // UI Revamp - Nouveau système d'ombres
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Sign in to your account
      </h2>
      <SocialAuth {...args} />
    </div>
  ),
};
