#!/usr/bin/env python3
"""
Script to create the Luxury Premium Theme (ID 31) in the database.
Run this from the backend directory: python scripts/create_luxury_theme.py
"""

import asyncio
import sys
import json
from pathlib import Path
from datetime import datetime

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
from app.models.theme import Theme
from sqlalchemy import select


# Luxury Theme Configuration - Premium Design with Intelligent UI
LUXURY_THEME_CONFIG = {
    "mode": "system",
    "primary_color": "#8B5CF6",  # Premium purple
    "secondary_color": "#EC4899",  # Elegant pink
    "danger_color": "#EF4444",
    "warning_color": "#F59E0B",
    "info_color": "#06B6D4",
    "success_color": "#10B981",
    "font_family": "Inter",
    "border_radius": "12px",
    "typography": {
        "fontFamily": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        "fontFamilyHeading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        "fontFamilySubheading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        "fontFamilyMono": "'Fira Code', 'Courier New', monospace",
        "fontSize": {
            "xs": "12px",
            "sm": "14px",
            "base": "16px",
            "lg": "18px",
            "xl": "20px",
            "2xl": "24px",
            "3xl": "30px",
            "4xl": "36px",
            "5xl": "48px"
        },
        "fontWeight": {
            "normal": "400",
            "medium": "500",
            "semibold": "600",
            "bold": "700",
            "extrabold": "800"
        },
        "lineHeight": {
            "tight": "1.25",
            "normal": "1.5",
            "relaxed": "1.75"
        },
        "textHeading": "#0F172A",
        "textSubheading": "#334155",
        "textBody": "#1E293B",
        "textSecondary": "#64748B",
        "textLink": "#8B5CF6"
    },
    "colors": {
        "background": "#FFFFFF",
        "foreground": "#0F172A",
        "primary": "#8B5CF6",
        "primaryForeground": "#FFFFFF",
        "secondary": "#EC4899",
        "secondaryForeground": "#FFFFFF",
        "accent": "#F59E0B",
        "accentForeground": "#000000",
        "muted": "#F8FAFC",
        "mutedForeground": "#64748B",
        "border": "#E2E8F0",
        "input": "#FFFFFF",
        "ring": "#8B5CF6",
        "destructive": "#EF4444",
        "destructiveForeground": "#FFFFFF",
        "success": "#10B981",
        "successForeground": "#FFFFFF",
        "warning": "#F59E0B",
        "warningForeground": "#FFFFFF",
        "info": "#06B6D4",
        "infoForeground": "#FFFFFF"
    },
    "spacing": {
        "unit": "8px",
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "2xl": "48px",
        "3xl": "64px",
        "4xl": "96px"
    },
    "borderRadius": {
        "none": "0",
        "sm": "4px",
        "base": "6px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "2xl": "20px",
        "full": "9999px"
    },
    "shadow": {
        "sm": "0 1px 2px 0 rgba(139, 92, 246, 0.05)",
        "base": "0 1px 3px 0 rgba(139, 92, 246, 0.1), 0 1px 2px 0 rgba(139, 92, 246, 0.06)",
        "md": "0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06)",
        "lg": "0 10px 15px -3px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)",
        "xl": "0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)",
        "2xl": "0 25px 50px -12px rgba(139, 92, 246, 0.25)",
        "inner": "inset 0 2px 4px 0 rgba(139, 92, 246, 0.06)"
    },
    "effects": {
        "glassmorphism": "backdrop-filter: blur(16px) saturate(180%); background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(139, 92, 246, 0.125);",
        "gradientPrimary": "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
        "gradientSecondary": "linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)",
        "gradientAccent": "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
        "glow": "0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)",
        "glowHover": "0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)",
        "shimmer": "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
        "animation": "smooth, elegant, premium"
    },
    "components": {
        "button": {
            "style": "premium",
            "hover": "glow",
            "transition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "shadow": "lg"
        },
        "card": {
            "style": "glassmorphism",
            "border": "subtle",
            "shadow": "xl",
            "hover": "lift"
        },
        "input": {
            "style": "premium",
            "focus": "glow",
            "border": "gradient"
        },
        "modal": {
            "style": "glassmorphism",
            "backdrop": "blur",
            "animation": "smooth"
        }
    },
    "breakpoint": {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px"
    }
}


async def create_luxury_theme():
    """Create the Luxury Premium Theme if it doesn't exist."""
    print("=" * 60)
    print("Creating Luxury Premium Theme (ID 31)...")
    print("=" * 60)
    
    try:
        async for db in get_db():
            # Check if Luxury Theme already exists
            result = await db.execute(select(Theme).where(Theme.id == 31))
            existing_theme = result.scalar_one_or_none()
            
            if existing_theme:
                print(f"\n✅ Luxury Theme already exists!")
                print(f"   ID: {existing_theme.id}")
                print(f"   Name: {existing_theme.name}")
                print(f"   Display Name: {existing_theme.display_name}")
                print(f"   Is Active: {existing_theme.is_active}")
                return
            
            # Create new Luxury Theme
            print("\n📝 Creating Luxury Premium Theme...")
            theme = Theme(
                id=31,
                name="LuxuryTheme",
                display_name="Luxury Premium Theme",
                description="Premium luxury theme with intelligent design, sophisticated UI components, and wow effects. Features elegant gradients, glassmorphism, premium typography, and intelligent spacing.",
                config=LUXURY_THEME_CONFIG,
                is_active=False,  # Don't activate by default
                created_by=1,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(theme)
            await db.commit()
            await db.refresh(theme)
            
            print(f"\n✅ Luxury Premium Theme created successfully!")
            print(f"   ID: {theme.id}")
            print(f"   Name: {theme.name}")
            print(f"   Display Name: {theme.display_name}")
            print(f"   Description: {theme.description}")
            print(f"   Is Active: {theme.is_active}")
            print(f"\n🎨 Theme Features:")
            print(f"   - Premium purple/pink gradient color scheme")
            print(f"   - Intelligent spacing and typography")
            print(f"   - Glassmorphism effects")
            print(f"   - Premium shadows with purple tint")
            print(f"   - Wow component styles (glow, shimmer, gradients)")
            print(f"   - Smooth animations and transitions")
            
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
    asyncio.run(create_luxury_theme())
