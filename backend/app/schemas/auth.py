"""
Authentication Schemas
Pydantic v2 models for authentication
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    """Token response schema"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    token: Optional[str] = Field(None, description="Expired access token to refresh")
    refresh_token: Optional[str] = Field(None, description="Refresh token (if implemented)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }
        }
    }


class TokenData(BaseModel):
    """Token data schema"""
    username: Optional[str] = None


class UserCreate(BaseModel):
    """User creation schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength - rejects weak and medium passwords, only accepts strong"""
        if not v or len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password cannot exceed 128 characters")
        
        # Calculate password strength score
        score = 0
        has_lower = any(c.islower() for c in v)
        has_upper = any(c.isupper() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v)
        
        # Scoring system
        if len(v) >= 12:
            score += 2  # Longer passwords get more points
        elif len(v) >= 8:
            score += 1
        
        if has_lower:
            score += 1
        if has_upper:
            score += 1
        if has_digit:
            score += 1
        if has_special:
            score += 2  # Special characters are important
        
        # Check for common patterns that weaken passwords
        has_common_pattern = False
        common_patterns = [
            '123', 'abc', 'qwe', 'asd', 'password', 'admin', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'sunshine', 'princess',
            'football', 'shadow', 'michael', 'jennifer', 'jordan', 'superman'
        ]
        v_lower = v.lower()
        for pattern in common_patterns:
            if pattern in v_lower:
                has_common_pattern = True
                score -= 1  # Penalize common patterns
                break
        
        # Check for sequential characters (weak)
        sequential_chars = ['12345', 'abcde', 'qwerty', 'asdfg', 'zxcvb']
        for seq in sequential_chars:
            if seq in v_lower:
                score -= 2
                break
        
        # Check for repeated characters (weak)
        if len(set(v)) < len(v) * 0.5:  # More than 50% repeated characters
            score -= 1
        
        # Determine strength
        if score < 4:
            raise ValueError(
                "Password is too weak. Please use a stronger password with at least 12 characters, "
                "uppercase, lowercase, numbers, and special characters."
            )
        elif score < 6:
            raise ValueError(
                "Password strength is medium. Please use a stronger password with at least 12 characters, "
                "uppercase, lowercase, numbers, and special characters for better security."
            )
        
        # Additional checks for strong passwords
        if not has_lower:
            raise ValueError("Password must contain at least one lowercase letter")
        if not has_upper:
            raise ValueError("Password must contain at least one uppercase letter")
        if not has_digit:
            raise ValueError("Password must contain at least one digit")
        
        # Check for common weak passwords
        weak_passwords = [
            'password', '12345678', 'qwerty', 'abc123', 'password123',
            'admin123', 'letmein', 'welcome', 'monkey', '1234567890',
            'password1', 'qwerty123', 'admin', 'root', 'test123',
            'guest', 'user', 'pass', '1234', '12345', '123456',
            '1234567', '123456789', 'iloveyou', 'princess', 'rockyou',
            '123qwe', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
        ]
        if v_lower in weak_passwords:
            raise ValueError("Password is too weak. Please choose a stronger password")
        
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123",
                "first_name": "John",
                "last_name": "Doe",
            }
        }
    }


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool
    # DEPRECATED: theme_preference is kept for API compatibility only
    # Theme management is now handled globally via the theme system
    theme_preference: str = Field(
        default='system', 
        description="DEPRECATED: Theme is now global. This field is kept for backward compatibility only."
    )
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class TokenWithUser(BaseModel):
    """Token response schema with user data"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    user: UserResponse = Field(..., description="User data")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "is_active": True,
                    "theme_preference": "system",
                    "created_at": "2025-01-01T00:00:00Z",
                    "updated_at": "2025-01-01T00:00:00Z"
                }
            }
        }
    }