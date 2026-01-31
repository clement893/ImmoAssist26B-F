'use client';

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use shared DashboardLayout component for consistency
import DashboardLayout from '@/components/layout/DashboardLayout';

export default DashboardLayout;
