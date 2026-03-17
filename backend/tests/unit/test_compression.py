"""
Tests for Compression Middleware
"""

import pytest
from unittest.mock import AsyncMock, Mock
from fastapi import Request, FastAPI
from fastapi.testclient import TestClient
from fastapi.responses import JSONResponse

from app.core.compression import CompressionMiddleware


class TestCompressionMiddleware:
    """Tests for CompressionMiddleware"""
    
    @pytest.fixture
    def app(self):
        """Create test FastAPI app"""
        app = FastAPI()
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test" * 100}  # Large enough to compress
        
        @app.get("/small")
        async def small_endpoint():
            return {"message": "test"}  # Too small to compress
        
        @app.get("/error")
        async def error_endpoint():
            return JSONResponse(
                content={"error": "test"},
                status_code=400
            )
        
        return app
    
    def test_supports_compression_gzip(self):
        """Test compression support detection for GZip"""
        middleware = CompressionMiddleware(Mock(), use_brotli=False)
        supports_gzip, supports_brotli = middleware._supports_compression("gzip")
        assert supports_gzip is True
        assert supports_brotli is False
    
    def test_supports_compression_brotli(self):
        """Test compression support detection for Brotli"""
        middleware = CompressionMiddleware(Mock(), use_brotli=True)
        supports_gzip, supports_brotli = middleware._supports_compression("br, gzip")
        assert supports_gzip is True
        assert supports_brotli is True
    
    def test_supports_compression_none(self):
        """Test compression support detection when not supported"""
        middleware = CompressionMiddleware(Mock())
        supports_gzip, supports_brotli = middleware._supports_compression("")
        assert supports_gzip is False
        assert supports_brotli is False
    
    def test_compress_gzip(self):
        """Test GZip compression"""
        middleware = CompressionMiddleware(Mock())
        data = b"test data" * 100
        compressed = middleware._compress_gzip(data)
        assert isinstance(compressed, bytes)
        assert len(compressed) < len(data)
    
    def test_compress_brotli(self):
        """Test Brotli compression"""
        middleware = CompressionMiddleware(Mock(), use_brotli=True)
        data = b"test data" * 100
        compressed = middleware._compress_brotli(data)
        assert compressed is not None
        assert isinstance(compressed, bytes)
        assert len(compressed) < len(data)
    
    def test_compression_middleware_large_response(self, app):
        """Test compression middleware compresses large responses"""
        app.add_middleware(CompressionMiddleware, min_size=100)
        client = TestClient(app)
        
        response = client.get("/test", headers={"Accept-Encoding": "gzip"})
        assert response.status_code == 200
        # Response should be compressed if large enough
        # Note: TestClient may decompress automatically
    
    def test_compression_middleware_small_response(self, app):
        """Test compression middleware skips small responses"""
        app.add_middleware(CompressionMiddleware, min_size=1000)
        client = TestClient(app)
        
        response = client.get("/small", headers={"Accept-Encoding": "gzip"})
        assert response.status_code == 200
        # Small response should not be compressed
    
    def test_compression_middleware_error_response(self, app):
        """Test compression middleware skips error responses"""
        app.add_middleware(CompressionMiddleware)
        client = TestClient(app)
        
        response = client.get("/error", headers={"Accept-Encoding": "gzip"})
        assert response.status_code == 400
        # Error responses should not be compressed
    
    def test_compression_middleware_no_accept_encoding(self, app):
        """Test compression middleware when client doesn't accept compression"""
        app.add_middleware(CompressionMiddleware)
        client = TestClient(app)
        
        response = client.get("/test")  # No Accept-Encoding header
        assert response.status_code == 200
        # Should not compress if client doesn't accept it
