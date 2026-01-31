import AdminContent from './AdminContent';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Force dynamic rendering to avoid CSS file issues during build
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminContent />
    </ProtectedRoute>
  );
}
