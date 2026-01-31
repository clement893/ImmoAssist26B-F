'use client';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { Check } from 'lucide-react';
import clsx from 'clsx';
interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
}
interface PricingCardSimpleProps {
  plan: Plan;
  billingPeriod: 'month' | 'year';
  onSelect: (planId: string, period: 'month' | 'year') => void;
}
export default function PricingCardSimple({
  plan,
  billingPeriod,
  onSelect: _onSelect,
}: PricingCardSimpleProps) {
  const calculatePrice = () => {
    if (billingPeriod === 'year') {
      return Math.round((plan.price * 12 * 0.8) / 12);
    }
    return plan.price;
  };
  const calculateYearlyPrice = () => {
    if (billingPeriod === 'year') {
      return Math.round(plan.price * 12 * 0.8);
    }
    return null;
  };
  return (
    <Card
      className={clsx(
        'relative',
        plan.popular && 'border-2 border-primary-500 shadow-xl scale-105'
      )}
    >
      {' '}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          {' '}
          <Badge variant="success" className="px-4 py-1">
            {' '}
            Le plus populaire{' '}
          </Badge>{' '}
        </div>
      )}{' '}
      <div className="p-8">
        {' '}
        <h2 className="text-2xl font-bold text-foreground mb-2"> {plan.name} </h2>{' '}
        <p className="text-muted-foreground mb-6">{plan.description}</p>{' '}
        <div className="mb-6">
          {' '}
          <span className="text-4xl font-bold text-foreground"> {calculatePrice()}€ </span>{' '}
          <span className="text-muted-foreground">/mois</span>{' '}
          {billingPeriod === 'year' && calculateYearlyPrice() && (
            <div className="text-sm text-muted-foreground mt-1"> {calculateYearlyPrice()}€/an </div>
          )}{' '}
        </div>{' '}
        <Link href={`/subscriptions?plan=${plan.id}&period=${billingPeriod}`}>
          {' '}
          <Button
            className={clsx('w-full mb-6', plan.popular && 'bg-primary-600 hover:bg-primary-700')}
            variant={plan.popular ? 'primary' : 'outline'}
          >
            {' '}
            {plan.buttonText}{' '}
          </Button>{' '}
        </Link>{' '}
        <ul className="space-y-3">
          {' '}
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              {' '}
              <Check className="w-5 h-5 text-success-500 mr-2 mt-0.5 flex-shrink-0" />{' '}
              <span className="text-foreground">{feature}</span>{' '}
            </li>
          ))}{' '}
        </ul>{' '}
      </div>{' '}
    </Card>
  );
}
