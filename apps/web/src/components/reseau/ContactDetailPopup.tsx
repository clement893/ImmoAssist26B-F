'use client';

import { type Contact } from '@/lib/api/reseau-contacts';
import ContactAvatar from './ContactAvatar';
import { Badge } from '@/components/ui';
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Globe,
  MoreVertical,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ContactDetailPopupProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  position?: { x: number; y: number };
}

export default function ContactDetailPopup({
  contact,
  onClose,
  position,
}: ContactDetailPopupProps) {
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position || { x: 0, y: 0 });

  // Adjust position to keep popup within viewport
  useEffect(() => {
    if (!popupRef.current || !position) {
      if (position) {
        setAdjustedPosition(position);
      }
      return;
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (!popupRef.current) return;

      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 20;
      }
      if (x < 20) {
        x = 20;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 20;
      }
      if (y < 20) {
        y = 20;
      }

      setAdjustedPosition({ x, y });
    });
  }, [position]);

  const circleColors: Record<string, string> = {
    client: 'bg-green-500 text-white',
    prospect: 'bg-orange-500 text-white',
    partenaire: 'bg-green-600 text-white',
    fournisseur: 'bg-blue-500 text-white',
    autre: 'bg-gray-500 text-white',
  };

  const circleLabel: Record<string, string> = {
    client: 'Customer',
    prospect: 'Prospect',
    partenaire: 'Partner',
    fournisseur: 'Supplier',
    autre: 'Other',
  };

  if (!position) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-96 bg-background rounded-xl shadow-standard-xl border border-border overflow-hidden animate-scale-in" // UI Revamp - shadow-standard-xl
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => {
        // Keep popup open when hovering over it
      }}
      onMouseLeave={() => {
        if (onClose) onClose();
      }}
    >
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-br from-green-500 via-blue-500 to-green-400 p-6 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <ContactAvatar contact={contact} size="xl" className="ring-4 ring-white/20" />
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-1">{fullName}</h3>
              {contact.position && contact.company_name && (
                <p className="text-sm text-white/90">
                  {contact.position} at {contact.company_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-modern" // UI Revamp - Transition moderne
                aria-label="Call"
              >
                <Phone className="w-4 h-4 text-white" />
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-modern" // UI Revamp - Transition moderne
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>
            )}
            <button
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-modern" // UI Revamp - Transition moderne
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="p-6 space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Details
        </h4>

        <div className="space-y-3">
          {contact.company_name && (
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Company</div>
                <div className="text-sm font-medium">{contact.company_name}</div>
              </div>
            </div>
          )}

          {contact.position && (
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="text-sm font-medium">{contact.position}</div>
              </div>
            </div>
          )}

          {contact.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <a href={`tel:${contact.phone}`} className="text-sm font-medium text-primary hover:underline">
                  {contact.phone}
                </a>
              </div>
            </div>
          )}

          {contact.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <a href={`mailto:${contact.email}`} className="text-sm font-medium text-primary hover:underline">
                  {contact.email}
                </a>
              </div>
            </div>
          )}

          {(contact.linkedin || contact.email) && (
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Website</div>
                {contact.linkedin ? (
                  <a
                    href={
                      contact.linkedin.startsWith('http')
                        ? contact.linkedin
                        : `https://${contact.linkedin}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {contact.linkedin.replace(/^https?:\/\//, '')}
                  </a>
                ) : contact.email ? (
                  <span className="text-sm font-medium">
                    {contact.email.split('@')[1] || contact.email}
                  </span>
                ) : (
                  <span className="text-sm font-medium">-</span>
                )}
              </div>
            </div>
          )}

          {contact.circle && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <Badge
                  className={`capitalize ${circleColors[contact.circle] || 'bg-gray-500 text-white'}`}
                >
                  {circleLabel[contact.circle] || contact.circle}
                </Badge>
              </div>
            </div>
          )}

          {(contact.city || contact.country) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="text-sm font-medium">
                  {[contact.city, contact.country].filter(Boolean).join(', ') || '-'}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Access</div>
              <div className="text-sm font-medium">Everyone</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
