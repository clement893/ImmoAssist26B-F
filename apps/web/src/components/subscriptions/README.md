# Subscriptions Components

Components for subscription management and pricing displays.

## 📦 Components

- **PricingCard** - Display individual pricing plan
- **PricingSection** - Complete pricing section with multiple plans
- **SubscriptionCard** - Display user's current subscription

## 📖 Usage Examples

### Pricing Card

```tsx
import { PricingCard } from '@/components/subscriptions';
import type { Plan } from '@/components/subscriptions';

<PricingCard
  plan={planData}
  onSelect={(planId) => handleSelectPlan(planId)}
  currentPlanId={currentPlan?.id}
/>;
```

### Pricing Section

```tsx
import { PricingSection } from '@/components/subscriptions';

<PricingSection />;
```

### Subscription Card

```tsx
import { SubscriptionCard } from '@/components/subscriptions';

<SubscriptionCard
  subscription={subscriptionData}
  onCancel={() => handleCancel()}
  onResume={() => handleResume()}
/>;
```

## 🎨 Features

- **Plan Display**: Show pricing plans with features
- **Plan Comparison**: Compare multiple plans
- **Subscription Management**: View and manage subscriptions
- **Billing Periods**: Support for monthly/yearly billing
- **Feature Lists**: Display plan features
- **Popular Badge**: Highlight popular plans
- **Current Plan**: Show current subscription status

## 🔧 Configuration

### PricingCard

- `plan`: Plan object with pricing and features
- `onSelect`: Plan selection callback
- `currentPlanId`: Current plan ID (optional)
- `isLoading`: Loading state

### PricingSection

- Automatically fetches plans from API
- Handles plan selection and checkout

### SubscriptionCard

- `subscription`: Subscription object
- `onCancel`: Cancel callback
- `onResume`: Resume callback

## 🔗 Related Components

- See `/components/billing` for billing components
- See `/components/ui` for Card and Button components
