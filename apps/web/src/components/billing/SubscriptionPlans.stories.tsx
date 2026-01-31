/**
 * SubscriptionPlans Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import SubscriptionPlans from './SubscriptionPlans';
import type { Plan } from './SubscriptionPlans';

const meta: Meta<typeof SubscriptionPlans> = {
  title: 'Billing/SubscriptionPlans',
  component: SubscriptionPlans,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SubscriptionPlans>;

const samplePlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      { name: '10 projects', included: true },
      { name: '5 team members', included: true },
      { name: 'Basic support', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams',
    price: 29,
    currency: 'USD',
    interval: 'month',
    popular: true,
    features: [
      { name: 'Unlimited projects', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'API access', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99,
    currency: 'USD',
    interval: 'month',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantee', included: true },
      { name: 'On-premise deployment', included: true },
    ],
  },
];

export const Default: Story = {
  args: {
    plans: samplePlans,
    currentPlanId: 'pro',
    onSelectPlan: (plan) => console.log('Plan selected:', plan),
  },
};

export const NoCurrentPlan: Story = {
  args: {
    plans: samplePlans,
    onSelectPlan: (plan) => console.log('Plan selected:', plan),
  },
};

export const AnnualPlans: Story = {
  args: {
    plans: samplePlans.map((plan) => ({
      ...plan,
      interval: 'year' as const,
      price: plan.price * 10,
    })),
    currentPlanId: 'pro',
    onSelectPlan: (plan) => console.log('Plan selected:', plan),
  },
};
