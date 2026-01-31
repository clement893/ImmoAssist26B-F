'use client';

import AdminLogsContent from './AdminLogsContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

export default function AdminLogsPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminLogsContent />
    </ProtectedSuperAdminRoute>
  );
}
