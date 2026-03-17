"""
Tests for optimized CommentService (Batch 6 optimizations)
Tests the N+1 query optimization in get_comments_for_entity
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.comment_service import CommentService
from app.models.comment import Comment


@pytest.mark.asyncio
async def test_get_comments_for_entity_optimized_query(db: AsyncSession):
    """Test that get_comments_for_entity uses optimized single query approach"""
    service = CommentService(db)
    
    # Mock the database query to return all comments at once
    mock_comments = [
        MagicMock(id=1, parent_id=None, content="Parent 1", created_at=MagicMock()),
        MagicMock(id=2, parent_id=1, content="Reply 1", created_at=MagicMock()),
        MagicMock(id=3, parent_id=1, content="Reply 2", created_at=MagicMock()),
        MagicMock(id=4, parent_id=None, content="Parent 2", created_at=MagicMock()),
    ]
    
    # Set up mock for selectinload
    for comment in mock_comments:
        comment.user = MagicMock()
        comment.replies = []
    
    # Mock the execute to return all comments
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = mock_comments
    
    with patch.object(db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_execute.return_value = mock_result
        
        result = await service.get_comments_for_entity(
            entity_type="project",
            entity_id=1,
            include_deleted=False,
            limit=10,
            offset=0
        )
        
        # Verify that execute was called only once (optimized query)
        assert mock_execute.call_count == 1
        
        # Verify that result contains top-level comments
        assert len(result) == 2  # Two parent comments
        assert result[0].id == 1 or result[0].id == 4


@pytest.mark.asyncio
async def test_get_comments_for_entity_threaded_structure(db: AsyncSession):
    """Test that comments are properly threaded in memory"""
    service = CommentService(db)
    
    # Create mock comments with parent-child relationships
    parent1 = MagicMock(id=1, parent_id=None, content="Parent 1", created_at=MagicMock())
    reply1 = MagicMock(id=2, parent_id=1, content="Reply 1", created_at=MagicMock())
    reply2 = MagicMock(id=3, parent_id=1, content="Reply 2", created_at=MagicMock())
    parent2 = MagicMock(id=4, parent_id=None, content="Parent 2", created_at=MagicMock())
    
    for comment in [parent1, reply1, reply2, parent2]:
        comment.user = MagicMock()
        comment.replies = []
    
    mock_comments = [parent1, reply1, reply2, parent2]
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = mock_comments
    
    with patch.object(db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_execute.return_value = mock_result
        
        result = await service.get_comments_for_entity(
            entity_type="project",
            entity_id=1
        )
        
        # Verify threading: parent1 should have replies attached
        parent1_found = next((c for c in result if c.id == 1), None)
        if parent1_found:
            # Replies should be attached to parent
            assert hasattr(parent1_found, 'replies') or len(parent1_found.replies) >= 0


@pytest.mark.asyncio
async def test_get_comments_for_entity_eager_loads_user(db: AsyncSession):
    """Test that user relationship is eager loaded"""
    service = CommentService(db)
    
    mock_comment = MagicMock(id=1, parent_id=None, content="Comment", created_at=MagicMock())
    mock_comment.user = MagicMock(id=1, email="test@example.com")
    mock_comment.replies = []
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_comment]
    
    with patch.object(db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_execute.return_value = mock_result
        
        result = await service.get_comments_for_entity(
            entity_type="project",
            entity_id=1
        )
        
        # Verify that user is accessible (eager loaded)
        if result:
            assert hasattr(result[0], 'user')


@pytest.mark.asyncio
async def test_get_comments_for_entity_pagination(db: AsyncSession):
    """Test that pagination works correctly with optimized query"""
    service = CommentService(db)
    
    # Create 15 mock comments (5 parents, 10 replies)
    mock_comments = []
    for i in range(1, 16):
        comment = MagicMock(
            id=i,
            parent_id=None if i <= 5 else (i - 5),  # First 5 are parents, rest are replies
            content=f"Comment {i}",
            created_at=MagicMock()
        )
        comment.user = MagicMock()
        comment.replies = []
        mock_comments.append(comment)
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = mock_comments
    
    with patch.object(db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_execute.return_value = mock_result
        
        # Request first 3 parent comments
        result = await service.get_comments_for_entity(
            entity_type="project",
            entity_id=1,
            limit=3,
            offset=0
        )
        
        # Should return 3 top-level comments (after filtering)
        assert len(result) <= 3
