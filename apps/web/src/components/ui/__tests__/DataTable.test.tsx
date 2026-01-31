import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable from '../DataTable';
import type { Column } from '../DataTable';

interface TestData {
  id: string;
  name: string;
  age: number;
}

describe('DataTable', () => {
  const columns: Column<TestData>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true },
  ];

  const data: TestData[] = [
    { id: '1', name: 'John', age: 30 },
    { id: '2', name: 'Jane', age: 25 },
  ];

  it('renders table with data', () => {
    render(<DataTable data={data} columns={columns} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="No data found" />);

    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable data={data} columns={columns} loading={true} />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });
});
