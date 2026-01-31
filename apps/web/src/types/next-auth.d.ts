/**
 * NextAuth Type Extensions
 * Extends NextAuth types to include custom session properties
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
    };
    accessToken?: string;
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    user?: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
    error?: string;
  }
}
