/**
 * Subscription Plans Component
 * Displays available subscription plans with pricing and features
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Check, X, Zap, Crown, Rocket } from 'lucide-react';

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  popular?: boolean;
  icon?: React.ReactNode;
  ctaText?: string;
}

export interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentPlanId?: string;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  className?: string;
}

export default function SubscriptionPlans({
  plans,
  currentPlanId,
  onSelectPlan,
  className,
}: SubscriptionPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const getPlanIcon = (plan: SubscriptionPlan) => {
    if (plan.icon) return plan.icon;
    if (plan.name.toLowerCase().includes('pro')) return <Zap className="w-6 h-6" />;
    if (plan.name.toLowerCase().includes('enterprise')) return <Crown className="w-6 h-6" />;
    return <Rocket className="w-6 h-6" />;
  };

  const getDisplayPrice = (plan: SubscriptionPlan) => {
    const price = billingInterval === 'year' ? plan.price * 10 : plan.price; // Yearly is typically 10x monthly
    return `${plan.currency} ${price.toFixed(2)}`;
  };

  return (
    <div className={clsx('space-y-8', className)}>
      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={clsx(
            'text-sm font-medium',
            billingInterval === 'month' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
          className={clsx(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
            billingInterval === 'year' ? 'bg-primary-600 dark:bg-primary-500' : 'bg-muted'
          )}
        >
          <span
            className={clsx(
              'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
              billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <span
          className={clsx(
            'text-sm font-medium',
            billingInterval === 'year' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Yearly
          <Badge variant="success" className="ml-2">
            Save 20%
          </Badge>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.id}
              className={clsx(
                'relative bg-background',
                isPopular && 'ring-2 ring-primary-500 dark:ring-primary-400',
                isCurrentPlan && 'border-2 border-success-500 dark:border-success-400'
              )}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="info">Most Popular</Badge>
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-primary-600 dark:text-primary-400">
                      {getPlanIcon(plan)}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      {getDisplayPrice(plan)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{billingInterval === 'month' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingInterval === 'year' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {plan.currency} {((plan.price * 10) / 12).toFixed(2)}/month billed annually
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={clsx(
                          'text-sm',
                          feature.included
                            ? 'text-foreground'
                            : 'text-muted-foreground line-through'
                        )}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  variant={isPopular ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => onSelectPlan?.(plan)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.ctaText || `Select ${plan.name}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
