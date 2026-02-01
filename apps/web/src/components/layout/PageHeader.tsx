import { ReactNode } from 'react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Container } from '@/components/ui';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import { clsx } from 'clsx';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <Container className={clsx('py-8 sm:py-10', className)}> {/* Revamp UI - Padding vertical augmenté */}
      {breadcrumbs && (
        <div className="mb-6"> {/* Revamp UI - Margin augmentée */}
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            {/* Dashboard V2 Style - Typographie adaptée */}
            <Heading level={1} className="text-3xl font-light text-gray-900 dark:text-neutral-100">
              {title}
            </Heading>
            {badge && <div className="flex-shrink-0">{badge}</div>}
          </div>
          {description && (
            <Text variant="body" className="text-xl font-light text-gray-400 dark:text-gray-400"> {/* Dashboard V2 Style - text-xl font-light */}
              {description}
            </Text>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-4 items-start sm:items-center flex-shrink-0"> {/* Revamp UI - Gap augmenté */}
            {actions}
          </div>
        )}
      </div>
    </Container>
  );
}
