'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';
import { Button, Card, Alert, Badge, Container, Loading } from '@/components/ui';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

interface GoogleAuthStatus {
  configured: boolean;
  client_id?: string;
  redirect_uri?: string;
  auth_url?: string;
}

function GoogleAuthTestContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState<GoogleAuthStatus | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();

    // Check for success/cancel from OAuth callback
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (successParam) {
      setSuccess('Google authentication successful!');
    }
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if Google Auth is configured
      const response = await apiClient.get<{ auth_url?: string }>('/v1/auth/google', {
        params: {
          redirect: window.location.origin + '/auth/google/testing?success=true',
        },
      });

      // Extract auth_url from response (handle both ApiResponse wrapper and direct response)
      const extractAuthUrl = (data: unknown): string | undefined => {
        if (!data || typeof data !== 'object') return undefined;

        // Check if it's ApiResponse wrapper
        if ('data' in data && data.data && typeof data.data === 'object') {
          const innerData = data.data as { auth_url?: string };
          return innerData.auth_url;
        }

        // Check if it's direct response
        if ('auth_url' in data) {
          return (data as { auth_url?: string }).auth_url;
        }

        return undefined;
      };

      // Extract data from API response using utility
      const responseData = extractApiData<{ auth_url?: string }>(response);
      const authUrlValue = extractAuthUrl(responseData) || extractAuthUrl(response);

      if (authUrlValue) {
        setStatus({
          configured: true,
          auth_url: authUrlValue,
        });
        setAuthUrl(authUrlValue);
      } else {
        setStatus({
          configured: false,
        });
        setError('Google OAuth is configured but no authorization URL was returned');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        'Failed to check Google Auth status';

      if (axiosError.response?.status === 503) {
        // Service unavailable means not configured
        setStatus({
          configured: false,
        });
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestAuth = () => {
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      setError('No authorization URL available. Please check configuration.');
    }
  };

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Google Auth Test</h1>
        <p className="text-muted-foreground">Test Google OAuth integration for authentication</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}

      {/* Status Card */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
        {loading ? (
          <div className="py-8 text-center">
            <Loading />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={status?.configured ? 'success' : 'error'}>
                {status?.configured ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>

            {status?.configured && authUrl && (
              <>
                <div className="mt-4">
                  <Button onClick={handleTestAuth} variant="primary" fullWidth size="lg">
                    Test Google Authentication
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-muted rounded">
                  <p className="text-sm text-muted-foreground mb-2">Authorization URL:</p>
                  <code className="text-xs break-all">{authUrl}</code>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">How to Test</h2>
        <div className="space-y-4 text-sm text-foreground">
          <div>
            <h3 className="font-semibold mb-1 text-foreground">1. Check Configuration</h3>
            <p>Verify that Google OAuth is configured in environment variables:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>GOOGLE_CLIENT_ID</li>
              <li>GOOGLE_CLIENT_SECRET</li>
              <li>GOOGLE_REDIRECT_URI (or it will be auto-generated)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">2. Test Authentication</h3>
            <p>
              Click "Test Google Authentication" to initiate the OAuth flow. You will be redirected
              to Google to sign in.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">3. Verify Redirect</h3>
            <p>
              After authentication, you should be redirected back to this page with a success
              message.
            </p>
          </div>
          <Alert variant="info" title="ℹ️ Note" className="mt-4">
            Make sure the redirect URI in Google Cloud Console matches your backend configuration.
            The redirect URI should be:{' '}
            <code className="text-xs">https://your-backend.com/api/v1/auth/google/callback</code>
          </Alert>
        </div>
      </Card>
    </Container>
  );
}

export default function GoogleAuthTestPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <div className="text-center">
            <Loading />
          </div>
        </Container>
      }
    >
      <GoogleAuthTestContent />
    </Suspense>
  );
}
