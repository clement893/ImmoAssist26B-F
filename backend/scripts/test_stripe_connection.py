#!/usr/bin/env python3
"""
Stripe Connection Test Script
Tests the Stripe API connection and configuration
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import stripe
from app.core.config import settings


def test_stripe_configuration():
    """Test Stripe configuration"""
    print("=" * 60)
    print("Stripe Connection Test")
    print("=" * 60)
    print()
    
    # Check environment variables
    print("1. Checking Environment Variables...")
    print("-" * 60)
    
    stripe_secret_key = getattr(settings, 'STRIPE_SECRET_KEY', None)
    stripe_publishable_key = getattr(settings, 'STRIPE_PUBLISHABLE_KEY', None)
    stripe_webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    
    if stripe_secret_key:
        # Mask the key for display
        masked_key = stripe_secret_key[:7] + "..." + stripe_secret_key[-4:] if len(stripe_secret_key) > 11 else "***"
        print(f"   ✓ STRIPE_SECRET_KEY: {masked_key}")
        
        # Check if it's a test or live key
        if stripe_secret_key.startswith('sk_test_'):
            print("   ℹ Key type: TEST key")
        elif stripe_secret_key.startswith('sk_live_'):
            print("   ⚠ Key type: LIVE key (production)")
        else:
            print("   ⚠ Key format: Unknown format")
    else:
        print("   ✗ STRIPE_SECRET_KEY: NOT SET")
        print("   → Set this in backend/.env file")
    
    if stripe_publishable_key:
        masked_key = stripe_publishable_key[:7] + "..." + stripe_publishable_key[-4:] if len(stripe_publishable_key) > 11 else "***"
        print(f"   ✓ STRIPE_PUBLISHABLE_KEY: {masked_key}")
        
        if stripe_publishable_key.startswith('pk_test_'):
            print("   ℹ Key type: TEST key")
        elif stripe_publishable_key.startswith('pk_live_'):
            print("   ⚠ Key type: LIVE key (production)")
    else:
        print("   ✗ STRIPE_PUBLISHABLE_KEY: NOT SET")
    
    if stripe_webhook_secret:
        masked_secret = stripe_webhook_secret[:7] + "..." + stripe_webhook_secret[-4:] if len(stripe_webhook_secret) > 11 else "***"
        print(f"   ✓ STRIPE_WEBHOOK_SECRET: {masked_secret}")
    else:
        print("   ⚠ STRIPE_WEBHOOK_SECRET: NOT SET (optional, needed for webhooks)")
    
    print()
    
    # Test API connection
    if not stripe_secret_key:
        print("❌ Cannot test API connection: STRIPE_SECRET_KEY not set")
        print()
        print("To set up Stripe:")
        print("1. Get your API keys from https://dashboard.stripe.com/apikeys")
        print("2. Add to backend/.env:")
        print("   STRIPE_SECRET_KEY=sk_test_...")
        print("   STRIPE_PUBLISHABLE_KEY=pk_test_...")
        return False
    
    print("2. Testing Stripe API Connection...")
    print("-" * 60)
    
    try:
        # Initialize Stripe
        stripe.api_key = stripe_secret_key
        
        # Test connection by retrieving account info
        print("   → Retrieving account information...")
        account = stripe.Account.retrieve()
        
        print(f"   ✓ Connected successfully!")
        print(f"   → Account ID: {account.id}")
        print(f"   → Country: {account.country}")
        print(f"   → Default currency: {account.default_currency}")
        print(f"   → Charges enabled: {account.charges_enabled}")
        print(f"   → Payouts enabled: {account.payouts_enabled}")
        
        # Test mode check
        if stripe_secret_key.startswith('sk_test_'):
            print()
            print("   ℹ Running in TEST mode")
            print("   → Use test cards: 4242 4242 4242 4242")
        elif stripe_secret_key.startswith('sk_live_'):
            print()
            print("   ⚠ Running in LIVE mode (production)")
            print("   → Real charges will be made!")
        
        print()
        
        # Test retrieving products/prices
        print("3. Testing Products & Prices Retrieval...")
        print("-" * 60)
        
        try:
            products = stripe.Product.list(limit=5)
            print(f"   ✓ Retrieved {len(products.data)} products")
            
            if products.data:
                print("   → Products found:")
                for product in products.data[:3]:
                    print(f"     - {product.name} (ID: {product.id})")
                    
                    # Get prices for this product
                    prices = stripe.Price.list(product=product.id, limit=3)
                    if prices.data:
                        for price in prices.data:
                            amount = price.unit_amount / 100 if price.unit_amount else 0
                            currency = price.currency.upper()
                            interval = price.recurring.interval if price.recurring else "one-time"
                            print(f"       Price: {amount} {currency} / {interval} (ID: {price.id})")
            else:
                print("   ℹ No products found")
                print("   → Create products in Stripe Dashboard: https://dashboard.stripe.com/products")
        except stripe.error.StripeError as e:
            print(f"   ⚠ Error retrieving products: {e}")
        
        print()
        
        # Test webhook endpoint verification
        print("4. Webhook Configuration...")
        print("-" * 60)
        
        if stripe_webhook_secret:
            print("   ✓ Webhook secret configured")
            print("   → Webhook endpoint: /api/webhooks/stripe")
            print("   → For local testing, use Stripe CLI:")
            print("     stripe listen --forward-to localhost:8000/api/webhooks/stripe")
        else:
            print("   ⚠ Webhook secret not configured")
            print("   → Optional: Set STRIPE_WEBHOOK_SECRET in backend/.env")
            print("   → For local testing, use Stripe CLI to get webhook secret")
        
        print()
        print("=" * 60)
        print("✅ Stripe Connection Test PASSED")
        print("=" * 60)
        return True
        
    except stripe.error.AuthenticationError as e:
        print(f"   ✗ Authentication failed: {e}")
        print()
        print("   → Check that your STRIPE_SECRET_KEY is correct")
        print("   → Get your keys from: https://dashboard.stripe.com/apikeys")
        return False
        
    except stripe.error.APIConnectionError as e:
        print(f"   ✗ Connection error: {e}")
        print()
        print("   → Check your internet connection")
        print("   → Stripe API might be temporarily unavailable")
        return False
        
    except stripe.error.StripeError as e:
        print(f"   ✗ Stripe error: {e}")
        print(f"   → Error type: {type(e).__name__}")
        return False
        
    except Exception as e:
        print(f"   ✗ Unexpected error: {e}")
        print(f"   → Error type: {type(e).__name__}")
        return False


if __name__ == "__main__":
    success = test_stripe_configuration()
    sys.exit(0 if success else 1)

