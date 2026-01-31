'use client';

import { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { bootstrapSuperAdmin, makeSuperAdmin, checkSuperAdminStatus } from '@/lib/api/admin';
import { Shield, Key, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function BecomeSuperAdminContent() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [bootstrapKey, setBootstrapKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  const handleBootstrap = async () => {
    if (!email || !bootstrapKey) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await bootstrapSuperAdmin(email, bootstrapKey);
      setSuccess(result.message || 'Superadmin créé avec succès !');
      setIsSuperAdmin(true);
      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la création du superadmin';
      // Check if it's a connection error
      if (
        errorMessage.includes("backend n'est pas accessible") ||
        errorMessage.includes('Failed to fetch')
      ) {
        setError(`${errorMessage}. Veuillez démarrer le serveur backend avant de continuer.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMakeSuperAdmin = async () => {
    if (!email) {
      setError('Veuillez entrer un email');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await makeSuperAdmin(email);
      setSuccess(result.message || 'Superadmin créé avec succès !');
      if (email === user?.email) {
        setIsSuperAdmin(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la création du superadmin';
      // Check if it's a connection error
      if (
        errorMessage.includes("backend n'est pas accessible") ||
        errorMessage.includes('Failed to fetch')
      ) {
        setError(`${errorMessage}. Veuillez démarrer le serveur backend avant de continuer.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!email) {
      setError('Veuillez entrer un email');
      return;
    }

    setCheckingStatus(true);
    setError(null);

    try {
      const result = await checkSuperAdminStatus(email);
      setIsSuperAdmin(result.is_superadmin);
      if (result.is_superadmin) {
        setSuccess(`L'utilisateur ${email} est superadmin`);
      } else {
        setError(`L'utilisateur ${email} n'est pas superadmin`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification';
      if (
        errorMessage.includes("backend n'est pas accessible") ||
        errorMessage.includes('Failed to fetch')
      ) {
        setError(`${errorMessage}. Veuillez démarrer le serveur backend avant de continuer.`);
      } else {
        setError(errorMessage);
      }
      setIsSuperAdmin(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Devenir Super Admin"
        description="Créez ou vérifiez le statut de superadmin pour un utilisateur"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Super Admin' }]}
      />

      <div className="space-y-8">
        {/* Current User Status */}
        {user && (
          <Section title="Votre Statut Actuel">
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Email:</span>
                  <span className="text-foreground">{user.email}</span>
                </div>
                {isSuperAdmin !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Statut Superadmin:</span>
                    <Badge variant={isSuperAdmin ? 'success' : 'default'}>
                      {isSuperAdmin ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Superadmin
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Non superadmin
                        </>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </Section>
        )}

        {/* Bootstrap Method (First Superadmin) */}
        <Section title="Méthode Bootstrap (Premier Superadmin)">
          <Card>
            <div className="space-y-4">
              <div className="p-4 bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-info-900 dark:text-info-100 mb-1">
                      Créer le premier Superadmin
                    </h4>
                    <p className="text-sm text-info-800 dark:text-info-200">
                      Utilisez cette méthode si aucun superadmin n'existe encore dans le système.
                      Vous devez définir la variable d'environnement{' '}
                      <code className="bg-info-100 dark:bg-info-900/40 px-1 rounded">
                        BOOTSTRAP_SUPERADMIN_KEY
                      </code>{' '}
                      dans votre backend.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email de l'utilisateur
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    Clé Bootstrap
                  </label>
                  <Input
                    type="password"
                    value={bootstrapKey}
                    onChange={(e) => setBootstrapKey(e.target.value)}
                    placeholder="Entrez la clé bootstrap"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cette clé doit correspondre à la variable <code>BOOTSTRAP_SUPERADMIN_KEY</code>{' '}
                    dans votre backend.
                  </p>
                </div>

                <Button
                  onClick={handleBootstrap}
                  disabled={loading || !email || !bootstrapKey}
                  variant="primary"
                  className="w-full"
                >
                  {loading ? 'Création en cours...' : 'Créer Superadmin (Bootstrap)'}
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        {/* Standard Method (Requires Existing Superadmin) */}
        <Section title="Méthode Standard (Nécessite un Superadmin existant)">
          <Card>
            <div className="space-y-4">
              <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-1">
                      Créer un Superadmin
                    </h4>
                    <p className="text-sm text-warning-800 dark:text-warning-200">
                      Cette méthode nécessite que vous soyez déjà connecté en tant que superadmin.
                      Si vous n'êtes pas encore superadmin, utilisez la méthode Bootstrap ci-dessus.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email de l'utilisateur
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                  />
                </div>

                <Button
                  onClick={handleMakeSuperAdmin}
                  disabled={loading || !email}
                  variant="primary"
                  className="w-full"
                >
                  {loading ? 'Création en cours...' : 'Créer Superadmin'}
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        {/* Check Status */}
        <Section title="Vérifier le Statut">
          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email de l'utilisateur à vérifier
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus || !email}
                    variant="outline"
                  >
                    {checkingStatus ? 'Vérification...' : 'Vérifier'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* Messages */}
        {error && (
          <Card className="border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-error-600 dark:text-error-400" />
              <div>
                <h4 className="font-semibold mb-1 text-error-900 dark:text-error-100">Erreur</h4>
                <p className="text-sm text-error-800 dark:text-error-200">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {success && (
          <Card className="border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-success-600 dark:text-success-400" />
              <div>
                <h4 className="font-semibold mb-1 text-success-900 dark:text-success-100">
                  Succès
                </h4>
                <p className="text-sm text-success-800 dark:text-success-200">{success}</p>
              </div>
            </div>
          </Card>
        )}

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
                  <li>
                    La méthode Bootstrap ne fonctionne que s'il n'existe aucun superadmin dans le
                    système
                  </li>
                  <li>
                    Après avoir créé le premier superadmin, vous devez utiliser la méthode standard
                  </li>
                  <li>
                    Assurez-vous que la variable{' '}
                    <code className="bg-muted px-1 rounded">BOOTSTRAP_SUPERADMIN_KEY</code> est
                    définie dans votre backend
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

export default function BecomeSuperAdminPage() {
  return <BecomeSuperAdminContent />;
}
