'use client';

import { useEffect } from 'react';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo/schemaMarkup';

interface SchemaMarkupProps {
  type: 'organization' | 'website';
  data: Record<string, unknown>;
}

export function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  useEffect(() => {
    let schema: object;
    if (type === 'organization') {
      schema = generateOrganizationSchema(data as unknown as Parameters<typeof generateOrganizationSchema>[0]);
    } else {
      schema = generateWebSiteSchema(data as unknown as Parameters<typeof generateWebSiteSchema>[0]);
    }

    // Create script tag
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = `schema-${type}`;

    // Remove existing script if present
    const existing = document.getElementById(`schema-${type}`);
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(`schema-${type}`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}
