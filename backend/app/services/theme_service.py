"""
Theme service for managing platform themes.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.theme import Theme
from app.schemas.theme import ThemeCreate, ThemeUpdate


class ThemeService:
    """Service for theme management operations."""
    
    @staticmethod
    def get_active_theme(db: Session) -> Optional[Theme]:
        """Get the currently active theme."""
        return db.query(Theme).filter(Theme.is_active == True).first()
    
    @staticmethod
    def get_theme_by_id(db: Session, theme_id: int) -> Optional[Theme]:
        """Get a theme by its ID."""
        return db.query(Theme).filter(Theme.id == theme_id).first()
    
    @staticmethod
    def get_theme_by_name(db: Session, name: str) -> Optional[Theme]:
        """Get a theme by its name."""
        return db.query(Theme).filter(Theme.name == name).first()
    
    @staticmethod
    def get_all_themes(db: Session, skip: int = 0, limit: int = 100) -> List[Theme]:
        """Get all themes with pagination."""
        return db.query(Theme).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_theme(db: Session, theme_data: ThemeCreate, created_by: Optional[int] = None) -> Theme:
        """
        Create a new theme.
        If is_active=True, deactivates all other themes first.
        """
        # If this theme should be active, deactivate all others
        if theme_data.is_active:
            ThemeService.deactivate_all_themes(db)
        
        theme = Theme(
            name=theme_data.name,
            display_name=theme_data.display_name,
            description=theme_data.description,
            config=theme_data.config,
            is_active=theme_data.is_active or False,
            created_by=created_by
        )
        
        db.add(theme)
        db.commit()
        db.refresh(theme)
        return theme
    
    @staticmethod
    def update_theme(
        db: Session, 
        theme_id: int, 
        theme_data: ThemeUpdate
    ) -> Optional[Theme]:
        """
        Update an existing theme.
        If is_active=True, deactivates all other themes first.
        """
        theme = ThemeService.get_theme_by_id(db, theme_id)
        if not theme:
            return None
        
        # If activating this theme, deactivate all others
        if theme_data.is_active is True:
            ThemeService.deactivate_all_themes(db, exclude_id=theme_id)
        
        # Update fields
        if theme_data.display_name is not None:
            theme.display_name = theme_data.display_name
        if theme_data.description is not None:
            theme.description = theme_data.description
        if theme_data.config is not None:
            theme.config = theme_data.config
        if theme_data.is_active is not None:
            theme.is_active = theme_data.is_active
        
        db.commit()
        db.refresh(theme)
        return theme
    
    @staticmethod
    def delete_theme(db: Session, theme_id: int) -> bool:
        """Delete a theme. Cannot delete the active theme."""
        theme = ThemeService.get_theme_by_id(db, theme_id)
        if not theme:
            return False
        
        # Prevent deletion of active theme
        if theme.is_active:
            raise ValueError("Cannot delete the active theme. Please activate another theme first.")
        
        db.delete(theme)
        db.commit()
        return True
    
    @staticmethod
    def activate_theme(db: Session, theme_id: int) -> Optional[Theme]:
        """Activate a theme (deactivates all others)."""
        theme = ThemeService.get_theme_by_id(db, theme_id)
        if not theme:
            return None
        
        # Deactivate all themes
        ThemeService.deactivate_all_themes(db, exclude_id=theme_id)
        
        # Activate this theme
        theme.is_active = True
        db.commit()
        db.refresh(theme)
        return theme
    
    @staticmethod
    def deactivate_all_themes(db: Session, exclude_id: Optional[int] = None) -> None:
        """Deactivate all themes, optionally excluding one."""
        # Optimized: Use bulk update instead of loading all objects
        update_stmt = update(Theme).where(Theme.is_active == True).values(is_active=False)
        if exclude_id:
            update_stmt = update_stmt.where(Theme.id != exclude_id)
        
        db.execute(update_stmt)
        db.commit()


