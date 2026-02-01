'use client';

import { useState, useEffect } from 'react';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Card, Button, Badge, LoadingSkeleton, ServiceTestCard, Grid } from '@/components/ui';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';

export default function AdminContent() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Administration"
          description="Panneau d'administration du système"
          breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Administration' }]}
        />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={6} />
        </div>
      </PageContainer>
    );
  }

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

        <Card title="Thèmes" className="flex flex-col">
          <p className="text-muted-foreground mb-4">
            Créez, modifiez et activez les thèmes de la plateforme.
          </p>
          <Link href="/admin/themes">
            <Button variant="primary" className="w-full">
              Gérer les thèmes
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

        <Card title="Clés API" className="flex flex-col">
          <p className="text-muted-foreground mb-4">
            Consulter et gérer toutes les clés API du système.
          </p>
          <Link href="/admin/api-keys">
            <Button variant="primary" className="w-full">
              Gérer les clés API
            </Button>
          </Link>
        </Card>
      </div>

      {/* Service Tests Section */}
      <MotionDiv variant="slideUp" delay={300} className="mt-8">
        <Card className="hover:shadow-standard-xl transition-modern">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-info-100 dark:bg-info-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-info-600 dark:text-info-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Service Tests</h3>
              <p className="text-sm text-muted-foreground">
                Test and verify the configuration of integrated services
              </p>
            </div>
          </div>
          <Grid columns={{ mobile: 1, tablet: 3, desktop: 3 }} gap="normal">
            <ServiceTestCard
              href="/ai/testing"
              title="AI Test"
              description="Test OpenAI integration with chat completions and text generation"
              color="info"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/email/testing"
              title="Email Test"
              description="Test SendGrid email service with test, welcome, and custom emails"
              color="secondary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/stripe/testing"
              title="Stripe Test"
              description="Test Stripe integration for subscriptions and payment processing"
              color="success"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/auth/google/testing"
              title="Google Auth Test"
              description="Test Google OAuth integration for authentication"
              color="warning"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/sentry/testing"
              title="Sentry Test"
              description="Test Sentry error tracking and monitoring integration"
              color="error"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/upload"
              title="S3 Upload"
              description="Test AWS S3 file upload and management functionality"
              color="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/client/dashboard"
              title="Client Portal"
              description="Test Client Portal - View orders, invoices, projects, and support tickets"
              color="info"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/erp/dashboard"
              title="ERP Portal"
              description="Test ERP Portal - Manage orders, invoices, clients, inventory, and reports"
              color="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
            />
            <ServiceTestCard
              href="/api-connections/testing"
              title="API Connections Test"
              description="Test and verify API connections between frontend pages and backend endpoints"
              color="info"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>
              }
            />
          </Grid>
        </Card>
      </MotionDiv>

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
