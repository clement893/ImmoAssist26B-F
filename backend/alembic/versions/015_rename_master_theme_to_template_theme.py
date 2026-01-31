"""Rename master theme to TemplateTheme with ID 32

Revision ID: 015_rename_master_theme_to_template_theme
Revises: 014_add_tenancy_support
Create Date: 2025-01-27 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime
import json

# revision identifiers, used by Alembic.
revision = '015_rename_master_theme'
down_revision = '014_add_tenancy_support'
branch_labels = None
depends_on = None


def upgrade():
    """
    Rename master theme to TemplateTheme and set ID to 32.
    If master theme doesn't exist, create TemplateTheme with ID 32.
    """
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        print("Themes table does not exist, skipping migration")
        return
    
    # Check if a theme with name 'master' exists
    result = conn.execute(sa.text("SELECT id, name, display_name FROM themes WHERE name = 'master'"))
    master_theme = result.fetchone()
    
    # Check if TemplateTheme already exists
    result = conn.execute(sa.text("SELECT id FROM themes WHERE name = 'TemplateTheme'"))
    template_theme_exists = result.fetchone()
    
    if template_theme_exists:
        print("TemplateTheme already exists, skipping migration")
        return
    
    # Check if ID 32 is already taken
    result = conn.execute(sa.text("SELECT id FROM themes WHERE id = 32"))
    id_32_taken = result.fetchone()
    
    if id_32_taken:
        print("ID 32 is already taken by another theme, skipping migration")
        return
    
    # Default config for TemplateTheme - using comprehensive default
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
    
    if master_theme:
        # Rename master theme to TemplateTheme
        master_id = master_theme[0]
        
        # If master theme has ID 32, just rename it
        if master_id == 32:
            conn.execute(sa.text("""
                UPDATE themes 
                SET name = 'TemplateTheme', 
                    display_name = 'Template Theme',
                    description = 'Master theme that controls all components',
                    updated_at = :updated_at
                WHERE id = 32
            """), {"updated_at": datetime.utcnow()})
            print("Renamed master theme to TemplateTheme (ID 32)")
        else:
            # If master theme has different ID, we need to:
            # 1. Check if we can swap IDs or need to update sequence
            # 2. Update the master theme to TemplateTheme with ID 32
            
            # First, temporarily rename the master theme
            conn.execute(sa.text("""
                UPDATE themes 
                SET name = 'TemplateTheme_temp', 
                    updated_at = :updated_at
                WHERE id = :master_id
            """), {"master_id": master_id, "updated_at": datetime.utcnow()})
            
            # Update the ID to 32
            # We need to handle foreign key constraints if any
            # For now, we'll use a transaction-safe approach
            
            # Check if there are any active themes
            result = conn.execute(sa.text("SELECT id FROM themes WHERE is_active = true"))
            active_theme = result.fetchone()
            is_active = active_theme and active_theme[0] == master_id
            
            # Delete the old master theme
            conn.execute(sa.text("DELETE FROM themes WHERE id = :master_id"), {"master_id": master_id})
            
            # Insert TemplateTheme with ID 32
            # Use CAST for proper JSONB conversion with psycopg2
            conn.execute(sa.text("""
                INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
                VALUES (32, 'TemplateTheme', 'Template Theme', 'Master theme that controls all components', 
                        CAST(:config AS jsonb), :is_active, 1, :created_at, :updated_at)
            """), {
                "config": json.dumps(default_config),
                "is_active": is_active,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            print(f"Renamed master theme (ID {master_id}) to TemplateTheme (ID 32)")
    else:
        # Create TemplateTheme with ID 32
        # First, ensure the sequence is set correctly
        # Get the current max ID
        result = conn.execute(sa.text("SELECT COALESCE(MAX(id), 0) FROM themes"))
        max_id = result.scalar()
        
        # Set sequence to at least 33 if needed
        if max_id < 32:
            try:
                conn.execute(sa.text("SELECT setval('themes_id_seq', GREATEST(33, (SELECT COALESCE(MAX(id), 0) + 1 FROM themes)))"))
            except Exception as e:
                print(f"Warning: Could not update sequence: {e}")
        
        # Insert TemplateTheme with ID 32
        # Use CAST for proper JSONB conversion with psycopg2
        conn.execute(sa.text("""
            INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
            VALUES (32, 'TemplateTheme', 'Template Theme', 'Master theme that controls all components', 
                    CAST(:config AS jsonb), true, 1, :created_at, :updated_at)
        """), {
            "config": json.dumps(default_config),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        print("Created TemplateTheme with ID 32")
    
    # Ensure sequence is set correctly after insertion
    try:
        conn.execute(sa.text("SELECT setval('themes_id_seq', GREATEST(33, (SELECT COALESCE(MAX(id), 0) + 1 FROM themes)))"))
    except Exception as e:
        print(f"Warning: Could not update sequence: {e}")
    
    conn.commit()


def downgrade():
    """
    Revert TemplateTheme back to master theme.
    """
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        return
    
    # Check if TemplateTheme exists
    result = conn.execute(sa.text("SELECT id FROM themes WHERE name = 'TemplateTheme'"))
    template_theme = result.fetchone()
    
    if template_theme:
        # Rename TemplateTheme back to master
        conn.execute(sa.text("""
            UPDATE themes 
            SET name = 'master', 
                display_name = 'Master Theme',
                updated_at = :updated_at
            WHERE name = 'TemplateTheme'
        """), {"updated_at": datetime.utcnow()})
        
        print("Renamed TemplateTheme back to master")
    
    conn.commit()

