# Subscriptions & Payments Guide

Complete guide to using the subscription and payment system.

## Overview

The subscription system provides:

- ✅ Multiple subscription plans (Free, Pro, Enterprise)
- ✅ Stripe integration for payments
- ✅ Automatic billing
- ✅ Customer portal for self-service
- ✅ Webhook handling for real-time updates
- ✅ Trial periods support

## API Endpoints

### Plans

#### List Plans

```http
GET /api/v1/subscriptions/plans
```

**Query Parameters:**

- `active_only` (boolean, default: true) - Only return active plans

**Response:**

```json
{
  "plans": [
    {
      "id": 1,
      "name": "Pro",
      "description": "For growing teams",
      "amount": 2900,
      "currency": "usd",
      "interval": "MONTH",
      "interval_count": 1,
      "is_popular": true,
      "features": "{\"max_users\": 10, \"max_projects\": 50}",
      "status": "ACTIVE"
    }
  ],
  "total": 1
}
```

#### Get Plan

```http
GET /api/v1/subscriptions/plans/{plan_id}
```

### Subscriptions

#### Get Current Subscription

```http
GET /api/v1/subscriptions/me
```

**Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "plan_id": 2,
  "plan": {
    "id": 2,
    "name": "Pro",
    "amount": 2900
  },
  "status": "ACTIVE",
  "current_period_start": "2025-01-01T00:00:00Z",
  "current_period_end": "2025-02-01T00:00:00Z",
  "cancel_at_period_end": false
}
```

#### Create Checkout Session

```http
POST /api/v1/subscriptions/checkout
```

**Request Body:**

```json
{
  "plan_id": 2,
  "success_url": "https://yourapp.com/subscriptions/success",
  "cancel_url": "https://yourapp.com/pricing",
  "trial_days": 14
}
```

**Response:**

```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### Create Customer Portal Session

```http
POST /api/v1/subscriptions/portal?return_url=https://yourapp.com/subscriptions
```

**Response:**

```json
{
  "url": "https://billing.stripe.com/..."
}
```

#### Cancel Subscription

```http
POST /api/v1/subscriptions/cancel
```

Cancels subscription at end of billing period.

#### Upgrade Plan

```http
POST /api/v1/subscriptions/upgrade/{plan_id}
```

Upgrades subscription to new plan with proration.

## Frontend Usage

### Display Pricing Page

```tsx
import { PricingSection } from "@/components/subscriptions/PricingSection";

export default function PricingPage() {
  return <PricingSection />;
}
```

### Check Subscription Status

```tsx
import { api } from "@/lib/api";

const checkSubscription = async () => {
  try {
    const response = await api.get("/v1/subscriptions/me");
    const subscription = response.data;

    if (subscription.status === "ACTIVE") {
      // User has active subscription
    }
  } catch (error) {
    // No subscription or error
  }
};
```

### Redirect to Checkout

```tsx
const handleSubscribe = async (planId: number) => {
  const response = await api.post("/v1/subscriptions/checkout", {
    plan_id: planId,
    success_url: `${window.location.origin}/subscriptions/success`,
    cancel_url: `${window.location.origin}/pricing`,
  });

  // Redirect to Stripe Checkout
  window.location.href = response.data.url;
};
```

## Webhooks

Webhooks are automatically handled at `/webhooks/stripe`. Configure in Stripe Dashboard:

1. Go to Webhooks section
2. Add endpoint: `https://yourdomain.com/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

## Database Models

### Plan

- `id`: Primary key
- `name`: Plan name
- `amount`: Price in cents
- `interval`: Billing interval (MONTH, YEAR, etc.)
- `stripe_price_id`: Stripe Price ID
- `features`: JSON string of plan features/limits

### Subscription

- `id`: Primary key
- `user_id`: Foreign key to users
- `plan_id`: Foreign key to plans
- `stripe_subscription_id`: Stripe Subscription ID
- `status`: Subscription status
- `current_period_start`: Start of current billing period
- `current_period_end`: End of current billing period

### Invoice

- `id`: Primary key
- `user_id`: Foreign key to users
- `subscription_id`: Foreign key to subscriptions
- `stripe_invoice_id`: Stripe Invoice ID
- `amount_due`: Amount due in cents
- `status`: Invoice status

## Setup

### 1. Run Database Migration

Run the migration to create tables:

```bash
cd backend
alembic upgrade head
```

### 2. Seed Default Plans

Seed default plans in the database:

```bash
python scripts/seed_plans.py
```

This creates three default plans:

- **Free**: $0/month - Perfect for getting started
- **Pro**: $29/month - For growing teams (marked as popular)
- **Enterprise**: $99/month - For large organizations

### 3. Configure Stripe Price IDs

After creating products and prices in Stripe Dashboard, update the `stripe_price_id` for each plan in your database (see [STRIPE_SETUP.md](./STRIPE_SETUP.md) for details).

## Environment Variables

### Backend

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Testing

Use Stripe test cards:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

See [Stripe Testing Guide](https://stripe.com/docs/testing) for more test cards.
