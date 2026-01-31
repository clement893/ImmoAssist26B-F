import TenancyContent from './TenancyContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function TenancyPage() {
  return (
    <ProtectedSuperAdminRoute>
      <TenancyContent />
    </ProtectedSuperAdminRoute>
  );
}
