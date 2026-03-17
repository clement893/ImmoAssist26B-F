"""
Real Estate Contacts Endpoints
API endpoints for real estate contact management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, RealEstateContact, ContactType
from app.schemas.real_estate_contact import (
    RealEstateContactCreate,
    RealEstateContactUpdate,
    RealEstateContactResponse,
    RealEstateContactListResponse,
)
from app.core.logging import logger

router = APIRouter(prefix="/real-estate-contacts", tags=["real-estate-contacts"])


@router.get("/", response_model=RealEstateContactListResponse)
async def list_contacts(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    type_filter: Optional[ContactType] = Query(None, alias="type", description="Filter by contact type"),
    search: Optional[str] = Query(None, description="Search in first name, last name, email, company"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of real estate contacts with search and filter capabilities
    """
    try:
        query = select(RealEstateContact)
        
        # Apply type filter
        if type_filter:
            query = query.where(RealEstateContact.type == type_filter)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    RealEstateContact.first_name.ilike(search_term),
                    RealEstateContact.last_name.ilike(search_term),
                    RealEstateContact.email.ilike(search_term),
                    RealEstateContact.company.ilike(search_term),
                )
            )
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(RealEstateContact.last_name, RealEstateContact.first_name).offset(skip).limit(limit)
        
        result = await db.execute(query)
        contacts = result.scalars().all()
        
        return RealEstateContactListResponse(
            contacts=[RealEstateContactResponse.model_validate(c) for c in contacts],
            total=total,
            skip=skip,
            limit=limit,
        )
        
    except Exception as e:
        logger.error(f"Error listing contacts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing contacts: {str(e)}",
        )


@router.get("/{contact_id}", response_model=RealEstateContactResponse)
async def get_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific real estate contact by ID
    """
    try:
        query = select(RealEstateContact).where(RealEstateContact.id == contact_id)
        
        result = await db.execute(query)
        contact = result.scalar_one_or_none()
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found",
            )
        
        return RealEstateContactResponse.model_validate(contact)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting contact: {str(e)}",
        )


@router.post("/", response_model=RealEstateContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_data: RealEstateContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new real estate contact
    """
    try:
        # Check if email already exists (if provided)
        if contact_data.email:
            existing = await db.execute(
                select(RealEstateContact).where(RealEstateContact.email == contact_data.email)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Contact with email {contact_data.email} already exists",
                )
        
        # Check if user_id already has a contact (if provided)
        if contact_data.user_id:
            existing = await db.execute(
                select(RealEstateContact).where(RealEstateContact.user_id == contact_data.user_id)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User {contact_data.user_id} already has a contact",
                )
        
        # Create contact
        contact = RealEstateContact(**contact_data.model_dump())
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
        
        return RealEstateContactResponse.model_validate(contact)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating contact: {str(e)}",
        )


@router.put("/{contact_id}", response_model=RealEstateContactResponse)
async def update_contact(
    contact_id: int,
    contact_data: RealEstateContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a real estate contact
    """
    try:
        query = select(RealEstateContact).where(RealEstateContact.id == contact_id)
        
        result = await db.execute(query)
        contact = result.scalar_one_or_none()
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found",
            )
        
        # Check email uniqueness if email is being updated
        update_data = contact_data.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"]:
            existing = await db.execute(
                select(RealEstateContact).where(
                    and_(
                        RealEstateContact.email == update_data["email"],
                        RealEstateContact.id != contact_id
                    )
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Contact with email {update_data['email']} already exists",
                )
        
        # Update fields
        for field, value in update_data.items():
            setattr(contact, field, value)
        
        await db.commit()
        await db.refresh(contact)
        
        return RealEstateContactResponse.model_validate(contact)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating contact: {str(e)}",
        )


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a real estate contact (soft delete - cascade will remove transaction associations)
    """
    try:
        query = select(RealEstateContact).where(RealEstateContact.id == contact_id)
        
        result = await db.execute(query)
        contact = result.scalar_one_or_none()
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found",
            )
        
        await db.delete(contact)
        await db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting contact: {str(e)}",
        )
