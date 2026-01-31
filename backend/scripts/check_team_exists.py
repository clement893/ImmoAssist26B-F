"""
Script to check if a team exists in the database
Usage: python -m scripts.check_team_exists <slug>
"""

import asyncio
import sys
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.team import Team, TeamMember
from app.models.user import User


async def check_team(slug: str):
    """Check if a team exists and show its details"""
    async with async_session_maker() as db:
        # Check team by slug (without is_active filter to see all teams)
        result = await db.execute(
            select(Team).where(Team.slug == slug)
        )
        team = result.scalar_one_or_none()
        
        if not team:
            print(f"❌ Team with slug '{slug}' NOT found in database")
            return
        
        print(f"✅ Team found:")
        print(f"   ID: {team.id}")
        print(f"   Name: {team.name}")
        print(f"   Slug: {team.slug}")
        print(f"   Owner ID: {team.owner_id}")
        print(f"   Is Active: {team.is_active}")
        print(f"   Created: {team.created_at}")
        
        # Check owner
        owner_result = await db.execute(
            select(User).where(User.id == team.owner_id)
        )
        owner = owner_result.scalar_one_or_none()
        if owner:
            print(f"   Owner: {owner.email} ({owner.first_name} {owner.last_name})")
        
        # Check members
        members_result = await db.execute(
            select(TeamMember).where(TeamMember.team_id == team.id)
        )
        members = members_result.scalars().all()
        print(f"   Members: {len(members)}")
        for member in members:
            user_result = await db.execute(
                select(User).where(User.id == member.user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                print(f"     - {user.email} (active: {member.is_active})")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.check_team_exists <slug>")
        sys.exit(1)
    
    slug = sys.argv[1]
    asyncio.run(check_team(slug))
