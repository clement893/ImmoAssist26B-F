# Stripe Setup Guide

This guide will help you set up Stripe payments for your SAAS application.

## Prerequisites

1. **Stripe Account**: Create an account at [stripe.com](https://stripe.com)
2. **API Keys**: Get your Stripe API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

## Configuration

### 1. Backend Configuration

Add the following environment variables to `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook secret (see Webhooks section)
```

### 2. Frontend Configuration

Add the following environment variable to `apps/web/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
```

## Setting Up Products and Prices in Stripe

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create products for each plan (Free, Pro, Enterprise)
3. Create prices for each product:
   - Set the amount (in cents)
   - Set the billing interval (monthly, yearly, etc.)
   - Copy the Price ID (starts with `price_...`)

### Seeding Default Plans

First, seed the default plans in your database:

```bash
cd backend
python scripts/seed_plans.py
```

This will create three default plans: Free, Pro, and Enterprise.

### Updating Plans in Database

After creating prices in Stripe, update your plans in the database:

```python
# Run this script or use SQL directly
from app.models import Plan
from app.core.database import AsyncSessionLocal

async def update_plan_stripe_ids():
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select

        # Get plans by name
        result = await session.execute(select(Plan).where(Plan.name == "Free"))
        free_plan = result.scalar_one_or_none()
        if free_plan:
            free_plan.stripe_price_id = "price_..."  # Your Stripe price ID

        result = await session.execute(select(Plan).where(Plan.name == "Pro"))
        pro_plan = result.scalar_one_or_none()
        if pro_plan:
            pro_plan.stripe_price_id = "price_..."  # Your Stripe price ID

        result = await session.execute(select(Plan).where(Plan.name == "Enterprise"))
        enterprise_plan = result.scalar_one_or_none()
        if enterprise_plan:
            enterprise_plan.stripe_price_id = "price_..."  # Your Stripe price ID

        await session.commit()
```

## Webhooks Setup

### 1. Create Webhook Endpoint in Stripe

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_...`)

### 2. Configure Webhook Secret

Add the webhook secret to `backend/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Test Webhooks Locally

For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/webhooks/stripe

# Copy the webhook signing secret from the output
```

## Testing

### Test Mode

Stripe provides test mode with test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any CVC, and any ZIP code.

### Testing Subscriptions

1. Start your application
2. Navigate to `/pricing`
3. Select a plan
4. Use test card `4242 4242 4242 4242`
5. Complete checkout
6. Verify subscription in Stripe Dashboard

## Production Checklist

- [ ] Switch to production API keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Configure webhook secret in production environment
- [ ] Test webhook events in production
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications for payment events
- [ ] Set up retry logic for failed webhooks

## Troubleshooting

### Webhook Signature Verification Failed

- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint URL matches Stripe configuration
- Check that raw request body is being passed to webhook handler

### Checkout Session Not Created

- Verify `STRIPE_SECRET_KEY` is set
- Ensure plan has `stripe_price_id` configured
- Check Stripe API key has correct permissions

### Subscription Not Created After Checkout

- Verify webhook is receiving events
- Check webhook handler logs for errors
- Ensure database migrations are applied
- Verify user_id and plan_id in checkout metadata

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
