"""
Comment Service
Manages comments and reactions
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment, CommentReaction
from app.core.logging import logger


class CommentService:
    """Service for comment operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_comment(
        self,
        entity_type: str,
        entity_id: int,
        content: str,
        user_id: int,
        parent_id: Optional[int] = None,
        content_html: Optional[str] = None
    ) -> Comment:
        """Create a new comment"""
        comment = Comment(
            entity_type=entity_type,
            entity_id=entity_id,
            content=content,
            content_html=content_html,
            user_id=user_id,
            parent_id=parent_id
        )
        
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        
        return comment

    async def get_comments_for_entity(
        self,
        entity_type: str,
        entity_id: int,
        include_deleted: bool = False,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Comment]:
        """Get all comments for an entity (threaded)"""
        # First, get all comments for this entity in one query (optimized)
        all_comments_query = select(Comment).where(
            and_(
                Comment.entity_type == entity_type,
                Comment.entity_id == entity_id
            )
        )
        
        if not include_deleted:
            all_comments_query = all_comments_query.where(Comment.is_deleted == False)
        
        # Eager load user relationship to prevent N+1 queries
        all_comments_query = all_comments_query.options(selectinload(Comment.user))
        
        all_comments_result = await self.db.execute(all_comments_query)
        all_comments = {comment.id: comment for comment in all_comments_result.scalars().all()}
        
        # Build threaded structure in memory
        top_level_comments = []
        for comment in all_comments.values():
            if comment.parent_id is None:
                top_level_comments.append(comment)
            else:
                # Attach to parent's replies
                parent = all_comments.get(comment.parent_id)
                if parent:
                    if not hasattr(parent, 'replies') or parent.replies is None:
                        parent.replies = []
                    parent.replies.append(comment)
        
        # Sort top-level comments by created_at desc
        top_level_comments.sort(key=lambda c: c.created_at, reverse=True)
        
        # Apply pagination to top-level comments only
        if limit:
            top_level_comments = top_level_comments[offset:offset + limit]
        
        return top_level_comments

    async def _load_replies(self, comment: Comment, include_deleted: bool = False) -> None:
        """
        Recursively load replies for a comment
        
        NOTE: This method is deprecated in favor of the optimized get_comments_for_entity
        which loads all comments in one query. Kept for backward compatibility.
        """
        query = select(Comment).where(
            and_(
                Comment.parent_id == comment.id
            )
        )
        
        if not include_deleted:
            query = query.where(Comment.is_deleted == False)
        
        # Eager load user relationship to prevent N+1 queries
        query = query.options(selectinload(Comment.user))
        query = query.order_by(Comment.created_at)
        
        result = await self.db.execute(query)
        replies = result.scalars().all()
        
        # Recursively load nested replies
        for reply in replies:
            await self._load_replies(reply, include_deleted)
        
        # Attach replies to comment
        comment.replies = list(replies)

    async def update_comment(
        self,
        comment_id: int,
        content: str,
        content_html: Optional[str] = None,
        user_id: int = None
    ) -> Optional[Comment]:
        """Update a comment"""
        comment = await self.db.get(Comment, comment_id)
        if not comment:
            return None
        
        # Check ownership if user_id provided
        if user_id and comment.user_id != user_id:
            raise ValueError("User does not have permission to edit this comment")
        
        comment.content = content
        if content_html:
            comment.content_html = content_html
        comment.is_edited = True
        
        await self.db.commit()
        await self.db.refresh(comment)
        
        return comment

    async def delete_comment(
        self,
        comment_id: int,
        user_id: int = None,
        hard_delete: bool = False
    ) -> bool:
        """Delete a comment (soft delete by default)"""
        comment = await self.db.get(Comment, comment_id)
        if not comment:
            return False
        
        # Check ownership if user_id provided
        if user_id and comment.user_id != user_id:
            raise ValueError("User does not have permission to delete this comment")
        
        if hard_delete:
            await self.db.delete(comment)
        else:
            comment.is_deleted = True
            from datetime import datetime, timezone
            comment.deleted_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        return True

    async def add_reaction(
        self,
        comment_id: int,
        user_id: int,
        reaction_type: str = 'like'
    ) -> CommentReaction:
        """Add a reaction to a comment"""
        # Check if reaction already exists
        existing = await self.db.execute(
            select(CommentReaction).where(
                and_(
                    CommentReaction.comment_id == comment_id,
                    CommentReaction.user_id == user_id,
                    CommentReaction.reaction_type == reaction_type
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Reaction already exists")
        
        reaction = CommentReaction(
            comment_id=comment_id,
            user_id=user_id,
            reaction_type=reaction_type
        )
        
        # Update comment reactions count
        comment = await self.db.get(Comment, comment_id)
        if comment:
            comment.reactions_count += 1
        
        self.db.add(reaction)
        await self.db.commit()
        await self.db.refresh(reaction)
        
        return reaction

    async def remove_reaction(
        self,
        comment_id: int,
        user_id: int,
        reaction_type: Optional[str] = None
    ) -> bool:
        """Remove a reaction from a comment"""
        query = select(CommentReaction).where(
            and_(
                CommentReaction.comment_id == comment_id,
                CommentReaction.user_id == user_id
            )
        )
        
        if reaction_type:
            query = query.where(CommentReaction.reaction_type == reaction_type)
        
        result = await self.db.execute(query)
        reaction = result.scalar_one_or_none()
        
        if reaction:
            # Update comment reactions count
            comment = await self.db.get(Comment, comment_id)
            if comment and comment.reactions_count > 0:
                comment.reactions_count -= 1
            
            await self.db.delete(reaction)
            await self.db.commit()
            return True
        
        return False

    async def get_reactions_for_comment(
        self,
        comment_id: int
    ) -> List[CommentReaction]:
        """Get all reactions for a comment"""
        result = await self.db.execute(
            select(CommentReaction).where(
                CommentReaction.comment_id == comment_id
            ).order_by(CommentReaction.created_at)
        )
        return list(result.scalars().all())




