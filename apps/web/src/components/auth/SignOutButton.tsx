/** * Sign Out Button Component * Button to sign out the current user */ 'use client';
import { signOut } from 'next-auth/react';
import Button from '@/components/ui/Button';
interface SignOutButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}
export default function SignOutButton({ className, variant = 'secondary' }: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };
  return (
    <Button onClick={handleSignOut} variant={variant} className={className}>
      {' '}
      Sign Out{' '}
    </Button>
  );
}
