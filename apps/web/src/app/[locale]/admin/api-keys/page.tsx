import AdminAPIKeysContent from './AdminAPIKeysContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminAPIKeysPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminAPIKeysContent />
    </ProtectedSuperAdminRoute>
  );
}
