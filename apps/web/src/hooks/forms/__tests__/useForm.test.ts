import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { useForm } from '../useForm';

describe('useForm', () => {
  const validationSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  });

  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com', name: 'Test' },
          onSubmit: vi.fn(),
        })
      );

      expect(result.current.values.email).toBe('test@example.com');
      expect(result.current.values.name).toBe('Test');
    });

    it('initializes with empty values when no initialValues provided', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      expect(result.current.values).toEqual({});
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('initializes with validation schema', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          onSubmit: vi.fn(),
        })
      );

      expect(result.current.isValid).toBe(false);
    });
  });

  describe('Value Management', () => {
    it('sets value using setValue', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setValue('email', 'test@example.com');
      });

      expect(result.current.values.email).toBe('test@example.com');
    });

    it('sets multiple values using setValues', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setValues({ email: 'test@example.com', name: 'Test' });
      });

      expect(result.current.values.email).toBe('test@example.com');
      expect(result.current.values.name).toBe('Test');
    });

    it('handles handleChange event', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      const mockEvent = {
        target: { value: 'test@example.com', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange('email')(mockEvent);
      });

      expect(result.current.values.email).toBe('test@example.com');
    });

    it('handles checkbox change event', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      const mockEvent = {
        target: { checked: true, type: 'checkbox' },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange('agree')(mockEvent);
      });

      expect(result.current.values.agree).toBe(true);
    });

    it('handles number input change event', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      const mockEvent = {
        target: { value: '42', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChange('age')(mockEvent);
      });

      expect(result.current.values.age).toBe(42);
    });
  });

  describe('Validation', () => {
    it('validates field on blur when validateOnBlur is true', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          validateOnBlur: true,
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setValue('email', 'invalid-email');
        result.current.handleBlur('email')();
      });

      expect(result.current.errors.email).toBeTruthy();
      expect(result.current.touched.email).toBe(true);
    });

    it('validates field on change when validateOnChange is true', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          validateOnChange: true,
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setValue('email', 'invalid-email');
      });

      expect(result.current.errors.email).toBeTruthy();
    });

    it('does not validate on change when validateOnChange is false', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          validateOnChange: false,
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setValue('email', 'invalid-email');
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('clears error when field becomes valid', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          validateOnChange: true,
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setValue('email', 'invalid');
      });

      expect(result.current.errors.email).toBeTruthy();

      act(() => {
        result.current.setValue('email', 'valid@example.com');
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('validates all fields on submit', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.email).toBeTruthy();
      expect(result.current.errors.password).toBeTruthy();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Error Management', () => {
    it('sets error using setError', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setError('email', 'Custom error');
      });

      expect(result.current.errors.email).toBe('Custom error');
    });

    it('sets multiple errors using setErrors', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setErrors({ email: 'Email error', password: 'Password error' });
      });

      expect(result.current.errors.email).toBe('Email error');
      expect(result.current.errors.password).toBe('Password error');
    });

    it('clears all errors using clearErrors', () => {
      const { result } = renderHook(() =>
        useForm({
          onSubmit: vi.fn(),
        })
      );

      act(() => {
        result.current.setErrors({ email: 'Error', password: 'Error' });
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      act(() => {
        result.current.clearErrors();
      });

      expect(Object.keys(result.current.errors).length).toBe(0);
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit when form is valid', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          initialValues: {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('does not call onSubmit when form is invalid', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          initialValues: { email: 'invalid' },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('sets isSubmitting during submission', async () => {
      const onSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com' },
          onSubmit,
        })
      );

      const submitPromise = act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      expect(result.current.isSubmitting).toBe(false);
    });

    it('handles submission errors', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com' },
          onSubmit,
          onError,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors._form).toBe('Submission failed');
      expect(onError).toHaveBeenCalled();
    });

    it('prevents default form submission', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com' },
          onSubmit,
        })
      );

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('resets form to initial values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'initial@example.com' },
          onSubmit: vi.fn(),
        })
      );

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.setValue('email', 'changed@example.com');
        result.current.setError('email', 'Error');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values.email).toBe('initial@example.com');
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('resets individual field', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com', name: 'Test' },
          onSubmit: vi.fn(),
        })
      );

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.setValue('email', 'changed@example.com');
        result.current.setError('email', 'Error');
        result.current.resetField('email');
      });

      expect(result.current.values.email).toBeUndefined();
      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.values.name).toBe('Test');
    });
  });

  describe('getFieldProps', () => {
    it('returns field props with correct structure', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com' },
          onSubmit: vi.fn(),
        })
      );

      expect(result.current).not.toBeNull();

      const fieldProps = result.current.getFieldProps('email');

      expect(fieldProps).toHaveProperty('name', 'email');
      expect(fieldProps).toHaveProperty('value', 'test@example.com');
      expect(fieldProps).toHaveProperty('onChange');
      expect(fieldProps).toHaveProperty('onBlur');
      expect(fieldProps).toHaveProperty('error');
      expect(fieldProps).toHaveProperty('touched');
    });

    it('includes error and touched state in field props', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          validateOnBlur: true,
          onSubmit: vi.fn(),
        })
      );

      expect(result.current).not.toBeNull();

      act(() => {
        result.current.setValue('email', 'invalid');
        result.current.handleBlur('email')();
      });

      const fieldProps = result.current.getFieldProps('email');
      expect(fieldProps.error).toBeTruthy();
      expect(fieldProps.touched).toBe(true);
    });
  });

  describe('isValid', () => {
    it('returns true when form is valid', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          initialValues: {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          },
          onSubmit: vi.fn(),
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current.isValid).toBe(true);
    });

    it('returns false when form is invalid', () => {
      const { result } = renderHook(() =>
        useForm({
          validationSchema,
          initialValues: { email: 'invalid' },
          onSubmit: vi.fn(),
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current.isValid).toBe(false);
    });
  });
});
