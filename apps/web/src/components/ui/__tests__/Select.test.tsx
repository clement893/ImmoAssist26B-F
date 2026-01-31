import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Select from '../Select';
import type { SelectOption } from '../Select';

const mockOptions: SelectOption[] = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3', disabled: true },
];

describe('Select', () => {
  it('renders select element', () => {
    const { container } = render(<Select options={mockOptions} />);
    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Select label="Choose an option" options={mockOptions} />);
    expect(screen.getByLabelText('Choose an option')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={mockOptions} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders with selected value', () => {
    render(<Select options={mockOptions} value="option2" onChange={() => {}} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} onChange={handleChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option2' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('displays error message', () => {
    render(<Select options={mockOptions} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveAttribute('role', 'alert');
  });

  it('displays helper text when no error', () => {
    render(<Select options={mockOptions} helperText="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('does not display helper text when error is present', () => {
    render(<Select options={mockOptions} error="Error" helperText="Helper text" />);
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Select options={mockOptions} placeholder="Select..." />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
    const placeholderOption = screen.getByText('Select...');
    expect(placeholderOption).toBeDisabled();
  });

  it('disables disabled options', () => {
    render(<Select options={mockOptions} />);
    const option3 = screen.getByText('Option 3');
    const select = screen.getByRole('combobox');
    const optionElement = Array.from(select.querySelectorAll('option')).find(
      (opt) => opt.textContent === 'Option 3'
    );
    expect(optionElement).toBeDisabled();
  });

  it('renders with fullWidth', () => {
    const { container } = render(<Select options={mockOptions} fullWidth />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('w-full');
  });

  it('has error styling when error is present', () => {
    const { container } = render(<Select options={mockOptions} error="Error" />);
    const select = container.querySelector('select');
    expect(select).toHaveClass('border-error-500');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Select options={mockOptions} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('forwards HTML select attributes', () => {
    render(<Select options={mockOptions} disabled required />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveAttribute('required');
  });

  it('generates unique id when not provided', () => {
    const { container } = render(<Select options={mockOptions} />);
    const select = container.querySelector('select');
    expect(select).toHaveAttribute('id');
    expect(select?.getAttribute('id')).toMatch(/^select-/);
  });

  it('uses provided id', () => {
    render(<Select id="custom-select" options={mockOptions} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'custom-select');
  });
});
