import Link from 'next/link';
import { Button } from '@/components/ui';
interface PageNavigationProps {
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
  home?: { label: string; href: string };
}
export default function PageNavigation({ prev, next, home }: PageNavigationProps) {
  return (
    <div className="mt-8 flex justify-between">
      {' '}
      {prev ? (
        <Link href={prev.href}>
          {' '}
          <Button variant="outline">← {prev.label}</Button>{' '}
        </Link>
      ) : (
        <div />
      )}{' '}
      {home && (
        <Link href={home.href}>
          {' '}
          <Button variant="ghost">{home.label}</Button>{' '}
        </Link>
      )}{' '}
      {next ? (
        <Link href={next.href}>
          {' '}
          <Button variant="primary">{next.label} →</Button>{' '}
        </Link>
      ) : (
        <div />
      )}{' '}
    </div>
  );
}
