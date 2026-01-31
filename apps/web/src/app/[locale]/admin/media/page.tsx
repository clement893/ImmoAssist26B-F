import AdminMediaContent from './AdminMediaContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminMediaPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminMediaContent />
    </ProtectedSuperAdminRoute>
  );
}
