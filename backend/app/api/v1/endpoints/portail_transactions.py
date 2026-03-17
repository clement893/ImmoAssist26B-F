"""
Portail Transactions Endpoints (Portail client ImmoAssist)
API for portal transactions (client/courtier)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, PortailTransaction, ClientInvitation
from app.schemas.portail_transaction import (
    PortailTransactionCreate,
    PortailTransactionUpdate,
    PortailTransactionResponse,
    PortailTransactionDetail,
)

router = APIRouter(prefix="/portail/transactions", tags=["portail-transactions"])


@router.post("", response_model=PortailTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: PortailTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new transaction (courtier)."""
    result = await db.execute(
        select(ClientInvitation)
        .where(
            ClientInvitation.id == data.client_invitation_id,
            ClientInvitation.courtier_id == current_user.id,
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation non trouvée")
    transaction = PortailTransaction(
        client_invitation_id=data.client_invitation_id,
        courtier_id=current_user.id,
        type=data.type,
        statut="recherche",
        progression=0,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return PortailTransactionResponse.model_validate(transaction)


@router.get("/client", response_model=PortailTransactionDetail)
async def get_client_transaction(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the active transaction for the current client."""
    if not current_user.client_invitation_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pas de transaction trouvée")
    result = await db.execute(
        select(PortailTransaction)
        .where(
            PortailTransaction.client_invitation_id == current_user.client_invitation_id,
            PortailTransaction.statut != "complete",
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pas de transaction active")
    return PortailTransactionDetail.model_validate(transaction)


@router.get("/courtier", response_model=List[PortailTransactionResponse])
async def list_courtier_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    statut: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List transactions for the current courtier."""
    query = (
        select(PortailTransaction)
        .where(PortailTransaction.courtier_id == current_user.id)
    )
    if statut:
        query = query.where(PortailTransaction.statut == statut)
    query = query.offset(skip).limit(limit).order_by(PortailTransaction.date_debut.desc())
    result = await db.execute(query)
    transactions = list(result.scalars().all())
    return [PortailTransactionResponse.model_validate(t) for t in transactions]


@router.get("/{transaction_id}", response_model=PortailTransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get transaction by ID (courtier or client)."""
    result = await db.execute(
        select(PortailTransaction).where(PortailTransaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction non trouvée")
    # Courtier or client of this transaction
    if transaction.courtier_id != current_user.id and (
        not current_user.client_invitation_id or transaction.client_invitation_id != current_user.client_invitation_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return PortailTransactionResponse.model_validate(transaction)


@router.put("/{transaction_id}/progression", response_model=PortailTransactionResponse)
async def update_progression(
    transaction_id: int,
    progression: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update transaction progression (courtier)."""
    result = await db.execute(
        select(PortailTransaction).where(PortailTransaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction non trouvée")
    if transaction.courtier_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    transaction.progression = max(0, min(100, progression))
    if transaction.progression >= 100:
        transaction.statut = "complete"
    elif transaction.progression >= 80:
        transaction.statut = "notaire"
    elif transaction.progression >= 60:
        transaction.statut = "financement"
    elif transaction.progression >= 40:
        transaction.statut = "inspection"
    elif transaction.progression >= 20:
        transaction.statut = "offre"
    await db.commit()
    await db.refresh(transaction)
    return PortailTransactionResponse.model_validate(transaction)
