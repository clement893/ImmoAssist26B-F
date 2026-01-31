'use client';
import Toast from './Toast';
import { useToastStore } from '@/lib/toast';
/** * ToastContainer Component * * Global container for toast notifications. * Uses Zustand store for centralized state management. * Automatically renders all active toasts. */ export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  if (toasts.length === 0) {
    return null;
  }
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {' '}
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          {' '}
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            icon={toast.icon}
            onClose={removeToast}
          />{' '}
        </div>
      ))}{' '}
    </div>
  );
}
export default ToastContainer;
