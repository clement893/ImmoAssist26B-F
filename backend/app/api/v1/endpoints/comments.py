"""
Comments API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.comment_service import CommentService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

router = APIRouter()


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    entity_type: str = Field(..., description="Entity type (e.g., 'project', 'file')")
    entity_id: int = Field(..., description="ID of the entity to comment on")
    parent_id: Optional[int] = Field(None, description="Parent comment ID for threading")
    content_html: Optional[str] = None


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)
    content_html: Optional[str] = None


class CommentResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    parent_id: Optional[int]
    content: str
    content_html: Optional[str]
    user_id: int
    is_edited: bool
    reactions_count: int
    created_at: str
    updated_at: str
    replies: List['CommentResponse'] = []

    class Config:
        from_attributes = True


CommentResponse.model_rebuild()


class ReactionCreate(BaseModel):
    reaction_type: str = Field(..., description="Reaction type: like, love, thumbs_up, etc.")


@router.post("/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED, tags=["comments"])
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new comment"""
    try:
        service = CommentService(db)
        comment = await service.create_comment(
            entity_type=comment_data.entity_type,
            entity_id=comment_data.entity_id,
            content=comment_data.content,
            user_id=current_user.id,
            parent_id=comment_data.parent_id,
            content_html=comment_data.content_html
        )
        return CommentResponse.model_validate(comment)
    except Exception as e:
        logger.error(f"Failed to create comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )


@router.get("/comments/{entity_type}/{entity_id}", response_model=List[CommentResponse], tags=["comments"])
async def get_comments(
    entity_type: str,
    entity_id: int,
    include_deleted: bool = Query(False),
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all comments for an entity"""
    service = CommentService(db)
    comments = await service.get_comments_for_entity(
        entity_type=entity_type,
        entity_id=entity_id,
        include_deleted=include_deleted,
        limit=limit,
        offset=offset
    )
    return [CommentResponse.model_validate(comment) for comment in comments]


@router.put("/comments/{comment_id}", response_model=CommentResponse, tags=["comments"])
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a comment"""
    try:
        service = CommentService(db)
        comment = await service.update_comment(
            comment_id=comment_id,
            content=comment_data.content,
            content_html=comment_data.content_html,
            user_id=current_user.id
        )
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        return CommentResponse.model_validate(comment)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/comments/{comment_id}", tags=["comments"])
async def delete_comment(
    comment_id: int,
    hard_delete: bool = Query(False, description="Permanently delete instead of soft delete"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment"""
    try:
        service = CommentService(db)
        success = await service.delete_comment(
            comment_id=comment_id,
            user_id=current_user.id,
            hard_delete=hard_delete
        )
        if success:
            return {"success": True, "message": "Comment deleted successfully"}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/comments/{comment_id}/reactions", tags=["comments"])
async def add_reaction(
    comment_id: int,
    reaction_data: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a reaction to a comment"""
    try:
        service = CommentService(db)
        reaction = await service.add_reaction(
            comment_id=comment_id,
            user_id=current_user.id,
            reaction_type=reaction_data.reaction_type
        )
        return {"success": True, "message": "Reaction added successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/comments/{comment_id}/reactions", tags=["comments"])
async def remove_reaction(
    comment_id: int,
    reaction_type: Optional[str] = Query(None, description="Specific reaction type to remove"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a reaction from a comment"""
    service = CommentService(db)
    success = await service.remove_reaction(
        comment_id=comment_id,
        user_id=current_user.id,
        reaction_type=reaction_type
    )
    if success:
        return {"success": True, "message": "Reaction removed successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Reaction not found"
    )




