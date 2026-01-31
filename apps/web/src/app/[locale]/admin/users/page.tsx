import AdminUsersContent from './AdminUsersContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminUsersPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminUsersContent />
    </ProtectedSuperAdminRoute>
  );
}
