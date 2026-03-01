"""
Real Estate Transactions Endpoints
API endpoints for real estate transaction management
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.exc import SQLAlchemyError, OperationalError, ProgrammingError
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, RealEstateTransaction, RealEstateContact, TransactionContact
from app.models.contact import Contact
from app.models.real_estate_contact import ContactType
from app.schemas.real_estate_transaction import (
    RealEstateTransactionCreate,
    RealEstateTransactionUpdate,
    RealEstateTransactionResponse,
    RealEstateTransactionListResponse,
)
from app.schemas.real_estate_contact import (
    TransactionContactCreate,
    TransactionContactResponse,
    TransactionContactListResponse,
    RealEstateContactResponse,
)
from app.services.pdf_analyzer_service import PDFAnalyzerService
from app.services.s3_service import S3Service
from app.core.logging import logger

router = APIRouter(prefix="/transactions", tags=["transactions"])


async def handle_database_error(e: Exception, operation: str = "operation", db: Optional[AsyncSession] = None):
    """Handle database errors and provide helpful error messages"""
    error_msg = str(e).lower()
    
    # Check if it's a schema/migration error
    if isinstance(e, (OperationalError, ProgrammingError)):
        if 'column' in error_msg and ('does not exist' in error_msg or 'not found' in error_msg):
            if db:
                await db.rollback()
            logger.error(f"Database schema error - migration may not be applied: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database schema is not up to date. Please run database migrations (alembic upgrade head)."
            )
        if 'relation' in error_msg and ('does not exist' in error_msg or 'not found' in error_msg):
            if db:
                await db.rollback()
            logger.error(f"Database table error - migration may not be applied: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database schema is not up to date. Please run database migrations (alembic upgrade head)."
            )
    
    # Re-raise if it's a SQLAlchemy error that we haven't handled
    if isinstance(e, SQLAlchemyError):
        if db:
            await db.rollback()
        logger.error(f"Database error during {operation}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred"
        )
    
    # For other exceptions, log and raise generic error
    if db:
        await db.rollback()
    logger.error(f"Unexpected error during {operation}: {e}", exc_info=True)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred"
    )


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
        await handle_database_error(e, "listing transactions", db)


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
        handle_database_error(e, "getting transaction", db)


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
        # Ensure empty dossier_number is None to avoid unique constraint (multiple NULLs allowed, multiple '' not)
        dn = transaction_dict.get("dossier_number")
        if dn is None or (isinstance(dn, str) and not dn.strip()):
            transaction_dict["dossier_number"] = None
        
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
        transaction_dict.setdefault("pipeline_stage", "creation_dossier")

        transaction = RealEstateTransaction(**transaction_dict)
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        return RealEstateTransactionResponse.model_validate(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        # Use the existing handle_database_error function
        if isinstance(e, (OperationalError, ProgrammingError)):
            await handle_database_error(e, "creating transaction", db)
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


@router.post("/{transaction_id}/contacts", response_model=TransactionContactResponse, status_code=status.HTTP_201_CREATED)
async def add_contact_to_transaction(
    transaction_id: int,
    contact_data: TransactionContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Associate a contact to a transaction with a specific role.
    Accepts either contact_id (real_estate_contacts) or reseau_contact_id (reseau/contacts).
    When reseau_contact_id is provided, the contact is resolved to a RealEstateContact (created if needed).
    """
    try:
        # Verify transaction exists and belongs to user
        transaction_query = select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
        transaction_result = await db.execute(transaction_query)
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        
        # Resolve contact_id: either direct or from reseau contact
        contact_id_to_use: int
        if contact_data.reseau_contact_id is not None:
            # Load reseau contact (commercial Contact)
            reseau_query = select(Contact).where(Contact.id == contact_data.reseau_contact_id)
            reseau_result = await db.execute(reseau_query)
            reseau_contact = reseau_result.scalar_one_or_none()
            if not reseau_contact:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Contact not found",
                )
            # Get or create RealEstateContact from reseau contact (same user)
            # Look up by user_id + email if email set, else by user_id + first_name + last_name + email null
            if reseau_contact.email:
                lookup = and_(
                    RealEstateContact.user_id == current_user.id,
                    RealEstateContact.email == reseau_contact.email,
                )
            else:
                lookup = and_(
                    RealEstateContact.user_id == current_user.id,
                    RealEstateContact.first_name == reseau_contact.first_name,
                    RealEstateContact.last_name == reseau_contact.last_name,
                    RealEstateContact.email.is_(None),
                )
            existing_rec = await db.execute(select(RealEstateContact).where(lookup))
            real_contact = existing_rec.scalar_one_or_none()
            if not real_contact:
                # Map reseau circle to ContactType where possible
                contact_type = ContactType.OTHER
                if reseau_contact.circle:
                    circle_lower = reseau_contact.circle.lower()
                    if circle_lower == "client":
                        contact_type = ContactType.CLIENT
                    elif "courtier" in circle_lower or "broker" in circle_lower:
                        contact_type = ContactType.REAL_ESTATE_BROKER
                    elif "notaire" in circle_lower or "notary" in circle_lower:
                        contact_type = ContactType.NOTARY
                real_contact = RealEstateContact(
                    first_name=reseau_contact.first_name,
                    last_name=reseau_contact.last_name,
                    email=reseau_contact.email,
                    phone=reseau_contact.phone,
                    company=reseau_contact.company or getattr(reseau_contact, "position", None),
                    type=contact_type,
                    user_id=current_user.id,
                )
                db.add(real_contact)
                await db.flush()
                await db.refresh(real_contact)
            contact_id_to_use = real_contact.id
        else:
            contact_id_to_use = contact_data.contact_id  # type: ignore[assignment]
        
        # Verify contact exists (for direct contact_id path or after resolve)
        contact_query = select(RealEstateContact).where(RealEstateContact.id == contact_id_to_use)
        contact_result = await db.execute(contact_query)
        contact = contact_result.scalar_one_or_none()
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found",
            )
        
        # Ensure contact belongs to current user when using real_estate_contacts
        if contact.user_id is not None and contact.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found",
            )
        
        # Check if association already exists
        existing = await db.execute(
            select(TransactionContact).where(
                and_(
                    TransactionContact.transaction_id == transaction_id,
                    TransactionContact.contact_id == contact_id_to_use,
                    TransactionContact.role == contact_data.role
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contact already has role '{contact_data.role}' in this transaction",
            )
        
        # Create association
        transaction_contact = TransactionContact(
            transaction_id=transaction_id,
            contact_id=contact_id_to_use,
            role=contact_data.role
        )
        db.add(transaction_contact)
        await db.commit()
        await db.refresh(transaction_contact)
        
        # Load contact for response
        await db.refresh(contact)
        
        return TransactionContactResponse(
            transaction_id=transaction_contact.transaction_id,
            contact_id=transaction_contact.contact_id,
            role=transaction_contact.role,
            created_at=transaction_contact.created_at,
            contact=RealEstateContactResponse.model_validate(contact)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error adding contact to transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding contact to transaction: {str(e)}",
        )


@router.get("/{transaction_id}/contacts", response_model=TransactionContactListResponse)
async def get_transaction_contacts(
    transaction_id: int,
    role_filter: Optional[str] = Query(None, alias="role", description="Filter by role"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all contacts associated with a transaction
    """
    try:
        # Verify transaction exists and belongs to user
        transaction_query = select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
        transaction_result = await db.execute(transaction_query)
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        
        # Build query
        query = select(TransactionContact).where(
            TransactionContact.transaction_id == transaction_id
        ).options(selectinload(TransactionContact.contact))
        
        # Apply role filter
        if role_filter:
            query = query.where(TransactionContact.role == role_filter)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Execute query
        result = await db.execute(query)
        transaction_contacts = result.scalars().all()
        
        return TransactionContactListResponse(
            contacts=[
                TransactionContactResponse(
                    transaction_id=tc.transaction_id,
                    contact_id=tc.contact_id,
                    role=tc.role,
                    created_at=tc.created_at,
                    contact=RealEstateContactResponse.model_validate(tc.contact)
                )
                for tc in transaction_contacts
            ],
            total=total,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction contacts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting transaction contacts: {str(e)}",
        )


@router.delete("/{transaction_id}/contacts/{contact_id}/{role}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_contact_from_transaction(
    transaction_id: int,
    contact_id: int,
    role: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a contact from a transaction (dissociate by role)
    """
    try:
        # Verify transaction exists and belongs to user
        transaction_query = select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
        transaction_result = await db.execute(transaction_query)
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        
        # Find the association
        query = select(TransactionContact).where(
            and_(
                TransactionContact.transaction_id == transaction_id,
                TransactionContact.contact_id == contact_id,
                TransactionContact.role == role
            )
        )
        
        result = await db.execute(query)
        transaction_contact = result.scalar_one_or_none()
        
        if not transaction_contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact association not found",
            )
        
        await db.delete(transaction_contact)
        await db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error removing contact from transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing contact from transaction: {str(e)}",
        )


@router.post("/analyze-pdf", response_model=Dict[str, Any], tags=["transactions"])
async def analyze_transaction_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload and analyze a PDF to extract transaction data using AI
    Returns extracted data and PDF preview for validation
    """
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported"
            )
        
        # Read PDF content
        pdf_content = await file.read()
        
        if len(pdf_content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF file is empty"
            )
        
        # Analyze PDF
        pdf_analyzer = PDFAnalyzerService()
        analysis_result = await pdf_analyzer.analyze_transaction_pdf(
            pdf_content=pdf_content,
            pdf_filename=file.filename or "document.pdf"
        )
        
        return analysis_result
        
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"PDF analysis service not available: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error analyzing PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze PDF: {str(e)}"
        )


@router.post("/{transaction_id}/documents", response_model=RealEstateTransactionResponse, tags=["transactions"])
async def add_document_to_transaction(
    transaction_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Query(None, description="Description du document"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a document (PDF, image, etc.) to a transaction
    """
    try:
        # Get transaction
        result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Upload file to S3
        if not S3Service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="File upload service is not configured"
            )
        
        s3_service = S3Service()
        upload_result = s3_service.upload_file(
            file=file,
            folder=f"transactions/{transaction_id}/documents",
            user_id=str(current_user.id),
        )
        
        # Create document entry (unique id so SQLAlchemy persists the JSON change)
        existing_docs = transaction.documents or []
        doc_id = int(datetime.now().timestamp() * 1000) if existing_docs else 1
        while any(d.get("id") == doc_id for d in existing_docs):
            doc_id += 1
        document_entry = {
            "id": doc_id,
            "filename": file.filename or "document",
            "url": upload_result.get("url") or upload_result.get("file_key", ""),
            "file_key": upload_result.get("file_key", ""),
            "size": upload_result.get("size", 0),
            "content_type": file.content_type or "application/pdf",
            "description": description,
            "uploaded_at": datetime.now().isoformat(),
            "uploaded_by": current_user.id,
        }
        
        # Add to documents list and mark JSON column as modified for SQLAlchemy
        if transaction.documents is None:
            transaction.documents = []
        transaction.documents.append(document_entry)
        flag_modified(transaction, "documents")
        
        await db.commit()
        await db.refresh(transaction)
        
        return RealEstateTransactionResponse.model_validate(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error adding document to transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding document: {str(e)}"
        )


@router.delete("/{transaction_id}/documents/{document_id}", response_model=RealEstateTransactionResponse, tags=["transactions"])
async def remove_document_from_transaction(
    transaction_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a document from a transaction
    """
    try:
        # Get transaction
        result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Find document to delete and remove from S3 if it has a file_key
        if transaction.documents:
            document_to_delete = next(
                (doc for doc in transaction.documents if doc.get("id") == document_id),
                None
            )
            
            # Delete from S3 if file_key exists
            if document_to_delete and document_to_delete.get("file_key"):
                try:
                    if S3Service.is_configured():
                        s3_service = S3Service()
                        s3_service.delete_file(document_to_delete["file_key"])
                except Exception as s3_error:
                    logger.warning(f"Failed to delete file from S3: {s3_error}")
            
            # Remove document from list and mark JSON column as modified
            transaction.documents = [
                doc for doc in transaction.documents
                if doc.get("id") != document_id
            ]
            flag_modified(transaction, "documents")
            await db.commit()
            await db.refresh(transaction)
        
        return RealEstateTransactionResponse.model_validate(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error removing document from transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing document: {str(e)}"
        )


@router.post("/{transaction_id}/photos", response_model=RealEstateTransactionResponse, tags=["transactions"])
async def add_photo_to_transaction(
    transaction_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Query(None, description="Description de la photo"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a photo to a transaction
    """
    try:
        # Validate file is an image
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Get transaction
        result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Upload file to S3
        if not S3Service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="File upload service is not configured"
            )
        
        s3_service = S3Service()
        upload_result = s3_service.upload_file(
            file=file,
            folder=f"transactions/{transaction_id}/photos",
            user_id=str(current_user.id),
        )
        
        # Create photo entry (unique id so SQLAlchemy persists the JSON change)
        existing_docs = transaction.documents or []
        photo_id = int(datetime.now().timestamp() * 1000) if existing_docs else 1
        while any(d.get("id") == photo_id for d in existing_docs):
            photo_id += 1
        photo_entry = {
            "id": photo_id,
            "filename": file.filename or "photo",
            "url": upload_result.get("url") or upload_result.get("file_key", ""),
            "file_key": upload_result.get("file_key", ""),
            "size": upload_result.get("size", 0),
            "content_type": file.content_type or "image/jpeg",
            "description": description,
            "uploaded_at": datetime.now().isoformat(),
            "uploaded_by": current_user.id,
            "type": "photo",  # Mark as photo
        }
        
        # Add to documents list and mark JSON column as modified for SQLAlchemy
        if transaction.documents is None:
            transaction.documents = []
        transaction.documents.append(photo_entry)
        flag_modified(transaction, "documents")
        
        await db.commit()
        await db.refresh(transaction)
        
        return RealEstateTransactionResponse.model_validate(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error adding photo to transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding photo: {str(e)}"
        )


@router.post("/{transaction_id}/documents/{document_id}/refresh-url", response_model=Dict[str, str], tags=["transactions"])
async def refresh_document_url(
    transaction_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh presigned URL for a document/photo.
    This is useful when URLs expire (after 7 days).
    """
    try:
        # Get transaction
        result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Find document
        if not transaction.documents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        document = next((doc for doc in transaction.documents if doc.get("id") == document_id), None)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        file_key = document.get("file_key")
        if not file_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document file_key not found"
            )
        
        # Generate new presigned URL
        if not S3Service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="File upload service is not configured"
            )
        
        s3_service = S3Service()
        new_url = s3_service.generate_presigned_url(
            file_key=file_key,
            expiration=604800  # 7 days
        )
        
        # Update document URL in transaction
        document["url"] = new_url
        await db.commit()
        await db.refresh(transaction)
        
        return {"url": new_url}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error refreshing document URL: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing URL: {str(e)}"
        )
