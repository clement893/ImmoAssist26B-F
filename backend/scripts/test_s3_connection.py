#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple AWS S3 Connection Test
Tests AWS S3 connection and bucket access
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
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    print("[ERROR] boto3 module not installed")
    print("   Install with: pip install boto3")
    sys.exit(1)


def test_s3_connection():
    """Test AWS S3 connection"""
    print("=" * 60)
    print("AWS S3 Connection Test")
    print("=" * 60)
    print()
    
    # Get AWS credentials from environment
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID', '').strip()
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY', '').strip()
    aws_region = os.getenv('AWS_REGION', 'us-east-1').strip()
    aws_s3_bucket = os.getenv('AWS_S3_BUCKET', '').strip()
    
    # Check environment variables
    print("1. Checking Environment Variables...")
    print("-" * 60)
    
    if aws_access_key_id:
        masked_key = aws_access_key_id[:4] + "..." + aws_access_key_id[-4:] if len(aws_access_key_id) > 8 else "***"
        print(f"[OK] AWS_ACCESS_KEY_ID: {masked_key}")
    else:
        print("[ERROR] AWS_ACCESS_KEY_ID not found")
        print("  -> Add to backend/.env: AWS_ACCESS_KEY_ID=AKIA...")
        return False
    
    if aws_secret_access_key:
        masked_secret = "***" + aws_secret_access_key[-4:] if len(aws_secret_access_key) > 4 else "***"
        print(f"[OK] AWS_SECRET_ACCESS_KEY: {masked_secret}")
    else:
        print("[ERROR] AWS_SECRET_ACCESS_KEY not found")
        print("  -> Add to backend/.env: AWS_SECRET_ACCESS_KEY=...")
        return False
    
    if aws_region:
        print(f"[OK] AWS_REGION: {aws_region}")
    else:
        print("[WARNING] AWS_REGION not set, using default: us-east-1")
        aws_region = 'us-east-1'
    
    if aws_s3_bucket:
        print(f"[OK] AWS_S3_BUCKET: {aws_s3_bucket}")
    else:
        print("[WARNING] AWS_S3_BUCKET not set")
        print("  -> Add to backend/.env: AWS_S3_BUCKET=your-bucket-name")
    
    print()
    print("2. Testing AWS S3 Connection...")
    print("-" * 60)
    
    try:
        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        
        # Test connection by listing buckets
        print("-> Listing S3 buckets...")
        response = s3_client.list_buckets()
        
        print()
        print("[SUCCESS] Connection successful!")
        print("-" * 60)
        print(f"Account has access to {len(response['Buckets'])} bucket(s)")
        
        if response['Buckets']:
            print("\nBuckets found:")
            for bucket in response['Buckets']:
                bucket_name = bucket['Name']
                creation_date = bucket['CreationDate'].strftime('%Y-%m-%d %H:%M:%S')
                print(f"  • {bucket_name} (created: {creation_date})")
        
        # Test bucket access if bucket name is provided
        if aws_s3_bucket:
            print()
            print("3. Testing Bucket Access...")
            print("-" * 60)
            
            try:
                # Check if bucket exists and is accessible
                print(f"-> Checking access to bucket: {aws_s3_bucket}")
                s3_client.head_bucket(Bucket=aws_s3_bucket)
                
                print(f"[OK] Bucket '{aws_s3_bucket}' is accessible")
                
                # List objects in bucket (limit to 10)
                print(f"-> Listing objects in bucket...")
                objects_response = s3_client.list_objects_v2(
                    Bucket=aws_s3_bucket,
                    MaxKeys=10
                )
                
                if 'Contents' in objects_response:
                    object_count = objects_response.get('KeyCount', len(objects_response['Contents']))
                    total_objects = objects_response.get('IsTruncated', False)
                    print(f"[OK] Found {object_count} object(s) in bucket")
                    
                    if objects_response['Contents']:
                        print("\nSample objects:")
                        for obj in objects_response['Contents'][:5]:
                            size_kb = obj['Size'] / 1024
                            last_modified = obj['LastModified'].strftime('%Y-%m-%d %H:%M:%S')
                            print(f"  • {obj['Key']} ({size_kb:.2f} KB, modified: {last_modified})")
                    
                    if total_objects:
                        print("  (More objects available...)")
                else:
                    print("[INFO] Bucket is empty")
                
                # Test write permissions (optional - create a test file)
                print()
                print("4. Testing Write Permissions...")
                print("-" * 60)
                
                test_key = f"test-connection-{int(os.urandom(4).hex(), 16)}.txt"
                test_content = b"Test file created by S3 connection test"
                
                try:
                    print(f"-> Uploading test file: {test_key}")
                    s3_client.put_object(
                        Bucket=aws_s3_bucket,
                        Key=test_key,
                        Body=test_content,
                        ContentType='text/plain'
                    )
                    print(f"[OK] Successfully uploaded test file")
                    
                    # Clean up - delete test file
                    print(f"-> Cleaning up test file...")
                    s3_client.delete_object(Bucket=aws_s3_bucket, Key=test_key)
                    print(f"[OK] Test file deleted")
                    
                except ClientError as e:
                    error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                    if error_code == 'AccessDenied':
                        print("[WARNING] Write permission denied")
                        print("  -> Bucket is readable but not writable")
                    else:
                        print(f"[WARNING] Could not test write: {error_code}")
                        print(f"  -> Error: {e}")
                
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                if error_code == '404':
                    print(f"[ERROR] Bucket '{aws_s3_bucket}' not found")
                    print("  -> Check bucket name spelling")
                    print("  -> Verify bucket exists in region:", aws_region)
                elif error_code == '403':
                    print(f"[ERROR] Access denied to bucket '{aws_s3_bucket}'")
                    print("  -> Check IAM permissions")
                    print("  -> Verify bucket policy allows access")
                else:
                    print(f"[ERROR] Cannot access bucket: {error_code}")
                    print(f"  -> Error: {e}")
        else:
            print()
            print("[INFO] No bucket specified for detailed testing")
            print("  -> Set AWS_S3_BUCKET in backend/.env to test bucket access")
        
        print()
        print("=" * 60)
        print("[SUCCESS] All tests passed!")
        print("=" * 60)
        return True
        
    except NoCredentialsError:
        print()
        print("[ERROR] AWS credentials not found")
        print("-" * 60)
        print("Possible issues:")
        print("  - AWS_ACCESS_KEY_ID not set")
        print("  - AWS_SECRET_ACCESS_KEY not set")
        print()
        print("Solution:")
        print("  1. Add credentials to backend/.env")
        print("  2. Or configure AWS CLI: aws configure")
        return False
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_msg = e.response.get('Error', {}).get('Message', str(e))
        
        print()
        print(f"[ERROR] AWS S3 API error: {error_code}")
        print("-" * 60)
        print(f"Error: {error_msg}")
        print()
        
        if error_code == 'InvalidAccessKeyId':
            print("Possible issues:")
            print("  - Invalid AWS Access Key ID")
            print("  - Key revoked or expired")
            print()
            print("Solution:")
            print("  1. Check your credentials at: https://console.aws.amazon.com/iam/")
            print("  2. Generate new access keys if needed")
        elif error_code == 'SignatureDoesNotMatch':
            print("Possible issues:")
            print("  - Invalid AWS Secret Access Key")
            print("  - Key doesn't match Access Key ID")
            print()
            print("Solution:")
            print("  1. Verify both keys are correct")
            print("  2. Regenerate keys if needed")
        elif error_code == 'AccessDenied':
            print("Possible issues:")
            print("  - IAM user doesn't have S3 permissions")
            print("  - Bucket policy restricts access")
            print()
            print("Solution:")
            print("  1. Check IAM permissions at: https://console.aws.amazon.com/iam/")
            print("  2. Add S3 read/write permissions")
        else:
            print("Check AWS status: https://status.aws.amazon.com/")
        
        return False
        
    except Exception as e:
        print()
        print("[ERROR] Unexpected error")
        print("-" * 60)
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    success = test_s3_connection()
    sys.exit(0 if success else 1)

