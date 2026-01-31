import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Textarea from '../Textarea';

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('calls onChange when text is entered', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test text');

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<Textarea error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<Textarea className="custom-class" />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('custom-class');
  });
});
