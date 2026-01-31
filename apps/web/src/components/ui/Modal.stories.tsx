import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalWrapper = ({
  children,
  ...props
}: Omit<React.ComponentProps<typeof Modal>, 'isOpen' | 'onClose'>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalWrapper title="Modal Title">
      <p>This is the modal content. You can add any content here.</p>
    </ModalWrapper>
  ),
};

export const WithActions: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Action"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Confirm</Button>
            </>
          }
        >
          <p>Are you sure you want to perform this action?</p>
        </Modal>
      </>
    );
  },
};

export const Large: Story = {
  render: () => (
    <ModalWrapper title="Large Modal" size="lg">
      <div className="space-y-4">
        <p>This is a large modal with more content.</p>
        <p>You can add forms, tables, or any other content here.</p>
      </div>
    </ModalWrapper>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <ModalWrapper
      title="Accessible Modal"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title" className="sr-only">
        Modal Title
      </h2>
      <p id="modal-description">
        This modal has proper ARIA attributes for screen readers. Press Escape to close or Tab to
        navigate.
      </p>
    </ModalWrapper>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'aria-modal',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
  },
};
