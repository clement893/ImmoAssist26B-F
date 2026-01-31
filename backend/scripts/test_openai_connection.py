#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple OpenAI Connection Test
Tests OpenAI API connection without requiring full app setup
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
    from openai import OpenAI
except ImportError:
    print("[ERROR] OpenAI module not installed")
    print("   Install with: pip install openai")
    sys.exit(1)


def test_openai_connection():
    """Test OpenAI API connection"""
    print("=" * 60)
    print("OpenAI Connection Test")
    print("=" * 60)
    print()
    
    # Get OpenAI API key from environment
    openai_api_key = os.getenv('OPENAI_API_KEY', '').strip()
    
    if not openai_api_key:
        print("[ERROR] OPENAI_API_KEY not found in environment")
        print()
        print("To set up OpenAI:")
        print("1. Get your API key from https://platform.openai.com/api-keys")
        print("2. Add to backend/.env:")
        print("   OPENAI_API_KEY=sk-proj-...")
        print()
        print("Or set environment variable:")
        print("   export OPENAI_API_KEY=sk-proj-...")
        return False
    
    # Mask the key for display
    if len(openai_api_key) > 11:
        masked_key = openai_api_key[:7] + "..." + openai_api_key[-4:]
    else:
        masked_key = "***"
    
    print(f"[OK] Found OPENAI_API_KEY: {masked_key}")
    
    # Check key type
    if openai_api_key.startswith('sk-proj-'):
        print("  -> Key type: Project key")
    elif openai_api_key.startswith('sk-'):
        print("  -> Key type: Standard API key")
    else:
        print("  [WARNING] Key format: Unknown format")
        print("  -> Expected format: sk-proj-... or sk-...")
    
    print()
    print("Testing OpenAI API connection...")
    print("-" * 60)
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_api_key)
        
        # Test connection by listing models
        print("-> Retrieving available models...")
        models = client.models.list()
        
        print()
        print("[SUCCESS] Connection successful!")
        print("-" * 60)
        print(f"Available models: {len(models.data)} models")
        
        # Show some popular models
        print("\nPopular models found:")
        popular_models = ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini']
        found_models = []
        
        for model in models.data:
            model_id = model.id
            for popular in popular_models:
                if popular in model_id.lower() and model_id not in found_models:
                    found_models.append(model_id)
                    print(f"  • {model_id}")
                    break
        
        if not found_models:
            print("  (No popular models found, showing first 5 models)")
            for model in models.data[:5]:
                print(f"  • {model.id}")
        
        # Test a simple completion
        print()
        print("Testing API with a simple request...")
        print("-" * 60)
        
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": "Say 'Hello' in one word."}
                ],
                max_tokens=10
            )
            
            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                print(f"[OK] API request successful!")
                print(f"  Response: {content}")
                print(f"  Model used: {response.model}")
                print(f"  Tokens used: {response.usage.total_tokens if hasattr(response, 'usage') else 'N/A'}")
            else:
                print("[WARNING] API request completed but no response content")
                
        except Exception as e:
            print(f"[WARNING] Could not test chat completion: {e}")
            print("  -> This might be due to model availability or permissions")
            print("  -> Connection to OpenAI API is working")
        
        print()
        print("=" * 60)
        print("[SUCCESS] All tests passed!")
        print("=" * 60)
        return True
        
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        
        print()
        print(f"[ERROR] OpenAI API error: {error_type}")
        print("-" * 60)
        print(f"Error: {error_msg}")
        print()
        
        if "401" in error_msg or "authentication" in error_msg.lower() or "invalid" in error_msg.lower():
            print("Possible issues:")
            print("  - Invalid API key")
            print("  - Key revoked or expired")
            print("  - Wrong key format")
            print()
            print("Solution:")
            print("  1. Check your key at: https://platform.openai.com/api-keys")
            print("  2. Make sure you're using the correct key")
            print("  3. Regenerate if needed")
        elif "429" in error_msg or "rate limit" in error_msg.lower():
            print("Possible issues:")
            print("  - Rate limit exceeded")
            print("  - Quota exceeded")
            print()
            print("Solution:")
            print("  1. Wait a few minutes and try again")
            print("  2. Check your usage at: https://platform.openai.com/usage")
            print("  3. Upgrade your plan if needed")
        elif "network" in error_msg.lower() or "connection" in error_msg.lower():
            print("Possible issues:")
            print("  - No internet connection")
            print("  - OpenAI API temporarily unavailable")
            print("  - Firewall blocking connection")
        else:
            print("Check OpenAI status: https://status.openai.com/")
        
        return False


if __name__ == "__main__":
    success = test_openai_connection()
    sys.exit(0 if success else 1)

