import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Autocomplete from '../Autocomplete';
import type { AutocompleteOption } from '../Autocomplete';

describe('Autocomplete', () => {
  const options: AutocompleteOption[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
  ];

  it('renders input field', () => {
    render(<Autocomplete options={options} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows dropdown when typing', () => {
    render(<Autocomplete options={options} minChars={0} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('filters options based on input', () => {
    render(<Autocomplete options={options} minChars={0} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'app' } });

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('calls onSelect when option is clicked', () => {
    const onSelect = vi.fn();
    render(<Autocomplete options={options} onSelect={onSelect} minChars={0} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('Apple'));

    expect(onSelect).toHaveBeenCalledWith({ label: 'Apple', value: 'apple' });
  });
});
