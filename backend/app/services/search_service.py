"""
Advanced Search Service
Full-text search and filtering capabilities
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import text, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.logging import logger


class SearchService:
    """Service for advanced search and filtering"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def full_text_search(
        self,
        model_class: Any,
        search_query: str,
        search_fields: List[str],
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
        offset: int = 0,
        order_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform full-text search on a model
        
        Args:
            model_class: SQLAlchemy model class
            search_query: Search query string
            search_fields: List of field names to search in
            filters: Additional filters to apply
            limit: Maximum number of results
            offset: Offset for pagination
            order_by: Field to order by (with optional direction, e.g., 'created_at desc')
            
        Returns:
            Dict with 'results', 'total', 'limit', 'offset'
        """
        if not search_query or not search_fields:
            return {
                'results': [],
                'total': 0,
                'limit': limit,
                'offset': offset
            }

        # Build base query using select
        from sqlalchemy import select
        query = select(model_class)

        # Build search conditions
        search_conditions = []
        search_terms = search_query.split()
        
        for field_name in search_fields:
            if hasattr(model_class, field_name):
                field = getattr(model_class, field_name)
                for term in search_terms:
                    # Use ILIKE for case-insensitive search (PostgreSQL)
                    search_conditions.append(
                        field.ilike(f'%{term}%')
                    )

        if search_conditions:
            query = query.where(or_(*search_conditions))

        # Apply additional filters
        if filters:
            for key, value in filters.items():
                if hasattr(model_class, key):
                    field = getattr(model_class, key)
                    if isinstance(value, list):
                        query = query.where(field.in_(value))
                    elif isinstance(value, dict):
                        # Support operators like {'gte': 10, 'lte': 20}
                        if 'gte' in value:
                            query = query.where(field >= value['gte'])
                        if 'lte' in value:
                            query = query.where(field <= value['lte'])
                        if 'gt' in value:
                            query = query.where(field > value['gt'])
                        if 'lt' in value:
                            query = query.where(field < value['lt'])
                        if 'ne' in value:
                            query = query.where(field != value['ne'])
                    else:
                        query = query.where(field == value)

        # Get total count - create a separate count query
        count_query = select(func.count())
        # Apply same filters to count query
        if search_conditions:
            count_query = count_query.select_from(model_class).where(or_(*search_conditions))
        else:
            count_query = count_query.select_from(model_class)
        
        # Apply filters to count query
        if filters:
            for key, value in filters.items():
                if hasattr(model_class, key):
                    field = getattr(model_class, key)
                    if isinstance(value, list):
                        count_query = count_query.where(field.in_(value))
                    elif isinstance(value, dict):
                        if 'gte' in value:
                            count_query = count_query.where(field >= value['gte'])
                        if 'lte' in value:
                            count_query = count_query.where(field <= value['lte'])
                        if 'gt' in value:
                            count_query = count_query.where(field > value['gt'])
                        if 'lt' in value:
                            count_query = count_query.where(field < value['lt'])
                        if 'ne' in value:
                            count_query = count_query.where(field != value['ne'])
                    else:
                        count_query = count_query.where(field == value)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply ordering
        if order_by:
            order_parts = order_by.split()
            if len(order_parts) == 2 and order_parts[1].lower() == 'desc':
                field_name = order_parts[0]
                if hasattr(model_class, field_name):
                    query = query.order_by(getattr(model_class, field_name).desc())
            else:
                field_name = order_parts[0]
                if hasattr(model_class, field_name):
                    query = query.order_by(getattr(model_class, field_name).asc())
        else:
            # Default ordering by id desc
            if hasattr(model_class, 'id'):
                query = query.order_by(model_class.id.desc())

        # Apply pagination
        query = query.limit(limit).offset(offset)

        # Execute query
        result = await self.db.execute(query)
        results = result.scalars().all()

        return {
            'results': [self._serialize_model(item) for item in results],
            'total': total,
            'limit': limit,
            'offset': offset,
            'has_more': (offset + limit) < total
        }

    async def search_users(
        self,
        search_query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search users with full-text search"""
        from app.models.user import User
        
        search_fields = ['email', 'full_name', 'username']
        return await self.full_text_search(
            model_class=User,
            search_query=search_query,
            search_fields=search_fields,
            filters=filters,
            limit=limit,
            offset=offset
        )

    async def search_projects(
        self,
        search_query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search projects with full-text search"""
        from app.models.project import Project
        
        search_fields = ['name', 'description']
        return await self.full_text_search(
            model_class=Project,
            search_query=search_query,
            search_fields=search_fields,
            filters=filters,
            limit=limit,
            offset=offset
        )

    def _serialize_model(self, model_instance: Any) -> Dict[str, Any]:
        """Serialize SQLAlchemy model to dict"""
        result = {}
        for column in model_instance.__table__.columns:
            value = getattr(model_instance, column.name)
            # Handle datetime serialization
            if hasattr(value, 'isoformat'):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result

    @staticmethod
    def build_filter_query(filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build filter query from request parameters
        Supports:
        - Exact match: field=value
        - In list: field[]=value1&field[]=value2
        - Range: field[gte]=10&field[lte]=20
        - Not equal: field[ne]=value
        """
        processed_filters = {}
        
        for key, value in filters.items():
            if isinstance(value, dict):
                # Already processed (e.g., {'gte': 10})
                processed_filters[key] = value
            elif isinstance(value, list):
                # In list
                processed_filters[key] = value
            else:
                # Exact match
                processed_filters[key] = value
        
        return processed_filters

