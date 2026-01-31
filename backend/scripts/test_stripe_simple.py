#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Stripe Connection Test
Tests Stripe API connection without requiring full app setup
"""

import os
import sys
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

try:
    from dotenv import load_dotenv
except ImportError:
    print("Warning: python-dotenv not installed, using system environment variables")
    load_dotenv = lambda x: None

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"[OK] Loaded environment from {env_path}")
else:
    print(f"[WARNING] .env file not found at {env_path}")
    print("  Using environment variables from system")

try:
    import stripe
except ImportError:
    print("[ERROR] Stripe module not installed")
    print("   Install with: pip install stripe")
    sys.exit(1)

def test_stripe_connection():
    """Test Stripe API connection"""
    print("=" * 60)
    print("Stripe Connection Test")
    print("=" * 60)
    print()
    
    # Get Stripe secret key from environment
    stripe_secret_key = os.getenv('STRIPE_SECRET_KEY', '').strip()
    
    if not stripe_secret_key:
        print("[ERROR] STRIPE_SECRET_KEY not found in environment")
        print()
        print("To set up Stripe:")
        print("1. Get your API keys from https://dashboard.stripe.com/apikeys")
        print("2. Add to backend/.env:")
        print("   STRIPE_SECRET_KEY=sk_test_...")
        print("   STRIPE_PUBLISHABLE_KEY=pk_test_...")
        print()
        print("Or set environment variable:")
        print("   export STRIPE_SECRET_KEY=sk_test_...")
        return False
    
    # Mask the key for display
    if len(stripe_secret_key) > 11:
        masked_key = stripe_secret_key[:7] + "..." + stripe_secret_key[-4:]
    else:
        masked_key = "***"
    
    print(f"[OK] Found STRIPE_SECRET_KEY: {masked_key}")
    
    # Check key type
    if stripe_secret_key.startswith('sk_test_'):
        print("  -> Key type: TEST key")
        print("  -> Use test cards: 4242 4242 4242 4242")
    elif stripe_secret_key.startswith('sk_live_'):
        print("  [WARNING] Key type: LIVE key (production)")
        print("  [WARNING] Real charges will be made!")
    else:
        print("  [WARNING] Key format: Unknown format")
        print("  -> Expected format: sk_test_... or sk_live_...")
    
    print()
    print("Testing Stripe API connection...")
    print("-" * 60)
    
    try:
        # Initialize Stripe
        stripe.api_key = stripe_secret_key
        
        # Test connection by retrieving account info
        print("→ Retrieving account information...")
        account = stripe.Account.retrieve()
        
        print()
        print("[SUCCESS] Connection successful!")
        print("-" * 60)
        print(f"Account ID: {account.id}")
        print(f"Country: {account.country}")
        print(f"Default currency: {account.default_currency}")
        print(f"Charges enabled: {account.charges_enabled}")
        print(f"Payouts enabled: {account.payouts_enabled}")
        
        # Test retrieving products
        print()
        print("Testing Products API...")
        print("-" * 60)
        
        products = stripe.Product.list(limit=5)
        print(f"[OK] Retrieved {len(products.data)} products")
        
        if products.data:
            print("\nProducts found:")
            for product in products.data[:5]:
                print(f"  • {product.name} (ID: {product.id})")
                
                # Get prices for this product
                prices = stripe.Price.list(product=product.id, limit=3)
                if prices.data:
                    for price in prices.data:
                        amount = price.unit_amount / 100 if price.unit_amount else 0
                        currency = price.currency.upper()
                        if price.recurring:
                            interval = price.recurring.interval
                            print(f"    Price: ${amount:.2f} {currency} / {interval} (ID: {price.id})")
                        else:
                            print(f"    Price: ${amount:.2f} {currency} one-time (ID: {price.id})")
        else:
            print("  ℹ No products found")
            print("  → Create products at: https://dashboard.stripe.com/products")
        
        # Check publishable key
        print()
        print("Checking Frontend Configuration...")
        print("-" * 60)
        
        stripe_publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY', '').strip()
        if stripe_publishable_key:
            masked_pub = stripe_publishable_key[:7] + "..." + stripe_publishable_key[-4:] if len(stripe_publishable_key) > 11 else "***"
            print(f"[OK] STRIPE_PUBLISHABLE_KEY: {masked_pub}")
            print("  -> Add to apps/web/.env.local:")
            print(f"    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY={masked_pub}")
        else:
            print("[WARNING] STRIPE_PUBLISHABLE_KEY not found")
            print("  -> Get from: https://dashboard.stripe.com/apikeys")
            print("  -> Add to backend/.env and apps/web/.env.local")
        
        # Check webhook secret
        stripe_webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '').strip()
        if stripe_webhook_secret:
            masked_wh = stripe_webhook_secret[:7] + "..." + stripe_webhook_secret[-4:] if len(stripe_webhook_secret) > 11 else "***"
            print(f"[OK] STRIPE_WEBHOOK_SECRET: {masked_wh}")
        else:
            print("[WARNING] STRIPE_WEBHOOK_SECRET not set (optional)")
            print("  -> Needed for webhook verification")
            print("  -> For local testing, use Stripe CLI:")
            print("    stripe listen --forward-to localhost:8000/api/webhooks/stripe")
        
        print()
        print("=" * 60)
        print("[SUCCESS] All tests passed!")
        print("=" * 60)
        return True
        
    except stripe.error.AuthenticationError as e:
        print()
        print("[ERROR] Authentication failed")
        print("-" * 60)
        print(f"Error: {e}")
        print()
        print("Possible issues:")
        print("  - Invalid API key")
        print("  - Key revoked or expired")
        print("  - Wrong key type (test vs live)")
        print()
        print("Solution:")
        print("  1. Check your key at: https://dashboard.stripe.com/apikeys")
        print("  2. Make sure you're using the correct key (test or live)")
        print("  3. Regenerate if needed")
        return False
        
    except stripe.error.APIConnectionError as e:
        print()
        print("[ERROR] Connection error")
        print("-" * 60)
        print(f"Error: {e}")
        print()
        print("Possible issues:")
        print("  - No internet connection")
        print("  - Stripe API temporarily unavailable")
        print("  - Firewall blocking connection")
        return False
        
    except stripe.error.StripeError as e:
        print()
        print("[ERROR] Stripe API error")
        print("-" * 60)
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")
        return False
        
    except Exception as e:
        print()
        print("[ERROR] Unexpected error")
        print("-" * 60)
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    success = test_stripe_connection()
    sys.exit(0 if success else 1)

