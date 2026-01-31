"""Remove default theme from database

Revision ID: 016_remove_default_theme
Revises: 015_rename_master_theme
Create Date: 2025-12-26 16:22:17.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime
import json

# revision identifiers, used by Alembic.
revision = '016_remove_default_theme'
down_revision = '015_rename_master_theme'
branch_labels = None
depends_on = None


def upgrade():
    """
    Remove default theme (name='default' or id=0) from database.
    If default theme is active, activate TemplateTheme (ID 32) first.
    """
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        print("Themes table does not exist, skipping migration")
        return
    
    # Find default theme(s) - could be id=0 or name='default'
    result = conn.execute(sa.text("""
        SELECT id, name, is_active 
        FROM themes 
        WHERE id = 0 OR name = 'default'
    """))
    default_themes = result.fetchall()
    
    if not default_themes:
        print("No default theme found, skipping migration")
        return
    
    # Check if any default theme is active
    active_default_theme = None
    for theme in default_themes:
        if theme[2]:  # is_active is True
            active_default_theme = theme
            break
    
    # If default theme is active, activate TemplateTheme (ID 32) first
    if active_default_theme:
        # Check if TemplateTheme exists
        result = conn.execute(sa.text("SELECT id FROM themes WHERE id = 32"))
        template_theme = result.fetchone()
        
        if template_theme:
            # Activate TemplateTheme
            conn.execute(sa.text("""
                UPDATE themes 
                SET is_active = true, 
                    updated_at = :updated_at
                WHERE id = 32
            """), {"updated_at": datetime.utcnow()})
            print("Activated TemplateTheme (ID 32) before removing default theme")
        else:
            # If TemplateTheme doesn't exist, create it first
            default_config = {
                "mode": "system",
                "primary": "#3b82f6",
                "secondary": "#8b5cf6",
                "danger": "#ef4444",
                "warning": "#f59e0b",
                "info": "#06b6d4",
            }
            
            conn.execute(sa.text("""
                INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
                VALUES (32, 'TemplateTheme', 'Template Theme', 'Master theme that controls all components', 
                        :config::jsonb, true, 1, :created_at, :updated_at)
            """), {
                "config": json.dumps(default_config),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            print("Created and activated TemplateTheme (ID 32) before removing default theme")
    
    # Delete all default themes (id=0 or name='default')
    result = conn.execute(sa.text("""
        DELETE FROM themes 
        WHERE id = 0 OR name = 'default'
    """))
    deleted_count = result.rowcount
    
    if deleted_count > 0:
        print(f"Deleted {deleted_count} default theme(s) from database")
    else:
        print("No default themes were deleted")
    
    conn.commit()


def downgrade():
    """
    Revert: Recreate default theme if needed.
    Note: This is a destructive operation, so downgrade is minimal.
    """
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        return
    
    # Check if default theme already exists
    result = conn.execute(sa.text("SELECT id FROM themes WHERE id = 0 OR name = 'default'"))
    default_theme_exists = result.fetchone()
    
    if default_theme_exists:
        print("Default theme already exists, skipping downgrade")
        return
    
    # Note: We don't recreate the default theme in downgrade
    # because we don't know what its original configuration was
    print("Downgrade: Default theme was removed and cannot be automatically recreated")
    conn.commit()

