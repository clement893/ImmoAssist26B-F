'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { sitePages, BASE_URL } from '@/config/sitemap';
import Badge from '@/components/ui/Badge';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/lib/store';
import { checkMySuperAdminStatus } from '@/lib/api/admin';

function SitemapPageContent() {
  const { isAuthenticated, user, token } = useAuthStore();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!isAuthenticated() || !token) {
        return;
      }

      try {
        const status = await checkMySuperAdminStatus(token);
        setIsSuperAdmin(status.is_superadmin === true);
      } catch (error) {
        // If check fails, assume not superadmin
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, [isAuthenticated, token]);
  return (
    <div className="min-h-screen bg-muted py-12">
      <Container className="max-w-6xl">
        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Plan du Site</h1>
            <p className="text-muted-foreground">
              Retrouvez tous les liens et pages disponibles sur le site. Utilisez ce plan pour
              naviguer facilement.
            </p>
          </div>

          <div className="space-y-8">
            {Object.entries(sitePages).map(([category, pages]) => (
              <div key={category} className="border-b border-border pb-6 last:border-b-0">
                <h2 className="text-2xl font-semibold text-foreground mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page) => {
                    // Check if user can access: no auth required, or authenticated and (no admin required or is admin/superadmin)
                    const canAccess =
                      !page.requiresAuth ||
                      (page.requiresAuth &&
                        isAuthenticated() &&
                        (!page.requiresAdmin || user?.is_admin || isSuperAdmin));

                    return (
                      <div
                        key={page.path}
                        className={`block p-4 rounded-lg border transition-all group ${
                          canAccess
                            ? 'border-border hover:border-primary hover:shadow-md cursor-pointer'
                            : 'border-border opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {canAccess ? (
                          <Link href={page.path} className="block">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition">
                                {page.title}
                              </h3>
                              <div className="flex gap-1 ml-2">
                                {page.requiresAuth && (
                                  <Badge variant="default" className="text-xs">
                                    Auth
                                  </Badge>
                                )}
                                {page.requiresAdmin && (
                                  <Badge variant="error" className="text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{page.description}</p>
                            <span className="text-xs text-info-600 dark:text-info-400 font-mono">
                              {page.path}
                            </span>
                          </Link>
                        ) : (
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-medium text-muted-foreground">
                                {page.title}
                              </h3>
                              <div className="flex gap-1 ml-2">
                                {page.requiresAuth && (
                                  <Badge variant="default" className="text-xs opacity-75">
                                    Auth
                                  </Badge>
                                )}
                                {page.requiresAdmin && (
                                  <Badge variant="error" className="text-xs opacity-75">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{page.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">
                                {page.path}
                              </span>
                              <span className="text-xs text-error-600 dark:text-error-400">
                                (Connexion requise)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Sitemap XML</h2>
            <p className="text-muted-foreground mb-4">
              Pour les moteurs de recherche, vous pouvez également accéder au sitemap XML :
            </p>
            <Link
              href="/sitemap.xml"
              className="inline-block text-info-600 dark:text-info-400 hover:underline font-mono"
            >
              {BASE_URL}/sitemap.xml
            </Link>
          </div>

          {/* Note explicative sur la logique d'accès */}
          <div className="mt-8 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              📋 Note sur l'accès aux pages
            </h2>
            <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Pages publiques (accessibles sans connexion)
                </h3>
                <p className="text-sm text-foreground mb-2">
                  Ces pages sont accessibles à tous les visiteurs, même sans compte utilisateur :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Page d'accueil, tarifs, exemples, composants, documentation</li>
                  <li>Pages d'authentification (connexion, inscription)</li>
                  <li>Pages de test et monitoring</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  Pages protégées
                  <Badge variant="default" className="text-xs">
                    Auth
                  </Badge>
                </h3>
                <p className="text-sm text-foreground mb-2">
                  Ces pages nécessitent une authentification. Si vous n'êtes pas connecté, vous
                  serez redirigé vers la page de connexion :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Tableau de bord (Dashboard)</li>
                  <li>Gestion des abonnements</li>
                  <li>Pages de confirmation d'abonnement</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  Pages d'administration
                  <Badge variant="error" className="text-xs">
                    Admin
                  </Badge>
                </h3>
                <p className="text-sm text-foreground mb-2">
                  Ces pages nécessitent à la fois une authentification et des droits administrateur.
                  Seuls les administrateurs peuvent y accéder :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Panneau d'administration</li>
                  <li>Gestion des équipes</li>
                  <li>Gestion des invitations</li>
                  <li>Gestion des rôles et permissions (RBAC)</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-info-200 dark:border-info-800">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Indicateurs visuels :</strong> Les pages
                  protégées sont affichées avec des badges colorés. Les pages non accessibles
                  apparaissent en gris avec la mention "(Connexion requise)". Si vous êtes connecté
                  et avez les permissions nécessaires, vous pouvez cliquer directement sur les
                  liens.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}

export default function SitemapPage() {
  return <SitemapPageContent />;
}
