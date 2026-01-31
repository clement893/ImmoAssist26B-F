import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Pagination from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return <Pagination currentPage={page} totalPages={10} onPageChange={setPage} />;
  },
};

export const WithFirstLast: Story = {
  render: () => {
    const [page, setPage] = useState(5);
    return <Pagination currentPage={page} totalPages={20} onPageChange={setPage} showFirstLast />;
  },
};

export const ManyPages: Story = {
  render: () => {
    const [page, setPage] = useState(10);
    return (
      <Pagination
        currentPage={page}
        totalPages={100}
        onPageChange={setPage}
        showFirstLast
        maxVisible={7}
      />
    );
  },
};

export const KeyboardNavigation: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Use Tab to navigate, Arrow keys to change pages, Enter/Space to select
        </p>
        <Pagination
          currentPage={page}
          totalPages={10}
          onPageChange={setPage}
          aria-label="Page navigation"
        />
        <p className="text-sm text-gray-500">Current page: {page}</p>
      </div>
    );
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
  },
};
