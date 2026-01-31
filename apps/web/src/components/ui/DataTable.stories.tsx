import type { Meta, StoryObj } from '@storybook/react';
import DataTable from './DataTable';
import type { Column } from './DataTable';

const meta: Meta<typeof DataTable> = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

type SampleData = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

const sampleData: SampleData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Manager', status: 'Active' },
];

const columns: Column<SampleData>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Admin', value: 'Admin' },
      { label: 'User', value: 'User' },
      { label: 'Manager', value: 'Manager' },
    ],
  },
  { key: 'status', label: 'Status', sortable: true, filterable: true },
];

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns as Column<Record<string, unknown>>[],
  },
};

export const WithSearch: Story = {
  args: {
    data: sampleData,
    columns: columns as Column<Record<string, unknown>>[],
    searchable: true,
    searchPlaceholder: 'Search users...',
  },
};

export const WithPagination: Story = {
  args: {
    data: Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ['Admin', 'User', 'Manager'][i % 3],
      status: ['Active', 'Inactive'][i % 2],
    })),
    columns: columns as Column<Record<string, unknown>>[],
    pageSize: 5,
  },
};

export const WithActions: Story = {
  args: {
    data: sampleData,
    columns: columns as Column<Record<string, unknown>>[],
    actions: (row) => [
      { label: 'Edit', onClick: () => console.log('Edit', row) },
      { label: 'Delete', onClick: () => console.log('Delete', row), variant: 'danger' },
    ],
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns: columns as Column<Record<string, unknown>>[],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: columns as Column<Record<string, unknown>>[],
    emptyMessage: 'No users found',
  },
};

export const KeyboardNavigation: Story = {
  args: {
    data: sampleData,
    columns: columns as Column<Record<string, unknown>>[],
    onRowClick: (row) => console.log('Row clicked', row),
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
