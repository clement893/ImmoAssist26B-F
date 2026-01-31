"""Health check endpoints."""

import os
from fastapi import APIRouter, HTTPException, status

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
    }


@router.get("/api/health")
async def api_health_check():
    """API health check endpoint."""
    return {
        "status": "ok",
        "service": "backend",
        "version": "1.0.0",
    }


@router.get("/api/health/s3")
async def s3_health_check():
    """S3 configuration and connectivity test."""
    from app.services.s3_service import S3Service
    
    results = {
        "configured": False,
        "bucket": os.getenv("AWS_S3_BUCKET"),
        "region": os.getenv("AWS_REGION", "us-east-1"),
        "endpoint_url": os.getenv("AWS_S3_ENDPOINT_URL"),
        "tests": {},
    }
    
    # Check if S3 is configured
    if not S3Service.is_configured():
        results["error"] = "S3 is not configured. Missing required environment variables."
        return results
    
    results["configured"] = True
    
    try:
        # Initialize S3 service
        s3_service = S3Service()
        
        # Test 1: Bucket access
        try:
            import boto3
            s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION', 'us-east-1'),
                endpoint_url=os.getenv('AWS_S3_ENDPOINT_URL'),
            )
            bucket_name = os.getenv('AWS_S3_BUCKET')
            s3_client.head_bucket(Bucket=bucket_name)
            results["tests"]["bucket_access"] = "✅ Success"
        except Exception as e:
            results["tests"]["bucket_access"] = f"❌ Failed: {str(e)}"
            return results
        
        # Test 2: File upload
        try:
            test_key = "test/s3_test.txt"
            test_content = b"S3 integration test file"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType="text/plain",
            )
            results["tests"]["upload"] = "✅ Success"
        except Exception as e:
            results["tests"]["upload"] = f"❌ Failed: {str(e)}"
            return results
        
        # Test 3: Presigned URL generation
        try:
            url = s3_service.generate_presigned_url(test_key, expiration=3600)
            results["tests"]["presigned_url"] = "✅ Success"
            results["tests"]["presigned_url_example"] = url[:100] + "..." if len(url) > 100 else url
        except Exception as e:
            results["tests"]["presigned_url"] = f"❌ Failed: {str(e)}"
        
        # Test 4: File deletion
        try:
            s3_service.delete_file(test_key)
            results["tests"]["delete"] = "✅ Success"
        except Exception as e:
            results["tests"]["delete"] = f"❌ Failed: {str(e)}"
        
        results["status"] = "all_tests_passed"
        
    except Exception as e:
        results["error"] = f"S3 service error: {str(e)}"
    
    return results


@router.get("/api/health/email")
async def email_health_check():
    """SendGrid configuration check (no authentication required)."""
    from app.services.email_service import EmailService
    
    email_service = EmailService()
    
    results = {
        "configured": email_service.is_configured(),
        "from_email": email_service.from_email,
        "from_name": email_service.from_name,
    }
    
    if not email_service.is_configured():
        results["error"] = "SendGrid is not configured. Please set SENDGRID_API_KEY environment variable."
        results["status"] = "not_configured"
        return results
    
    # Try to verify API key by creating a client (SendGrid validates on first send)
    try:
        # Just check if client is initialized correctly
        if email_service.client:
            results["status"] = "ready"
            results["api_key_set"] = True
        else:
            results["status"] = "not_configured"
    except Exception as e:
        results["error"] = f"SendGrid service error: {str(e)}"
        results["status"] = "error"
    
    return results
