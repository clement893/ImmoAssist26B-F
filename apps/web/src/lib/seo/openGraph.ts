/**
 * Open Graph Metadata Utilities
 * Generate Open Graph tags for social media sharing
 */

import type { Metadata } from 'next';

export interface OpenGraphData {
  title: string;
  description: string;
  url: string;
  siteName?: string;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  }>;
  locale?: string;
  type?: 'website' | 'article' | 'profile' | 'book' | 'video' | 'music';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

/**
 * Generate Open Graph metadata for Next.js
 */
export function generateOpenGraphMetadata(data: OpenGraphData): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      url: data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`,
      siteName: data.siteName || process.env.NEXT_PUBLIC_APP_NAME || 'App',
      images: data.images || [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
      locale: data.locale || 'en_US',
      type: (data.type === 'video' || data.type === 'music' ? 'website' : data.type) || 'website',
      ...(data.publishedTime && { publishedTime: data.publishedTime }),
      ...(data.modifiedTime && { modifiedTime: data.modifiedTime }),
      ...(data.authors && data.authors.length > 0 && { authors: data.authors }),
      ...(data.section && { section: data.section }),
      ...(data.tags && data.tags.length > 0 && { tags: data.tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: data.images?.map((img) => img.url) || [`${baseUrl}/og-image.png`],
    },
  };
}

/**
 * Generate default Open Graph metadata
 */
export function getDefaultOpenGraphMetadata(): Metadata {
  return generateOpenGraphMetadata({
    title: process.env.NEXT_PUBLIC_APP_NAME || 'MODELE-NEXTJS-FULLSTACK',
    description: 'Full-stack template with Next.js 16 frontend and FastAPI backend',
    url: '/',
    siteName: process.env.NEXT_PUBLIC_APP_NAME || 'App',
  });
}
