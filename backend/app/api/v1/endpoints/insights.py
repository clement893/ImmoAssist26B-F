"""
Insights API Endpoints
Dashboard insights and analytics
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


class ChartDataPoint(BaseModel):
    label: str
    value: float


class AnalyticsMetric(BaseModel):
    label: str
    value: float
    change: Optional[float] = None
    changeType: Optional[str] = None  # 'increase' or 'decrease'
    format: Optional[str] = None  # 'number', 'currency', 'percentage'


class InsightsResponse(BaseModel):
    metrics: List[AnalyticsMetric]
    trends: List[ChartDataPoint]
    userGrowth: List[ChartDataPoint]


@router.get("/insights", response_model=InsightsResponse, tags=["insights"])
async def get_insights(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard insights including metrics, trends, and user growth"""
    
    # Calculate metrics from projects and activities
    projects_query = select(Project).where(Project.user_id == current_user.id)
    projects_query = apply_tenant_scope(projects_query, Project)
    
    result = await db.execute(projects_query)
    projects = result.scalars().all()
    
    # Calculate project metrics
    total_projects = len(projects)
    active_projects = len([p for p in projects if p.status == 'active'])
    
    # Calculate previous period for comparison (30 days ago)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sixty_days_ago = datetime.utcnow() - timedelta(days=60)
    
    # Get projects from previous period
    prev_projects_query = select(Project).where(
        Project.user_id == current_user.id,
        Project.created_at >= sixty_days_ago,
        Project.created_at < thirty_days_ago
    )
    prev_projects_query = apply_tenant_scope(prev_projects_query, Project)
    prev_result = await db.execute(prev_projects_query)
    prev_projects = prev_result.scalars().all()
    prev_total = len(prev_projects)
    
    # Calculate growth percentage
    project_growth = 0.0
    if prev_total > 0:
        project_growth = ((total_projects - prev_total) / prev_total) * 100
    elif total_projects > 0:
        project_growth = 100.0
    
    # Generate trend data (last 6 months)
    trend_data = []
    for i in range(6):
        month_start = datetime.utcnow() - timedelta(days=30 * (6 - i))
        month_end = month_start + timedelta(days=30)
        
        month_projects_query = select(func.count(Project.id)).where(
            Project.user_id == current_user.id,
            Project.created_at >= month_start,
            Project.created_at < month_end
        )
        month_projects_query = apply_tenant_scope(month_projects_query, Project)
        month_result = await db.execute(month_projects_query)
        month_count = month_result.scalar() or 0
        
        trend_data.append(ChartDataPoint(
            label=month_start.strftime('%b'),
            value=float(month_count)
        ))
    
    # Generate user growth data (simplified - using project counts as proxy)
    user_growth_data = []
    for i in range(6):
        month_start = datetime.utcnow() - timedelta(days=30 * (6 - i))
        month_end = month_start + timedelta(days=30)
        
        month_projects_query = select(func.count(Project.id)).where(
            Project.user_id == current_user.id,
            Project.created_at < month_end
        )
        month_projects_query = apply_tenant_scope(month_projects_query, Project)
        month_result = await db.execute(month_projects_query)
        cumulative_count = month_result.scalar() or 0
        
        user_growth_data.append(ChartDataPoint(
            label=month_start.strftime('%b'),
            value=float(cumulative_count)
        ))
    
    # Build metrics
    metrics = [
        AnalyticsMetric(
            label="Total Projects",
            value=float(total_projects),
            change=abs(project_growth) if project_growth != 0 else None,
            changeType="increase" if project_growth >= 0 else "decrease",
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
            label="Project Growth",
            value=abs(project_growth),
            change=None,
            changeType="increase" if project_growth >= 0 else "decrease",
            format="percentage"
        ),
    ]
    
    # Log data access
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_ACCESSED,
            description="Accessed dashboard insights",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return InsightsResponse(
        metrics=metrics,
        trends=trend_data,
        userGrowth=user_growth_data
    )
