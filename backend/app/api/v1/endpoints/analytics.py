"""
Analytics API Endpoints
Dashboard analytics metrics
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.models.user import User
from app.models.project import Project
from app.dependencies import get_current_user, get_db
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.tenancy_helpers import apply_tenant_scope
from fastapi import Request

router = APIRouter()


class AnalyticsMetric(BaseModel):
    label: str
    value: float
    change: Optional[float] = None
    changeType: Optional[str] = None  # 'increase' or 'decrease'
    format: Optional[str] = None  # 'number', 'currency', 'percentage'


class AnalyticsResponse(BaseModel):
    metrics: List[AnalyticsMetric]


@router.get("/analytics/metrics", response_model=AnalyticsResponse, tags=["analytics"])
async def get_analytics_metrics(
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get analytics metrics for the dashboard"""
    
    # Parse date range or use defaults
    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    else:
        end_dt = datetime.utcnow()
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    else:
        start_dt = end_dt - timedelta(days=30)
    
    # Calculate metrics from projects
    projects_query = select(Project).where(
        Project.user_id == current_user.id,
        Project.created_at >= start_dt,
        Project.created_at <= end_dt
    )
    projects_query = apply_tenant_scope(projects_query, Project)
    
    result = await db.execute(projects_query)
    projects = result.scalars().all()
    
    # Calculate previous period for comparison
    period_duration = end_dt - start_dt
    prev_start_dt = start_dt - period_duration
    prev_end_dt = start_dt
    
    prev_projects_query = select(Project).where(
        Project.user_id == current_user.id,
        Project.created_at >= prev_start_dt,
        Project.created_at < prev_end_dt
    )
    prev_projects_query = apply_tenant_scope(prev_projects_query, Project)
    prev_result = await db.execute(prev_projects_query)
    prev_projects = prev_result.scalars().all()
    
    # Calculate metrics
    total_projects = len(projects)
    active_projects = len([p for p in projects if p.status == 'active'])
    prev_total = len(prev_projects)
    
    # Calculate growth
    growth = 0.0
    if prev_total > 0:
        growth = ((total_projects - prev_total) / prev_total) * 100
    elif total_projects > 0:
        growth = 100.0
    
    # Build metrics
    metrics = [
        AnalyticsMetric(
            label="Total Projects",
            value=float(total_projects),
            change=abs(growth) if growth != 0 else None,
            changeType="increase" if growth >= 0 else "decrease",
            format="number"
        ),
        AnalyticsMetric(
            label="Active Projects",
            value=float(active_projects),
            change=None,
            changeType=None,
            format="number"
        ),
        AnalyticsMetric(
            label="Growth Rate",
            value=abs(growth),
            change=None,
            changeType="increase" if growth >= 0 else "decrease",
            format="percentage"
        ),
    ]
    
    # Log data access
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_ACCESSED,
            description=f"Accessed analytics metrics from {start_date} to {end_date}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return AnalyticsResponse(metrics=metrics)
