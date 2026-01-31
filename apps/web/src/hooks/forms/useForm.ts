/**
 * useForm Hook
 * Gestion complète de formulaires avec validation
 */

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export interface FormField<T> {
  name: keyof T;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  validation?: z.ZodTypeAny;
  options?: { label: string; value: string }[];
  helpText?: string;
  disabled?: boolean;
}

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues?: Partial<T>;
  validationSchema?: z.ZodObject<z.ZodRawShape, 'strip', z.ZodTypeAny, T, T>;
  onSubmit: (data: T) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (name: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setError: (name: keyof T, error: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  handleChange: (
    name: keyof T
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (name: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  resetField: (name: keyof T) => void;
  getFieldProps: (name: keyof T) => {
    name: string;
    value: unknown;
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    onBlur: () => void;
    error?: string;
    touched?: boolean;
  };
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const {
    initialValues = {},
    validationSchema,
    onSubmit,
    onError,
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  const [values, setValuesState] = useState<Partial<T>>(initialValues);
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, value: unknown): string | null => {
      if (!validationSchema) return null;

      try {
        const fieldSchema = validationSchema.shape[name as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
        }
        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.issues[0]?.message ?? 'Invalid value';
        }
        return 'Invalid value';
      }
    },
    [validationSchema]
  );

  const validateAll = useCallback((): Record<string, string> => {
    if (!validationSchema) return {};

    try {
      // Use safeParse to avoid throwing errors
      // Validate only fields that exist in values to avoid issues with partial objects
      const result = validationSchema.safeParse(values);
      if (result.success) {
        return {};
      }

      // Extract errors only for fields that exist in values
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (path) {
          fieldErrors[path] = err.message;
        }
      });
      return fieldErrors;
    } catch (error) {
      // Fallback for any unexpected errors - this should never happen with safeParse
      // but we catch it just in case
      if (error instanceof Error) {
        logger.error('Unexpected validation error', error);
      }
      return {};
    }
  }, [validationSchema, values]);

  // Compute isValid lazily to avoid issues during initial render
  const isValid = useMemo(() => {
    if (!validationSchema) {
      // If no schema, form is considered valid if no errors exist
      return Object.keys(errors).length === 0;
    }
    try {
      const validationErrors = validateAll();
      return Object.keys(validationErrors).length === 0;
    } catch (error) {
      // Fallback to false if validation fails unexpectedly
      logger.error(
        'Error computing isValid',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }, [validateAll, validationSchema, errors]);

  const setValue = useCallback(
    (name: keyof T, value: unknown) => {
      setValuesState((prev) => ({ ...prev, [name]: value }));

      if (validateOnChange) {
        const error = validateField(name, value);
        if (error) {
          setErrorsState((prev) => ({ ...prev, [name as string]: error }));
        } else {
          setErrorsState((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name as string];
            return newErrors;
          });
        }
      }
    },
    [validateOnChange, validateField]
  );

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrorsState((prev) => ({ ...prev, [name as string]: error }));
  }, []);

  const setErrors = useCallback((newErrors: Record<string, string>) => {
    setErrorsState(newErrors);
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  const handleChange = useCallback(
    (name: keyof T) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value =
          e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.type === 'number'
              ? Number(e.target.value)
              : e.target.value;

        setValue(name, value);
      },
    [setValue]
  );

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouchedState((prev) => ({ ...prev, [name as string]: true }));

      if (validateOnBlur) {
        const value = values[name];
        const error = validateField(name, value);
        if (error) {
          setErrorsState((prev) => ({ ...prev, [name as string]: error }));
        } else {
          setErrorsState((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name as string];
            return newErrors;
          });
        }
      }
    },
    [validateOnBlur, validateField, values]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setIsSubmitting(true);
      clearErrors();

      // Validate all fields
      const validationErrors = validateAll();
      if (Object.keys(validationErrors).length > 0) {
        setErrorsState(validationErrors);
        setTouchedState(
          Object.keys(validationErrors).reduce(
            (acc, key) => {
              acc[key] = true;
              return acc;
            },
            {} as Record<string, boolean>
          )
        );
        setIsSubmitting(false);
        onError?.(validationErrors);
        return;
      }

      try {
        await onSubmit(values as T);
      } catch (error) {
        if (error instanceof Error) {
          setErrorsState({ _form: error.message });
        }
        onError?.({ _form: error instanceof Error ? error.message : 'An error occurred' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onError, values, validateAll, clearErrors]
  );

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrorsState({});
    setTouchedState({});
  }, [initialValues]);

  const resetField = useCallback((name: keyof T) => {
    setValuesState((prev) => {
      const newValues = { ...prev };
      delete newValues[name];
      return newValues;
    });
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as string];
      return newErrors;
    });
    setTouchedState((prev) => {
      const newTouched = { ...prev };
      delete newTouched[name as string];
      return newTouched;
    });
  }, []);

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: name as string,
      value: values[name] ?? '',
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      error: errors[name as string],
      touched: touched[name as string],
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    setError,
    setErrors,
    clearErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    resetField,
    getFieldProps,
  };
}
