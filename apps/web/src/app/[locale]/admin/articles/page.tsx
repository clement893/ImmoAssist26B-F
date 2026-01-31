import AdminArticlesContent from './AdminArticlesContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminArticlesPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminArticlesContent />
    </ProtectedSuperAdminRoute>
  );
}
