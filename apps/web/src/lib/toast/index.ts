/**
 * Toast Store
 *
 * Zustand store for managing toast notifications globally.
 * Provides centralized state management for toasts across the application.
 */

import { create } from 'zustand';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastStore {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * Zustand store for toast notifications
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastData = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-dismiss if duration > 0
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

/**
 * Hook for showing toasts
 * Provides convenient methods for different toast types
 */
export function useToast() {
  const { addToast, removeToast, clearToasts } = useToastStore();

  return {
    showToast: (toast: Omit<ToastData, 'id'>) => {
      addToast(toast);
    },
    success: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'success', ...options });
    },
    error: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'error', ...options });
    },
    warning: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'warning', ...options });
    },
    info: (message: string, options?: Omit<ToastData, 'id' | 'message' | 'type'>) => {
      addToast({ message, type: 'info', ...options });
    },
    removeToast,
    clearToasts,
  };
}
