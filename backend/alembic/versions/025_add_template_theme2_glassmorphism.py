"""Add TemplateTheme2 with Glassmorphism style

Revision ID: 025_add_template_theme2
Revises: 024_add_avatar_column
Create Date: 2025-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import json

# revision identifiers, used by Alembic.
revision = '025_add_template_theme2'
down_revision = '024_add_avatar_column'
branch_labels = None
depends_on = None


def upgrade():
    """Create TemplateTheme2 (ID 33) with glassmorphism style."""
    conn = op.get_bind()
    
    try:
        # Check if themes table exists
        inspector = sa.inspect(conn)
        tables = inspector.get_table_names()
        
        if 'themes' not in tables:
            print("⚠️  Themes table does not exist, skipping TemplateTheme2 creation")
            return
        
        # Check if TemplateTheme2 (ID 33) already exists
        result = conn.execute(text("SELECT id, is_active FROM themes WHERE id = 33"))
        existing_theme = result.fetchone()
        
        if existing_theme:
            print("✅ TemplateTheme2 (ID 33) already exists")
            return
        
        # Glassmorphism theme config - inspired by modern glassmorphism design
        # Features: glass effects, gradients, soft shadows, modern colors
        glassmorphism_config = {
            "mode": "system",
            "primary_color": "#6366f1",  # Indigo - modern and elegant
            "secondary_color": "#8b5cf6",  # Purple - complements indigo
            "danger_color": "#ef4444",  # Red
            "warning_color": "#f59e0b",  # Amber
            "info_color": "#06b6d4",  # Cyan
            "success_color": "#10b981",  # Emerald
            "font_family": "Inter",
            "border_radius": "16px",  # More rounded for glass effect
            "typography": {
                "fontFamily": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                "fontFamilyHeading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                "fontFamilySubheading": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                "fontFamilyMono": "'Fira Code', 'Courier New', monospace",
                "fontSize": {
                    "xs": "12px",
                    "sm": "14px",
                    "base": "16px",
                    "lg": "18px",
                    "xl": "20px",
                    "2xl": "24px",
                    "3xl": "30px",
                    "4xl": "36px"
                },
                "fontWeight": {
                    "normal": "400",
                    "medium": "500",
                    "semibold": "600",
                    "bold": "700"
                },
                "lineHeight": {
                    "tight": "1.25",
                    "normal": "1.5",
                    "relaxed": "1.75"
                },
                "textHeading": "#0f172a",  # Slate 900
                "textSubheading": "#334155",  # Slate 700
                "textBody": "#1e293b",  # Slate 800
                "textSecondary": "#64748b",  # Slate 500
                "textLink": "#6366f1"  # Indigo
            },
            "colors": {
                "primary": "#6366f1",  # Indigo
                "secondary": "#8b5cf6",  # Purple
                "danger": "#ef4444",
                "warning": "#f59e0b",
                "info": "#06b6d4",
                "success": "#10b981",
                "background": "#f8fafc",  # Slate 50 - lighter for glass effect
                "foreground": "#0f172a",  # Slate 900
                "muted": "#f1f5f9",  # Slate 100
                "mutedForeground": "#64748b",  # Slate 500
                "border": "#e2e8f0",  # Slate 200
                "input": "#ffffff",
                "ring": "#6366f1",  # Indigo
                "destructive": "#ef4444",
                "destructiveForeground": "#ffffff",
                "successForeground": "#ffffff",
                "warningForeground": "#ffffff",
                "infoForeground": "#ffffff"
            },
            "spacing": {
                "unit": "8px",
                "xs": "4px",
                "sm": "8px",
                "md": "16px",
                "lg": "24px",
                "xl": "32px",
                "2xl": "48px",
                "3xl": "64px"
            },
            "borderRadius": {
                "none": "0",
                "sm": "4px",
                "base": "8px",
                "md": "12px",
                "lg": "16px",
                "xl": "20px",
                "2xl": "24px",
                "full": "9999px"
            },
            "shadow": {
                "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                "base": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            },
            "breakpoint": {
                "sm": "640px",
                "md": "768px",
                "lg": "1024px",
                "xl": "1280px",
                "2xl": "1536px"
            },
            "effects": {
                "glassmorphism": {
                    "enabled": True,  # Glassmorphism activated
                    "blur": "20px",  # Strong blur for glass effect
                    "saturation": "180%",  # High saturation for vibrant colors
                    "opacity": 0.15,  # Semi-transparent background
                    "borderOpacity": 0.3  # More visible borders
                },
                "gradients": {
                    "enabled": True,  # Gradients activated
                    "direction": "to-br",  # Bottom-right gradient
                    "intensity": 0.4  # Moderate intensity
                },
                "shadows": {
                    "enabled": True,  # Colored shadows activated
                    "primary": "0 0 20px rgba(99, 102, 241, 0.3)",  # Indigo glow
                    "secondary": "0 0 20px rgba(139, 92, 246, 0.3)"  # Purple glow
                }
            }
        }
        
        config_json = json.dumps(glassmorphism_config)
        
        # Insert TemplateTheme2 with ID 33
        # Don't activate it by default (TemplateTheme should remain active)
        conn.execute(text("""
            INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
            VALUES (33, 'TemplateTheme2', 'Template Theme 2 - Glassmorphism', 
                    'Modern glassmorphism theme with glass effects, gradients, and elegant colors', 
                    CAST(:config AS jsonb), false, 1, NOW(), NOW())
        """), {
            "config": config_json
        })
        
        print(f"✅ Created TemplateTheme2 (ID 33) with glassmorphism style")
        
    except Exception as e:
        print(f"❌ Error creating TemplateTheme2: {e}")
        raise


def downgrade():
    """Remove TemplateTheme2 (ID 33) if it exists."""
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        print("⚠️  Themes table does not exist, skipping TemplateTheme2 removal")
        return
    
    # Check if TemplateTheme2 exists
    result = conn.execute(text("SELECT id FROM themes WHERE id = 33"))
    existing_theme = result.fetchone()
    
    if existing_theme:
        # Check if it's active
        active_check = conn.execute(text("SELECT is_active FROM themes WHERE id = 33"))
        is_active = active_check.scalar()
        
        if is_active:
            # Activate TemplateTheme (ID 32) if it exists
            template_result = conn.execute(text("SELECT id FROM themes WHERE id = 32"))
            template_theme = template_result.fetchone()
            
            if template_theme:
                conn.execute(text("UPDATE themes SET is_active = true WHERE id = 32"))
                print("   Activated TemplateTheme (ID 32) before removing TemplateTheme2")
        
        # Remove TemplateTheme2
        conn.execute(text("DELETE FROM themes WHERE id = 33"))
        print("✅ Removed TemplateTheme2 (ID 33)")
    else:
        print("ℹ️  TemplateTheme2 (ID 33) does not exist, nothing to remove")
