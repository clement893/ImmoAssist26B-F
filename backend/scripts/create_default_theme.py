#!/usr/bin/env python3
"""
Script to create the default TemplateTheme in the database.
Run this from the backend directory: python scripts/create_default_theme.py
"""

import asyncio
import sys
import os
import json
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
from app.models.theme import Theme
from app.api.v1.endpoints.themes import ensure_default_theme
from sqlalchemy import select


async def create_default_theme():
    """Create the default TemplateTheme if it doesn't exist."""
    print("=" * 60)
    print("Creating default TemplateTheme...")
    print("=" * 60)
    
    try:
        async for db in get_db():
            # Check if TemplateTheme already exists
            result = await db.execute(select(Theme).where(Theme.id == 32))
            existing_theme = result.scalar_one_or_none()
            
            if existing_theme:
                print(f"\n✅ TemplateTheme already exists!")
                print(f"   ID: {existing_theme.id}")
                print(f"   Name: {existing_theme.name}")
                print(f"   Display Name: {existing_theme.display_name}")
                print(f"   Is Active: {existing_theme.is_active}")
                print(f"   Config: {json.dumps(existing_theme.config, indent=2)}")
                
                # Check if it's active
                if not existing_theme.is_active:
                    active_result = await db.execute(select(Theme).where(Theme.is_active == True))
                    active_theme = active_result.scalar_one_or_none()
                    if not active_theme:
                        print("\n⚠️  TemplateTheme exists but is not active. Activating it...")
                        existing_theme.is_active = True
                        await db.commit()
                        await db.refresh(existing_theme)
                        print("✅ TemplateTheme is now active!")
            else:
                print("\n📝 Creating TemplateTheme...")
                theme = await ensure_default_theme(db, created_by=1)
                print(f"\n✅ TemplateTheme created successfully!")
                print(f"   ID: {theme.id}")
                print(f"   Name: {theme.name}")
                print(f"   Display Name: {theme.display_name}")
                print(f"   Is Active: {theme.is_active}")
                print(f"   Config: {json.dumps(theme.config, indent=2)}")
            
            break
        
        print("\n" + "=" * 60)
        print("Done!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error creating theme: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(create_default_theme())

