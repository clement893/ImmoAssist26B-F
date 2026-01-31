"""
File Validation Utilities
Validates file uploads for size, type, and format
"""

from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException, status


# Allowed file types by category
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", 
    "image/webp", "image/svg+xml"
}

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain"
}

ALLOWED_ARCHIVE_TYPES = {
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/gzip"
}

# File size limits (in bytes)
# Images: No size limit (removed 5MB restriction)
MAX_FILE_SIZE_IMAGE = None  # No limit for images
MAX_FILE_SIZE_DOCUMENT = 10 * 1024 * 1024  # 10 MB
MAX_FILE_SIZE_ARCHIVE = 50 * 1024 * 1024  # 50 MB
MAX_FILE_SIZE_GENERIC = 10 * 1024 * 1024  # 10 MB default


def validate_file_size(
    file: UploadFile,
    max_size: Optional[int] = MAX_FILE_SIZE_GENERIC
) -> Tuple[bool, Optional[str]]:
    """
    Validate file size.
    
    Args:
        file: UploadFile to validate
        max_size: Maximum allowed size in bytes (None = no limit)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # If max_size is None, skip size validation (no limit)
    if max_size is None:
        return True, None
    
    if file.size and file.size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        return False, f"File size exceeds maximum allowed size of {max_size_mb:.1f} MB"
    return True, None


def validate_file_type(
    file: UploadFile,
    allowed_types: Optional[List[str]] = None,
    allowed_extensions: Optional[List[str]] = None
) -> Tuple[bool, Optional[str]]:
    """
    Validate file type by MIME type and/or extension.
    
    Args:
        file: UploadFile to validate
        allowed_types: List of allowed MIME types (e.g., ["image/jpeg", "image/png"])
        allowed_extensions: List of allowed file extensions (e.g., [".jpg", ".png"])
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check MIME type if provided
    if allowed_types and file.content_type:
        if file.content_type not in allowed_types:
            return False, f"File type '{file.content_type}' not allowed. Allowed types: {', '.join(allowed_types)}"
    
    # Check extension if provided
    if allowed_extensions and file.filename:
        file_ext = None
        if '.' in file.filename:
            file_ext = '.' + file.filename.rsplit('.', 1)[1].lower()
        
        if file_ext and file_ext not in allowed_extensions:
            return False, f"File extension '{file_ext}' not allowed. Allowed extensions: {', '.join(allowed_extensions)}"
    
    return True, None


def validate_image_file(file: UploadFile, max_size: Optional[int] = MAX_FILE_SIZE_IMAGE) -> Tuple[bool, Optional[str]]:
    """
    Validate image file (type and size).
    
    Args:
        file: UploadFile to validate
        max_size: Maximum allowed size in bytes (default: None = no limit for images)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Validate size (no limit if max_size is None)
    is_valid, error = validate_file_size(file, max_size)
    if not is_valid:
        return False, error
    
    # Validate type
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
    is_valid, error = validate_file_type(
        file,
        allowed_types=list(ALLOWED_IMAGE_TYPES),
        allowed_extensions=allowed_extensions
    )
    if not is_valid:
        return False, error
    
    return True, None


def validate_document_file(file: UploadFile, max_size: int = MAX_FILE_SIZE_DOCUMENT) -> Tuple[bool, Optional[str]]:
    """
    Validate document file (type and size).
    
    Args:
        file: UploadFile to validate
        max_size: Maximum allowed size in bytes (default: 10 MB)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Validate size
    is_valid, error = validate_file_size(file, max_size)
    if not is_valid:
        return False, error
    
    # Validate type
    allowed_extensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt"]
    is_valid, error = validate_file_type(
        file,
        allowed_types=list(ALLOWED_DOCUMENT_TYPES),
        allowed_extensions=allowed_extensions
    )
    if not is_valid:
        return False, error
    
    return True, None


def validate_import_file(file: UploadFile, max_size: int = MAX_FILE_SIZE_DOCUMENT) -> Tuple[bool, Optional[str]]:
    """
    Validate import file (CSV, Excel, JSON).
    
    Args:
        file: UploadFile to validate
        max_size: Maximum allowed size in bytes (default: 10 MB)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Validate size
    is_valid, error = validate_file_size(file, max_size)
    if not is_valid:
        return False, error
    
    # Validate type - allow CSV, Excel, JSON
    allowed_extensions = [".csv", ".xls", ".xlsx", ".json"]
    allowed_types = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/json"
    ]
    
    is_valid, error = validate_file_type(
        file,
        allowed_types=allowed_types,
        allowed_extensions=allowed_extensions
    )
    if not is_valid:
        return False, error
    
    return True, None


