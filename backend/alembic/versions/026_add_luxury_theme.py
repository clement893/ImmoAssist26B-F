"""Add Luxury Premium Theme (ID 31)

Revision ID: 026_add_luxury_theme
Revises: 025_add_template_theme2
Create Date: 2025-12-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import json
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '026_add_luxury_theme'
down_revision = '025_add_template_theme2'
branch_labels = None
depends_on = None


def upgrade():
    """Create Luxury Premium Theme (ID 31) with premium design and intelligent UI."""
    conn = op.get_bind()
    
    try:
        # Check if themes table exists
        inspector = sa.inspect(conn)
        tables = inspector.get_table_names()
        
        if 'themes' not in tables:
            print("⚠️  Themes table does not exist, skipping Luxury Theme creation")
            return
        
        # Check if Luxury Theme (ID 31) already exists
        result = conn.execute(text("SELECT id, is_active FROM themes WHERE id = 31"))
        existing_theme = result.fetchone()
        
        if existing_theme:
            print("✅ Luxury Theme (ID 31) already exists")
            return
        
        # Luxury Premium Theme Configuration
        # Features: Premium purple/pink gradients, glassmorphism, intelligent spacing, wow effects
        luxury_config = {
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
        
        config_json = json.dumps(luxury_config)
        
        # Insert Luxury Theme with ID 31 (not active by default)
        conn.execute(text("""
            INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
            VALUES (31, 'LuxuryTheme', 'Luxury Premium Theme', 
                    'Premium luxury theme with intelligent design, sophisticated UI components, and wow effects. Features elegant gradients, glassmorphism, premium typography, and intelligent spacing.', 
                    CAST(:config AS jsonb), false, 1, NOW(), NOW())
        """), {
            "config": config_json
        })
        
        print("✅ Created Luxury Premium Theme (ID 31)")
        print("   - Premium purple/pink gradient color scheme")
        print("   - Intelligent spacing and typography")
        print("   - Glassmorphism effects")
        print("   - Premium shadows with purple tint")
        print("   - Wow component styles (glow, shimmer, gradients)")
        print("   - Smooth animations and transitions")
        
    except Exception as e:
        print(f"❌ Error creating Luxury Theme: {e}")
        raise


def downgrade():
    """Remove Luxury Theme (ID 31) if it exists."""
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        print("⚠️  Themes table does not exist, skipping Luxury Theme removal")
        return
    
    # Check if Luxury Theme exists
    result = conn.execute(text("SELECT id, is_active FROM themes WHERE id = 31"))
    existing_theme = result.fetchone()
    
    if existing_theme:
        # If it's active, activate another theme first
        if existing_theme[1]:  # is_active
            # Find another theme to activate
            other_theme_result = conn.execute(text("SELECT id FROM themes WHERE id != 31 AND is_active = false LIMIT 1"))
            other_theme = other_theme_result.fetchone()
            
            if other_theme:
                conn.execute(text("UPDATE themes SET is_active = true WHERE id = :id"), {"id": other_theme[0]})
                print(f"   Activated theme ID {other_theme[0]} before removing Luxury Theme")
        
        # Remove Luxury Theme
        conn.execute(text("DELETE FROM themes WHERE id = 31"))
        print("✅ Removed Luxury Theme (ID 31)")
    else:
        print("ℹ️  Luxury Theme (ID 31) does not exist, nothing to remove")
