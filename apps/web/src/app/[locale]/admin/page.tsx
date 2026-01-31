import AdminContent from './AdminContent';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

// Force dynamic rendering to avoid CSS file issues during build
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Disable static generation to avoid hydration issues
export const revalidate = 0;

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <ErrorBoundary>
        <AdminContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
