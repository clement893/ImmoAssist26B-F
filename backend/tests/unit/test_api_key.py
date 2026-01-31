"""
Unit tests for API key utilities
"""

import pytest
from app.core.api_key import generate_api_key, hash_api_key, verify_api_key


class TestAPIKeyGeneration:
    """Test API key generation"""
    
    def test_generate_api_key_format(self):
        """Test API key format"""
        key = generate_api_key()
        
        assert key.startswith("mk_")
        assert len(key) > 20  # Should be reasonably long
    
    def test_generate_api_key_unique(self):
        """Test that generated keys are unique"""
        key1 = generate_api_key()
        key2 = generate_api_key()
        
        assert key1 != key2
    
    def test_hash_api_key(self):
        """Test API key hashing"""
        key = generate_api_key()
        hashed = hash_api_key(key)
        
        assert hashed != key
        assert len(hashed) == 64  # SHA256 hex digest length
        assert isinstance(hashed, str)
    
    def test_verify_api_key(self):
        """Test API key verification"""
        key = generate_api_key()
        hashed = hash_api_key(key)
        
        assert verify_api_key(key, hashed) is True
        assert verify_api_key("wrong_key", hashed) is False

