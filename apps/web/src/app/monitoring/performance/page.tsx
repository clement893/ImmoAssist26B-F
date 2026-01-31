/**
 * Performance Monitoring Dashboard Page
 */

import SystemPerformanceDashboard from '@/components/monitoring/SystemPerformanceDashboard';

export const metadata = {
  title: 'Performance Dashboard | Monitoring',
  description: 'Real-time Core Web Vitals and performance metrics',
};

export default function PerformancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SystemPerformanceDashboard />
    </div>
  );
}
