#!/usr/bin/env python3
"""
Script to check which theme is currently active in the database.
Run this from the backend directory: python scripts/check_active_theme.py
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
from app.models.theme import Theme
from sqlalchemy import select


async def check_active_theme():
    """Check which theme is currently active."""
    print("=" * 60)
    print("Checking active theme in database...")
    print("=" * 60)
    
    try:
        async for db in get_db():
            # Get all themes
            result = await db.execute(select(Theme))
            all_themes = result.scalars().all()
            
            print(f"\nTotal themes in database: {len(all_themes)}\n")
            
            if not all_themes:
                print("⚠️  No themes found in database!")
                print("   A default theme should be created automatically.")
                return
            
            # Find active theme
            active_result = await db.execute(select(Theme).where(Theme.is_active == True))
            active_theme = active_result.scalar_one_or_none()
            
            if active_theme:
                print("✅ ACTIVE THEME:")
                print(f"   ID: {active_theme.id}")
                print(f"   Name: {active_theme.name}")
                print(f"   Display Name: {active_theme.display_name}")
                print(f"   Description: {active_theme.description or 'N/A'}")
                print(f"   Is Active: {active_theme.is_active}")
                print(f"   Created By: {active_theme.created_by}")
                print(f"   Created At: {active_theme.created_at}")
                print(f"   Updated At: {active_theme.updated_at}")
                print(f"\n   Config:")
                if active_theme.config:
                    for key, value in active_theme.config.items():
                        print(f"     - {key}: {value}")
                else:
                    print("     (no config)")
            else:
                print("⚠️  No active theme found!")
                print("   This means no theme has is_active=True")
            
            # List all themes
            print(f"\n📋 ALL THEMES ({len(all_themes)}):")
            print("-" * 60)
            for theme in all_themes:
                status = "✅ ACTIVE" if theme.is_active else "   inactive"
                print(f"{status} | ID: {theme.id:3d} | {theme.display_name:30s} | {theme.name}")
            
            break  # Only need one session
        
        print("\n" + "=" * 60)
        print("Check complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error checking themes: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(check_active_theme())

