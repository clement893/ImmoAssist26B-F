import type { Meta, StoryObj } from '@storybook/react';
import Stepper from './Stepper';
import type { Step } from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'UI/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const steps: Step[] = [
  { id: '1', label: 'Step 1', description: 'First step' },
  { id: '2', label: 'Step 2', description: 'Second step' },
  { id: '3', label: 'Step 3', description: 'Third step' },
  { id: '4', label: 'Step 4', description: 'Final step' },
];

export const Horizontal: Story = {
  args: {
    steps,
    currentStep: 1,
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  args: {
    steps,
    currentStep: 1,
    orientation: 'vertical',
  },
};

export const WithOptional: Story = {
  args: {
    steps: [
      { id: '1', label: 'Required Step', description: 'This is required' },
      { id: '2', label: 'Optional Step', description: 'This is optional', optional: true },
      { id: '3', label: 'Another Step', description: 'Required again' },
    ],
    currentStep: 0,
    allowNavigation: true,
  },
};

export const WithError: Story = {
  args: {
    steps: [
      { id: '1', label: 'Step 1', description: 'Completed' },
      { id: '2', label: 'Step 2', description: 'Has error', error: true },
      { id: '3', label: 'Step 3', description: 'Upcoming' },
    ],
    currentStep: 1,
  },
};

export const Completed: Story = {
  args: {
    steps: [
      { id: '1', label: 'Step 1', description: 'Completed', completed: true },
      { id: '2', label: 'Step 2', description: 'Completed', completed: true },
      { id: '3', label: 'Step 3', description: 'Current', completed: false },
    ],
    currentStep: 2,
  },
};
