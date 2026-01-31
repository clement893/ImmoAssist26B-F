/** * User Guides Component * * Displays list of user guides and documentation. * * @component */ 'use client';
import { Card } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { ExternalLink, FileText } from 'lucide-react';
export interface UserGuide {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  external?: boolean;
}
export interface UserGuidesProps {
  guides?: UserGuide[];
  className?: string;
}
const defaultGuides: UserGuide[] = [
  {
    id: '1',
    title: 'Getting Started Guide',
    description: 'Learn how to set up your account and get started',
    category: 'Getting Started',
    url: '/docs/getting-started',
  },
  {
    id: '2',
    title: 'User Manual',
    description: 'Complete guide to all features and functionality',
    category: 'Documentation',
    url: '/docs/manual',
  },
  {
    id: '3',
    title: 'API Documentation',
    description: 'Complete API reference and examples',
    category: 'API',
    url: '/docs/api',
  },
  {
    id: '4',
    title: 'Best Practices',
    description: 'Tips and best practices for using the platform',
    category: 'Tips',
    url: '/docs/best-practices',
  },
];
/** * User Guides Component * * Displays user guides in a grid layout. */ export default function UserGuides({
  guides = defaultGuides,
  className,
}: UserGuidesProps) {
  const categories = Array.from(new Set(guides.map((guide) => guide.category)));
  return (
    <div className={className}>
      {' '}
      {categories.map((category) => {
        const categoryGuides = guides.filter((guide) => guide.category === category);
        return (
          <Card key={category} title={category} className="mb-6">
            {' '}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {' '}
              {categoryGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={guide.url}
                  target={guide.external ? '_blank' : undefined}
                  rel={guide.external ? 'noopener noreferrer' : undefined}
                >
                  {' '}
                  <div className="p-4 border border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors h-full">
                    {' '}
                    <div className="flex items-start gap-3">
                      {' '}
                      <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />{' '}
                      <div className="flex-1 min-w-0">
                        {' '}
                        <h3 className="font-medium text-foreground mb-1"> {guide.title} </h3>{' '}
                        <p className="text-sm text-muted-foreground"> {guide.description} </p>{' '}
                        {guide.external && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                            {' '}
                            <ExternalLink className="w-3 h-3" /> <span>External Link</span>{' '}
                          </div>
                        )}{' '}
                      </div>{' '}
                    </div>{' '}
                  </div>{' '}
                </Link>
              ))}{' '}
            </div>{' '}
          </Card>
        );
      })}{' '}
    </div>
  );
}
