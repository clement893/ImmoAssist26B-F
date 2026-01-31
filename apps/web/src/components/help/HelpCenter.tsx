/** * Help Center Component * * Main hub for help and support resources. * * @component */ 'use client';
import { Card, Button } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { HelpCircle, MessageSquare, BookOpen, Video, FileText, Search } from 'lucide-react';
export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}
export interface HelpCenterProps {
  categories?: HelpCategory[];
  className?: string;
}
const defaultCategories: HelpCategory[] = [
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Frequently asked questions and answers',
    icon: <HelpCircle className="w-6 h-6" />,
    link: '/help/faq',
    color:
      'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] border-[var(--color-primary-200)] dark:border-[var(--color-primary-800)]',
  },
  {
    id: 'guides',
    title: 'User Guides',
    description: 'Step-by-step guides and tutorials',
    icon: <BookOpen className="w-6 h-6" />,
    link: '/help/guides',
    color:
      'bg-[var(--color-secondary-50)] dark:bg-[var(--color-secondary-950)] border-[var(--color-secondary-200)] dark:border-[var(--color-secondary-800)]',
  },
  {
    id: 'videos',
    title: 'Video Tutorials',
    description: 'Watch video tutorials and demos',
    icon: <Video className="w-6 h-6" />,
    link: '/help/videos',
    color:
      'bg-[var(--color-info-50)] dark:bg-[var(--color-info-950)] border-[var(--color-info-200)] dark:border-[var(--color-info-800)]',
  },
  {
    id: 'contact',
    title: 'Contact Support',
    description: 'Get in touch with our support team',
    icon: <MessageSquare className="w-6 h-6" />,
    link: '/help/contact',
    color:
      'bg-[var(--color-success-50)] dark:bg-[var(--color-success-950)] border-[var(--color-success-200)] dark:border-[var(--color-success-800)]',
  },
  {
    id: 'tickets',
    title: 'Support Tickets',
    description: 'View and manage your support tickets',
    icon: <FileText className="w-6 h-6" />,
    link: '/help/tickets',
    color:
      'bg-[var(--color-warning-50)] dark:bg-[var(--color-warning-950)] border-[var(--color-warning-200)] dark:border-[var(--color-warning-800)]',
  },
];
/** * Help Center Component * * Displays help categories and quick links. */ export default function HelpCenter({
  categories = defaultCategories,
  className,
}: HelpCenterProps) {
  return (
    <div className={className}>
      {' '}
      {/* Search Bar */}{' '}
      <Card className="mb-8">
        {' '}
        <div className="flex items-center gap-4">
          {' '}
          <Search className="w-5 h-5 text-[var(--color-muted-foreground)]" />{' '}
          <input
            type="text"
            placeholder="Search for help..."
            className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />{' '}
          <Button variant="primary">Search</Button>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Help Categories */}{' '}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {' '}
        {categories.map((category) => (
          <Link key={category.id} href={category.link}>
            {' '}
            <Card hover className={`h-full ${category.color} border-2 transition-all`}>
              {' '}
              <div className="flex flex-col items-center text-center p-6">
                {' '}
                <div className="mb-4 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">
                  {' '}
                  {category.icon}{' '}
                </div>{' '}
                <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                  {' '}
                  {category.title}{' '}
                </h3>{' '}
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {' '}
                  {category.description}{' '}
                </p>{' '}
              </div>{' '}
            </Card>{' '}
          </Link>
        ))}{' '}
      </div>{' '}
      {/* Quick Links */}{' '}
      <Card title="Quick Links" className="mt-8">
        {' '}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {' '}
          <Link href="/help/faq">
            {' '}
            <div className="p-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors">
              {' '}
              <h4 className="font-medium text-[var(--color-foreground)]">Common Questions</h4>{' '}
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Find answers to common questions
              </p>{' '}
            </div>{' '}
          </Link>{' '}
          <Link href="/help/contact">
            {' '}
            <div className="p-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors">
              {' '}
              <h4 className="font-medium text-[var(--color-foreground)]">Need More Help?</h4>{' '}
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Contact our support team
              </p>{' '}
            </div>{' '}
          </Link>{' '}
        </div>{' '}
      </Card>{' '}
    </div>
  );
}
