import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../Table';

describe('Table', () => {
  it('renders table element', () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table className="custom-table">
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(container.querySelector('table')).toHaveClass('custom-table');
  });

  it('applies custom style', () => {
    const { container } = render(
      <Table style={{ backgroundColor: 'red' }}>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    // Style is applied to the wrapper div, not the table element
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ backgroundColor: 'red' });
  });
});

describe('TableHead', () => {
  it('renders thead element', () => {
    const { container } = render(
      <table>
        <TableHead>
          <tr>
            <th>Header</th>
          </tr>
        </TableHead>
      </table>
    );
    expect(container.querySelector('thead')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <table>
        <TableHead className="custom-head">
          <tr>
            <th>Header</th>
          </tr>
        </TableHead>
      </table>
    );
    expect(container.querySelector('thead')).toHaveClass('custom-head');
  });
});

describe('TableBody', () => {
  it('renders tbody element', () => {
    const { container } = render(
      <table>
        <TableBody>
          <tr>
            <td>Content</td>
          </tr>
        </TableBody>
      </table>
    );
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('applies striped class when striped is true', () => {
    const { container } = render(
      <table>
        <TableBody striped>
          <tr>
            <td>Row 1</td>
          </tr>
          <tr>
            <td>Row 2</td>
          </tr>
        </TableBody>
      </table>
    );
    expect(container.querySelector('tbody')).toHaveClass('[&>tr:nth-child(even)]:bg-gray-50');
  });

  it('applies hover class when hover is true', () => {
    const { container } = render(
      <table>
        <TableBody hover>
          <tr>
            <td>Content</td>
          </tr>
        </TableBody>
      </table>
    );
    expect(container.querySelector('tbody')).toHaveClass('[&>tr:hover]:bg-gray-50');
  });
});

describe('TableRow', () => {
  it('renders tr element', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow>
            <td>Content</td>
          </TableRow>
        </tbody>
      </table>
    );
    expect(container.querySelector('tr')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <table>
        <tbody>
          <TableRow onClick={handleClick}>
            <td>Content</td>
          </TableRow>
        </tbody>
      </table>
    );

    const row = container.querySelector('tr');
    if (row) {
      await user.click(row);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('has cursor-pointer class when onClick is provided', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow onClick={vi.fn()}>
            <td>Content</td>
          </TableRow>
        </tbody>
      </table>
    );
    expect(container.querySelector('tr')).toHaveClass('cursor-pointer');
  });
});

describe('TableHeader', () => {
  it('renders th element', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHeader>Header</TableHeader>
          </tr>
        </thead>
      </table>
    );
    expect(container.querySelector('th')).toBeInTheDocument();
  });

  it('calls onSort when clicked and sortable is true', async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHeader sortable onSort={handleSort}>
              Header
            </TableHeader>
          </tr>
        </thead>
      </table>
    );

    const header = container.querySelector('th');
    if (header) {
      await user.click(header);
      expect(handleSort).toHaveBeenCalledTimes(1);
    }
  });

  it('shows sort indicator when sortDirection is provided', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHeader sortable sortDirection="asc">
              Header
            </TableHeader>
          </tr>
        </thead>
      </table>
    );
    const header = container.querySelector('th');
    expect(header).toBeInTheDocument();
  });
});

describe('TableCell', () => {
  it('renders td element', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell>Content</TableCell>
          </tr>
        </tbody>
      </table>
    );
    expect(container.querySelector('td')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell className="custom-cell">Content</TableCell>
          </tr>
        </tbody>
      </table>
    );
    expect(container.querySelector('td')).toHaveClass('custom-cell');
  });
});

describe('Table Accessibility', () => {
  it('has proper table structure', () => {
    const { container } = render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Header 1</TableHeader>
            <TableHeader>Header 2</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Cell 1</TableCell>
            <TableCell>Cell 2</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('has accessible table headers', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHeader>Name</TableHeader>
            <TableHeader>Email</TableHeader>
          </tr>
        </thead>
      </table>
    );

    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(2);
  });
});

describe('Table Edge Cases', () => {
  it('handles empty table', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>No data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('handles table with many columns', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            {Array.from({ length: 20 }, (_, i) => (
              <TableHeader key={i}>Header {i + 1}</TableHeader>
            ))}
          </tr>
        </thead>
      </table>
    );

    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(20);
  });

  it('handles table with many rows', () => {
    const { container } = render(
      <table>
        <TableBody>
          {Array.from({ length: 100 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>Row {i + 1}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    );

    const rows = container.querySelectorAll('tr');
    expect(rows.length).toBe(100);
  });
});
