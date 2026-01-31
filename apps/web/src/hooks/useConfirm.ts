/**
 * useConfirm Hook
 *
 * Reusable hook for confirmation dialogs.
 * Reduces code duplication for delete/action confirmations.
 *
 * @example
 * ```tsx
 * const confirm = useConfirm();
 *
 * const handleDelete = async () => {
 *   if (await confirm('Are you sure?')) {
 *     await deleteItem();
 *   }
 * };
 * ```
 */

import { useCallback } from 'react';

export interface ConfirmOptions {
  /** Confirmation message */
  message: string;
  /** Title for the confirmation dialog */
  title?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether the action is destructive */
  destructive?: boolean;
}

/**
 * useConfirm - Hook for confirmation dialogs
 */
export function useConfirm() {
  const confirm = useCallback((options: string | ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const message = typeof options === 'string' ? options : options.message;
      const result = window.confirm(message);
      resolve(result);
    });
  }, []);

  return confirm;
}

/**
 * useConfirmAction - Higher-order hook for actions requiring confirmation
 */
export function useConfirmAction<T extends (...args: unknown[]) => unknown>(
  action: T,
  options: string | ConfirmOptions
): T {
  const confirm = useConfirm();

  return useCallback(
    async (...args: Parameters<T>) => {
      const confirmed = await confirm(options);
      if (confirmed) {
        return action(...args);
      }
      return undefined as ReturnType<T>;
    },
    [action, confirm, options]
  ) as T;
}
