'use client';
import { type Contact } from '@/lib/api/reseau-contacts';
import { User } from 'lucide-react';
import Image from 'next/image';
interface ContactAvatarProps {
  contact: Contact;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
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
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
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
          className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} font-medium text-muted-foreground`}
        >
          {' '}
          {initials}{' '}
        </span>
      ) : (
        <User
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} text-muted-foreground`}
        />
      )}{' '}
    </div>
  );
}
