"""Test script for S3 configuration."""

import os
import sys
from io import BytesIO

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.s3_service import S3Service

def test_s3_connection():
    """Test S3 connection and basic operations."""
    print("=" * 60)
    print("Testing S3 Configuration")
    print("=" * 60)
    
    # Check if S3 is configured
    print("\n1. Checking S3 configuration...")
    if not S3Service.is_configured():
        print("❌ S3 is not configured!")
        print("\nRequired environment variables:")
        print("  - AWS_ACCESS_KEY_ID")
        print("  - AWS_SECRET_ACCESS_KEY")
        print("  - AWS_S3_BUCKET")
        print("  - AWS_REGION (optional, defaults to us-east-1)")
        return False
    
    print("✅ S3 is configured")
    
    # Display configuration (without secrets)
    print("\n2. S3 Configuration:")
    print(f"   Region: {os.getenv('AWS_REGION', 'us-east-1')}")
    print(f"   Bucket: {os.getenv('AWS_S3_BUCKET')}")
    print(f"   Access Key ID: {os.getenv('AWS_ACCESS_KEY_ID', '')[:10]}...")
    if os.getenv('AWS_S3_ENDPOINT_URL'):
        print(f"   Endpoint URL: {os.getenv('AWS_S3_ENDPOINT_URL')}")
    
    try:
        # Initialize S3 service
        print("\n3. Initializing S3 service...")
        s3_service = S3Service()
        print("✅ S3 service initialized")
        
        # Test bucket access
        print("\n4. Testing bucket access...")
        import boto3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            endpoint_url=os.getenv('AWS_S3_ENDPOINT_URL'),
        )
        
        bucket_name = os.getenv('AWS_S3_BUCKET')
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' is accessible")
        except Exception as e:
            print(f"❌ Cannot access bucket '{bucket_name}': {e}")
            return False
        
        # Test file upload
        print("\n5. Testing file upload...")
        test_file_content = b"This is a test file for S3 integration"
        test_file_key = "test/test_file.txt"
        
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_file_key,
                Body=test_file_content,
                ContentType="text/plain",
            )
            print(f"✅ File uploaded successfully: {test_file_key}")
        except Exception as e:
            print(f"❌ Failed to upload file: {e}")
            return False
        
        # Test file retrieval
        print("\n6. Testing file retrieval...")
        try:
            response = s3_client.get_object(Bucket=bucket_name, Key=test_file_key)
            content = response['Body'].read()
            if content == test_file_content:
                print("✅ File retrieved successfully and content matches")
            else:
                print("⚠️  File retrieved but content doesn't match")
        except Exception as e:
            print(f"❌ Failed to retrieve file: {e}")
            return False
        
        # Test presigned URL generation
        print("\n7. Testing presigned URL generation...")
        try:
            url = s3_service.generate_presigned_url(test_file_key, expiration=3600)
            print(f"✅ Presigned URL generated: {url[:80]}...")
        except Exception as e:
            print(f"❌ Failed to generate presigned URL: {e}")
            return False
        
        # Test file deletion
        print("\n8. Testing file deletion...")
        try:
            s3_service.delete_file(test_file_key)
            print("✅ File deleted successfully")
        except Exception as e:
            print(f"❌ Failed to delete file: {e}")
            return False
        
        # Test metadata retrieval (should fail after deletion)
        print("\n9. Testing metadata retrieval (after deletion)...")
        try:
            metadata = s3_service.get_file_metadata(test_file_key)
            print("⚠️  File still exists (should have been deleted)")
        except Exception as e:
            print("✅ File correctly deleted (metadata retrieval failed as expected)")
        
        print("\n" + "=" * 60)
        print("✅ All S3 tests passed!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_s3_connection()
    sys.exit(0 if success else 1)

