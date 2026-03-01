'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { transformApiUserToStoreUser } from '@/lib/auth/userTransform';
import { Input, Button, Alert } from '@/components/ui';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState('');
  const errorProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorProcessedRef.current === errorParam) return;
      errorProcessedRef.current = errorParam;
      let errorMessage = decodeURIComponent(errorParam);
      const errorMessages: Record<string, string> = {
        unauthorized:
          "Votre session a expiré ou vous n'êtes pas autorisé. Veuillez vous reconnecter.",
        session_expired: 'Votre session a expiré. Veuillez vous reconnecter.',
        timeout:
          'La vérification a pris trop de temps. Vérifiez votre connexion et réessayez.',
        unauthorized_superadmin: 'Vous devez être superadmin pour accéder à cette page.',
        forbidden: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
      };
      if (errorMessages[errorParam]) errorMessage = errorMessages[errorParam];
      setLocalError(errorMessage);
      setError(errorMessage);
    } else {
      if (errorProcessedRef.current !== null) {
        errorProcessedRef.current = null;
        setLocalError('');
        setError(null);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    try {
      const response = await authAPI.login(email, password);
      const { access_token, refresh_token, user } = response.data;
      const userForStore = transformApiUserToStoreUser(user);
      await login(userForStore, access_token, refresh_token);
      await new Promise((resolve) => setTimeout(resolve, 50));
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.detail || 'Login failed';
      setLocalError(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const callbackPath = '/auth/callback';
      const response = await authAPI.getGoogleAuthUrl(callbackPath);
      const { auth_url } = response.data;
      window.location.href = auth_url;
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (!axiosError.response) {
        const isCorsError =
          axiosError.message?.includes('CORS') ||
          axiosError.message?.includes('Failed to fetch') ||
          axiosError.code === 'ERR_NETWORK';
        const message = isCorsError
          ? 'Erreur de connexion au serveur. Vérifiez que le backend est accessible et que CORS est configuré correctement.'
          : 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
        setLocalError(message);
        setError(message);
        return;
      }
      if (axiosError.response.status === 502) {
        setLocalError(
          'Le serveur backend est temporairement indisponible. Veuillez réessayer plus tard.'
        );
        setError('Le serveur backend est temporairement indisponible.');
        return;
      }
      const message =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        'Échec de la connexion Google. Veuillez réessayer.';
      setLocalError(message);
      setError(message);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden flex-col justify-between bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white p-12 xl:p-16"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />
        <div className="relative z-10">
          <span className="inline-block text-primary-200 font-semibold tracking-widest uppercase text-sm">
            ImmoAssist
          </span>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
            Gérez vos mandats et transactions en toute sérénité.
          </h2>
          <p className="text-primary-200/90 text-lg leading-relaxed">
            Connexion sécurisée, tableau de bord unifié et outils conformes OACIQ à portée de main.
          </p>
        </div>
        <div className="relative z-10 flex gap-6 text-primary-200/80 text-sm">
          <span>Conformité</span>
          <span>•</span>
          <span>Multi-utilisateurs</span>
          <span>•</span>
          <span>Portail client</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-[400px] animate-fade-in-slide-up">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-primary-600 dark:text-primary-400 font-semibold tracking-widest uppercase text-sm">
              ImmoAssist
            </span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Connexion
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Accédez à votre espace ou connectez-vous avec Google.
              </p>
            </div>

            {error && (
              <Alert
                variant="error"
                title="Erreur"
                className="rounded-xl border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/50"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                label="Adresse courriel"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                fullWidth
                className="rounded-xl border-border/80 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <Input
                type="password"
                label="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                maxLength={128}
                fullWidth
                className="rounded-xl border-border/80 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                loading={isLoading}
                fullWidth
                className="h-11 rounded-xl font-medium text-base shadow-lg shadow-primary-500/25 hover:shadow-primary-500/30 transition-all"
              >
                {isLoading ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-background text-muted-foreground font-medium">
                  ou continuer avec
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              fullWidth
              className="h-11 rounded-xl border-2 border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <p className="text-center text-muted-foreground text-sm">
              Pas encore de compte ?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline underline-offset-2 transition-colors"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"
              aria-hidden
            />
            <p className="text-muted-foreground text-sm">Chargement…</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
