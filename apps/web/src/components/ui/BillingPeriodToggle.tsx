'use client';
import { Button, Badge } from '@/components/ui';
interface BillingPeriodToggleProps {
  value: 'month' | 'year';
  onChange: (value: 'month' | 'year') => void;
}
export default function BillingPeriodToggle({ value, onChange }: BillingPeriodToggleProps) {
  return (
    <div className="inline-flex items-center bg-background rounded-lg p-1 shadow-md">
      {' '}
      <Button
        onClick={() => onChange('month')}
        variant={value === 'month' ? 'primary' : 'ghost'}
        size="md"
        className="px-6"
      >
        {' '}
        Mensuel{' '}
      </Button>{' '}
      <Button
        onClick={() => onChange('year')}
        variant={value === 'year' ? 'primary' : 'ghost'}
        size="md"
        className="px-6"
      >
        {' '}
        Annuel{' '}
        <Badge variant="success" className="ml-2">
          {' '}
          -20%{' '}
        </Badge>{' '}
      </Button>{' '}
    </div>
  );
}
