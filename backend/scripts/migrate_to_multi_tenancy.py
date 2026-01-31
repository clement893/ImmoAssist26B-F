#!/usr/bin/env python3
"""
Migration Script: Single-Tenant to Multi-Tenancy

This script migrates existing single-tenant data to multi-tenant structure.
It assigns all existing data to a default team/tenant.

Usage:
    python scripts/migrate_to_multi_tenancy.py [--default-team-id TEAM_ID] [--dry-run]

Options:
    --default-team-id TEAM_ID: Team ID to assign all data to (default: creates new team)
    --dry-run: Show what would be migrated without making changes
"""

import os
import sys
import argparse
from typing import Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.tenancy import TenancyConfig, TenancyMode
from app.core.logging import logger
from app.models.team import Team, TeamMember
from app.models.user import User


def get_tenant_aware_tables():
    """Get list of tables that should have team_id"""
    return [
        "projects",
        "forms",
        "form_submissions",
        "files",
        "templates",
        "pages",
        "menus",
        "support_tickets",
        "ticket_messages",
        "api_keys",
        "webhook_events",
        "favorites",
        "comments",
        "shares",
        "integrations",
    ]


def check_tenancy_mode():
    """Check that tenancy mode is set correctly"""
    mode = TenancyConfig.get_mode()
    if mode == TenancyMode.SINGLE:
        print("⚠️  WARNING: TENANCY_MODE is set to 'single'")
        print("   Set TENANCY_MODE=shared_db or separate_db before running migration")
        response = input("Continue anyway? (yes/no): ")
        if response.lower() != "yes":
            sys.exit(1)
    return mode


def create_default_team(db_session, team_name: str = "Default Team") -> Team:
    """Create a default team for migration"""
    # Find first active user to be team owner
    user = db_session.query(User).filter(User.is_active == True).first()
    if not user:
        raise ValueError("No active users found. Cannot create default team.")
    
    team = Team(
        name=team_name,
        slug="default-team",
        owner_id=user.id,
        is_active=True,
        description="Default team created during multi-tenancy migration"
    )
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    
    # Add all users to default team
    users = db_session.query(User).filter(User.is_active == True).all()
    for user in users:
        member = TeamMember(
            team_id=team.id,
            user_id=user.id,
            role="member",
            is_active=True
        )
        db_session.add(member)
    
    db_session.commit()
    print(f"✅ Created default team: {team.name} (ID: {team.id})")
    print(f"   Added {len(users)} users to team")
    
    return team


def migrate_table_data(
    db_session,
    table_name: str,
    team_id: int,
    dry_run: bool = False
) -> int:
    """
    Migrate data in a table by setting team_id for all rows.
    
    Returns:
        Number of rows updated
    """
    # Check if table has team_id column
    result = db_session.execute(
        text(f"SELECT column_name FROM information_schema.columns "
             f"WHERE table_name = '{table_name}' AND column_name = 'team_id'")
    )
    has_team_id = result.fetchone() is not None
    
    if not has_team_id:
        print(f"⏭️  Skipping {table_name}: no team_id column")
        return 0
    
    # Count rows without team_id
    result = db_session.execute(
        text(f"SELECT COUNT(*) FROM {table_name} WHERE team_id IS NULL")
    )
    count = result.scalar()
    
    if count == 0:
        print(f"✅ {table_name}: All rows already have team_id")
        return 0
    
    if dry_run:
        print(f"🔍 {table_name}: Would update {count} rows with team_id={team_id}")
        return count
    
    # Update rows
    try:
        result = db_session.execute(
            text(f"UPDATE {table_name} SET team_id = :team_id WHERE team_id IS NULL")
            .bindparams(team_id=team_id)
        )
        db_session.commit()
        updated = result.rowcount
        print(f"✅ {table_name}: Updated {updated} rows with team_id={team_id}")
        return updated
    except SQLAlchemyError as e:
        db_session.rollback()
        print(f"❌ {table_name}: Error updating rows: {e}")
        return 0


def main():
    """Main migration function"""
    parser = argparse.ArgumentParser(
        description="Migrate single-tenant data to multi-tenancy"
    )
    parser.add_argument(
        "--default-team-id",
        type=int,
        help="Team ID to assign all data to (default: creates new team)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be migrated without making changes"
    )
    parser.add_argument(
        "--team-name",
        type=str,
        default="Default Team",
        help="Name for default team (if creating new team)"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Multi-Tenancy Migration Script")
    print("=" * 60)
    print()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print()
    
    # Check tenancy mode
    try:
        mode = check_tenancy_mode()
        print(f"📋 Tenancy Mode: {mode.value}")
    except Exception as e:
        print(f"❌ Error checking tenancy mode: {e}")
        sys.exit(1)
    
    # Create database connection
    try:
        engine = create_engine(str(settings.DATABASE_URL))
        SessionLocal = sessionmaker(bind=engine)
        db_session = SessionLocal()
        print("✅ Database connection established")
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        sys.exit(1)
    
    try:
        # Get or create default team
        if args.default_team_id:
            team = db_session.query(Team).filter(Team.id == args.default_team_id).first()
            if not team:
                print(f"❌ Team with ID {args.default_team_id} not found")
                sys.exit(1)
            print(f"✅ Using existing team: {team.name} (ID: {team.id})")
        else:
            if args.dry_run:
                print(f"🔍 Would create default team: {args.team_name}")
                team_id = 1  # Placeholder for dry run
            else:
                team = create_default_team(db_session, args.team_name)
                team_id = team.id
            if not args.dry_run:
                team_id = team.id
        
        print()
        print("📊 Starting data migration...")
        print()
        
        # Migrate each table
        total_updated = 0
        tables = get_tenant_aware_tables()
        
        for table_name in tables:
            updated = migrate_table_data(
                db_session,
                table_name,
                team_id if not args.dry_run else 1,
                args.dry_run
            )
            total_updated += updated
        
        print()
        print("=" * 60)
        if args.dry_run:
            print(f"🔍 DRY RUN COMPLETE")
            print(f"   Would update {total_updated} rows across {len(tables)} tables")
        else:
            print(f"✅ MIGRATION COMPLETE")
            print(f"   Updated {total_updated} rows across {len(tables)} tables")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        logger.error(f"Migration error: {e}", exc_info=True)
        db_session.rollback()
        sys.exit(1)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()

