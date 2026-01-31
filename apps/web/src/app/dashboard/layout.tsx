'use client';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use shared DashboardLayout component for consistency
// This prevents double sidebars when both /dashboard and /[locale]/dashboard layouts are active
import DashboardLayout from '@/components/layout/DashboardLayout';

export default DashboardLayout;
