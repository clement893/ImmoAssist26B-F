import type { Meta, StoryObj } from '@storybook/react';
import VideoPlayer from './VideoPlayer';

const meta: Meta<typeof VideoPlayer> = {
  title: 'Components/UI/VideoPlayer',
  component: VideoPlayer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A video player component with custom controls, playback, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Video source URL',
    },
    poster: {
      control: 'text',
      description: 'Poster image URL',
    },
    title: {
      control: 'text',
      description: 'Video title for accessibility',
    },
    autoplay: {
      control: 'boolean',
      description: 'Whether to autoplay the video',
    },
    controls: {
      control: 'boolean',
      description: 'Whether to show controls',
    },
    loop: {
      control: 'boolean',
      description: 'Whether to loop the video',
    },
    muted: {
      control: 'boolean',
      description: 'Whether video is muted by default',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VideoPlayer>;

export const Default: Story = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://via.placeholder.com/800x450',
    title: 'Sample Video',
    controls: true,
    autoplay: false,
    loop: false,
    muted: false,
  },
};

export const WithPoster: Story = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://via.placeholder.com/800x450?text=Video+Poster',
    title: 'Elephants Dream',
    controls: true,
  },
};

export const Autoplay: Story = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Autoplay Video',
    autoplay: true,
    muted: true, // Required for autoplay in most browsers
    controls: true,
  },
};

export const Loop: Story = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'Looping Video',
    loop: true,
    controls: true,
  },
};

export const WithoutControls: Story = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'Video Without Controls',
    controls: false,
  },
};

export const CustomSize: Story = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    title: 'Custom Sized Video',
    controls: true,
    className: 'w-96 h-64',
  },
};
