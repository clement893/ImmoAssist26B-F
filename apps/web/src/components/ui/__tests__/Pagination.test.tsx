import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../Pagination';

describe('Pagination', () => {
  it('renders pagination controls', () => {
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={10} onPageChange={handlePageChange} />);

    expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
  });

  it('calls onPageChange when page is clicked', async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();

    render(<Pagination currentPage={1} totalPages={10} onPageChange={handlePageChange} />);

    const page2 = screen.getByText('2');
    await user.click(page2);

    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={10} onPageChange={handlePageChange} />);

    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={10} totalPages={10} onPageChange={handlePageChange} />);

    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('shows first/last buttons when showFirstLast is true', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={handlePageChange}
        showFirstLast={true}
      />
    );

    expect(screen.getByLabelText('First page')).toBeInTheDocument();
    expect(screen.getByLabelText('Last page')).toBeInTheDocument();
  });

  it('hides first/last buttons when showFirstLast is false', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={handlePageChange}
        showFirstLast={false}
      />
    );

    expect(screen.queryByLabelText('First page')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Last page')).not.toBeInTheDocument();
  });

  it('calls onPageChange with 1 when first button is clicked', async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();

    render(<Pagination currentPage={5} totalPages={10} onPageChange={handlePageChange} />);

    const firstButton = screen.getByLabelText('First page');
    await user.click(firstButton);

    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with totalPages when last button is clicked', async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();

    render(<Pagination currentPage={5} totalPages={10} onPageChange={handlePageChange} />);

    const lastButton = screen.getByLabelText('Last page');
    await user.click(lastButton);

    expect(handlePageChange).toHaveBeenCalledWith(10);
  });

  it('displays current page as active', () => {
    const handlePageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={10} onPageChange={handlePageChange} />);

    const currentPageButton = screen.getByText('5');
    expect(currentPageButton).toHaveClass('bg-primary-600');
  });

  it('applies custom className', () => {
    const handlePageChange = vi.fn();
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={handlePageChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows ellipsis when many pages', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination currentPage={5} totalPages={20} onPageChange={handlePageChange} maxVisible={5} />
    );

    // Component uses "..." (three dots) not "…" (ellipsis character)
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThan(0);
  });
});
