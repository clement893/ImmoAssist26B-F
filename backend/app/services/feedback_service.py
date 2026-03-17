"""
Feedback Service
Manages user feedback and support tickets
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import Feedback, FeedbackAttachment, FeedbackType, FeedbackStatus
from app.core.logging import logger


class FeedbackService:
    """Service for feedback operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_feedback(
        self,
        type: FeedbackType,
        subject: str,
        message: str,
        user_id: Optional[int] = None,
        priority: int = 1,
        url: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Feedback:
        """Create a new feedback entry"""
        import json
        
        feedback = Feedback(
            user_id=user_id,
            type=type,
            subject=subject,
            message=message,
            priority=priority,
            url=url,
            user_agent=user_agent,
            feedback_metadata=json.dumps(metadata) if metadata else None
        )
        
        self.db.add(feedback)
        await self.db.commit()
        await self.db.refresh(feedback)
        
        return feedback

    async def get_feedback(self, feedback_id: int) -> Optional[Feedback]:
        """Get feedback by ID"""
        return await self.db.get(Feedback, feedback_id)

    async def get_user_feedback(
        self,
        user_id: int,
        status: Optional[FeedbackStatus] = None
    ) -> List[Feedback]:
        """Get feedback for a specific user"""
        query = select(Feedback).where(Feedback.user_id == user_id)
        
        if status:
            query = query.where(Feedback.status == status)
        
        result = await self.db.execute(query.order_by(desc(Feedback.created_at)))
        return list(result.scalars().all())

    async def get_all_feedback(
        self,
        status: Optional[FeedbackStatus] = None,
        type: Optional[FeedbackType] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Feedback]:
        """Get all feedback with filters"""
        query = select(Feedback)
        
        if status:
            query = query.where(Feedback.status == status)
        
        if type:
            query = query.where(Feedback.type == type)
        
        result = await self.db.execute(
            query.order_by(desc(Feedback.priority), desc(Feedback.created_at))
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def update_feedback(
        self,
        feedback_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Feedback]:
        """Update feedback"""
        feedback = await self.get_feedback(feedback_id)
        if not feedback:
            return None
        
        import json
        
        for key, value in updates.items():
            if hasattr(feedback, key) and value is not None:
                if key == 'feedback_metadata' and isinstance(value, dict):
                    setattr(feedback, key, json.dumps(value))
                elif key == 'metadata':
                    # Handle legacy 'metadata' key
                    setattr(feedback, 'feedback_metadata', json.dumps(value))
                else:
                    setattr(feedback, key, value)
        
        await self.db.commit()
        await self.db.refresh(feedback)
        
        return feedback

    async def respond_to_feedback(
        self,
        feedback_id: int,
        response: str,
        responded_by_id: int,
        status: Optional[FeedbackStatus] = None
    ) -> Optional[Feedback]:
        """Respond to feedback"""
        from datetime import datetime
        
        updates = {
            'response': response,
            'responded_by_id': responded_by_id,
            'responded_at': datetime.utcnow()
        }
        
        if status:
            updates['status'] = status
        
        return await self.update_feedback(feedback_id, updates)

    async def add_attachment(
        self,
        feedback_id: int,
        file_path: str,
        file_name: str,
        file_size: int,
        mime_type: Optional[str] = None
    ) -> FeedbackAttachment:
        """Add an attachment to feedback"""
        attachment = FeedbackAttachment(
            feedback_id=feedback_id,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type
        )
        
        self.db.add(attachment)
        await self.db.commit()
        await self.db.refresh(attachment)
        
        return attachment

    async def delete_feedback(self, feedback_id: int) -> bool:
        """Delete feedback"""
        feedback = await self.get_feedback(feedback_id)
        if not feedback:
            return False
        
        await self.db.delete(feedback)
        await self.db.commit()
        
        return True

