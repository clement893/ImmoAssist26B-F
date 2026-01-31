import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('calls onSearch when value changes', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    expect(handleSearch).toHaveBeenCalledWith('test');
  });

  it('shows clear button when value exists and showClearButton is true', async () => {
    const user = userEvent.setup();

    render(<SearchBar showClearButton={true} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('hides clear button when showClearButton is false', async () => {
    const user = userEvent.setup();

    render(<SearchBar showClearButton={false} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(handleSearch).toHaveBeenCalledWith('');
  });

  it('applies custom placeholder', () => {
    render(<SearchBar placeholder="Search users..." />);
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('applies fullWidth class when fullWidth is true', () => {
    const { container } = render(<SearchBar fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    const { container } = render(<SearchBar className="custom-class" />);
    // className is applied to the input element, not the wrapper
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });

  it('passes through other input props', () => {
    render(<SearchBar disabled aria-label="Search" />);
    const input = screen.getByLabelText('Search');
    expect(input).toBeDisabled();
  });

  it('handles search with multiple characters', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test query');

    expect(handleSearch).toHaveBeenCalled();
  });

  it('handles empty search value', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(handleSearch).toHaveBeenCalledWith('');
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SearchBar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper input role', () => {
      render(<SearchBar />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });
});
