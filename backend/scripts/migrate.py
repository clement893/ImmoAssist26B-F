#!/usr/bin/env python3
"""
Database Migration Script
Handles Alembic migrations with rollback support
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic import command
from alembic.config import Config


def get_alembic_config() -> Config:
    """Get Alembic configuration"""
    alembic_cfg = Config(str(Path(__file__).parent.parent / "alembic.ini"))
    return alembic_cfg


def upgrade(revision: str = "head") -> None:
    """Upgrade database to revision"""
    print(f"Upgrading database to revision: {revision}")
    alembic_cfg = get_alembic_config()
    command.upgrade(alembic_cfg, revision)
    print("✓ Database upgraded successfully")


def downgrade(revision: str) -> None:
    """Downgrade database to revision"""
    print(f"Downgrading database to revision: {revision}")
    alembic_cfg = get_alembic_config()
    command.downgrade(alembic_cfg, revision)
    print("✓ Database downgraded successfully")


def create_revision(message: str, autogenerate: bool = True) -> None:
    """Create a new migration revision"""
    print(f"Creating migration: {message}")
    alembic_cfg = get_alembic_config()
    command.revision(
        alembic_cfg,
        message=message,
        autogenerate=autogenerate,
    )
    print("✓ Migration created successfully")


def show_current() -> None:
    """Show current database revision"""
    alembic_cfg = get_alembic_config()
    command.current(alembic_cfg)


def show_history() -> None:
    """Show migration history"""
    alembic_cfg = get_alembic_config()
    command.history(alembic_cfg)


def main() -> None:
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Database migration tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Upgrade command
    upgrade_parser = subparsers.add_parser("upgrade", help="Upgrade database")
    upgrade_parser.add_argument(
        "--revision",
        default="head",
        help="Target revision (default: head)",
    )

    # Downgrade command
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade database")
    downgrade_parser.add_argument(
        "revision",
        help="Target revision (use -1 for previous, -2 for two before, etc.)",
    )

    # Create revision command
    create_parser = subparsers.add_parser("create", help="Create new migration")
    create_parser.add_argument("message", help="Migration message")
    create_parser.add_argument(
        "--no-autogenerate",
        action="store_true",
        help="Create empty migration without autogenerate",
    )

    # Current revision command
    subparsers.add_parser("current", help="Show current revision")

    # History command
    subparsers.add_parser("history", help="Show migration history")

    args = parser.parse_args()

    if args.command == "upgrade":
        upgrade(args.revision)
    elif args.command == "downgrade":
        downgrade(args.revision)
    elif args.command == "create":
        create_revision(args.message, autogenerate=not args.no_autogenerate)
    elif args.command == "current":
        show_current()
    elif args.command == "history":
        show_history()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

