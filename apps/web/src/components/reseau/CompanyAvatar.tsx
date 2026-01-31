'use client';
import { type Company } from '@/lib/api/companies';
import { Building2 } from 'lucide-react';
import Image from 'next/image';
interface CompanyAvatarProps {
  company: Company;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
export default function CompanyAvatar({
  company,
  size = 'md',
  className = '',
}: CompanyAvatarProps) {
  if (company.logo_url) {
    return (
      <div className={`${sizeClasses[size]} rounded overflow-hidden flex-shrink-0 ${className}`}>
        {' '}
        <Image
          src={company.logo_url}
          alt={company.name}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className="w-full h-full object-cover"
        />{' '}
      </div>
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded bg-muted flex items-center justify-center ${className}`}
    >
      {' '}
      <Building2
        className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} text-muted-foreground`}
      />{' '}
    </div>
  );
}
