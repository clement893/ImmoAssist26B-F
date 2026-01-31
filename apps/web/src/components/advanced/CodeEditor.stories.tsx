/**
 * CodeEditor Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import CodeEditor from './CodeEditor';

const meta: Meta<typeof CodeEditor> = {
  title: 'Advanced/CodeEditor',
  component: CodeEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof CodeEditor>;

export const Default: Story = {
  args: {
    language: 'javascript',
    value: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`,
    onChange: (value) => console.log('Code changed:', value.length),
    onSave: async (value) => {
      console.log('Save code:', value.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    value: `interface User {
  name: string;
  email: string;
}

function getUser(): User {
  return {
    name: 'John',
    email: 'john@example.com',
  };
}`,
    onChange: (value) => console.log('Code changed:', value.length),
    onSave: async (value) => {
      console.log('Save code:', value.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const ReadOnly: Story = {
  args: {
    language: 'javascript',
    value: `// This is read-only code
function example() {
  return 'Hello, World!';
}`,
    readOnly: true,
  },
};
