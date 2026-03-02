"""S3 service for file operations."""

import os
import uuid
import base64
from typing import Optional
from datetime import datetime, timedelta, timezone

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile


def _get_s3_config() -> dict:
    """Resolve S3/R2 config from AWS_* or R2_* environment variables."""
    access_key = (
        (os.getenv("AWS_ACCESS_KEY_ID") or "").strip()
        or (os.getenv("R2_ACCESS_KEY_ID") or "").strip()
    )
    secret_key = (
        (os.getenv("AWS_SECRET_ACCESS_KEY") or "").strip()
        or (os.getenv("R2_SECRET_ACCESS_KEY") or "").strip()
    )
    bucket = (
        (os.getenv("AWS_S3_BUCKET") or "").strip()
        or (os.getenv("R2_BUCKET_NAME") or "").strip()
    )
    endpoint_url = (
        (os.getenv("AWS_S3_ENDPOINT_URL") or "").strip()
        or (os.getenv("R2_ENDPOINT_URL") or "").strip()
    )
    region = (os.getenv("AWS_REGION") or "").strip() or (os.getenv("R2_REGION") or "").strip()
    is_r2 = endpoint_url and "r2.cloudflarestorage.com" in endpoint_url
    if is_r2:
        region = region or "auto"  # R2 requires region "auto"
    elif not region:
        region = "us-east-1"
    return {
        "access_key_id": access_key or None,
        "secret_access_key": secret_key or None,
        "region": region,
        "bucket": bucket or None,
        "endpoint_url": endpoint_url or None,
    }


_CONFIG = _get_s3_config()
AWS_ACCESS_KEY_ID = _CONFIG["access_key_id"]
AWS_SECRET_ACCESS_KEY = _CONFIG["secret_access_key"]
AWS_REGION = _CONFIG["region"]
AWS_S3_BUCKET = _CONFIG["bucket"]
AWS_S3_ENDPOINT_URL = _CONFIG["endpoint_url"]

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

    @staticmethod
    def _encode_filename_for_metadata(filename: str) -> str:
        """
        Encode filename to ASCII-safe string for S3 metadata.
        S3 metadata can only contain ASCII characters.
        
        Args:
            filename: Original filename (may contain non-ASCII characters)
            
        Returns:
            ASCII-safe encoded filename
        """
        if not filename:
            return ""
        
        # Try to encode as ASCII, replacing non-ASCII characters
        try:
            # First, try to encode as ASCII (will fail if non-ASCII chars exist)
            filename.encode('ascii')
            return filename
        except UnicodeEncodeError:
            # If non-ASCII characters exist, encode as base64
            # This preserves all information while being ASCII-safe
            encoded = base64.b64encode(filename.encode('utf-8')).decode('ascii')
            return f"base64:{encoded}"

    @staticmethod
    def _decode_filename_from_metadata(encoded_filename: str) -> str:
        """
        Decode filename from S3 metadata.
        
        Args:
            encoded_filename: Encoded filename from S3 metadata
            
        Returns:
            Decoded original filename
        """
        if not encoded_filename:
            return ""
        
        # Check if it's base64 encoded
        if encoded_filename.startswith("base64:"):
            try:
                encoded_part = encoded_filename[7:]  # Remove "base64:" prefix
                decoded = base64.b64decode(encoded_part).decode('utf-8')
                return decoded
            except Exception:
                # If decoding fails, return as-is
                return encoded_filename
        
        # If not encoded, return as-is
        return encoded_filename

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
            # Encode filename for S3 metadata (must be ASCII-only)
            encoded_filename = self._encode_filename_for_metadata(file.filename or "")
            
            s3_client.put_object(
                Bucket=AWS_S3_BUCKET,
                Key=file_key,
                Body=file_content,
                ContentType=file.content_type or "application/octet-stream",
                Metadata={
                    "original_filename": encoded_filename,
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id or "",
                },
            )

            # Generate presigned URL (valid for 7 days - S3 maximum)
            # Note: S3/DigitalOcean Spaces limits presigned URLs to max 7 days (604800 seconds)
            url = self.generate_presigned_url(file_key, expiration=604800)  # 7 days

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
        expiration: int = 604800,
    ) -> str:
        """
        Generate a presigned URL for a file.
        
        Args:
            file_key: S3 object key
            expiration: URL expiration time in seconds (default: 7 days, max: 604800)
                       S3/DigitalOcean Spaces limits presigned URLs to maximum 7 days
            
        Returns:
            Presigned URL string
        """
        if not AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET is not configured")

        # Ensure expiration doesn't exceed S3 maximum (7 days = 604800 seconds)
        max_expiration = 604800  # 7 days in seconds
        expiration = min(expiration, max_expiration)

        try:
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': AWS_S3_BUCKET, 'Key': file_key},
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            raise ValueError(f"Failed to generate presigned URL: {str(e)}")

    def get_file_content(self, file_key: str) -> bytes:
        """
        Download file content from S3.

        Args:
            file_key: S3 object key

        Returns:
            File content as bytes
        """
        if not AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET is not configured")
        try:
            response = s3_client.get_object(Bucket=AWS_S3_BUCKET, Key=file_key)
            return response["Body"].read()
        except ClientError as e:
            raise ValueError(f"Failed to download file from S3: {str(e)}")

    def get_file_metadata(self, file_key: str) -> dict:
        """
        Get file metadata from S3.
        
        Args:
            file_key: S3 object key
            
        Returns:
            dict with file metadata (original_filename is decoded if it was encoded)
        """
        if not AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET is not configured")

        try:
            response = s3_client.head_object(Bucket=AWS_S3_BUCKET, Key=file_key)
            metadata = response.get("Metadata", {})
            
            # Decode original_filename if it was encoded
            if "original_filename" in metadata:
                metadata["original_filename"] = self._decode_filename_from_metadata(
                    metadata["original_filename"]
                )
            
            return {
                "size": response.get("ContentLength", 0),
                "content_type": response.get("ContentType", ""),
                "last_modified": response.get("LastModified"),
                "metadata": metadata,
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

