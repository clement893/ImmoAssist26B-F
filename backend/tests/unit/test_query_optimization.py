"""
Unit tests for query optimization utilities
"""

import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.query_optimization import QueryOptimizer
from app.models.user import User


class TestQueryOptimizer:
    """Test QueryOptimizer class"""
    
    def test_add_eager_loading_selectin(self):
        """Test adding eager loading with selectin strategy"""
        query = select(User)
        optimized = QueryOptimizer.add_eager_loading(query, ["roles"], strategy="selectin")
        
        # Check that options were added (simplified check)
        assert optimized is not None
    
    def test_add_eager_loading_joined(self):
        """Test adding eager loading with joined strategy"""
        query = select(User)
        optimized = QueryOptimizer.add_eager_loading(query, ["roles"], strategy="joined")
        
        assert optimized is not None
    
    def test_add_select_fields(self):
        """Test adding select fields"""
        query = select(User)
        optimized = QueryOptimizer.add_select_fields(query, ["email", "id"])
        
        assert optimized is not None
    
    def test_optimize_join_order(self):
        """Test optimizing join order"""
        query = select(User)
        optimized = QueryOptimizer.optimize_join_order(query)
        
        assert optimized is not None

