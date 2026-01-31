/** * ProfileCard Component * * Displays user profile information with avatar, name, email, and basic stats. * Fully theme-aware and accessible. * * @example * ```tsx * <ProfileCard user={user} onEdit={() => router.push('/profile')} /> * ``` */ 'use client';
import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Mail, Calendar, Shield, Edit } from 'lucide-react';
export interface ProfileCardProps {
  /** User data */ user: {
    id: string | number;
    email: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    is_active?: boolean;
    is_admin?: boolean;
    is_verified?: boolean;
    created_at?: string;
  };
  /** Edit button click handler */ onEdit?: () => void;
  /** Show edit button */ showEditButton?: boolean;
  /** Additional actions */ actions?: ReactNode;
  /** Additional CSS classes */ className?: string;
}
/** * ProfileCard - Display user profile information */ export function ProfileCard({
  user,
  onEdit,
  showEditButton = true,
  actions,
  className,
}: ProfileCardProps) {
  const displayName =
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join('') ||
    user.email.split('@')[0];
  const initials = (displayName || '')
    .split('')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };
  return (
    <Card className={clsx('p-6', className)}>
      {' '}
      <div className="flex flex-col sm:flex-row gap-6">
        {' '}
        {/* Avatar Section */}{' '}
        <div className="flex-shrink-0">
          {' '}
          <div className="relative">
            {' '}
            <Avatar
              src={user.avatar}
              alt={displayName}
              name={displayName}
              fallback={initials}
              size="xl"
              className="border-4 border-primary-200 dark:border-primary-800"
            />{' '}
          </div>{' '}
        </div>{' '}
        {/* Profile Info Section */}{' '}
        <div className="flex-1 space-y-4">
          {' '}
          <div>
            {' '}
            <div className="flex items-center gap-3 mb-2">
              {' '}
              <h2 className="text-2xl font-bold text-foreground"> {displayName} </h2>{' '}
              {user.is_admin && (
                <Badge
                  variant="default"
                  className="flex items-center gap-1 bg-primary-500 text-background"
                >
                  {' '}
                  <Shield className="w-3 h-3" /> Admin{' '}
                </Badge>
              )}{' '}
              {user.is_active === false && <Badge variant="error">Inactive</Badge>}{' '}
            </div>{' '}
            <div className="space-y-2 text-sm text-muted-foreground">
              {' '}
              <div className="flex items-center gap-2">
                {' '}
                <Mail className="w-4 h-4" /> <span>{user.email}</span>{' '}
                {user.is_verified && (
                  <Badge variant="success" className="text-xs">
                    {' '}
                    Verified{' '}
                  </Badge>
                )}{' '}
              </div>{' '}
              {user.created_at && (
                <div className="flex items-center gap-2">
                  {' '}
                  <Calendar className="w-4 h-4" />{' '}
                  <span>Member since {formatDate(user.created_at)}</span>{' '}
                </div>
              )}{' '}
            </div>{' '}
          </div>{' '}
          {/* Actions */}{' '}
          <div className="flex flex-wrap gap-2">
            {' '}
            {showEditButton && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                {' '}
                <Edit className="w-4 h-4" /> Edit Profile{' '}
              </Button>
            )}{' '}
            {actions}{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
