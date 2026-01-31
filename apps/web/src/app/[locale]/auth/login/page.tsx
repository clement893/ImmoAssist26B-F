'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { transformApiUserToStoreUser } from '@/lib/auth/userTransform';
import { Input, Button, Alert, Card, Container } from '@/components/ui';

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

  // Read error from URL query parameter
  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      // Prevent processing the same error multiple times
      if (errorProcessedRef.current === errorParam) {
        return;
      }

      errorProcessedRef.current = errorParam;

      let errorMessage = decodeURIComponent(errorParam);

      // Translate common error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        unauthorized:
          "Votre session a expiré ou vous n'êtes pas autorisé. Veuillez vous reconnecter.",
        session_expired: 'Votre session a expiré. Veuillez vous reconnecter.',
        unauthorized_superadmin: 'Vous devez être superadmin pour accéder à cette page.',
        forbidden: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
      };

      if (errorMessages[errorParam]) {
        errorMessage = errorMessages[errorParam];
      }

      setLocalError(errorMessage);
      setError(errorMessage);
    } else {
      // Clear error if no error param in URL
      if (errorProcessedRef.current !== null) {
        errorProcessedRef.current = null;
        setLocalError('');
        setError(null);
      }
    }
  }, [searchParams]); // Removed setError from dependencies as it's stable from Zustand

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');

    try {
      const response = await authAPI.login(email, password);
      const { access_token, refresh_token, user } = response.data;

      // Transform user data to store format
      const userForStore = transformApiUserToStoreUser(user);

      // CRITICAL: Wait for token storage to complete before redirecting
      await login(userForStore, access_token, refresh_token);

      // Small delay to ensure token is available in sessionStorage for ProtectedRoute
      await new Promise((resolve) => setTimeout(resolve, 50));

      router.push('/dashboard'); // Will automatically use current locale
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

      // Check for CORS or network errors
      if (!axiosError.response) {
        // Network error or CORS blocked
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

      // Check for 502 Bad Gateway
      if (axiosError.response.status === 502) {
        setLocalError(
          'Le serveur backend est temporairement indisponible. Veuillez réessayer plus tard.'
        );
        setError('Le serveur backend est temporairement indisponible.');
        return;
      }

      // Other API errors
      const message =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        'Échec de la connexion Google. Veuillez réessayer.';
      setLocalError(message);
      setError(message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-muted dark:to-muted">
      <Container className="w-full max-w-md">
        <Card>
          <h1 className="text-3xl font-bold text-center text-foreground mb-8">Login</h1>

          {error && (
            <Alert variant="error" title="Erreur" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              fullWidth
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              maxLength={128}
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              loading={isLoading}
              fullWidth
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              fullWidth
              className="mt-4"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Register
            </Link>
          </p>
        </Card>
      </Container>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-muted dark:to-muted">
          <Container className="w-full max-w-md">
            <Card>
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </Card>
          </Container>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
