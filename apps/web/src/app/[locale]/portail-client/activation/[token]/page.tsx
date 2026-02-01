'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { KeyRound, Mail, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiClient, getApiUrl } from '@/lib/api';
import { Button, Input, Card, Container } from '@/components/ui';

interface InvitationInfo {
  email: string;
  prenom: string;
  nom: string;
  statut: string;
}

export default function PortailClientActivationPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Lien d'invitation invalide.");
      setLoading(false);
      return;
    }
    const baseUrl = getApiUrl().replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/client-invitations/by-token/${encodeURIComponent(token)}`;
    fetch(url, { method: 'GET', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail || "Lien d'invitation invalide ou déjà utilisé.");
        }
        return res.json();
      })
      .then((data: InvitationInfo) => {
        setInvitation(data);
        setLoadError(null);
      })
      .catch((err: Error) => {
        setLoadError(err.message || "Lien d'invitation invalide ou expiré.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (password.length < 8) {
      setSubmitError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`v1/client-invitations/activate/${encodeURIComponent(token)}`, {
        password,
        first_name: invitation?.prenom,
        last_name: invitation?.nom,
      });
      setSuccess(true);
      setTimeout(() => {
        const locale = params?.locale ?? 'fr';
        router.push(`/${locale}/auth/login?message=activated`);
      }, 2500);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err instanceof Error
            ? err.message
            : "Erreur lors de l'activation du compte.";
      setSubmitError(typeof message === 'string' ? message : "Erreur lors de l'activation.");
    } finally {
      setSubmitting(false);
    }
  };

  const locale = (params?.locale as string) ?? 'fr';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Vérification du lien d&apos;invitation...</p>
        </div>
      </div>
    );
  }

  if (loadError || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h1>
            <p className="text-gray-600 mb-6">{loadError}</p>
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Retour à la connexion
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Compte activé</h1>
            <p className="text-gray-600 mb-6">
              Votre compte a été créé. Vous allez être redirigé vers la page de connexion.
            </p>
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Se connecter maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Container className="max-w-md w-full">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Activer votre accès</h1>
              <p className="text-sm text-gray-500">Portail client ImmoAssist</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Invitation pour :</p>
            <div className="flex items-center gap-2 text-gray-900 font-medium">
              <User className="w-4 h-4 text-gray-500" />
              {invitation.prenom} {invitation.nom}
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
              <Mail className="w-4 h-4 text-gray-400" />
              {invitation.email}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe (min. 8 caractères)
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full"
              />
            </div>
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{submitError}</p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Activation en cours...' : 'Activer mon compte'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}
