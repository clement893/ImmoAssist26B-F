'use client';

import { Container, Card, Button } from '@immoassist/ui';
import { useRouter, useParams } from 'next/navigation';

export default function AdminModulePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <Container>
      <Card title="Module Admin">
        <p className="text-muted-foreground mb-4">
          Gestion de l&apos;administration et des fonctionnalités de gestion.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/users`)}>
            Utilisateurs
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/teams`)}>
            Équipes
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/rbac`)}>
            Rôles et permissions
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/organizations`)}>
            Organisations
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/pages`)}>
            Pages
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/articles`)}>
            Articles
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/media`)}>
            Médias
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/themes`)}>
            Thèmes
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/admin/settings`)}>
            Configuration
          </Button>
        </div>
      </Card>
    </Container>
  );
}
