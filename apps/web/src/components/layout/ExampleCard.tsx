import { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { clsx } from 'clsx';

interface ExampleCardProps {
  title: string;
  children: ReactNode;
  description?: string;
  className?: string;
}

export default function ExampleCard({ title, children, description, className }: ExampleCardProps) {
  return (
    <Card className={clsx(className)}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {children}
    </Card>
  );
}
