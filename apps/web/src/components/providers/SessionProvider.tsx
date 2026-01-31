/** * Session Provider Component * Wraps the application with NextAuth SessionProvider */ 'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
interface SessionProviderProps {
  children: ReactNode;
}
export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
export default SessionProvider;
