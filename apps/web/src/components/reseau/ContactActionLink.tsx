'use client';
import { type Contact } from '@/lib/api/reseau-contacts';
import { Mail, Phone, Linkedin } from 'lucide-react';
interface ContactActionLinkProps {
  type: 'email' | 'phone' | 'linkedin';
  value: string;
  contact?: Contact;
}
export default function ContactActionLink({ type, value }: ContactActionLinkProps) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  switch (type) {
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
    case 'linkedin':
      return (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {' '}
          <Linkedin className="w-3 h-3" /> LinkedIn{' '}
        </a>
      );
    default:
      return <span className="text-muted-foreground">-</span>;
  }
}
