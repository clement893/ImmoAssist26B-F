"""
Reports API Endpoints
Dashboard reports management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.report import Report
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.tenancy_helpers import apply_tenant_scope
from fastapi import Request

router = APIRouter()


class ReportField(BaseModel):
    id: str
    name: str
    type: str
    selected: bool


class ReportConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    dateRange: dict = Field(..., description="Date range with start and end")
    fields: List[dict] = Field(default_factory=list, description="Report fields")
    groupBy: Optional[str] = None
    sortBy: Optional[str] = None
    format: str = Field(default='both', pattern='^(table|chart|both)$')


class ReportData(BaseModel):
    table: Optional[List[dict]] = None
    chart: Optional[List[dict]] = None
    chartType: Optional[str] = None


class ReportCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    config: dict = Field(..., description="Report configuration")
    data: Optional[dict] = Field(None, description="Generated report data")


class ReportUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    config: Optional[dict] = None
    data: Optional[dict] = None


class ReportResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    config: dict
    data: Optional[dict] = None
    user_id: int
    generated_at: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.get("/reports", response_model=List[ReportResponse], tags=["reports"])
async def list_reports(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all reports for the current user"""
    query = select(Report).where(Report.user_id == current_user.id)
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Report)
    query = query.order_by(Report.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    # Log data access
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_ACCESSED,
            description=f"Listed {len(reports)} reports",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass  # Don't fail if audit logging fails
    
    return [ReportResponse.model_validate(report) for report in reports]


@router.get("/reports/{report_id}", response_model=ReportResponse, tags=["reports"])
async def get_report(
    report_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a report by ID"""
    query = select(Report).where(
        Report.id == report_id,
        Report.user_id == current_user.id
    )
    query = apply_tenant_scope(query, Report)
    
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Log data access
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_ACCESSED,
            description=f"Accessed report {report_id}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return ReportResponse.model_validate(report)


@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED, tags=["reports"])
async def create_report(
    report_data: ReportCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new report"""
    # Create report
    report = Report(
        name=report_data.name,
        description=report_data.description,
        config=report_data.config,
        data=report_data.data or {},
        user_id=current_user.id,
    )
    
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    # Log creation
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_CREATED,
            description=f"Created report: {report.name}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return ReportResponse.model_validate(report)


@router.put("/reports/{report_id}", response_model=ReportResponse, tags=["reports"])
async def update_report(
    report_id: int,
    report_data: ReportUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a report"""
    query = select(Report).where(
        Report.id == report_id,
        Report.user_id == current_user.id
    )
    query = apply_tenant_scope(query, Report)
    
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Update fields
    if report_data.name is not None:
        report.name = report_data.name
    if report_data.description is not None:
        report.description = report_data.description
    if report_data.config is not None:
        report.config = report_data.config
    if report_data.data is not None:
        report.data = report_data.data
    
    await db.commit()
    await db.refresh(report)
    
    # Log update
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_MODIFIED,
            description=f"Updated report {report_id}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return ReportResponse.model_validate(report)


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["reports"])
async def delete_report(
    report_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a report"""
    query = select(Report).where(
        Report.id == report_id,
        Report.user_id == current_user.id
    )
    query = apply_tenant_scope(query, Report)
    
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    await db.delete(report)
    await db.commit()
    
    # Log deletion
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_DELETED,
            description=f"Deleted report {report_id}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return None


@router.post("/reports/{report_id}/refresh", response_model=ReportResponse, tags=["reports"])
async def refresh_report(
    report_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Refresh a report (regenerate data)"""
    query = select(Report).where(
        Report.id == report_id,
        Report.user_id == current_user.id
    )
    query = apply_tenant_scope(query, Report)
    
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Update generated_at timestamp
    from datetime import datetime
    from sqlalchemy import func
    report.generated_at = func.now()
    
    # In a real implementation, you would regenerate the data here
    # For now, we just update the timestamp
    await db.commit()
    await db.refresh(report)
    
    return ReportResponse.model_validate(report)
