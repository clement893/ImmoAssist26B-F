"""
User Schemas
Pydantic v2 models for user management
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
import re


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr = Field(..., description="User email address", strip_whitespace=True)
    first_name: Optional[str] = Field(None, max_length=100, description="First name", strip_whitespace=True)
    last_name: Optional[str] = Field(None, max_length=100, description="Last name", strip_whitespace=True)
    is_active: bool = Field(default=True, description="User active status")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate and normalize email"""
        if not v or not v.strip():
            raise ValueError('Email cannot be empty')
        # Normalize email (lowercase)
        return v.strip().lower()
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate name fields - more permissive to handle edge cases"""
        if v is not None:
            # Handle non-string types gracefully
            if not isinstance(v, str):
                return None
            cleaned = v.strip()
            if cleaned and len(cleaned) > 100:
                raise ValueError('Name cannot exceed 100 characters')
            # Return cleaned value (allow most characters to avoid blocking valid names)
            return cleaned if cleaned else None
        return v


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength - rejects weak and medium passwords, only accepts strong"""
        if not v or len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 128:
            raise ValueError('Password cannot exceed 128 characters')
        
        # Calculate password strength score
        score = 0
        has_lower = bool(re.search(r'[a-z]', v))
        has_upper = bool(re.search(r'[A-Z]', v))
        has_digit = bool(re.search(r'[0-9]', v))
        has_special = bool(re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', v))
        
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
        v_lower = v.lower()
        common_patterns = [
            '123', 'abc', 'qwe', 'asd', 'password', 'admin', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'sunshine', 'princess',
            'football', 'shadow', 'michael', 'jennifer', 'jordan', 'superman'
        ]
        for pattern in common_patterns:
            if pattern in v_lower:
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
                'Password is too weak. Please use a stronger password with at least 12 characters, '
                'uppercase, lowercase, numbers, and special characters.'
            )
        elif score < 6:
            raise ValueError(
                'Password strength is medium. Please use a stronger password with at least 12 characters, '
                'uppercase, lowercase, numbers, and special characters for better security.'
            )
        
        # Additional checks for strong passwords
        if not has_lower:
            raise ValueError('Password must contain at least one lowercase letter')
        if not has_upper:
            raise ValueError('Password must contain at least one uppercase letter')
        if not has_digit:
            raise ValueError('Password must contain at least one digit')
        
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
            raise ValueError('Password is too weak. Please choose a stronger password')
        
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = Field(None, strip_whitespace=True)
    first_name: Optional[str] = Field(None, max_length=100, strip_whitespace=True)
    last_name: Optional[str] = Field(None, max_length=100, strip_whitespace=True)
    avatar: Optional[str] = Field(None, max_length=500, description="Avatar URL")
    is_active: Optional[bool] = None
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize email"""
        if v is not None:
            cleaned = v.strip().lower()
            if not cleaned:
                raise ValueError('Email cannot be empty')
            return cleaned
        return v
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate name fields - more permissive to handle edge cases"""
        if v is not None:
            # Handle non-string types gracefully
            if not isinstance(v, str):
                return None
            cleaned = v.strip()
            if cleaned and len(cleaned) > 100:
                raise ValueError('Name cannot exceed 100 characters')
            # Return cleaned value (allow most characters to avoid blocking valid names)
            return cleaned if cleaned else None
        return v


class User(UserBase):
    """User response schema"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserInDB(User):
    """User in database schema"""
    hashed_password: str


# Alias for API responses
UserResponse = User