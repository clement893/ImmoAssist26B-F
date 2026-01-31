"""
Data Import API Endpoints
"""

from typing import Optional, Callable
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, Field

from app.services.import_service import ImportService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.logging import logger

router = APIRouter()


class ImportResponse(BaseModel):
    """Import response model"""
    total_rows: int
    valid_rows: int
    invalid_rows: int
    errors: list
    warnings: list
    data: list


@router.post("/import", response_model=ImportResponse, tags=["imports"])
async def import_data(
    file: UploadFile = File(...),
    format: str = "auto",
    encoding: str = "utf-8",
    has_headers: bool = True,
    current_user: User = Depends(get_current_user),
):
    """
    Import data from various formats (CSV, Excel, JSON).
    
    Format can be 'auto' (detected from filename) or explicit: 'csv', 'excel', 'json'.
    File is validated for size (max 10MB) and format before processing.
    
    Args:
        file: File to import (CSV, Excel, or JSON)
        format: File format ('auto', 'csv', 'excel', or 'json')
        encoding: File encoding (default: utf-8)
        has_headers: Whether first row contains headers (default: True)
        current_user: Authenticated user
        
    Returns:
        ImportResponse: Import results with data, errors, and warnings
        
    Raises:
        HTTPException: 400 if file format is invalid or unsupported
        HTTPException: 400 if file is too large
        HTTPException: 503 if required dependencies are missing
    """
    from app.core.file_validation import validate_import_file
    
    # Validate file before processing
    is_valid, error = validate_import_file(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Invalid import file"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Detect format if auto
        if format == "auto":
            filename_lower = file.filename.lower() if file.filename else ""
            if filename_lower.endswith('.csv'):
                format = 'csv'
            elif filename_lower.endswith(('.xlsx', '.xls')):
                format = 'excel'
            elif filename_lower.endswith('.json'):
                format = 'json'
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not detect file format. Please specify format parameter."
                )
        
        # Import based on format
        if format == 'csv':
            result = ImportService.import_from_csv(
                file_content=file_content,
                encoding=encoding,
                has_headers=has_headers
            )
        elif format == 'excel':
            result = ImportService.import_from_excel(
                file_content=file_content,
                has_headers=has_headers
            )
        elif format == 'json':
            result = ImportService.import_from_json(
                file_content=file_content,
                encoding=encoding
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {format}. Supported: csv, excel, json"
            )
        
        logger.info(f"User {current_user.id} imported {result['total_rows']} rows ({result['valid_rows']} valid, {result['invalid_rows']} invalid)")
        
        return ImportResponse(**result)
        
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Import error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import data: {str(e)}"
        )


@router.get("/formats", tags=["imports"])
async def get_import_formats(
    current_user: User = Depends(get_current_user),
):
    """
    Get list of available import formats
    """
    formats = ImportService.get_import_formats()
    return {
        "formats": formats,
        "details": {
            "csv": "Comma-separated values",
            "excel": "Microsoft Excel (.xlsx, .xls)",
            "json": "JSON format"
        }
    }

