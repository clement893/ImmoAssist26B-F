'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import Link from 'next/link';

export default function AdminContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Administration"
        description="Panneau d'administration du système"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Administration' }]}
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Invitations" className="flex flex-col">
          <p className="text-muted-foreground mb-4">
            Gérer les invitations utilisateurs et les accès au système.
          </p>
          <Link href="/admin/invitations">
            <Button variant="primary" className="w-full">
              Gérer les invitations
            </Button>
          </Link>
        </Card>

        <Card title="Utilisateurs" className="flex flex-col">
          <p className="text-muted-foreground mb-4">
            Consulter et gérer les utilisateurs du système.
          </p>
          <Link href="/admin/users">
            <Button variant="primary" className="w-full">
              Gérer les utilisateurs
            </Button>
          </Link>
        </Card>

        <Card title="Organisations" className="flex flex-col">
          <p className="text-muted-foreground mb-4">Gérer les organisations et leurs paramètres.</p>
          <Link href="/admin/organizations">
            <Button variant="primary" className="w-full">
              Gérer les organisations
            </Button>
          </Link>
        </Card>

        <Card title="Paramètres" className="flex flex-col">
          <p className="text-muted-foreground mb-4">Configuration générale du système.</p>
          <Link href="/admin/settings">
            <Button variant="primary" className="w-full">
              Configurer
            </Button>
          </Link>
        </Card>

        <Card title="Logs" className="flex flex-col">
          <p className="text-muted-foreground mb-4">Consulter les logs système et les activités.</p>
          <Link href="/admin-logs/testing">
            <Button variant="primary" className="w-full">
              Voir les logs
            </Button>
          </Link>
        </Card>

        <Card title="Statistiques" className="flex flex-col">
          <p className="text-muted-foreground mb-4">
            Visualiser les statistiques et métriques du système.
          </p>
          <Link href="/admin/statistics">
            <Button variant="primary" className="w-full">
              Voir les statistiques
            </Button>
          </Link>
        </Card>
      </div>

      <Section title="Statut du système" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg bg-secondary-100 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                API Backend
              </span>
              <Badge variant="success">En ligne</Badge>
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-secondary-100 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Base de données
              </span>
              <Badge variant="success">Connectée</Badge>
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-secondary-100 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Services
              </span>
              <Badge variant="success">Opérationnels</Badge>
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}
