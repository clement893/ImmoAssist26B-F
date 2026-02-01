'use client';

import { Container, Card, Button } from '@immoassist/ui';
import { useRouter, useParams } from 'next/navigation';
import {
  Users,
  UserCog,
  Shield,
  Building2,
  UserCheck,
  FileText,
  FileCheck,
  Image,
  Palette,
  Lock,
  Sliders,
  Cog,
  BookOpen,
} from 'lucide-react';

export default function AdminModulePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const adminSections = [
    {
      title: 'Utilisateurs',
      description: 'Gérer les utilisateurs, leurs rôles et permissions',
      icon: <Users className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/users`,
      color: 'bg-blue-500',
    },
    {
      title: 'Équipes',
      description: 'Gérer les équipes et leurs membres',
      icon: <UserCog className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/teams`,
      color: 'bg-green-500',
    },
    {
      title: 'Rôles et permissions',
      description: 'Configurer les rôles et les permissions du système',
      icon: <Shield className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/rbac`,
      color: 'bg-green-500',
    },
    {
      title: 'Organisations',
      description: 'Gérer les organisations et leurs paramètres',
      icon: <Building2 className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/organizations`,
      color: 'bg-orange-500',
    },
    {
      title: 'Invitations',
      description: 'Gérer les invitations utilisateurs',
      icon: <UserCheck className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/invitations`,
      color: 'bg-teal-500',
    },
    {
      title: 'Pages',
      description: 'Gérer les pages du site',
      icon: <FileText className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/pages`,
      color: 'bg-indigo-500',
    },
    {
      title: 'Articles',
      description: 'Gérer les articles et le contenu',
      icon: <FileCheck className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/articles`,
      color: 'bg-pink-500',
    },
    {
      title: 'Médias',
      description: 'Gérer la bibliothèque de médias',
      icon: <Image className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/media`,
      color: 'bg-yellow-500',
    },
    {
      title: 'Thèmes',
      description: 'Gérer les thèmes et personnalisations',
      icon: <Palette className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/themes`,
      color: 'bg-rose-500',
    },
    {
      title: 'Clés API',
      description: 'Gérer les clés API et les accès',
      icon: <Lock className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/api-keys`,
      color: 'bg-red-500',
    },
    {
      title: 'Statistiques',
      description: 'Consulter les statistiques du système',
      icon: <Sliders className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/statistics`,
      color: 'bg-cyan-500',
    },
    {
      title: 'Configuration',
      description: 'Paramètres généraux du système',
      icon: <Cog className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/settings`,
      color: 'bg-gray-500',
    },
    {
      title: 'Portail clients (infos)',
      description: 'Documentation et fonctionnement du portail client ImmoAssist',
      icon: <BookOpen className="w-6 h-6" />,
      href: `/${locale}/dashboard/modules/admin/portail-clients`,
      color: 'bg-blue-600',
    },
  ];

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Administration</h1>
        <p className="text-muted-foreground">
          Panneau d&apos;administration - Gérez tous les aspects de la plateforme
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Card
            key={section.title}
            className="hover:shadow-standard-lg transition-modern cursor-pointer" // UI Revamp - Nouveau système d'ombres et transition moderne
            onClick={() => router.push(section.href)}
          >
            <div className="flex items-start gap-4">
              <div className={`${section.color} p-3 rounded-lg text-white flex-shrink-0`}>
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">{section.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(section.href);
                  }}
                >
                  Accéder
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
