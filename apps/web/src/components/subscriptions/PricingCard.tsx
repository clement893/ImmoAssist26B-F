'use client';
import { Button, Card, Badge } from '@/components/ui';
import { Check } from 'lucide-react';
import clsx from 'clsx';
export interface Plan {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: 'MONTH' | 'YEAR' | 'WEEK' | 'DAY';
  interval_count: number;
  is_popular?: boolean;
  features?: string | null;
}
interface PricingCardProps {
  plan: Plan;
  onSelect: (planId: number) => void;
  isLoading?: boolean;
  currentPlanId?: number;
}
export function PricingCard({ plan, onSelect, isLoading, currentPlanId }: PricingCardProps) {
  const isCurrentPlan = currentPlanId === plan.id;
  const features = plan.features ? JSON.parse(plan.features) : {};
  const featureList = Object.entries(features).filter(
    ([_, value]) => typeof value !== 'boolean' || value === true
  );
  const formatPrice = () => {
    if (plan.amount === 0) return 'Free';
    const price = (plan.amount / 100).toFixed(2);
    return `$${price}`;
  };
  const formatInterval = () => {
    if (plan.interval === 'MONTH' && plan.interval_count === 1) return '/month';
    if (plan.interval === 'YEAR' && plan.interval_count === 1) return '/year';
    return `/${plan.interval_count} ${plan.interval.toLowerCase()}s`;
  };
  return (
    <Card
      className={clsx(
        'relative flex flex-col p-6',
        plan.is_popular && 'border-primary shadow-standard-lg scale-105' // UI Revamp - Nouveau système d'ombres
      )}
    >
      {' '}
      {plan.is_popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2"> Most Popular </Badge>
      )}{' '}
      <div className="flex-1">
        {' '}
        <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>{' '}
        <p className="text-muted-foreground mb-4">{plan.description}</p>{' '}
        <div className="mb-6">
          {' '}
          <span className="text-4xl font-bold text-foreground">{formatPrice()}</span>{' '}
          {plan.amount > 0 && (
            <span className="text-muted-foreground ml-2">{formatInterval()}</span>
          )}{' '}
        </div>{' '}
        <ul className="space-y-3 mb-6">
          {' '}
          {featureList.map(([key, value], index) => (
            <li key={index} className="flex items-start">
              {' '}
              <Check className="w-5 h-5 text-success-500 mr-2 flex-shrink-0 mt-0.5" />{' '}
              <span className="text-sm text-foreground">
                {' '}
                {typeof value === 'boolean'
                  ? key.replace(/_/g, '').replace(/\b\w/g, (l) => l.toUpperCase())
                  : `${key.replace(/_/g, '').replace(/\b\w/g, (l) => l.toUpperCase())}: ${value}`}{' '}
              </span>{' '}
            </li>
          ))}{' '}
        </ul>{' '}
      </div>{' '}
      <Button
        variant={plan.is_popular ? 'primary' : 'outline'}
        onClick={() => onSelect(plan.id)}
        disabled={isLoading || isCurrentPlan}
        className="w-full"
      >
        {' '}
        {isCurrentPlan ? 'Current Plan' : isLoading ? 'Processing...' : 'Select Plan'}{' '}
      </Button>{' '}
    </Card>
  );
}
