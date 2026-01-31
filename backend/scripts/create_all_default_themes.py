#!/usr/bin/env python3
"""
Script to create all default themes for new templates.
Run this from the backend directory: python scripts/create_all_default_themes.py

This script creates:
- TemplateTheme (ID 32) - Master theme
- LuxuryTheme (ID 31) - Premium luxury theme
- HypeModernTheme (ID 34) - Modern hype theme with complex design
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
from app.models.theme import Theme
from app.api.v1.endpoints.themes import ensure_default_theme
from sqlalchemy import select
from datetime import datetime

# Import theme configs
from scripts.create_luxury_theme import LUXURY_THEME_CONFIG
from scripts.create_hype_theme import HYPE_THEME_CONFIG


async def create_all_default_themes():
    """Create all default themes for new templates."""
    print("=" * 70)
    print("Creating All Default Themes for New Templates")
    print("=" * 70)
    
    themes_created = []
    themes_existing = []
    
    try:
        async for db in get_db():
            # 1. Ensure TemplateTheme (ID 32) exists
            print("\n" + "-" * 70)
            print("1. Checking TemplateTheme (ID 32)...")
            print("-" * 70)
            try:
                theme = await ensure_default_theme(db, created_by=1)
                themes_created.append(f"TemplateTheme (ID {theme.id})")
                print(f"✅ TemplateTheme ensured: {theme.name} (ID: {theme.id})")
            except Exception as e:
                result = await db.execute(select(Theme).where(Theme.id == 32))
                existing = result.scalar_one_or_none()
                if existing:
                    themes_existing.append(f"TemplateTheme (ID 32)")
                    print(f"ℹ️  TemplateTheme already exists (ID: 32)")
                else:
                    print(f"❌ Error ensuring TemplateTheme: {e}")
            
            # 2. Create LuxuryTheme (ID 31)
            print("\n" + "-" * 70)
            print("2. Checking LuxuryTheme (ID 31)...")
            print("-" * 70)
            try:
                result = await db.execute(select(Theme).where(Theme.id == 31))
                existing = result.scalar_one_or_none()
                if existing:
                    themes_existing.append(f"LuxuryTheme (ID 31)")
                    print(f"ℹ️  LuxuryTheme already exists (ID: 31)")
                else:
                    theme = Theme(
                        id=31,
                        name="LuxuryTheme",
                        display_name="Luxury Premium Theme",
                        description="Premium luxury theme with intelligent design, sophisticated UI components, and wow effects.",
                        config=LUXURY_THEME_CONFIG,
                        is_active=False,
                        created_by=1,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(theme)
                    await db.commit()
                    await db.refresh(theme)
                    themes_created.append(f"LuxuryTheme (ID 31)")
                    print(f"✅ Created LuxuryTheme (ID 31)")
            except Exception as e:
                print(f"❌ Error creating LuxuryTheme: {e}")
            
            # 3. Create HypeModernTheme (ID 34)
            print("\n" + "-" * 70)
            print("3. Checking HypeModernTheme (ID 34)...")
            print("-" * 70)
            try:
                result = await db.execute(select(Theme).where(Theme.id == 34))
                existing = result.scalar_one_or_none()
                if existing:
                    themes_existing.append(f"HypeModernTheme (ID 34)")
                    print(f"ℹ️  HypeModernTheme already exists (ID: 34)")
                else:
                    theme = Theme(
                        id=34,
                        name="HypeModernTheme",
                        display_name="Hype Modern Theme",
                        description="Thème moderne et hype avec design complexe : gradients néon, glassmorphism avancé, effets de lueur, animations fluides, et palette de couleurs vibrantes.",
                        config=HYPE_THEME_CONFIG,
                        is_active=False,
                        created_by=1,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(theme)
                    await db.commit()
                    await db.refresh(theme)
                    themes_created.append(f"HypeModernTheme (ID 34)")
                    print(f"✅ Created HypeModernTheme (ID 34)")
            except Exception as e:
                print(f"❌ Error creating HypeModernTheme: {e}")
            
            break
        
        # Summary
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        
        if themes_created:
            print(f"\n✅ Created {len(themes_created)} theme(s):")
            for theme in themes_created:
                print(f"   - {theme}")
        
        if themes_existing:
            print(f"\nℹ️  {len(themes_existing)} theme(s) already existed:")
            for theme in themes_existing:
                print(f"   - {theme}")
        
        print("\n" + "=" * 70)
        print("Default themes available for new templates:")
        print("   - TemplateTheme (ID 32) - Master theme")
        print("   - LuxuryTheme (ID 31) - Premium luxury theme")
        print("   - HypeModernTheme (ID 34) - Modern hype theme")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error creating default themes: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(create_all_default_themes())
