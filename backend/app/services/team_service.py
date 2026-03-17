"""
Team Service
Service for team/organization management
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
import json

from app.models import Team, TeamMember, User, Role


class TeamService:
    """Service for managing teams"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_team(
        self,
        name: str,
        slug: str,
        owner_id: int,
        description: Optional[str] = None,
        settings: Optional[dict] = None,
    ) -> Team:
        """Create a new team"""
        team = Team(
            name=name,
            slug=slug,
            owner_id=owner_id,
            description=description,
            settings=json.dumps(settings) if settings else None,
        )
        self.db.add(team)
        await self.db.commit()
        # Refresh non nécessaire car expire_on_commit=False dans database.py

        # Add owner as team member with admin role
        admin_role_result = await self.db.execute(
            select(Role).where(Role.slug == "admin")
        )
        admin_role_obj = admin_role_result.scalar_one_or_none()
        if not admin_role_obj:
            # If admin role doesn't exist, try to find any role or raise error
            # This should not happen in production, but handle gracefully
            raise ValueError("Admin role not found. Please ensure roles are initialized.")
        
        team_member = TeamMember(
            team_id=team.id,
            user_id=owner_id,
            role_id=admin_role_obj.id,
        )
        self.db.add(team_member)
        await self.db.commit()
        # Refresh non nécessaire, on retourne team qui est déjà en mémoire

        return team

    async def get_team(self, team_id: int) -> Optional[Team]:
        """Get a team by ID"""
        result = await self.db.execute(
            select(Team)
            .where(Team.id == team_id)
            .where(Team.is_active == True)
            .options(selectinload(Team.members), selectinload(Team.owner))
        )
        return result.scalar_one_or_none()

    async def get_team_by_slug(self, slug: str) -> Optional[Team]:
        """Get a team by slug with eager loading to prevent N+1 queries"""
        result = await self.db.execute(
            select(Team)
            .where(Team.slug == slug)
            .where(Team.is_active == True)
            .options(selectinload(Team.members), selectinload(Team.owner))
        )
        return result.scalar_one_or_none()

    async def get_user_teams(
        self, 
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Team]:
        """Get all teams a user belongs to with pagination"""
        result = await self.db.execute(
            select(Team)
            .join(TeamMember, Team.id == TeamMember.team_id)
            .where(TeamMember.user_id == user_id)
            .where(TeamMember.is_active == True)
            .where(Team.is_active == True)
            .distinct()
            .options(
                selectinload(Team.owner),
                selectinload(Team.members).selectinload(TeamMember.user),
                selectinload(Team.members).selectinload(TeamMember.role)
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_team_members(self, team_id: int) -> List[TeamMember]:
        """Get all members of a team"""
        result = await self.db.execute(
            select(TeamMember)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.is_active == True)
            .options(selectinload(TeamMember.user), selectinload(TeamMember.role))
        )
        return list(result.scalars().all())

    async def add_member(
        self,
        team_id: int,
        user_id: int,
        role_id: int,
    ) -> TeamMember:
        """Add a member to a team"""
        # Check if already a member
        existing = await self.db.execute(
            select(TeamMember)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.user_id == user_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError("User is already a team member")

        team_member = TeamMember(
            team_id=team_id,
            user_id=user_id,
            role_id=role_id,
        )
        self.db.add(team_member)
        await self.db.commit()
        # Refresh non nécessaire si pas besoin de relations lazy-loaded
        return team_member

    async def update_member_role(
        self,
        team_id: int,
        user_id: int,
        role_id: int,
    ) -> Optional[TeamMember]:
        """Update a member's role in a team"""
        result = await self.db.execute(
            select(TeamMember)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.user_id == user_id)
        )
        team_member = result.scalar_one_or_none()
        if not team_member:
            return None

        team_member.role_id = role_id
        await self.db.commit()
        # Refresh non nécessaire, l'objet est déjà modifié en mémoire
        return team_member

    async def remove_member(self, team_id: int, user_id: int) -> bool:
        """Remove a member from a team"""
        result = await self.db.execute(
            select(TeamMember)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.user_id == user_id)
        )
        team_member = result.scalar_one_or_none()
        if not team_member:
            return False

        team_member.is_active = False
        await self.db.commit()
        return True

    async def is_team_member(self, user_id: int, team_id: int) -> bool:
        """Check if user is a member of a team"""
        result = await self.db.execute(
            select(TeamMember)
            .where(TeamMember.user_id == user_id)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.is_active == True)
        )
        return result.scalar_one_or_none() is not None

    async def is_team_owner(self, user_id: int, team_id: int) -> bool:
        """Check if user is the owner of a team"""
        result = await self.db.execute(
            select(Team)
            .where(Team.id == team_id)
            .where(Team.owner_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    async def update_team(
        self,
        team_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        settings: Optional[dict] = None,
    ) -> Optional[Team]:
        """Update team information"""
        result = await self.db.execute(
            select(Team).where(Team.id == team_id)
        )
        team = result.scalar_one_or_none()
        if not team:
            return None

        if name:
            team.name = name
        if description is not None:
            team.description = description
        if settings is not None:
            team.settings = json.dumps(settings)

        await self.db.commit()
        # Refresh non nécessaire, l'objet est déjà modifié en mémoire
        return team

    async def delete_team(self, team_id: int) -> bool:
        """Soft delete a team"""
        result = await self.db.execute(
            select(Team).where(Team.id == team_id)
        )
        team = result.scalar_one_or_none()
        if not team:
            return False

        team.is_active = False
        await self.db.commit()
        return True

