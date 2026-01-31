import { Metadata } from 'next';

/**
 * Metadata for Documentation Page
 *
 * SEO metadata is exported from layout.tsx since metadata can only be
 * exported from Server Components, and the page.tsx is a Client Component.
 */
export const metadata: Metadata = {
  title: 'Documentation Technique - Template Full-Stack',
  description:
    "Vue d'ensemble complète de tous les éléments inclus dans ce template full-stack avec Next.js 16 et FastAPI",
  keywords: [
    'Next.js',
    'React',
    'FastAPI',
    'TypeScript',
    'Full-stack',
    'Documentation',
    'Template',
    'ERP',
    'Components',
    'Hooks',
  ],
  openGraph: {
    title: 'Documentation Technique - Template Full-Stack',
    description: "Vue d'ensemble complète de tous les éléments inclus dans ce template full-stack",
    type: 'website',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
