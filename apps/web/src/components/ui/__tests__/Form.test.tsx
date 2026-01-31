import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Form from '../Form';
import type { FormField } from '../Form';

describe('Form', () => {
  const fields: FormField[] = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
    },
  ];

  it('renders form with fields', () => {
    const onSubmit = vi.fn();
    render(<Form fields={fields} onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn();
    render(<Form fields={fields} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Submit/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows validation errors', () => {
    const errors = {
      email: 'Email is required',
    };

    render(<Form fields={fields} onSubmit={() => {}} errors={errors} />);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
