"""Ensure TemplateTheme exists

Revision ID: 017_ensure_template_theme
Revises: 016
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '017_ensure_template_theme'
down_revision = '016_remove_default_theme'
branch_labels = None
depends_on = None


def upgrade():
    """Ensure TemplateTheme (ID 32) exists in the database."""
    conn = op.get_bind()
    # Alembic already manages transactions, don't create a new one
    # Use conn directly without begin()
    
    try:
        # Check if themes table exists
        inspector = sa.inspect(conn)
        tables = inspector.get_table_names()
        
        if 'themes' not in tables:
            print("⚠️  Themes table does not exist, skipping TemplateTheme creation")
            print("   Run migration 001_create_themes_table first")
            return
        
        # Check if TemplateTheme (ID 32) already exists
        result = conn.execute(text("SELECT id, is_active FROM themes WHERE id = 32"))
        existing_theme = result.fetchone()
        
        if existing_theme:
            print("✅ TemplateTheme (ID 32) already exists")
            
            # Ensure it's active if no other theme is active
            active_result = conn.execute(text("SELECT id FROM themes WHERE is_active = true AND id != 32"))
            active_theme = active_result.fetchone()
            
            if not active_theme and not existing_theme[1]:  # existing_theme[1] is is_active
                print("   Activating TemplateTheme (no other active theme found)")
                conn.execute(text("UPDATE themes SET is_active = true, updated_at = NOW() WHERE id = 32"))
            
            return
        
        # Check if any theme is currently active
        active_result = conn.execute(text("SELECT id FROM themes WHERE is_active = true"))
        active_theme = active_result.fetchone()
        
        # Create TemplateTheme - activate it only if no other theme is active
        is_active = active_theme is None
        
        # Default config for TemplateTheme - comprehensive configuration
        default_config = {
            "mode": "system",
            "primary_color": "#3b82f6",
            "secondary_color": "#8b5cf6",
            "danger_color": "#ef4444",
            "warning_color": "#f59e0b",
            "info_color": "#06b6d4",
            "success_color": "#10b981",
            "font_family": "Inter",
            "border_radius": "8px",
            "typography": {
                "fontFamily": "Inter, system-ui, -apple-system, sans-serif",
                "fontFamilyHeading": "Inter, system-ui, -apple-system, sans-serif",
                "fontFamilySubheading": "Inter, system-ui, -apple-system, sans-serif",
                "fontFamilyMono": "Fira Code, monospace",
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
                "textHeading": "#111827",
                "textSubheading": "#374151",
                "textBody": "#1f2937",
                "textSecondary": "#6b7280",
                "textLink": "#3b82f6"
            },
            "colors": {
                "background": "#ffffff",
                "foreground": "#000000",
                "primary": "#3b82f6",
                "primaryForeground": "#ffffff",
                "secondary": "#8b5cf6",
                "secondaryForeground": "#ffffff",
                "accent": "#f59e0b",
                "accentForeground": "#000000",
                "muted": "#f3f4f6",
                "mutedForeground": "#6b7280",
                "border": "#e5e7eb",
                "input": "#ffffff",
                "ring": "#3b82f6",
                "destructive": "#ef4444",
                "destructiveForeground": "#ffffff",
                "success": "#10b981",
                "successForeground": "#ffffff",
                "warning": "#f59e0b",
                "warningForeground": "#000000",
                "info": "#06b6d4",
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
                "sm": "2px",
                "base": "4px",
                "md": "6px",
                "lg": "8px",
                "xl": "12px",
                "2xl": "16px",
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
                    "enabled": False,
                    "blur": "10px",
                    "saturation": "180%",
                    "opacity": 0.1,
                    "borderOpacity": 0.2
                },
                "gradients": {
                    "enabled": False,
                    "direction": "to-br",
                    "intensity": 0.3
                },
                "shadows": {
                    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }
            }
        }
        
        import json
        config_json = json.dumps(default_config)
        
        # Insert TemplateTheme with ID 32
        # Use CAST for proper JSONB conversion with psycopg2
        conn.execute(text("""
            INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
            VALUES (32, 'TemplateTheme', 'Template Theme', 'Master theme that controls all components', 
                    CAST(:config AS jsonb), :is_active, 1, NOW(), NOW())
        """), {
            "config": config_json,
            "is_active": is_active
        })
        
        print(f"✅ Created TemplateTheme (ID 32) - Active: {is_active}")
        
    except Exception as e:
        print(f"❌ Error creating TemplateTheme: {e}")
        raise


def downgrade():
    """Remove TemplateTheme (ID 32) if it exists."""
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        print("⚠️  Themes table does not exist, skipping TemplateTheme removal")
        return
    
    # Check if TemplateTheme exists
    result = conn.execute(text("SELECT id FROM themes WHERE id = 32"))
    existing_theme = result.fetchone()
    
    if existing_theme:
        # Check if it's the only theme
        all_themes_result = conn.execute(text("SELECT COUNT(*) FROM themes"))
        theme_count = all_themes_result.scalar()
        
        if theme_count == 1:
            print("⚠️  TemplateTheme is the only theme, skipping removal")
            print("   Create another theme before removing TemplateTheme")
            return
        
        # If it's active, activate another theme first
        if existing_theme:
            active_check = conn.execute(text("SELECT is_active FROM themes WHERE id = 32"))
            is_active = active_check.scalar()
            
            if is_active:
                # Find another theme to activate
                other_theme_result = conn.execute(text("SELECT id FROM themes WHERE id != 32 LIMIT 1"))
                other_theme = other_theme_result.fetchone()
                
                if other_theme:
                    conn.execute(text("UPDATE themes SET is_active = true WHERE id = :id"), {"id": other_theme[0]})
                    print(f"   Activated theme ID {other_theme[0]} before removing TemplateTheme")
        
        # Remove TemplateTheme
        conn.execute(text("DELETE FROM themes WHERE id = 32"))
        conn.commit()
        print("✅ Removed TemplateTheme (ID 32)")
    else:
        print("ℹ️  TemplateTheme (ID 32) does not exist, nothing to remove")

