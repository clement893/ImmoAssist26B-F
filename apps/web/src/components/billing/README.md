# Billing Components

Components for billing, subscription management, invoices, and payment processing.

## 📦 Components

- **BillingDashboard** - Overview of subscription, usage, and billing information
- **InvoiceList** - List of invoices with filtering and search
- **InvoiceViewer** - Detailed invoice viewer with print/download
- **PaymentMethodForm** - Form for adding/updating payment methods
- **PaymentHistory** - Payment transaction history
- **SubscriptionPlans** - Subscription plan selector
- **UsageMeter** - Usage meter with thresholds
- **BillingSettings** - Billing configuration settings

## 📖 Usage Examples

### Billing Dashboard

```tsx
import { BillingDashboard } from '@/components/billing';

<BillingDashboard
  subscription={{
    plan: 'Pro',
    status: 'active',
    currentPeriodEnd: '2024-04-15',
    amount: 29,
    currency: 'USD',
  }}
  usage={{
    current: 750,
    limit: 1000,
    unit: 'API calls',
  }}
/>;
```

### Subscription Plans

```tsx
import { SubscriptionPlans } from '@/components/billing';

<SubscriptionPlans
  plans={plans}
  currentPlanId="pro"
  onSelectPlan={(plan) => handlePlanSelect(plan)}
/>;
```

### Invoice List

```tsx
import { InvoiceList } from '@/components/billing';

<InvoiceList
  invoices={invoices}
  onViewInvoice={(invoice) => handleViewInvoice(invoice)}
  onDownloadInvoice={(invoice) => handleDownloadInvoice(invoice)}
/>;
```

## 🔗 Related

- [Billing Components Showcase](/components/billing)
- [Stripe Integration Guide](../../docs/STRIPE_SETUP.md)
