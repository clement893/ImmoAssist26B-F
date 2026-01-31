"""
Data Export API Endpoints
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.export_service import ExportService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.logging import logger
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from fastapi import Request
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class ExportRequest(BaseModel):
    """Export request model"""
    format: str = Field(..., description="Export format: csv, excel, json, pdf")
    data: List[Dict[str, Any]] = Field(..., description="Data to export")
    headers: Optional[List[str]] = Field(None, description="Column headers (optional)")
    filename: Optional[str] = Field(None, description="Custom filename (optional)")
    title: Optional[str] = Field(None, description="Title for PDF exports")


@router.post("/export", tags=["exports"])
async def export_data(
    http_request: Request,
    request: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export data to various formats (CSV, Excel, JSON, PDF)
    """
    try:
        # Validate format
        available_formats = ExportService.get_export_formats()
        if request.format not in available_formats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Format '{request.format}' not available. Available formats: {', '.join(available_formats)}"
            )
        
        # Export based on format
        if request.format == 'csv':
            buffer, filename = ExportService.export_to_csv(
                data=request.data,
                headers=request.headers,
                filename=request.filename
            )
            media_type = 'text/csv'
        elif request.format == 'excel':
            buffer, filename = ExportService.export_to_excel(
                data=request.data,
                headers=request.headers,
                filename=request.filename
            )
            media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif request.format == 'json':
            buffer, filename = ExportService.export_to_json(
                data=request.data,
                filename=request.filename
            )
            media_type = 'application/json'
        elif request.format == 'pdf':
            buffer, filename = ExportService.export_to_pdf(
                data=request.data,
                headers=request.headers,
                filename=request.filename,
                title=request.title or "Data Export"
            )
            media_type = 'application/pdf'
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {request.format}"
            )
        
        logger.info(f"User {current_user.id} exported {len(request.data)} rows as {request.format}")
        
        # Log data export
        try:
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.DATA_EXPORTED,
                description=f"Data exported as {request.format} ({len(request.data)} rows)",
                user_id=current_user.id,
                user_email=current_user.email,
                ip_address=http_request.client.host if http_request.client else None,
                user_agent=http_request.headers.get("user-agent"),
                request_method=http_request.method,
                request_path=str(http_request.url.path),
                severity="info",
                success="success",
                metadata={"format": request.format, "row_count": len(request.data), "filename": filename}
            )
        except Exception:
            pass  # Don't fail request if audit logging fails
        
        return StreamingResponse(
            buffer,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
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
        logger.error(f"Export error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export data: {str(e)}"
        )


@router.get("/formats", tags=["exports"])
async def get_export_formats(
    current_user: User = Depends(get_current_user),
):
    """
    Get list of available export formats
    """
    formats = ExportService.get_export_formats()
    return {
        "formats": formats,
        "details": {
            "csv": "Comma-separated values",
            "excel": "Microsoft Excel (.xlsx)",
            "json": "JSON format",
            "pdf": "PDF document"
        }
    }

