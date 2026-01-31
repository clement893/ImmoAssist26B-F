"""S3 service for file operations."""

import os
import uuid
from typing import Optional
from datetime import datetime, timedelta, timezone

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

# AWS S3 configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL")  # For S3-compatible services like DigitalOcean Spaces

# Initialize S3 client
s3_client = None
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
        endpoint_url=AWS_S3_ENDPOINT_URL,
    )


class S3Service:
    """Service for S3 file operations."""

    def __init__(self):
        """Initialize S3 service."""
        if not s3_client:
            raise ValueError("S3 client not configured. Please set AWS credentials.")

    def upload_file(
        self,
        file: UploadFile,
        folder: str = "uploads",
        user_id: Optional[str] = None,
    ) -> dict:
        """
        Upload a file to S3.
        
        Args:
            file: FastAPI UploadFile object
            folder: Folder path in S3 bucket
            user_id: Optional user ID for organizing files
            
        Returns:
            dict with file_key, url, size, and content_type
        """
        if not AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET is not configured")

        # Generate unique file key
        file_extension = os.path.splitext(file.filename or "")[1]
        file_id = str(uuid.uuid4())
        file_key = f"{folder}/{user_id}/{file_id}{file_extension}" if user_id else f"{folder}/{file_id}{file_extension}"

        # Read file content
        file_content = file.file.read()
        file_size = len(file_content)

        # Upload to S3
        try:
            s3_client.put_object(
                Bucket=AWS_S3_BUCKET,
                Key=file_key,
                Body=file_content,
                ContentType=file.content_type or "application/octet-stream",
                Metadata={
                    "original_filename": file.filename or "",
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id or "",
                },
            )

            # Generate presigned URL (valid for 1 year)
            url = self.generate_presigned_url(file_key, expiration=31536000)  # 1 year

            return {
                "file_key": file_key,
                "url": url,
                "size": file_size,
                "content_type": file.content_type or "application/octet-stream",
                "filename": file.filename,
            }
        except ClientError as e:
            raise ValueError(f"Failed to upload file to S3: {str(e)}")

    def delete_file(self, file_key: str) -> bool:
        """
        Delete a file from S3.
        
        Args:
            file_key: S3 object key
            
        Returns:
            True if successful, False otherwise
        """
        if not AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET is not configured")

        try:
            s3_client.delete_object(Bucket=AWS_S3_BUCKET, Key=file_key)
            return True
        except ClientError as e:
            raise ValueError(f"Failed to delete file from S3: {str(e)}")

    def generate_presigned_url(
        self,
        file_key: str,
        expiration: int = 3600,
    ) -> str:
        """
        Generate a presigned URL for a file.
        
        Args:
            file_key: S3 object key
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Presigned URL string
        """
        if not AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET is not configured")

        try:
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': AWS_S3_BUCKET, 'Key': file_key},
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            raise ValueError(f"Failed to generate presigned URL: {str(e)}")

    def get_file_metadata(self, file_key: str) -> dict:
        """
        Get file metadata from S3.
        
        Args:
            file_key: S3 object key
            
        Returns:
            dict with file metadata
        """
        if not AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET is not configured")

        try:
            response = s3_client.head_object(Bucket=AWS_S3_BUCKET, Key=file_key)
            return {
                "size": response.get("ContentLength", 0),
                "content_type": response.get("ContentType", ""),
                "last_modified": response.get("LastModified"),
                "metadata": response.get("Metadata", {}),
            }
        except ClientError as e:
            raise ValueError(f"Failed to get file metadata: {str(e)}")

    @staticmethod
    def is_configured() -> bool:
        """Check if S3 is properly configured."""
        return bool(
            AWS_ACCESS_KEY_ID
            and AWS_SECRET_ACCESS_KEY
            and AWS_S3_BUCKET
            and s3_client
        )

