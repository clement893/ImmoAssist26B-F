"""
Real Estate Transactions Endpoints
API endpoints for real estate transaction management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from decimal import Decimal

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, RealEstateTransaction
from app.schemas.real_estate_transaction import (
    RealEstateTransactionCreate,
    RealEstateTransactionUpdate,
    RealEstateTransactionResponse,
    RealEstateTransactionListResponse,
)
from app.core.logging import logger

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=RealEstateTransactionListResponse)
async def list_transactions(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in dossier number, address, city"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of real estate transactions for the current user
    """
    try:
        query = select(RealEstateTransaction).where(
            RealEstateTransaction.user_id == current_user.id
        )
        
        # Apply status filter
        if status_filter:
            query = query.where(RealEstateTransaction.status == status_filter)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    RealEstateTransaction.dossier_number.ilike(search_term),
                    RealEstateTransaction.property_address.ilike(search_term),
                    RealEstateTransaction.property_city.ilike(search_term),
                )
            )
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(RealEstateTransaction.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        return RealEstateTransactionListResponse(
            transactions=[
                RealEstateTransactionResponse.model_validate(t) for t in transactions
            ],
            total=total,
            skip=skip,
            limit=limit,
        )
        
    except Exception as e:
        logger.error(f"Error listing transactions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing transactions: {str(e)}",
        )


@router.get("/{transaction_id}", response_model=RealEstateTransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific real estate transaction by ID
    """
    try:
        query = select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
        
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        
        return RealEstateTransactionResponse.model_validate(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting transaction: {str(e)}",
        )


@router.post("/", response_model=RealEstateTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: RealEstateTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new real estate transaction
    """
    try:
        # Check if dossier number already exists (only if provided)
        if transaction_data.dossier_number:
            existing = await db.execute(
                select(RealEstateTransaction).where(
                    RealEstateTransaction.dossier_number == transaction_data.dossier_number
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Transaction with dossier number {transaction_data.dossier_number} already exists",
                )
        
        # Create transaction object
        transaction_dict = transaction_data.model_dump(exclude={"seller_broker", "buyer_broker", "notary", "inspector", "surveyor", "mortgage_advisor"})
        
        # Handle professionals separately
        if transaction_data.seller_broker:
            transaction_dict["seller_broker_name"] = transaction_data.seller_broker.get("name")
            transaction_dict["seller_broker_agency"] = transaction_data.seller_broker.get("agency_or_firm")
            transaction_dict["seller_broker_oaciq"] = transaction_data.seller_broker.get("license_number")
            transaction_dict["seller_broker_contact"] = transaction_data.seller_broker.get("contact")
        
        if transaction_data.buyer_broker:
            transaction_dict["buyer_broker_name"] = transaction_data.buyer_broker.get("name")
            transaction_dict["buyer_broker_agency"] = transaction_data.buyer_broker.get("agency_or_firm")
            transaction_dict["buyer_broker_oaciq"] = transaction_data.buyer_broker.get("license_number")
            transaction_dict["buyer_broker_contact"] = transaction_data.buyer_broker.get("contact")
        
        if transaction_data.notary:
            transaction_dict["notary_name"] = transaction_data.notary.get("name")
            transaction_dict["notary_firm"] = transaction_data.notary.get("agency_or_firm")
            transaction_dict["notary_contact"] = transaction_data.notary.get("contact")
        
        if transaction_data.inspector:
            transaction_dict["inspector_name"] = transaction_data.inspector.get("name")
            transaction_dict["inspector_company"] = transaction_data.inspector.get("agency_or_firm")
            transaction_dict["inspector_contact"] = transaction_data.inspector.get("contact")
        
        if transaction_data.surveyor:
            transaction_dict["surveyor_name"] = transaction_data.surveyor.get("name")
            transaction_dict["surveyor_company"] = transaction_data.surveyor.get("agency_or_firm")
            transaction_dict["surveyor_contact"] = transaction_data.surveyor.get("contact")
        
        if transaction_data.mortgage_advisor:
            transaction_dict["mortgage_advisor_name"] = transaction_data.mortgage_advisor.get("name")
            transaction_dict["mortgage_advisor_institution"] = transaction_data.mortgage_advisor.get("agency_or_firm")
            transaction_dict["mortgage_advisor_contact"] = transaction_data.mortgage_advisor.get("contact")
        
        transaction_dict["user_id"] = current_user.id
        
        transaction = RealEstateTransaction(**transaction_dict)
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        return RealEstateTransactionResponse.model_validate(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating transaction: {str(e)}",
        )


@router.put("/{transaction_id}", response_model=RealEstateTransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_data: RealEstateTransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a real estate transaction
    """
    try:
        query = select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
        
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        
        # Update fields
        update_data = transaction_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(transaction, field, value)
        
        await db.commit()
        await db.refresh(transaction)
        
        return RealEstateTransactionResponse.model_validate(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating transaction: {str(e)}",
        )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a real estate transaction
    """
    try:
        query = select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
        
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        
        await db.delete(transaction)
        await db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting transaction: {str(e)}",
        )


@router.get("/{transaction_id}/progression", response_model=dict)
async def get_transaction_progression(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get transaction progression status and steps
    Calculates the current progression status based on transaction data
    """
    try:
        query = select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
        
        result = await db.execute(query)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        
        # Calculate progression
        from datetime import datetime
        
        now = datetime.now()
        progression_status = "draft"
        current_step = "creation"
        overall_progress = 0
        
        # Determine current status
        if not transaction.promise_to_purchase_date:
            progression_status = "draft"
            current_step = "creation"
            overall_progress = 5
        elif transaction.promise_to_purchase_date and not transaction.promise_acceptance_date:
            progression_status = "active"
            current_step = "promise"
            overall_progress = 15
        else:
            inspection_lifted = bool(transaction.inspection_condition_lifted_date)
            financing_lifted = bool(transaction.financing_condition_lifted_date)
            all_conditions_met = inspection_lifted and financing_lifted
            
            if not all_conditions_met:
                progression_status = "pending_conditions"
                current_step = "conditions"
                overall_progress = 30
            elif not transaction.sale_act_signing_date:
                progression_status = "firm"
                current_step = "firm"
                overall_progress = 60
            elif transaction.sale_act_signing_date and not transaction.actual_closing_date:
                progression_status = "closing"
                current_step = "closing"
                overall_progress = 85
            elif transaction.actual_closing_date and transaction.seller_quittance_confirmed:
                progression_status = "closed"
                current_step = "finalization"
                overall_progress = 100
        
        if transaction.status == "Annulée":
            progression_status = "cancelled"
            overall_progress = 0
        
        return {
            "transaction_id": transaction.id,
            "current_step": current_step,
            "overall_progress": overall_progress,
            "status": progression_status,
            "steps": {
                "creation": {
                    "completed": True,
                    "date": transaction.created_at.isoformat() if transaction.created_at else None,
                },
                "promise": {
                    "completed": bool(transaction.promise_acceptance_date),
                    "date": transaction.promise_acceptance_date.isoformat() if transaction.promise_acceptance_date else None,
                },
                "inspection": {
                    "completed": bool(transaction.inspection_condition_lifted_date),
                    "deadline": transaction.inspection_deadline.isoformat() if transaction.inspection_deadline else None,
                },
                "financing": {
                    "completed": bool(transaction.financing_condition_lifted_date),
                    "deadline": transaction.financing_deadline.isoformat() if transaction.financing_deadline else None,
                },
                "firm": {
                    "completed": bool(transaction.inspection_condition_lifted_date and transaction.financing_condition_lifted_date),
                },
                "documents": {
                    "completed": bool(
                        transaction.location_certificate_received and
                        transaction.location_certificate_conform and
                        transaction.seller_declaration_signed and
                        transaction.home_insurance_proof_received
                    ),
                },
                "signing": {
                    "completed": bool(transaction.sale_act_signing_date),
                    "date": transaction.sale_act_signing_date.isoformat() if transaction.sale_act_signing_date else None,
                },
                "possession": {
                    "completed": bool(transaction.possession_date and transaction.possession_date <= now.date()) if transaction.possession_date else False,
                },
                "finalization": {
                    "completed": bool(transaction.seller_quittance_confirmed and transaction.sale_act_signing_date),
                },
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction progression: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting transaction progression: {str(e)}",
        )
