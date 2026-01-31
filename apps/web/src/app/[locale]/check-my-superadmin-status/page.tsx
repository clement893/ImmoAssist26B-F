'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { Shield, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const dynamic = 'force-dynamic';

function CheckMySuperAdminStatusContent() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    is_superadmin: boolean;
    email?: string;
    user_id?: number;
    is_active?: boolean;
  } | null>(null);

  const checkStatus = async () => {
    if (!user) {
      setError('Vous devez être connecté pour vérifier votre statut');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await checkMySuperAdminStatus(token || undefined);
      setStatus(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification';
      if (
        errorMessage.includes("backend n'est pas accessible") ||
        errorMessage.includes('Failed to fetch')
      ) {
        setError(`${errorMessage}. Veuillez démarrer le serveur backend avant de continuer.`);
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        setError('Vous devez être connecté pour vérifier votre statut');
        router.push(`/auth/login?redirect=${encodeURIComponent('/check-my-superadmin-status')}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <PageContainer>
      <PageHeader
        title="Vérifier mon Statut Superadmin"
        description="Vérifiez si vous avez les privilèges de superadmin"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Statut Superadmin' }]}
      />

      <div className="space-y-8">
        {/* Current User Info */}
        {user && (
          <Section title="Informations Utilisateur">
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Email:</span>
                  <span className="text-foreground">{user.email}</span>
                </div>
                {user.id && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">ID Utilisateur:</span>
                    <span className="text-foreground">{user.id}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Admin:</span>
                  <Badge variant={user.is_admin ? 'success' : 'default'}>
                    {user.is_admin ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Oui
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Non
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </Card>
          </Section>
        )}

        {/* Superadmin Status */}
        <Section title="Statut Superadmin">
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-info-600 dark:text-info-400" />
                  <p className="text-muted-foreground">Vérification en cours...</p>
                </div>
              </div>
            ) : status ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Statut Superadmin:</span>
                  <Badge
                    variant={status.is_superadmin ? 'success' : 'default'}
                    className="text-lg px-4 py-2"
                  >
                    {status.is_superadmin ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Superadmin
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 mr-2" />
                        Non superadmin
                      </>
                    )}
                  </Badge>
                </div>
                {status.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">Email vérifié:</span>
                    <span className="text-foreground">{status.email}</span>
                  </div>
                )}
                {status.user_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">ID Utilisateur:</span>
                    <span className="text-foreground">{status.user_id}</span>
                  </div>
                )}
                {status.is_active !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">Compte actif:</span>
                    <Badge variant={status.is_active ? 'success' : 'default'}>
                      {status.is_active ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Inactif
                        </>
                      )}
                    </Badge>
                  </div>
                )}
                <div className="pt-4 border-t border-border">
                  <Button onClick={checkStatus} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser le statut
                  </Button>
                </div>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-error-600 dark:text-error-400" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-error-900 dark:text-error-100">
                        Erreur
                      </h4>
                      <p className="text-sm text-error-800 dark:text-error-200">{error}</p>
                    </div>
                  </div>
                </div>
                <Button onClick={checkStatus} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            ) : null}
          </Card>
        </Section>

        {/* Information */}
        <Section title="Informations">
          <Card>
            <div className="space-y-4 text-foreground">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />À propos des Superadmins:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Les superadmins ont accès à toutes les fonctionnalités administratives</li>
                  <li>Ce statut est vérifié en temps réel auprès du backend</li>
                  <li>
                    Si vous n'êtes pas superadmin mais souhaitez le devenir, contactez un superadmin
                    existant
                  </li>
                  <li>
                    Vous pouvez actualiser cette page à tout moment pour vérifier votre statut
                    actuel
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}

export default function CheckMySuperAdminStatusPage() {
  return (
    <ProtectedRoute>
      <CheckMySuperAdminStatusContent />
    </ProtectedRoute>
  );
}
