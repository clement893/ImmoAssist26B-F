'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { checkMySuperAdminStatus } from '@/lib/api/admin';

/**
 * Returns whether the current user has superadmin role.
 * Used to show/hide superadmin-only menu items (e.g. Base de connaissance Léa).
 * Returns false until the check completes (avoids showing the link briefly to non-superadmins).
 */
export function useSuperAdminStatus(): boolean {
  const { user, token, isAuthenticated } = useAuthStore();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!user?.email || !isAuthenticated()) {
      setIsSuperAdmin(false);
      return;
    }
    let cancelled = false;
    checkMySuperAdminStatus(token || undefined)
      .then((res) => {
        if (!cancelled) setIsSuperAdmin(res.is_superadmin === true);
      })
      .catch(() => {
        if (!cancelled) setIsSuperAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, token, isAuthenticated]);

  return isSuperAdmin;
}
