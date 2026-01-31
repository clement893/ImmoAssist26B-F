'use client';
import { type Company } from '@/lib/api/companies';
import { ExternalLink, Mail, Phone } from 'lucide-react';
interface CompanyActionLinkProps {
  type: 'website' | 'email' | 'phone';
  value: string;
  company?: Company;
}
export default function CompanyActionLink({ type, value }: CompanyActionLinkProps) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  switch (type) {
    case 'website':
      return (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {' '}
          {value} <ExternalLink className="w-3 h-3" />{' '}
        </a>
      );
    case 'email':
      return (
        <a
          href={`mailto:${value}`}
          className="text-primary hover:underline flex items-center gap-1"
        >
          {' '}
          <Mail className="w-3 h-3" /> {value}{' '}
        </a>
      );
    case 'phone':
      return (
        <a href={`tel:${value}`} className="text-primary hover:underline flex items-center gap-1">
          {' '}
          <Phone className="w-3 h-3" /> {value}{' '}
        </a>
      );
    default:
      return <span className="text-muted-foreground">-</span>;
  }
}
