'use client';
import { type Contact } from '@/lib/api/reseau-contacts';
import { Card, Button } from '@/components/ui';
import ContactAvatar from './ContactAvatar';
import {
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Globe,
  Linkedin,
} from 'lucide-react';
interface ContactDetailProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
}
export default function ContactDetail({ contact, onEdit, onDelete }: ContactDetailProps) {
  const fullName = `${contact.first_name} ${contact.last_name}`;
  return (
    <Card className="p-6">
      {' '}
      <div className="flex items-start gap-4">
        {' '}
        <ContactAvatar contact={contact} size="lg" />{' '}
        <div className="flex-1">
          {' '}
          <h3 className="text-xl font-semibold mb-2">{fullName}</h3>{' '}
          {contact.position && <p className="text-muted-foreground mb-4">{contact.position}</p>}{' '}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {' '}
            {contact.email && (
              <div className="flex items-center gap-2">
                {' '}
                <Mail className="w-4 h-4 text-muted-foreground" />{' '}
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                  {' '}
                  {contact.email}{' '}
                </a>{' '}
              </div>
            )}{' '}
            {contact.phone && (
              <div className="flex items-center gap-2">
                {' '}
                <Phone className="w-4 h-4 text-muted-foreground" />{' '}
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                  {' '}
                  {contact.phone}{' '}
                </a>{' '}
              </div>
            )}{' '}
            {contact.company_name && (
              <div className="flex items-center gap-2">
                {' '}
                <Building2 className="w-4 h-4 text-muted-foreground" />{' '}
                <span>{contact.company_name}</span>{' '}
              </div>
            )}{' '}
            {contact.position && (
              <div className="flex items-center gap-2">
                {' '}
                <Briefcase className="w-4 h-4 text-muted-foreground" />{' '}
                <span>{contact.position}</span>{' '}
              </div>
            )}{' '}
            {contact.circle && (
              <div className="flex items-center gap-2">
                {' '}
                <span className="font-medium">Cercle:</span> <span>{contact.circle}</span>{' '}
              </div>
            )}{' '}
            {(contact.city || contact.country) && (
              <div className="flex items-center gap-2">
                {' '}
                <MapPin className="w-4 h-4 text-muted-foreground" />{' '}
                <span>
                  {' '}
                  {[contact.city, contact.country].filter(Boolean).join(',') || '-'}{' '}
                </span>{' '}
              </div>
            )}{' '}
            {contact.birthday && (
              <div className="flex items-center gap-2">
                {' '}
                <Calendar className="w-4 h-4 text-muted-foreground" />{' '}
                <span>{new Date(contact.birthday).toLocaleDateString('fr-FR')}</span>{' '}
              </div>
            )}{' '}
            {contact.language && (
              <div className="flex items-center gap-2">
                {' '}
                <Globe className="w-4 h-4 text-muted-foreground" />{' '}
                <span>{contact.language}</span>{' '}
              </div>
            )}{' '}
            {contact.linkedin && (
              <div className="flex items-center gap-2">
                {' '}
                <Linkedin className="w-4 h-4 text-muted-foreground" />{' '}
                <a
                  href={
                    contact.linkedin.startsWith('http')
                      ? contact.linkedin
                      : `https://${contact.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {' '}
                  LinkedIn{' '}
                </a>{' '}
              </div>
            )}{' '}
            {contact.employee_name && (
              <div className="flex items-center gap-2">
                {' '}
                <span className="font-medium">Assigné à:</span>{' '}
                <span>{contact.employee_name}</span>{' '}
              </div>
            )}{' '}
          </div>{' '}
          {(onEdit || onDelete) && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              {' '}
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  {' '}
                  <Edit className="w-4 h-4 mr-2" /> Modifier{' '}
                </Button>
              )}{' '}
              {onDelete && (
                <Button variant="danger" onClick={onDelete}>
                  {' '}
                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer{' '}
                </Button>
              )}{' '}
            </div>
          )}{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
