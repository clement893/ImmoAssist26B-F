#!/usr/bin/env python3
"""
Script to update the existing TemplateTheme config to use proper field names.
Run this from the backend directory: python scripts/update_theme_config.py
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
from sqlalchemy import select, text


async def update_theme_config():
    """Update TemplateTheme config to use proper field names."""
    print("=" * 60)
    print("Updating TemplateTheme config...")
    print("=" * 60)
    
    try:
        async for db in get_db():
            # Find TemplateTheme
            result = await db.execute(select(Theme).where(Theme.id == 32))
            theme = result.scalar_one_or_none()
            
            if not theme:
                print("\n❌ TemplateTheme (ID 32) not found!")
                print("   Run create_default_theme.py first to create it.")
                return
            
            print(f"\n📝 Found TemplateTheme:")
            print(f"   ID: {theme.id}")
            print(f"   Name: {theme.name}")
            print(f"   Current config: {json.dumps(theme.config, indent=2)}")
            
            # Get current config
            current_config = theme.config or {}
            
            # Import comprehensive default config
            from app.core.theme_defaults import DEFAULT_THEME_CONFIG
            
            # Start with comprehensive default config
            new_config = DEFAULT_THEME_CONFIG.copy()
            
            # Preserve existing values if they exist (merge strategy)
            # Update basic colors if they exist in old format
            if "primary" in current_config and "primary_color" not in current_config:
                new_config["primary_color"] = current_config["primary"]
            elif "primary_color" in current_config:
                new_config["primary_color"] = current_config["primary_color"]
                
            if "secondary" in current_config and "secondary_color" not in current_config:
                new_config["secondary_color"] = current_config["secondary"]
            elif "secondary_color" in current_config:
                new_config["secondary_color"] = current_config["secondary_color"]
                
            if "danger" in current_config and "danger_color" not in current_config:
                new_config["danger_color"] = current_config["danger"]
            elif "danger_color" in current_config:
                new_config["danger_color"] = current_config["danger_color"]
                
            if "warning" in current_config and "warning_color" not in current_config:
                new_config["warning_color"] = current_config["warning"]
            elif "warning_color" in current_config:
                new_config["warning_color"] = current_config["warning_color"]
                
            if "info" in current_config and "info_color" not in current_config:
                new_config["info_color"] = current_config["info"]
            elif "info_color" in current_config:
                new_config["info_color"] = current_config["info_color"]
            
            # Preserve mode if set
            if "mode" in current_config:
                new_config["mode"] = current_config["mode"]
            
            # Preserve existing nested structures if they exist
            if "typography" in current_config:
                new_config["typography"] = {**new_config.get("typography", {}), **current_config["typography"]}
            if "colors" in current_config:
                new_config["colors"] = {**new_config.get("colors", {}), **current_config["colors"]}
            if "spacing" in current_config:
                new_config["spacing"] = {**new_config.get("spacing", {}), **current_config["spacing"]}
            if "borderRadius" in current_config:
                new_config["borderRadius"] = {**new_config.get("borderRadius", {}), **current_config["borderRadius"]}
            if "shadow" in current_config:
                new_config["shadow"] = {**new_config.get("shadow", {}), **current_config["shadow"]}
            if "effects" in current_config:
                new_config["effects"] = {**new_config.get("effects", {}), **current_config["effects"]}
            
            # Preserve any other custom fields
            for key, value in current_config.items():
                if key not in new_config and key not in ["primary", "secondary", "danger", "warning", "info"]:
                    new_config[key] = value
            
            # Update the theme
            theme.config = new_config
            await db.commit()
            await db.refresh(theme)
            
            print(f"\n✅ TemplateTheme config updated successfully!")
            print(f"   New config: {json.dumps(theme.config, indent=2)}")
            
            break
        
        print("\n" + "=" * 60)
        print("Done!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error updating theme config: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(update_theme_config())

