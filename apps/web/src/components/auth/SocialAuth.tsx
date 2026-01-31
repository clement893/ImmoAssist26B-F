/**
 * Social Authentication Component
 * Supports multiple OAuth providers: Google, GitHub, Microsoft
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export type SocialProvider = 'google' | 'github' | 'microsoft';

export interface SocialAuthProps {
  providers?: SocialProvider[];
  onSignIn?: (provider: SocialProvider) => void;
  className?: string;
  fullWidth?: boolean;
}

interface ProviderConfig {
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  hoverBgColor: string;
  textColor: string;
  darkBgColor: string;
  darkHoverBgColor: string;
}

const providerConfigs: Record<SocialProvider, ProviderConfig> = {
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
    bgColor: 'bg-background',
    hoverBgColor: 'hover:bg-muted',
    textColor: 'text-foreground',
    darkBgColor: 'dark:bg-background',
    darkHoverBgColor: 'dark:hover:bg-muted',
  },
  github: {
    name: 'GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgColor: 'bg-background',
    hoverBgColor: 'hover:bg-muted',
    textColor: 'text-background',
    darkBgColor: '',
    darkHoverBgColor: 'dark:hover:bg-muted',
  },
  microsoft: {
    name: 'Microsoft',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
        <path d="M0 0h11.377v11.372H0z" fill="#f25022" />
        <path d="M12.623 0H24v11.372H12.623z" fill="#00a4ef" />
        <path d="M0 11.628h11.377V23H0z" fill="#7fba00" />
        <path d="M12.623 11.628H24V23H12.623z" fill="#ffb900" />
      </svg>
    ),
    bgColor: 'bg-background',
    hoverBgColor: 'hover:bg-muted',
    textColor: 'text-foreground',
    darkBgColor: 'dark:bg-background',
    darkHoverBgColor: 'dark:hover:bg-muted',
  },
};

export default function SocialAuth({
  providers = ['google', 'github', 'microsoft'],
  onSignIn,
  className,
  fullWidth = false,
}: SocialAuthProps) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState('');

  const handleSignIn = async (provider: SocialProvider) => {
    setLoading(provider);
    setError('');

    try {
      // Get the OAuth URL from environment or API
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_DEFAULT_API_URL ||
        'http://localhost:8000';
      const oauthUrl = `${baseUrl}/api/v1/auth/oauth/${provider}`;

      // Store the current URL for redirect after OAuth
      const redirectUrl = window.location.origin + '/auth/callback';
      const fullOAuthUrl = `${oauthUrl}?redirect_url=${encodeURIComponent(redirectUrl)}`;

      // Call the onSignIn callback if provided
      if (onSignIn) {
        onSignIn(provider);
      }

      // Redirect to OAuth provider
      window.location.href = fullOAuthUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to sign in with ${providerConfigs[provider].name}`
      );
      setLoading(null);
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className={clsx('space-y-3', fullWidth && 'w-full')}>
        {providers.map((provider) => {
          const config = providerConfigs[provider];
          const isLoading = loading === provider;

          return (
            <Button
              key={provider}
              variant="outline"
              onClick={() => handleSignIn(provider)}
              disabled={!!loading}
              loading={isLoading}
              fullWidth={fullWidth}
              className={clsx(
                'flex items-center justify-center gap-3',
                'border-2 transition-all',
                config.bgColor,
                config.hoverBgColor,
                config.textColor,
                config.darkBgColor,
                config.darkHoverBgColor,
                'dark:text-foreground',
                provider === 'github' && 'border-border',
                provider !== 'github' && 'border-border'
              )}
            >
              <span className={clsx('flex-shrink-0', isLoading && 'opacity-50')}>
                {config.icon}
              </span>
              <span className="font-medium">Continue with {config.name}</span>
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">Or continue with email</span>
        </div>
      </div>
    </div>
  );
}
