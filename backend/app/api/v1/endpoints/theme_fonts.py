"""
API endpoints for theme font management.
"""
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sql_func
from app.schemas.theme_font import ThemeFontCreate, ThemeFontResponse, ThemeFontListResponse
from app.models.theme_font import ThemeFont
from app.models.user import User
from app.core.database import get_db
from app.dependencies import get_current_user, require_superadmin
from app.services.s3_service import S3Service
import os
import re

router = APIRouter()

# Font upload constants
MAX_FONT_SIZE = 5 * 1024 * 1024  # 5MB per font file
ALLOWED_FONT_EXTENSIONS = {'.woff', '.woff2', '.ttf', '.otf'}
ALLOWED_FONT_MIME_TYPES = {
    'font/woff',
    'font/woff2',
    'application/font-woff',
    'application/font-woff2',
    'font/ttf',
    'font/otf',
    'application/x-font-ttf',
    'application/x-font-opentype',
    'application/octet-stream',  # Fallback MIME type used by some browsers
}


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and injection."""
    filename = os.path.basename(filename)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    filename = filename[:255]
    return filename


def validate_font_file(file: UploadFile) -> tuple[str, str]:
    """
    Validate font file and return format and sanitized filename.
    
    Returns:
        tuple: (font_format, sanitized_filename)
    """
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
    if file_ext not in ALLOWED_FONT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Font file type not allowed. Allowed types: {', '.join(ALLOWED_FONT_EXTENSIONS)}",
        )
    
    # Map extension to format
    format_map = {
        '.woff': 'woff',
        '.woff2': 'woff2',
        '.ttf': 'ttf',
        '.otf': 'otf',
    }
    font_format = format_map[file_ext]
    
    # Check MIME type if provided
    # If MIME type is application/octet-stream, rely on file extension validation instead
    # This is common when browsers don't recognize font file types
    if file.content_type:
        normalized_mime = file.content_type.lower()
        # Allow application/octet-stream as fallback when extension is valid
        if normalized_mime == 'application/octet-stream':
            # Extension validation already passed, so we accept this MIME type
            pass
        elif normalized_mime not in ALLOWED_FONT_MIME_TYPES:
            # Try alternative MIME types
            mime_map = {
                'application/font-woff': 'font/woff',
                'application/font-woff2': 'font/woff2',
                'application/x-font-ttf': 'font/ttf',
                'application/x-font-opentype': 'font/otf',
            }
            if normalized_mime in mime_map:
                pass  # Accept alternative MIME types
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Font MIME type not allowed: {file.content_type}",
                )
    
    return font_format, sanitized_filename


@router.post("", response_model=ThemeFontResponse, status_code=status.HTTP_201_CREATED, tags=["theme-fonts"])
async def upload_font(
    file: UploadFile = File(...),
    name: str = None,
    font_family: str = None,
    description: str = None,
    font_weight: str = None,
    font_style: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin),
):
    """
    Upload a custom font file.
    Requires superadmin authentication.
    """
    # Validate file
    font_format, sanitized_filename = validate_font_file(file)
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size
    if file_size > MAX_FONT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Font file too large. Maximum size is {MAX_FONT_SIZE / (1024 * 1024):.0f}MB",
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Font file is empty",
        )
    
    # Reset file pointer for upload
    await file.seek(0)
    
    # Check if S3 is configured
    if not S3Service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Font upload service is not configured. Please contact the administrator.",
        )
    
    # Generate font name and font_family if not provided
    if not name:
        name = os.path.splitext(sanitized_filename)[0].replace('_', ' ').replace('-', ' ').title()
    
    if not font_family:
        # Extract font family from filename (remove weight/style suffixes)
        font_family = os.path.splitext(sanitized_filename)[0]
        # Remove common weight/style suffixes
        font_family = re.sub(r'[-_]?(bold|light|regular|medium|semibold|black|thin|italic|oblique)$', '', font_family, flags=re.IGNORECASE)
        font_family = re.sub(r'[-_]?(\d+)$', '', font_family)  # Remove numeric suffixes
        font_family = font_family.replace('_', ' ').replace('-', ' ').strip()
        if not font_family:
            font_family = name
    
    try:
        # Upload to S3 in fonts folder
        s3_service = S3Service()
        upload_result = s3_service.upload_file(
            file=file,
            folder="fonts",
            user_id=str(current_user.id),
        )
        
        # Determine MIME type
        mime_type_map = {
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'otf': 'font/otf',
        }
        mime_type = mime_type_map.get(font_format, file.content_type or 'application/octet-stream')
        
        # Check if font_family already exists
        result = await db.execute(
            select(ThemeFont).where(ThemeFont.font_family == font_family)
        )
        existing_font = result.scalar_one_or_none()
        
        if existing_font:
            # Update existing font or create variant
            # For now, we'll allow multiple fonts with same family name (different weights/styles)
            pass
        
        # Create font record
        font_record = ThemeFont(
            name=name,
            font_family=font_family,
            description=description,
            file_key=upload_result["file_key"],
            filename=sanitized_filename,
            file_size=file_size,
            mime_type=mime_type,
            url=upload_result["url"],
            font_format=font_format,
            font_weight=font_weight or "normal",
            font_style=font_style or "normal",
            created_by=current_user.id,
        )
        
        db.add(font_record)
        await db.commit()
        await db.refresh(font_record)
        
        return ThemeFontResponse.model_validate(font_record)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload font: {str(e)}",
        )


@router.get("", response_model=ThemeFontListResponse, tags=["theme-fonts"])
async def list_fonts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin),
):
    """
    List all uploaded fonts.
    Requires superadmin authentication.
    """
    # Get total count
    count_result = await db.execute(
        select(sql_func.count(ThemeFont.id))
    )
    total = count_result.scalar() or 0
    
    # Get fonts
    result = await db.execute(
        select(ThemeFont)
        .order_by(ThemeFont.font_family, ThemeFont.font_weight, ThemeFont.font_style)
        .offset(skip)
        .limit(limit)
    )
    fonts = result.scalars().all()
    
    # Regenerate presigned URLs if needed
    if S3Service.is_configured():
        s3_service = S3Service()
        for font in fonts:
            try:
                font.url = s3_service.generate_presigned_url(
                    font.file_key,
                    expiration=31536000,  # 1 year
                )
            except Exception:
                pass
    
    return ThemeFontListResponse(
        fonts=[ThemeFontResponse.model_validate(font) for font in fonts],
        total=total,
    )


@router.get("/{font_id}", response_model=ThemeFontResponse, tags=["theme-fonts"])
async def get_font(
    font_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin),
):
    """
    Get a specific font by ID.
    Requires superadmin authentication.
    """
    result = await db.execute(
        select(ThemeFont).where(ThemeFont.id == font_id)
    )
    font = result.scalar_one_or_none()
    
    if not font:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Font with ID {font_id} not found",
        )
    
    # Regenerate presigned URL if needed
    if S3Service.is_configured():
        try:
            s3_service = S3Service()
            font.url = s3_service.generate_presigned_url(
                font.file_key,
                expiration=31536000,  # 1 year
            )
        except Exception:
            pass
    
    return ThemeFontResponse.model_validate(font)


@router.post("/check", response_model=Dict[str, bool], tags=["theme-fonts"])
async def check_fonts(
    font_families: List[str] = Body(..., description="List of font family names to check"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check if font families exist in the database.
    Returns a dictionary mapping font family names to boolean (exists or not).
    Requires authentication.
    """
    if not font_families:
        return {}
    
    # Extract font family names from CSS font-family strings (e.g., "Inter, sans-serif" -> "Inter")
    def extract_font_name(font_family: str) -> str:
        # Remove quotes and extract first font name before comma
        font_family = font_family.replace('"', '').replace("'", '').strip()
        parts = font_family.split(',')
        return parts[0].strip() if parts else font_family.strip()
    
    # Normalize font family names
    normalized_families = [extract_font_name(f) for f in font_families]
    
    # Query database for existing fonts
    result = await db.execute(
        select(ThemeFont.font_family).where(
            ThemeFont.font_family.in_(normalized_families)
        ).distinct()
    )
    existing_fonts = {row[0] for row in result.all()}
    
    # Build response dictionary
    response = {}
    for font_family in normalized_families:
        response[font_family] = font_family in existing_fonts
    
    return response


@router.delete("/{font_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["theme-fonts"])
async def delete_font(
    font_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin),
):
    """
    Delete a font.
    Requires superadmin authentication.
    """
    result = await db.execute(
        select(ThemeFont).where(ThemeFont.id == font_id)
    )
    font = result.scalar_one_or_none()
    
    if not font:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Font with ID {font_id} not found",
        )
    
    # Delete from S3
    if S3Service.is_configured():
        try:
            s3_service = S3Service()
            s3_service.delete_file(font.file_key)
        except Exception:
            pass
    
    # Delete from database
    await db.delete(font)
    await db.commit()
    
    return None

