'use client';

import { Container, Card, Button } from '@immoassist/ui';
import { useRouter, useParams } from 'next/navigation';

export default function ProfilModulePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <Container>
      <Card title="Module Profil">
        <p className="text-muted-foreground mb-4">
          Gestion du profil utilisateur et des paramètres personnels.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => router.push(`/${locale}/profile`)}>
            Mon profil
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/profile/settings`)}>
            Paramètres
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/profile/security`)}>
            Sécurité
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/profile/activity`)}>
            Activité
          </Button>
          <Button variant="primary" onClick={() => router.push(`/${locale}/profile/notifications`)}>
            Notifications
          </Button>
        </div>
      </Card>
    </Container>
  );
}
