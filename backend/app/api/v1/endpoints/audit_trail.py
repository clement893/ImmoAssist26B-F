"""
Audit Trail API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from datetime import datetime

from app.models.user import User
from app.core.security_audit import SecurityAuditLog
from app.dependencies import get_current_user, is_superadmin
from app.core.database import get_db
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class AuditLogResponse(BaseModel):
    id: int
    timestamp: str
    event_type: str
    severity: str
    user_id: Optional[int]
    user_email: Optional[str]
    api_key_id: Optional[int]
    ip_address: Optional[str]
    user_agent: Optional[str]
    request_method: Optional[str]
    request_path: Optional[str]
    description: str
    message: str  # Alias for description to match frontend
    event_metadata: Optional[dict]
    success: str

    class Config:
        from_attributes = True
    
    def __init__(self, **data):
        # Map description to message if message is not provided
        if 'message' not in data and 'description' in data:
            data['message'] = data['description']
        super().__init__(**data)


@router.get("/audit-trail", response_model=List[AuditLogResponse], tags=["audit-trail"])
async def get_audit_trail(
    user_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get audit trail logs
    
    Superadmins can see all logs. Regular users can only see their own logs.
    """
    from app.core.logging import logger
    
    try:
        # Check if user is superadmin
        user_is_superadmin = await is_superadmin(current_user, db)
        
        query = select(SecurityAuditLog)
        
        # Filter by user
        if user_id:
            # If filtering by specific user_id
            query = query.where(SecurityAuditLog.user_id == user_id)
            # Non-superadmins can only filter their own logs
            if not user_is_superadmin and user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view your own audit logs"
                )
        elif not user_is_superadmin:
            # Non-superadmins can only see their own logs
            query = query.where(SecurityAuditLog.user_id == current_user.id)
        # If superadmin and no user_id filter, show all logs
        
        if event_type:
            query = query.where(SecurityAuditLog.event_type == event_type)
        
        if severity:
            query = query.where(SecurityAuditLog.severity == severity)
        
        if start_date:
            query = query.where(SecurityAuditLog.timestamp >= start_date)
        
        if end_date:
            query = query.where(SecurityAuditLog.timestamp <= end_date)
        
        result = await db.execute(
            query.order_by(desc(SecurityAuditLog.timestamp))
            .limit(limit)
            .offset(offset)
        )
        
        logs = result.scalars().all()
        
        # Convert to response with message field mapped from description
        response_logs = []
        for log in logs:
            try:
                response_logs.append(
                    AuditLogResponse(
                        id=log.id,
                        timestamp=log.timestamp.isoformat() if log.timestamp else "",
                        event_type=log.event_type or "",
                        severity=log.severity or "info",
                        user_id=log.user_id,
                        user_email=log.user_email,
                        api_key_id=log.api_key_id,
                        ip_address=log.ip_address,
                        user_agent=log.user_agent,
                        request_method=log.request_method,
                        request_path=log.request_path,
                        description=log.description or "",
                        message=log.description or "",  # Map description to message for frontend
                        event_metadata=log.event_metadata or {},
                        success=getattr(log, 'success', 'unknown') or 'unknown',
                    )
                )
            except Exception as e:
                logger.error(f"Error converting audit log {log.id} to response: {e}", exc_info=True)
                # Skip this log if conversion fails
                continue
        
        return response_logs
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching audit trail: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while fetching audit logs"
        )


@router.get("/audit-trail/stats", tags=["audit-trail"])
async def get_audit_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get audit trail statistics"""
    from sqlalchemy import func
    
    query = select(SecurityAuditLog).where(SecurityAuditLog.user_id == current_user.id)
    
    if start_date:
        query = query.where(SecurityAuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.where(SecurityAuditLog.timestamp <= end_date)
    
    # Count by event type
    event_type_result = await db.execute(
        select(
            SecurityAuditLog.event_type,
            func.count(SecurityAuditLog.id).label('count')
        ).where(
            SecurityAuditLog.user_id == current_user.id
        ).group_by(SecurityAuditLog.event_type)
    )
    event_type_counts = {row[0]: row[1] for row in event_type_result.all()}
    
    # Count by severity
    severity_result = await db.execute(
        select(
            SecurityAuditLog.severity,
            func.count(SecurityAuditLog.id).label('count')
        ).where(
            SecurityAuditLog.user_id == current_user.id
        ).group_by(SecurityAuditLog.severity)
    )
    severity_counts = {row[0]: row[1] for row in severity_result.all()}
    
    return {
        'event_type_counts': event_type_counts,
        'severity_counts': severity_counts,
    }




