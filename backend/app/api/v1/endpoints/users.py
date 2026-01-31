"""
User Endpoints with Pagination and Query Optimization
Example implementation of optimized endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import json

from app.core.database import get_db
from app.core.pagination import PaginationParams, paginate_query, PaginatedResponse, get_pagination_params
from app.core.query_optimization import QueryOptimizer
from app.core.cache_enhanced import cache_query
from app.core.rate_limit import rate_limit_decorator
from app.core.logging import logger
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.dependencies import get_current_user
from fastapi import HTTPException, status
from typing import Annotated

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[UserResponse])
@rate_limit_decorator("100/hour")
@cache_query(expire=300, tags=["users"])
async def list_users(
    request: Request,
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
) -> PaginatedResponse[UserResponse]:
    """
    List users with pagination and filtering
    
    Features:
    - Pagination support
    - Filtering by active status
    - Search functionality
    - Query optimization with eager loading
    - Result caching
    """
    # Build query
    query = select(User)
    
    # Apply filters
    filters = []
    if is_active is not None:
        filters.append(User.is_active == is_active)
    
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
        )
        filters.append(search_filter)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Create base query for counting (without eager loading)
    from sqlalchemy import func
    # Build count query from scratch to ensure it's clean
    count_query = select(func.count()).select_from(User)
    if filters:
        count_query = count_query.where(and_(*filters))
    
    # Optimize query with eager loading (prevent N+1 queries)
    # Note: roles relationship may not exist, so we skip if it doesn't
    try:
        query = QueryOptimizer.add_eager_loading(query, ["roles"], strategy="selectin")
    except (AttributeError, Exception) as e:
        # roles relationship doesn't exist or other error, skip eager loading
        logger.warning(f"Could not add eager loading for roles: {e}")
        pass
    
    # Order by created_at (uses index)
    query = query.order_by(User.created_at.desc())
    
    # Paginate query with separate count query to avoid issues with eager loading
    try:
        # First, get the count
        count_result = await db.execute(count_query)
        total = count_result.scalar_one() or 0
        
        # Then, get the paginated items (without eager loading to avoid issues)
        paginated_query = query.offset(pagination.offset).limit(pagination.limit)
        result = await db.execute(paginated_query)
        users = result.scalars().all()
        
        # Convert SQLAlchemy User objects to UserResponse schemas
        user_responses = []
        for user in users:
            try:
                # Convert SQLAlchemy User to dict, excluding relationships
                # Handle datetime conversion explicitly
                user_dict = {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
                    "updated_at": user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at),
                }
                user_responses.append(UserResponse.model_validate(user_dict))
            except Exception as validation_error:
                logger.error(
                    f"Error validating user {user.id} (email: {user.email}): {validation_error}\n"
                    f"  User data: id={user.id}, email={user.email}, first_name={user.first_name}, "
                    f"last_name={user.last_name}, is_active={user.is_active}, "
                    f"created_at={user.created_at}, updated_at={user.updated_at}",
                    exc_info=True
                )
                # Skip this user if validation fails
                continue
        
        paginated_response = PaginatedResponse.create(
            items=user_responses,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
        # Convert to JSONResponse for slowapi compatibility
        # Use model_dump with mode='json' to ensure datetime serialization
        return JSONResponse(
            content=paginated_response.model_dump(mode='json'),
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error paginating users query: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Try without eager loading as fallback
        try:
            query_fallback = select(User).order_by(User.created_at.desc())
            if filters:
                query_fallback = query_fallback.where(and_(*filters))
            paginated_result = await paginate_query(db, query_fallback, pagination, count_query=count_query)
            # Convert to UserResponse with individual error handling
            user_responses = []
            for user in paginated_result.items:
                try:
                    # Convert SQLAlchemy User to dict, excluding relationships
                    # This prevents issues with eager-loaded relationships
                    user_dict = {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "is_active": user.is_active,
                        "created_at": user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else str(user.created_at),
                        "updated_at": user.updated_at.isoformat() if hasattr(user.updated_at, 'isoformat') else str(user.updated_at),
                    }
                    user_responses.append(UserResponse.model_validate(user_dict))
                except Exception as validation_error:
                    logger.error(
                        f"Error validating user {user.id} (email: {user.email}) in fallback: {validation_error}\n"
                        f"  User data: id={user.id}, email={user.email}, first_name={user.first_name}, "
                        f"last_name={user.last_name}, is_active={user.is_active}, "
                        f"created_at={user.created_at}, updated_at={user.updated_at}",
                        exc_info=True
                    )
                    # Skip this user if validation fails
                    continue
            
            paginated_response = PaginatedResponse.create(
                items=user_responses,
                total=paginated_result.total,
                page=paginated_result.page,
                page_size=paginated_result.page_size,
            )
            # Convert to JSONResponse for slowapi compatibility
            # Use model_dump with mode='json' to ensure datetime serialization
            return JSONResponse(
                content=paginated_response.model_dump(mode='json'),
                status_code=200
            )
        except Exception as fallback_error:
            logger.error(f"Error in fallback query: {fallback_error}", exc_info=True)
            # Last resort: return empty result instead of crashing
            try:
                paginated_response = PaginatedResponse.create(
                    items=[],
                    total=0,
                    page=pagination.page,
                    page_size=pagination.page_size,
                )
                # Convert to JSONResponse for slowapi compatibility
                # Use model_dump with mode='json' to ensure datetime serialization
                return JSONResponse(
                    content=paginated_response.model_dump(mode='json'),
                    status_code=200
                )
            except Exception as final_error:
                logger.error(f"Error creating empty response: {final_error}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to retrieve users: {str(fallback_error)}"
                )


@router.get("/{user_id}", response_model=UserResponse)
@rate_limit_decorator("200/hour")
@cache_query(expire=600, tags=["users"])
async def get_user(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """
    Get user by ID with query optimization
    
    Features:
    - Eager loading of relationships
    - Result caching
    """
    # Build optimized query
    query = select(User).where(User.id == user_id)
    
    # Eager load relationships to prevent N+1 queries
    # Note: relationships may not exist, so we skip if they don't
    try:
        query = QueryOptimizer.add_eager_loading(query, ["roles", "team_memberships"], strategy="selectin")
    except AttributeError:
        # relationships don't exist, skip eager loading
        pass
    
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit_decorator("10/hour")
async def delete_user(
    request: Request,
    user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete a user (admin/superadmin only)
    
    Features:
    - Requires admin or superadmin permissions
    - Prevents self-deletion
    - Prevents deletion of last superadmin
    - Soft delete (sets is_active=False) or hard delete based on configuration
    """
    from app.dependencies import is_admin_or_superadmin
    
    # Check if user is admin or superadmin
    is_admin = await is_admin_or_superadmin(current_user, db)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    # Get user to delete
    result = await db.execute(select(User).where(User.id == user_id))
    user_to_delete = result.scalar_one_or_none()
    
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is the last superadmin
    from app.models import Role, UserRole
    superadmin_role_result = await db.execute(
        select(Role).where(Role.slug == "superadmin")
    )
    superadmin_role = superadmin_role_result.scalar_one_or_none()
    
    if superadmin_role:
        superadmin_users_result = await db.execute(
            select(UserRole)
            .join(Role)
            .where(Role.slug == "superadmin")
            .where(Role.is_active == True)
        )
        superadmin_users = list(superadmin_users_result.scalars().all())
        
        # Check if user to delete is a superadmin
        user_is_superadmin = any(
            ur.user_id == user_id for ur in superadmin_users
        )
        
        if user_is_superadmin and len(superadmin_users) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last superadmin user"
            )
    
    # Log deletion attempt
    try:
        from app.core.security_audit import SecurityAuditLogger, SecurityEventType
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_DELETED,
            description=f"User '{user_to_delete.email}' deleted",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="warning",
            success="success",
            metadata={
                "resource_type": "user",
                "deleted_user_id": user_id,
                "deleted_user_email": user_to_delete.email,
                "action": "deleted"
            }
        )
    except Exception as e:
        logger.warning(f"Failed to log user deletion event: {e}")
    
    # Perform soft delete (set is_active=False) instead of hard delete
    # This preserves data integrity and allows for recovery if needed
    user_to_delete.is_active = False
    await db.commit()
    
    logger.info(f"User {user_id} ({user_to_delete.email}) deleted by {current_user.email}")
    
    return None


@router.put("/me", response_model=UserResponse)
@rate_limit_decorator("10/minute")
async def update_current_user(
    request: Request,
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """
    Update current user profile
    
    Allows authenticated users to update their own profile information.
    Only updates fields that are provided (partial update).
    
    Args:
        user_data: User update data (email, first_name, last_name)
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated user information
        
    Raises:
        HTTPException: If email is already taken by another user
    """
    try:
        logger.info(f"Updating user profile for: {current_user.email}")
        
        # Check if email is being updated and if it's already taken
        if user_data.email and user_data.email != current_user.email:
            result = await db.execute(
                select(User).where(User.email == user_data.email)
            )
            existing_user = result.scalar_one_or_none()
            if existing_user and existing_user.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already taken"
                )
        
        # Update only provided fields
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(current_user, field, value)
        
        # Save changes
        await db.commit()
        await db.refresh(current_user)
        
        logger.info(f"User profile updated successfully for: {current_user.email}")
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )
