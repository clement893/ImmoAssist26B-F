"""
Teams Endpoints
API endpoints for team management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern, invalidate_cache_pattern_async
from app.dependencies import get_current_user
from app.dependencies.rbac import require_team_permission, require_team_owner, require_team_member
from app.models import User
from app.models.team import TeamMember
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamMemberAdd,
    TeamMemberUpdate,
    TeamMemberResponse,
    TeamListResponse,
)
from app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["teams"])


def parse_team_settings(settings_value):
    """
    Parse team settings from database (JSON string) to dict.
    Handles None, dict, and JSON string formats.
    """
    if not settings_value:
        return None
    if isinstance(settings_value, dict):
        return settings_value
    if isinstance(settings_value, str):
        try:
            import json
            parsed = json.loads(settings_value)
            # Ensure parsed value is a dict
            return parsed if isinstance(parsed, dict) else None
        except (json.JSONDecodeError, TypeError, ValueError):
            return None
    return None


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new team"""
    team_service = TeamService(db)
    
    # Check if slug already exists
    existing = await team_service.get_team_by_slug(team_data.slug)
    if existing:
        # If the existing team belongs to the same user, return it instead of erroring
        # This handles cases where the team was created but UI didn't refresh
        if existing.owner_id == current_user.id:
            # Invalidate cache to ensure fresh data
            await invalidate_cache_pattern_async("teams:*")
            
            # Reload team with relationships properly loaded
            team = await team_service.get_team(existing.id)
            if not team:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Team exists but could not be retrieved",
                )
            
            # Parse settings if it's a JSON string
            settings_dict = parse_team_settings(team.settings)
            
            # Convert to response format
            team_dict = {
                "id": team.id,
                "name": team.name,
                "slug": team.slug,
                "description": team.description,
                "owner_id": team.owner_id,
                "is_active": team.is_active,
                "settings": settings_dict,
                "created_at": team.created_at.isoformat() if hasattr(team.created_at, 'isoformat') else str(team.created_at),
                "updated_at": team.updated_at.isoformat() if hasattr(team.updated_at, 'isoformat') else str(team.updated_at),
                "owner": None,
                "members": [],
            }
            
            if team.owner:
                team_dict["owner"] = {
                    "id": team.owner.id,
                    "email": team.owner.email,
                    "first_name": team.owner.first_name,
                    "last_name": team.owner.last_name,
                }
            
            if team.members:
                team_dict["members"] = [TeamMemberResponse.model_validate(m) for m in team.members]
            
            return TeamResponse.model_validate(team_dict)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team slug already exists",
            )
    
    created_team = await team_service.create_team(
        name=team_data.name,
        slug=team_data.slug,
        owner_id=current_user.id,
        description=team_data.description,
        settings=team_data.settings if team_data.settings else None,
    )
    
    # Invalidate cache after creation
    await invalidate_cache_pattern_async("teams:*")
    
    # Reload team with relationships properly loaded
    team = await team_service.get_team(created_team.id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Team was created but could not be retrieved",
        )
    
    # Parse settings if it's a JSON string
    settings_dict = parse_team_settings(team.settings)
    
    # Convert to response format - ensure we access loaded relationships safely
    team_dict = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "owner_id": team.owner_id,
        "is_active": team.is_active,
        "settings": settings_dict,
        "created_at": team.created_at.isoformat() if hasattr(team.created_at, 'isoformat') else str(team.created_at),
        "updated_at": team.updated_at.isoformat() if hasattr(team.updated_at, 'isoformat') else str(team.updated_at),
        "owner": None,
        "members": [],
    }
    
    # Safely access owner relationship (should be loaded via selectinload)
    if team.owner:
        team_dict["owner"] = {
            "id": team.owner.id,
            "email": team.owner.email,
            "first_name": team.owner.first_name,
            "last_name": team.owner.last_name,
        }
    
    # Safely access members relationship (should be loaded via selectinload)
    if team.members:
        team_dict["members"] = [TeamMemberResponse.model_validate(m) for m in team.members]
    
    return TeamResponse.model_validate(team_dict)


@router.get("", response_model=TeamListResponse)
async def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List teams the user belongs to with pagination. Superadmins see all teams."""
    from app.dependencies import is_superadmin
    
    team_service = TeamService(db)
    
    # Check if user is superadmin - if so, return all teams
    user_is_superadmin = await is_superadmin(current_user, db)
    
    if user_is_superadmin:
        # Superadmin sees all teams
        from sqlalchemy import select
        from app.models.team import Team
        
        result = await db.execute(
            select(Team)
            .where(Team.is_active == True)
            .order_by(Team.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(Team.owner),
                selectinload(Team.members).selectinload(TeamMember.user),
                selectinload(Team.members).selectinload(TeamMember.role)
            )
        )
        teams = list(result.scalars().all())
        
        # Get total count for pagination (optimized - use func.count instead of loading all objects)
        from sqlalchemy import func
        count_result = await db.execute(
            select(func.count()).select_from(Team).where(Team.is_active == True)
        )
        total = count_result.scalar_one() or 0
    else:
        # Regular users see only teams they belong to
        teams = await team_service.get_user_teams(current_user.id, skip=skip, limit=limit)
        total = len(teams)
    
    # Convert teams to response format
    teams_response = []
    for team in teams:
        team_dict = {
            "id": team.id,
            "name": team.name,
            "slug": team.slug,
            "description": team.description,
            "owner_id": team.owner_id,
            "is_active": team.is_active,
            "settings": parse_team_settings(team.settings),
            "created_at": team.created_at,
            "updated_at": team.updated_at,
            "owner": {
                "id": team.owner.id,
                "email": team.owner.email,
                "first_name": team.owner.first_name,
                "last_name": team.owner.last_name,
            } if team.owner else None,
            "members": [],
        }
        teams_response.append(TeamResponse.model_validate(team_dict))
    
    return TeamListResponse(teams=teams_response, total=total)


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a team by ID"""
    await require_team_member(team_id, current_user, db)
    
    team_service = TeamService(db)
    team = await team_service.get_team(team_id)
    
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Convert to dict with owner and members
    team_dict = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "owner_id": team.owner_id,
        "is_active": team.is_active,
        "settings": parse_team_settings(team.settings),
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": team.owner.id,
            "email": team.owner.email,
            "first_name": team.owner.first_name,
            "last_name": team.owner.last_name,
        } if team.owner else None,
        "members": [TeamMemberResponse.model_validate(m) for m in team.members],
    }
    
    return TeamResponse.model_validate(team_dict)


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_data: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a team"""
    await require_team_permission(team_id, "teams:update", current_user, db)
    
    team_service = TeamService(db)
    team = await team_service.update_team(
        team_id=team_id,
        name=team_data.name,
        description=team_data.description,
        settings=team_data.settings,
    )
    
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Invalidate cache
    await invalidate_cache_pattern_async("teams:*")
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    
    # Reload with relationships
    team = await team_service.get_team(team_id)
    team_dict = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "owner_id": team.owner_id,
        "is_active": team.is_active,
        "settings": parse_team_settings(team.settings),
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": {
            "id": team.owner.id,
            "email": team.owner.email,
            "first_name": team.owner.first_name,
            "last_name": team.owner.last_name,
        } if team.owner else None,
        "members": [TeamMemberResponse.model_validate(m) for m in team.members],
    }
    
    return TeamResponse.model_validate(team_dict)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a team (soft delete)"""
    await require_team_owner(team_id, current_user, db)
    
    team_service = TeamService(db)
    success = await team_service.delete_team(team_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Invalidate cache
    await invalidate_cache_pattern_async("teams:*")
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    
    return None


@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def list_team_members(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a team"""
    await require_team_member(team_id, current_user, db)
    
    team_service = TeamService(db)
    members = await team_service.get_team_members(team_id)
    
    return [TeamMemberResponse.model_validate(m) for m in members]


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_team_member(
    team_id: int,
    member_data: TeamMemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to a team"""
    await require_team_permission(team_id, "teams:members:add", current_user, db)
    
    team_service = TeamService(db)
    team_member = await team_service.add_member(
        team_id=team_id,
        user_id=member_data.user_id,
        role_id=member_data.role_id,
    )
    
    # Invalidate cache after adding member
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    await invalidate_cache_pattern_async("teams:*")
    
    return TeamMemberResponse.model_validate(team_member)


@router.put("/{team_id}/members/{user_id}", response_model=TeamMemberResponse)
async def update_team_member(
    team_id: int,
    user_id: int,
    member_data: TeamMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a team member's role"""
    await require_team_permission(team_id, "teams:members:update", current_user, db)
    
    team_service = TeamService(db)
    team_member = await team_service.update_member_role(
        team_id=team_id,
        user_id=user_id,
        role_id=member_data.role_id,
    )
    
    if not team_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    
    # Invalidate cache after updating member
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    await invalidate_cache_pattern_async("teams:*")
    
    return TeamMemberResponse.model_validate(team_member)


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from a team"""
    await require_team_permission(team_id, "teams:members:remove", current_user, db)
    
    # Cannot remove yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from team",
        )
    
    team_service = TeamService(db)
    success = await team_service.remove_member(team_id, user_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    
    # Invalidate cache after removing member
    await invalidate_cache_pattern_async(f"team:{team_id}:*")
    await invalidate_cache_pattern_async("teams:*")
    
    return None

