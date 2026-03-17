#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple SendGrid Connection Test
Tests SendGrid API connection and sends a test email
"""

import os
import sys
from pathlib import Path
from datetime import datetime

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
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To, Content
except ImportError:
    print("[ERROR] sendgrid module not installed")
    print("   Install with: pip install sendgrid")
    sys.exit(1)


def test_sendgrid_connection(to_email: str = None):
    """Test SendGrid API connection and send test email"""
    print("=" * 60)
    print("SendGrid Connection Test")
    print("=" * 60)
    print()
    
    # Get SendGrid credentials from environment
    sendgrid_api_key = os.getenv('SENDGRID_API_KEY', '').strip()
    sendgrid_from_email = os.getenv('SENDGRID_FROM_EMAIL', '').strip()
    sendgrid_from_name = os.getenv('SENDGRID_FROM_NAME', '').strip()
    
    # Check environment variables
    print("1. Checking Environment Variables...")
    print("-" * 60)
    
    if sendgrid_api_key:
        masked_key = sendgrid_api_key[:7] + "..." + sendgrid_api_key[-4:] if len(sendgrid_api_key) > 11 else "***"
        print(f"[OK] SENDGRID_API_KEY: {masked_key}")
    else:
        print("[ERROR] SENDGRID_API_KEY not found")
        print("  -> Add to backend/.env: SENDGRID_API_KEY=SG...")
        return False
    
    if sendgrid_from_email:
        print(f"[OK] SENDGRID_FROM_EMAIL: {sendgrid_from_email}")
    else:
        print("[WARNING] SENDGRID_FROM_EMAIL not set")
        print("  -> Add to backend/.env: SENDGRID_FROM_EMAIL=noreply@yourdomain.com")
        sendgrid_from_email = "noreply@example.com"
    
    if sendgrid_from_name:
        print(f"[OK] SENDGRID_FROM_NAME: {sendgrid_from_name}")
    else:
        print("[INFO] SENDGRID_FROM_NAME not set, using default")
        sendgrid_from_name = "Test App"
    
    # Get recipient email
    if not to_email:
        to_email = input("\nEnter recipient email address (or press Enter to skip sending): ").strip()
        if not to_email:
            print("[INFO] Skipping email send test")
            to_email = None
    
    print()
    print("2. Testing SendGrid API Connection...")
    print("-" * 60)
    
    try:
        # Initialize SendGrid client
        sg = SendGridAPIClient(api_key=sendgrid_api_key)
        
        # Test connection by checking API key validity
        print("-> Verifying API key...")
        
        # Try to get user info (this validates the API key)
        try:
            response = sg.client.user.get()
            if response.status_code == 200:
                print("[OK] API key is valid")
            else:
                print(f"[WARNING] Unexpected status code: {response.status_code}")
        except Exception as e:
            # Some API keys might not have user.get permission, that's OK
            print("[INFO] Could not verify user info (may be permission issue)")
        
        # Test sending email if recipient provided
        if to_email:
            print()
            print("3. Testing Email Sending...")
            print("-" * 60)
            
            print(f"-> Preparing email to: {to_email}")
            
            # Create email
            message = Mail(
                from_email=Email(sendgrid_from_email, sendgrid_from_name),
                to_emails=To(to_email),
                subject='Test Email from SendGrid Connection Test',
                html_content=Content(
                    'text/html',
                    f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">SendGrid Connection Test</h2>
                        <p>This is a test email sent from the SendGrid connection test script.</p>
                        <p><strong>Test Details:</strong></p>
                        <ul>
                            <li>Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</li>
                            <li>From: {sendgrid_from_email} ({sendgrid_from_name})</li>
                            <li>To: {to_email}</li>
                        </ul>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            If you received this email, your SendGrid configuration is working correctly!
                        </p>
                    </body>
                    </html>
                    """
                ),
                plain_text_content=Content(
                    'text/plain',
                    f"""SendGrid Connection Test

This is a test email sent from the SendGrid connection test script.

Test Details:
- Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
- From: {sendgrid_from_email} ({sendgrid_from_name})
- To: {to_email}

If you received this email, your SendGrid configuration is working correctly!
"""
                )
            )
            
            print(f"-> Sending email...")
            response = sg.send(message)
            
            if response.status_code in [200, 202]:
                print()
                print("[SUCCESS] Email sent successfully!")
                print("-" * 60)
                print(f"Status Code: {response.status_code}")
                print(f"To: {to_email}")
                print(f"From: {sendgrid_from_email} ({sendgrid_from_name})")
                print(f"Subject: Test Email from SendGrid Connection Test")
                print()
                print("[INFO] Check your inbox (and spam folder) for the test email")
            else:
                print(f"[WARNING] Unexpected status code: {response.status_code}")
                print(f"Response headers: {response.headers}")
        else:
            print()
            print("[INFO] Email sending skipped (no recipient provided)")
            print("  -> Connection test passed, but no email was sent")
        
        print()
        print("=" * 60)
        print("[SUCCESS] All tests passed!")
        print("=" * 60)
        return True
        
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        
        print()
        print(f"[ERROR] SendGrid API error: {error_type}")
        print("-" * 60)
        print(f"Error: {error_msg}")
        print()
        
        if "401" in error_msg or "unauthorized" in error_msg.lower() or "invalid" in error_msg.lower():
            print("Possible issues:")
            print("  - Invalid API key")
            print("  - Key revoked or expired")
            print("  - Wrong key format")
            print()
            print("Solution:")
            print("  1. Check your key at: https://app.sendgrid.com/settings/api_keys")
            print("  2. Make sure you're using the correct key")
            print("  3. Regenerate if needed")
        elif "403" in error_msg or "forbidden" in error_msg.lower():
            print("Possible issues:")
            print("  - API key doesn't have send permissions")
            print("  - Account restrictions")
            print()
            print("Solution:")
            print("  1. Check API key permissions at: https://app.sendgrid.com/settings/api_keys")
            print("  2. Ensure 'Mail Send' permission is enabled")
        elif "422" in error_msg or "unprocessable" in error_msg.lower():
            print("Possible issues:")
            print("  - Invalid email address")
            print("  - From email not verified")
            print("  - Missing required fields")
            print()
            print("Solution:")
            print("  1. Verify sender email at: https://app.sendgrid.com/settings/sender_auth")
            print("  2. Check email format")
        elif "rate limit" in error_msg.lower() or "429" in error_msg:
            print("Possible issues:")
            print("  - Rate limit exceeded")
            print("  - Too many requests")
            print()
            print("Solution:")
            print("  1. Wait a few minutes and try again")
            print("  2. Check your SendGrid plan limits")
        else:
            print("Check SendGrid status: https://status.sendgrid.com/")
        
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test SendGrid connection and send test email')
    parser.add_argument('--to', type=str, help='Recipient email address')
    args = parser.parse_args()
    
    success = test_sendgrid_connection(to_email=args.to)
    sys.exit(0 if success else 1)

