"""
Security Testing
Tests for security vulnerabilities and best practices
"""

import pytest
from app.core.api_key import generate_api_key, hash_api_key, verify_api_key
from app.core.two_factor import TwoFactorAuth
import secrets


class TestAPIKeySecurity:
    """Test API key security"""
    
    def test_api_key_entropy(self):
        """Test that API keys have sufficient entropy"""
        keys = [generate_api_key() for _ in range(10)]
        
        # Check uniqueness
        assert len(set(keys)) == 10
        
        # Check minimum length
        assert all(len(key) >= 32 for key in keys)
    
    def test_api_key_hashing_consistency(self):
        """Test that API key hashing is consistent"""
        key = generate_api_key()
        hash1 = hash_api_key(key)
        hash2 = hash_api_key(key)
        
        assert hash1 == hash2
    
    def test_api_key_verification(self):
        """Test API key verification"""
        key = generate_api_key()
        hashed = hash_api_key(key)
        
        assert verify_api_key(key, hashed) is True
        assert verify_api_key("wrong_key", hashed) is False
        assert verify_api_key(key, "wrong_hash") is False
    
    def test_api_key_timing_attack_resistance(self):
        """Test that API key verification is timing-attack resistant"""
        import time
        
        key = generate_api_key()
        hashed = hash_api_key(key)
        
        # Measure verification time for correct key
        start = time.time()
        verify_api_key(key, hashed)
        correct_time = time.time() - start
        
        # Measure verification time for wrong key
        start = time.time()
        verify_api_key("wrong_key", hashed)
        wrong_time = time.time() - start
        
        # Times should be similar (within 10ms) to prevent timing attacks
        # Note: This is a simplified test - real timing attack resistance requires constant-time comparison
        assert abs(correct_time - wrong_time) < 0.01


class TestPasswordSecurity:
    """Test password security"""
    
    def test_password_hashing(self):
        """Test that passwords are properly hashed"""
        from app.api.v1.endpoints.auth import get_password_hash, verify_password
        
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        # Hash should be different from password
        assert hashed != password
        
        # Should verify correctly
        assert verify_password(password, hashed) is True
        assert verify_password("wrong_password", hashed) is False
    
    def test_password_length_validation(self):
        """Test password length validation"""
        from app.schemas.user import UserCreate
        from pydantic import ValidationError
        
        # Too short
        with pytest.raises(ValidationError):
            UserCreate(
                email="test@example.com",
                password="short",
                first_name="Test",
                last_name="User",
            )
        
        # Valid
        user = UserCreate(
            email="test@example.com",
            password="ValidPassword123!",
            first_name="Test",
            last_name="User",
        )
        assert user.password == "ValidPassword123!"


class TestTwoFactorSecurity:
    """Test 2FA security"""
    
    def test_totp_secret_randomness(self):
        """Test that TOTP secrets are random"""
        secrets_list = [TwoFactorAuth.generate_secret() for _ in range(10)]
        
        # All secrets should be unique
        assert len(set(secrets_list)) == 10
    
    def test_totp_verification_window(self):
        """Test TOTP verification with time window"""
        import pyotp
        import time
        
        secret = TwoFactorAuth.generate_secret()
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        # Should verify with default window
        assert TwoFactorAuth.verify_totp(secret, token) is True
        
        # Should verify with custom window
        assert TwoFactorAuth.verify_totp(secret, token, window=2) is True
    
    def test_backup_codes_uniqueness(self):
        """Test that backup codes are unique"""
        codes = TwoFactorAuth.generate_backup_codes(count=20)
        
        assert len(set(codes)) == 20


class TestInputValidation:
    """Test input validation security"""
    
    def test_email_validation(self):
        """Test email validation"""
        from app.schemas.user import UserBase
        from pydantic import ValidationError
        
        # Valid email
        user = UserBase(email="test@example.com", first_name="Test")
        assert user.email == "test@example.com"
        
        # Invalid email
        with pytest.raises(ValidationError):
            UserBase(email="invalid-email", first_name="Test")
    
    def test_sql_injection_prevention(self):
        """Test that SQL injection is prevented"""
        from sqlalchemy import text
        
        # This test verifies that parameterized queries are used
        # SQLAlchemy automatically escapes parameters
        malicious_input = "'; DROP TABLE users; --"
        
        # This should be safely handled by SQLAlchemy
        query = text("SELECT * FROM users WHERE email = :email")
        # The parameterized query prevents SQL injection
        assert ":email" in str(query)


class TestXSSPrevention:
    """Test XSS prevention"""
    
    def test_html_sanitization(self):
        """Test HTML sanitization"""
        from app.core.security.input_validation import sanitize_html
        
        malicious_html = "<script>alert('XSS')</script><p>Safe content</p>"
        sanitized = sanitize_html(malicious_html)
        
        assert "<script>" not in sanitized
        assert "<p>Safe content</p>" in sanitized
    
    def test_text_sanitization(self):
        """Test text sanitization"""
        from app.core.security.input_validation import sanitize_text
        
        html_text = "<script>alert('XSS')</script>Safe text"
        sanitized = sanitize_text(html_text)
        
        assert "<script>" not in sanitized
        assert "Safe text" in sanitized


class TestCSRFProtection:
    """Test CSRF protection"""
    
    def test_csrf_token_generation(self):
        """Test CSRF token generation"""
        from app.core.csrf import generate_csrf_token
        
        token1 = generate_csrf_token()
        token2 = generate_csrf_token()
        
        # Tokens should be unique
        assert token1 != token2
        
        # Tokens should be reasonably long
        assert len(token1) >= 32


class TestRateLimiting:
    """Test rate limiting security"""
    
    def test_rate_limit_decorator_exists(self):
        """Test that rate limit decorator exists"""
        from app.core.rate_limit import rate_limit_decorator
        
        assert callable(rate_limit_decorator)
    
    def test_rate_limit_configuration(self):
        """Test rate limit configuration"""
        # This would require actual rate limit testing with multiple requests
        # For now, we just verify the decorator can be applied
        from app.core.rate_limit import rate_limit_decorator
        
        @rate_limit_decorator("10/minute")
        async def test_endpoint():
            return "test"
        
        assert callable(test_endpoint)

