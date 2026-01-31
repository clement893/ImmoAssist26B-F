/**
 * MarkdownEditor Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import MarkdownEditor from './MarkdownEditor';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Advanced/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

const markdownContent = `# Markdown Editor

This is a **markdown** editor with live preview.

## Features

- *Italic* and **bold** text
- Lists and code blocks
- Links and images

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

[Learn more](https://example.com)
`;

export const Default: Story = {
  args: {
    value: markdownContent,
    onChange: (value) => console.log('Markdown changed:', value.length),
    onSave: async (value) => {
      console.log('Save markdown:', value.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Empty: Story = {
  args: {
    value: '',
    onChange: (value) => console.log('Markdown changed:', value.length),
    onSave: async (value) => {
      console.log('Save markdown:', value.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
