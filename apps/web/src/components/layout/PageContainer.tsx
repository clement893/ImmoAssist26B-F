import { ReactNode } from 'react';
import { Container } from '@/components/ui';
import { clsx } from 'clsx';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className }: PageContainerProps) {
  return <Container className={clsx('py-8', className)}>{children}</Container>;
}
