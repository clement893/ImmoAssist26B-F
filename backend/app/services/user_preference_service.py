"""
User Preference Service
Manages user preferences and settings
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import ProgrammingError, OperationalError

from app.models.user_preference import UserPreference
from app.core.logging import logger


class UserPreferenceService:
    """Service for user preference operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_preference(
        self,
        user_id: int,
        key: str
    ) -> Optional[UserPreference]:
        """Get a specific preference for a user"""
        try:
            result = await self.db.execute(
                select(UserPreference).where(
                    and_(
                        UserPreference.user_id == user_id,
                        UserPreference.key == key
                    )
                )
            )
            return result.scalar_one_or_none()
        except (ProgrammingError, OperationalError) as e:
            # Table doesn't exist or database error
            logger.warning(f"Table user_preferences may not exist yet: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting preference {key} for user {user_id}: {e}", exc_info=True)
            # Return None if table doesn't exist or other error occurs
            return None

    async def get_all_preferences(
        self,
        user_id: int
    ) -> Dict[str, Any]:
        """Get all preferences for a user as a dictionary"""
        try:
            result = await self.db.execute(
                select(UserPreference).where(
                    UserPreference.user_id == user_id
                )
            )
            preferences = result.scalars().all()
            return {pref.key: pref.value for pref in preferences}
        except (ProgrammingError, OperationalError) as e:
            # Table doesn't exist or database error
            logger.warning(f"Table user_preferences may not exist yet: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error getting all preferences for user {user_id}: {e}", exc_info=True)
            # Return empty dict if table doesn't exist or other error occurs
            return {}

    async def set_preference(
        self,
        user_id: int,
        key: str,
        value: Any
    ) -> UserPreference:
        """Set a preference for a user (creates or updates)"""
        existing = await self.get_preference(user_id, key)
        
        if existing:
            existing.value = value
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            preference = UserPreference(
                user_id=user_id,
                key=key,
                value=value
            )
            self.db.add(preference)
            await self.db.commit()
            await self.db.refresh(preference)
            return preference

    async def set_preferences(
        self,
        user_id: int,
        preferences: Dict[str, Any]
    ) -> List[UserPreference]:
        """Set multiple preferences at once"""
        results = []
        for key, value in preferences.items():
            pref = await self.set_preference(user_id, key, value)
            results.append(pref)
        return results

    async def delete_preference(
        self,
        user_id: int,
        key: str
    ) -> bool:
        """Delete a specific preference"""
        preference = await self.get_preference(user_id, key)
        if not preference:
            return False
        
        await self.db.delete(preference)
        await self.db.commit()
        return True

    async def delete_all_preferences(
        self,
        user_id: int
    ) -> int:
        """Delete all preferences for a user"""
        result = await self.db.execute(
            select(UserPreference).where(
                UserPreference.user_id == user_id
            )
        )
        preferences = result.scalars().all()
        count = len(preferences)
        
        for pref in preferences:
            await self.db.delete(pref)
        
        await self.db.commit()
        return count

    async def get_preference_value(
        self,
        user_id: int,
        key: str,
        default: Any = None
    ) -> Any:
        """Get preference value with a default fallback"""
        preference = await self.get_preference(user_id, key)
        return preference.value if preference else default




