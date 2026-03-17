"""
Contact Schemas
Pydantic v2 models for commercial contacts
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator, EmailStr


class ContactBase(BaseModel):
    """Base contact schema"""
    first_name: str = Field(..., min_length=1, max_length=100, description="First name", strip_whitespace=True)
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name", strip_whitespace=True)
    company_id: Optional[int] = Field(None, description="Company ID")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (will be matched to existing company if company_id not provided)")
    position: Optional[str] = Field(None, max_length=200, description="Job position")
    circle: Optional[str] = Field(None, max_length=50, description="Contact circle (client, prospect, etc.)")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")
    photo_url: Optional[str] = Field(None, max_length=1000, description="Photo URL (S3)")
    photo_filename: Optional[str] = Field(None, max_length=500, description="Filename for photo matching during import")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    birthday: Optional[date] = Field(None, description="Birthday")
    language: Optional[str] = Field(None, max_length=10, description="Language code")
    employee_id: Optional[int] = Field(None, description="Assigned employee ID")
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name fields"""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @field_validator('linkedin')
    @classmethod
    def validate_linkedin(cls, v: Optional[str]) -> Optional[str]:
        """Validate LinkedIn URL"""
        if v and not v.startswith(('http://', 'https://')):
            return f'https://{v}'
        return v


class ContactCreate(ContactBase):
    """Contact creation schema"""
    pass


class ContactUpdate(BaseModel):
    """Contact update schema"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Last name")
    company_id: Optional[int] = Field(None, description="Company ID")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (will be matched to existing company if company_id not provided)")
    position: Optional[str] = Field(None, max_length=200, description="Job position")
    circle: Optional[str] = Field(None, max_length=50, description="Contact circle")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")
    photo_url: Optional[str] = Field(None, max_length=1000, description="Photo URL (S3)")
    photo_filename: Optional[str] = Field(None, max_length=500, description="Filename for photo matching during import")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    birthday: Optional[date] = Field(None, description="Birthday")
    language: Optional[str] = Field(None, max_length=10, description="Language code")
    employee_id: Optional[int] = Field(None, description="Assigned employee ID")


class Contact(ContactBase):
    """Contact response schema"""
    id: int
    company_name: Optional[str] = None
    employee_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContactInDB(Contact):
    """Contact in database schema"""
    pass
