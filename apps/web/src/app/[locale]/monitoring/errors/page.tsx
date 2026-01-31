/**
 * Error Tracking Dashboard Page
 */

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import ErrorTrackingDashboard from '@/components/monitoring/ErrorTrackingDashboard';

export const metadata = {
  title: 'Error Tracking Dashboard | Monitoring',
  description: 'Monitor application errors and performance issues',
};

export default function ErrorTrackingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorTrackingDashboard />
    </div>
  );
}
