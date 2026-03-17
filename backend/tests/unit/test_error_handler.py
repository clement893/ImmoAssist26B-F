"""
Tests for Error Handlers
"""

import pytest
from unittest.mock import Mock
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException
from app.core.error_handler import (
    app_exception_handler,
    validation_exception_handler,
    database_exception_handler,
    general_exception_handler,
)


class TestAppExceptionHandler:
    """Tests for AppException handler"""
    
    def test_app_exception_handler(self):
        """Test app exception handler"""
        exception = AppException(
            message="Test error",
            status_code=400,
            error_code="TEST_ERROR"
        )
        request = Mock(spec=Request)
        
        response = app_exception_handler(request, exception)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 400


class TestValidationExceptionHandler:
    """Tests for validation exception handler"""
    
    def test_validation_exception_handler(self):
        """Test validation exception handler"""
        # Create a mock validation error
        validation_error = ValidationError.from_exception_data(
            "TestModel",
            [{"type": "string_type", "loc": ("field",), "msg": "Input should be a valid string"}]
        )
        request = Mock(spec=Request)
        
        response = validation_exception_handler(request, validation_error)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 422


class TestDatabaseExceptionHandler:
    """Tests for database exception handler"""
    
    def test_database_exception_handler(self):
        """Test database exception handler"""
        db_error = SQLAlchemyError("Database error")
        request = Mock(spec=Request)
        
        response = database_exception_handler(request, db_error)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500


class TestGeneralExceptionHandler:
    """Tests for general exception handler"""
    
    def test_general_exception_handler(self):
        """Test general exception handler"""
        exception = Exception("General error")
        request = Mock(spec=Request)
        
        response = general_exception_handler(request, exception)
        
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500

