import Link from 'next/link';
import { clsx } from 'clsx';
interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}
export default function Breadcrumbs({ items, separator, className }: BreadcrumbsProps) {
  const defaultSeparator = (
    <svg
      className="w-4 h-4 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {' '}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />{' '}
    </svg>
  );
  return (
    <nav className={clsx('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      {' '}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center">
            {' '}
            {index > 0 && <span className="mx-2"> {separator || defaultSeparator} </span>}{' '}
            {isLast ? (
              <span className="text-muted-foreground font-medium">{item.label}</span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground dark:hover:text-background transition-colors"
              >
                {' '}
                {item.label}{' '}
              </Link>
            ) : (
              <span className="text-muted-foreground">{item.label}</span>
            )}{' '}
          </div>
        );
      })}{' '}
    </nav>
  );
}
