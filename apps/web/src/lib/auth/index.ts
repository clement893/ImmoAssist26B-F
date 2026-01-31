/**
 * Authentication Module
 * Main export for authentication functionality
 */

import NextAuth from 'next-auth';
import { authConfig } from './config';

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Re-export types
export type { Session, User } from 'next-auth';
export type { JWT } from 'next-auth/jwt';

// Re-export JWT utilities
export * from './jwt';
