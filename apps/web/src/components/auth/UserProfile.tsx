/** * User Profile Component * Displays current user information */ 'use client';
import { useSession } from 'next-auth/react';
import SignOutButton from './SignOutButton';
export default function UserProfile() {
  const { data: session, status } = useSession();
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        {' '}
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-muted-foreground"></div>{' '}
        <span>Loading...</span>{' '}
      </div>
    );
  }
  if (!session) {
    return null;
  }
  return (
    <div className="flex items-center gap-4">
      {' '}
      {session.user?.image && (
        <img
          src={session.user.image}
          alt={session.user.name ?? 'User'}
          className="w-10 h-10 rounded-full"
        />
      )}{' '}
      <div className="flex flex-col">
        {' '}
        <span className="text-sm font-medium text-foreground">
          {' '}
          {session.user?.name ?? session.user?.email}{' '}
        </span>{' '}
        {session.user?.email && session.user?.name && (
          <span className="text-xs text-muted-foreground">{session.user.email}</span>
        )}{' '}
      </div>{' '}
      <SignOutButton variant="secondary" />{' '}
    </div>
  );
}
