import AdminOrganizationsContent from './AdminOrganizationsContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminOrganizationsPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminOrganizationsContent />
    </ProtectedSuperAdminRoute>
  );
}
