/** * Section Templates Component * * Library of pre-built section templates for page builder. * * @component */ 'use client';
import { Card, Button } from '@/components/ui';
import { Plus, Sparkles } from 'lucide-react';
import type { PageSection } from './PageEditor';
export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  type: PageSection['type'];
  preview?: string;
  template: Omit<PageSection, 'id'>;
}
export interface SectionTemplatesProps {
  onSelectTemplate?: (template: SectionTemplate) => void;
  className?: string;
}
const defaultTemplates: SectionTemplate[] = [
  {
    id: 'hero-1',
    name: 'Hero Section',
    description: 'Large hero section with title and subtitle',
    type: 'hero',
    template: {
      type: 'hero',
      title: 'Welcome to Our Platform',
      content: 'Build amazing things with our powerful tools',
    },
  },
  {
    id: 'content-1',
    name: 'Content Section',
    description: 'Simple content section with title and text',
    type: 'content',
    template: { type: 'content', title: 'About Us', content: 'Add your content here...' },
  },
  {
    id: 'features-1',
    name: 'Features Grid',
    description: 'Showcase your features in a grid layout',
    type: 'features',
    template: {
      type: 'features',
      title: 'Our Features',
      content: 'Discover what makes us different',
    },
  },
  {
    id: 'testimonials-1',
    name: 'Testimonials',
    description: 'Display customer testimonials',
    type: 'testimonials',
    template: {
      type: 'testimonials',
      title: 'What Our Customers Say',
      content: 'Read testimonials from satisfied customers',
    },
  },
  {
    id: 'cta-1',
    name: 'Call to Action',
    description: 'Encourage action with a CTA section',
    type: 'cta',
    template: {
      type: 'cta',
      title: 'Get Started Today',
      content: 'Join thousands of satisfied customers',
    },
  },
];
/** * Section Templates Component * * Displays a library of section templates. */ export default function SectionTemplates({
  onSelectTemplate,
  className,
}: SectionTemplatesProps) {
  const handleSelect = (template: SectionTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };
  return (
    <div className={className}>
      {' '}
      <Card title="Section Templates">
        {' '}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {' '}
          {defaultTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-border rounded-lg p-4 hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => handleSelect(template)}
            >
              {' '}
              <div className="flex items-start gap-3 mb-2">
                {' '}
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                  {' '}
                  <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />{' '}
                </div>{' '}
                <div className="flex-1 min-w-0">
                  {' '}
                  <h3 className="font-medium text-foreground mb-1"> {template.name} </h3>{' '}
                  <p className="text-sm text-muted-foreground"> {template.description} </p>{' '}
                </div>{' '}
              </div>{' '}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(template);
                }}
              >
                {' '}
                <Plus className="w-4 h-4 mr-2" /> Use Template{' '}
              </Button>{' '}
            </div>
          ))}{' '}
        </div>{' '}
      </Card>{' '}
    </div>
  );
}
