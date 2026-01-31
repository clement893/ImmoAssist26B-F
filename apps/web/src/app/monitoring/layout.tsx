import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitoring & Observability | MODELE',
  description: 'Dashboard de monitoring, métriques de performance, logs et alertes',
};

export default function MonitoringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
