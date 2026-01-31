'use client';
import { type Contact } from '@/lib/api/reseau-contacts';
import { User } from 'lucide-react';
import Image from 'next/image';
interface ContactAvatarProps {
  contact: Contact;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
export default function ContactAvatar({
  contact,
  size = 'md',
  className = '',
}: ContactAvatarProps) {
  if (contact.photo_url) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
      >
        {' '}
        <Image
          src={contact.photo_url}
          alt={`${contact.first_name} ${contact.last_name}`}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
          className="w-full h-full object-cover"
        />{' '}
      </div>
    );
  }
  const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase();
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center ${className}`}
    >
      {' '}
      {initials ? (
        <span
          className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg'} font-medium text-muted-foreground`}
        >
          {' '}
          {initials}{' '}
        </span>
      ) : (
        <User
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground`}
        />
      )}{' '}
    </div>
  );
}
