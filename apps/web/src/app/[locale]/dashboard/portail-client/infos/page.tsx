'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, UserPlus, Info, MessageSquare, FileText, CheckSquare } from 'lucide-react';

export default function PortailsClientsInfosPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'fr';

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Portails clients</h1>
          <p className="text-muted-foreground mt-1">
            Gérez l&apos;accès de vos clients à leur espace dédié et suivez vos transactions
          </p>
        </div>

        {/* Info Section */}
        <Card>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                <Info className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Qu&apos;est-ce que le portail client ?</h2>
                <p className="text-muted-foreground mb-3">
                  Le portail client permet à vos clients d&apos;accéder à un espace sécurisé où ils peuvent suivre l&apos;évolution de leur transaction immobilière, consulter les documents partagés, communiquer avec vous via la messagerie et gérer leurs tâches.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    Documents partagés en toute sécurité
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
                    Messagerie intégrée pour une communication fluide
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                    Suivi des tâches et échéances
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card
            hover
            onClick={() => router.push(`/${locale}/dashboard/portail-client/courtier/clients`)}
            className="cursor-pointer"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Liste des clients</h2>
                  <p className="text-sm text-muted-foreground">
                    Gérer les accès portail
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Consultez la liste de vos clients ayant accès au portail. Gérez leurs invitations, suivez leur progression et leur activité.
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Voir la liste des clients
              </Button>
            </div>
          </Card>

          <Card
            hover
            onClick={() => router.push(`/${locale}/dashboard/portail-client/courtier/clients/inviter`)}
            className="cursor-pointer"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <UserPlus className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Inviter un client</h2>
                  <p className="text-sm text-muted-foreground">
                    Créer un accès portail
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Envoyez une invitation à un nouveau client pour lui donner accès à son portail personnalisé. Il recevra un email avec les instructions de connexion.
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Inviter un client
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Accès rapide</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href={`/${locale}/dashboard/portail-client/courtier/clients`}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Liste des clients</div>
                  <div className="text-sm text-muted-foreground">Gérer les accès portail</div>
                </div>
              </Link>
              <Link
                href={`/${locale}/dashboard/portail-client/courtier/clients/inviter`}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <UserPlus className="w-5 h-5 text-success" />
                <div>
                  <div className="font-medium">Inviter un client</div>
                  <div className="text-sm text-muted-foreground">Créer un nouvel accès</div>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
