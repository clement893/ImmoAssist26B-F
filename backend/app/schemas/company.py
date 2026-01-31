"""
Company Schemas
Pydantic v2 models for companies/enterprises
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator


class CompanyBase(BaseModel):
    """Base company schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Company name", strip_whitespace=True)
    description: Optional[str] = Field(None, max_length=1000, description="Company description")
    website: Optional[str] = Field(None, max_length=500, description="Website URL")
    logo_url: Optional[str] = Field(None, max_length=1000, description="Logo URL (S3)")
    logo_filename: Optional[str] = Field(None, max_length=500, description="Logo filename")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    industry: Optional[str] = Field(None, max_length=200, description="Industry")
    size: Optional[str] = Field(None, max_length=50, description="Company size")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    is_client: Optional[bool] = Field(False, description="Is client")
    parent_company_id: Optional[int] = Field(None, description="Parent company ID")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name field"""
        if not v or not v.strip():
            raise ValueError("Company name cannot be empty")
        return v.strip()
    
    model_config = ConfigDict(from_attributes=True)


class CompanyCreate(CompanyBase):
    """Company creation schema"""
    pass


class CompanyUpdate(BaseModel):
    """Company update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Company name")
    description: Optional[str] = Field(None, max_length=1000, description="Company description")
    website: Optional[str] = Field(None, max_length=500, description="Website URL")
    logo_url: Optional[str] = Field(None, max_length=1000, description="Logo URL (S3)")
    logo_filename: Optional[str] = Field(None, max_length=500, description="Logo filename")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    industry: Optional[str] = Field(None, max_length=200, description="Industry")
    size: Optional[str] = Field(None, max_length=50, description="Company size")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    is_client: Optional[bool] = Field(None, description="Is client")
    parent_company_id: Optional[int] = Field(None, description="Parent company ID")
    
    model_config = ConfigDict(from_attributes=True)


class Company(CompanyBase):
    """Company response schema"""
    id: int
    parent_company_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
