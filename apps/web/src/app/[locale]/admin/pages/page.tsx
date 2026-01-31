import AdminPagesContent from './AdminPagesContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminPagesPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminPagesContent />
    </ProtectedSuperAdminRoute>
  );
}
