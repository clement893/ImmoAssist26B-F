/**
 * NextAuth Configuration
 * Configure OAuth providers and authentication settings
 */

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { logger } from '@/lib/logger';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }) as never,
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token as string | undefined,
          refreshToken: account.refresh_token as string | undefined,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          user: {
            id: user.id ?? '',
            email: user.email ?? '',
            name: user.name ?? '',
            image: user.image ?? null,
          },
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user && token.user) {
        session.user.id = token.user.id;
        session.accessToken = token.accessToken as string | undefined;
        session.error = token.error as string | undefined;
      }

      return session;
    },
    async signIn({ user, account }) {
      // Allow sign in
      if (account?.provider === 'google') {
        // You can add additional checks here
        // For example, restrict to specific email domains
        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') ?? [];
        if (allowedDomains.length > 0 && user.email) {
          const domain = user.email.split('@')[1];
          if (domain && !allowedDomains.includes(domain)) {
            return false;
          }
        }
      }
      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(token: {
  refreshToken?: string;
  accessToken?: string;
  accessTokenExpires?: number;
  user?: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  error?: string;
}) {
  try {
    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + refreshedTokens.expiresIn * 1000,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
    };
  } catch (error) {
    logger.error(
      'Error refreshing access token',
      error instanceof Error ? error : new Error(String(error)),
      {
        hasRefreshToken: !!token.refreshToken,
        type: 'auth',
      }
    );

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
