"""
Unit tests for two-factor authentication utilities
"""

import pytest
import pyotp
from app.core.two_factor import TwoFactorAuth


class TestTwoFactorAuth:
    """Test 2FA utilities"""
    
    def test_generate_secret(self):
        """Test generating 2FA secret"""
        secret = TwoFactorAuth.generate_secret()
        
        assert secret is not None
        assert len(secret) > 0
        # Should be base32 encoded
        assert isinstance(secret, str)
    
    def test_generate_totp_uri(self):
        """Test generating TOTP URI"""
        secret = TwoFactorAuth.generate_secret()
        uri = TwoFactorAuth.generate_totp_uri(secret, "test@example.com", "MODELE")
        
        assert uri.startswith("otpauth://")
        assert "test@example.com" in uri
        assert "MODELE" in uri
    
    def test_verify_totp_valid(self):
        """Test verifying valid TOTP token"""
        secret = TwoFactorAuth.generate_secret()
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        assert TwoFactorAuth.verify_totp(secret, token) is True
    
    def test_verify_totp_invalid(self):
        """Test verifying invalid TOTP token"""
        secret = TwoFactorAuth.generate_secret()
        
        assert TwoFactorAuth.verify_totp(secret, "000000") is False
    
    def test_generate_backup_codes(self):
        """Test generating backup codes"""
        codes = TwoFactorAuth.generate_backup_codes()
        
        assert len(codes) == 10  # Default number of backup codes
        assert all(len(code) > 0 for code in codes)  # Each code should have content
        assert len(set(codes)) == 10  # All codes should be unique
    
    def test_generate_backup_codes_custom_count(self):
        """Test generating custom number of backup codes"""
        codes = TwoFactorAuth.generate_backup_codes(count=5)
        
        assert len(codes) == 5
        assert all(len(code) > 0 for code in codes)

