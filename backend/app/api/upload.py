"""File upload endpoints."""

import os
import re
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, File as FileModel
from app.schemas.file import FileResponse, FileUploadResponse
from app.services.s3_service import S3Service

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Security constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.csv'}
ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv'
}


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and injection."""
    # Remove directory separators
    filename = os.path.basename(filename)
    # Remove dangerous characters, keep only alphanumeric, dots, dashes, underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    # Limit length
    filename = filename[:255]
    return filename



def validate_file_content(file: UploadFile) -> None:
    """
    Validate file content using magic bytes (file signature).
    
    This provides an additional layer of security by checking the actual
    file content, not just the extension or MIME type declared by the client.
    
    Args:
        file: FastAPI UploadFile object
        
    Raises:
        HTTPException: If file content doesn't match declared type
    """
    try:
        # Try to import python-magic (optional dependency)
        try:
            import magic
            has_magic = True
        except ImportError:
            # If python-magic is not available, skip content validation
            # but log a warning
            from app.core.logging import logger
            logger.warning("python-magic not installed, skipping file content validation")
            has_magic = False
        
        if not has_magic:
            return
        
        # Read file content
        file_content = file.file.read()
        file.file.seek(0)  # Reset file pointer
        
        # Check magic bytes
        mime_type = magic.from_buffer(file_content, mime=True)
        
        # Map extensions to expected MIME types
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        expected_mime_types = {
            '.jpg': ['image/jpeg'],
            '.jpeg': ['image/jpeg'],
            '.png': ['image/png'],
            '.gif': ['image/gif'],
            '.pdf': ['application/pdf'],
            '.doc': ['application/msword'],
            '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            '.txt': ['text/plain'],
            '.csv': ['text/csv', 'text/plain'],
        }
        
        # Verify MIME type matches extension
        if file_ext in expected_mime_types:
            if mime_type not in expected_mime_types[file_ext]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File content ({mime_type}) doesn't match extension ({file_ext})"
                )
        
        # Verify MIME type is allowed
        if mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File MIME type not allowed: {mime_type}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        # If magic bytes check fails, log but don't block (fallback to basic validation)
        from app.core.logging import logger
        logger.warning(f"File content validation error: {e}")
        # Continue with basic validation


def validate_file(file: UploadFile) -> None:
    """Validate file size, type, and name."""
    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided",
        )
    
    # Sanitize filename
    sanitized_filename = sanitize_filename(file.filename)
    if sanitized_filename != file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename",
        )
    
    # Check extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    
    # Check MIME type if provided
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File MIME type not allowed",
        )


@router.post("/file", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Query("uploads", description="Folder path in S3"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file to S3 with security validations."""
    # Validate file
    validate_file(file)
    validate_file_content(file)
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size only for non-image files (images have no size limit)
    is_image = file.content_type and file.content_type.startswith('image/')
    if not is_image and file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.0f}MB",
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )
    
    # Reset file pointer for upload
    await file.seek(0)

    # Check if S3 is configured
    if not S3Service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File upload service is not configured. Please contact the administrator.",
        )

    try:
        # Upload to S3
        s3_service = S3Service()
        upload_result = s3_service.upload_file(
            file=file,
            folder=folder,
            user_id=str(current_user.id),
        )

        # Save file metadata to database
        file_record = FileModel(
            user_id=current_user.id,
            file_key=upload_result["file_key"],
            filename=upload_result["filename"] or "unknown",
            original_filename=upload_result["filename"] or "unknown",
            content_type=upload_result["content_type"],
            size=upload_result["size"],
            url=upload_result["url"],
            folder=folder,
        )

        db.add(file_record)
        await db.commit()
        await db.refresh(file_record)

        return FileUploadResponse(
            id=file_record.id,
            filename=file_record.filename,
            original_filename=file_record.original_filename,
            size=file_record.size,
            url=file_record.url,
            content_type=file_record.content_type,
            uploaded_at=file_record.created_at,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get file metadata."""
    result = await db.execute(
        select(FileModel).where(FileModel.id == file_id)
    )
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Check if user owns the file or is admin (you can add admin check)
    if file_record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this file",
        )

    # Regenerate presigned URL if needed
    if S3Service.is_configured():
        try:
            s3_service = S3Service()
            file_record.url = s3_service.generate_presigned_url(
                file_record.file_key,
                expiration=3600,  # 1 hour
            )
            await db.commit()
            await db.refresh(file_record)
        except Exception:
            # If URL generation fails, use existing URL
            pass

    return file_record


@router.get("/", response_model=list[FileResponse])
async def list_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's files."""
    result = await db.execute(
        select(FileModel)
        .where(FileModel.user_id == current_user.id)
        .order_by(FileModel.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    files = result.scalars().all()

    # Regenerate presigned URLs if needed
    if S3Service.is_configured():
        s3_service = S3Service()
        for file_record in files:
            try:
                file_record.url = s3_service.generate_presigned_url(
                    file_record.file_key,
                    expiration=3600,  # 1 hour
                )
            except Exception:
                # If URL generation fails, use existing URL
                pass

    return files


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete file from S3 and database."""
    result = await db.execute(
        select(FileModel).where(FileModel.id == file_id)
    )
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Check if user owns the file
    if file_record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this file",
        )

    # Delete from S3
    if S3Service.is_configured():
        try:
            s3_service = S3Service()
            s3_service.delete_file(file_record.file_key)
        except ValueError as e:
            # Log error but continue with database deletion
            pass

    # Delete from database
    db.delete(file_record)
    await db.commit()

    return None
