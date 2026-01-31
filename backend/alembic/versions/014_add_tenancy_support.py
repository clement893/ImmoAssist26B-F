"""Add tenancy support (conditional)

This migration adds team_id columns to tenant-aware tables, but only if
TENANCY_MODE is set to 'shared_db' or 'separate_db'. If TENANCY_MODE is 'single',
this migration does nothing.

Revision ID: 014_add_tenancy_support
Revises: 013_pages_forms_menus_tickets
Create Date: 2025-01-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import os
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '014_add_tenancy_support'
down_revision = '013_pages_forms_menus_tickets'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add team_id columns to tenant-aware tables if tenancy is enabled.
    
    This migration is conditional - it only runs if TENANCY_MODE is not 'single'.
    """
    tenancy_mode = os.getenv("TENANCY_MODE", "single").lower().strip()
    
    # If single mode, do nothing
    if tenancy_mode == "single":
        print("TENANCY_MODE=single, skipping tenancy migration")
        return
    
    print(f"TENANCY_MODE={tenancy_mode}, adding tenancy support")
    
    # Get connection and inspector
    connection = op.get_bind()
    inspector = inspect(connection)
    tables = inspector.get_table_names()
    
    # List of tables that should have team_id (tenant-aware tables)
    # Exclude: users, teams, team_members, roles, invitations (these are tenant-agnostic)
    tenant_aware_tables = [
        "projects",
        "forms",
        "form_submissions",
        "files",
        "templates",
        "pages",
        "menus",
        "support_tickets",
        "ticket_messages",
        "api_keys",
        "webhook_events",
        "favorites",
        "comments",
        "shares",
        "integrations",
    ]
    
    # Add team_id to each tenant-aware table
    for table_name in tenant_aware_tables:
        if table_name not in tables:
            print(f"Table {table_name} does not exist, skipping")
            continue
        
        # Check if team_id already exists
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        if 'team_id' in columns:
            print(f"Table {table_name} already has team_id column, skipping")
            continue
        
        # Add team_id column (nullable initially for existing data migration)
        op.add_column(
            table_name,
            sa.Column('team_id', sa.Integer(), nullable=True)
        )
        
        # Create foreign key constraint
        try:
            op.create_foreign_key(
                f'fk_{table_name}_team',
                table_name,
                'teams',
                ['team_id'],
                ['id'],
                ondelete='CASCADE'
            )
        except Exception as e:
            print(f"Warning: Could not create foreign key for {table_name}: {e}")
        
        # Create index
        try:
            op.create_index(
                f'idx_{table_name}_team_id',
                table_name,
                ['team_id']
            )
        except Exception as e:
            print(f"Warning: Could not create index for {table_name}: {e}")
        
        print(f"Added team_id to {table_name}")
    
    print("Tenancy support migration completed")


def downgrade():
    """
    Remove team_id columns from tenant-aware tables.
    
    This is a destructive operation - use with caution!
    """
    tenancy_mode = os.getenv("TENANCY_MODE", "single").lower().strip()
    
    # If single mode, nothing to downgrade
    if tenancy_mode == "single":
        print("TENANCY_MODE=single, nothing to downgrade")
        return
    
    print(f"TENANCY_MODE={tenancy_mode}, removing tenancy support")
    
    # Get connection and inspector
    connection = op.get_bind()
    inspector = inspect(connection)
    tables = inspector.get_table_names()
    
    # List of tables that have team_id
    tenant_aware_tables = [
        "projects",
        "forms",
        "form_submissions",
        "files",
        "templates",
        "pages",
        "menus",
        "support_tickets",
        "ticket_messages",
        "api_keys",
        "webhook_events",
        "favorites",
        "comments",
        "shares",
        "integrations",
    ]
    
    # Remove team_id from each table
    for table_name in tenant_aware_tables:
        if table_name not in tables:
            continue
        
        # Check if team_id exists
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        if 'team_id' not in columns:
            continue
        
        # Drop index
        try:
            op.drop_index(f'idx_{table_name}_team_id', table_name=table_name)
        except Exception as e:
            print(f"Warning: Could not drop index for {table_name}: {e}")
        
        # Drop foreign key constraint
        try:
            op.drop_constraint(f'fk_{table_name}_team', table_name, type_='foreignkey')
        except Exception as e:
            print(f"Warning: Could not drop foreign key for {table_name}: {e}")
        
        # Drop column
        try:
            op.drop_column(table_name, 'team_id')
        except Exception as e:
            print(f"Warning: Could not drop column for {table_name}: {e}")
        
        print(f"Removed team_id from {table_name}")
    
    print("Tenancy support downgrade completed")

