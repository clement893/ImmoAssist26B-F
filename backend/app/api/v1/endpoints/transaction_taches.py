"""
Transaction Taches Endpoints (Portail client ImmoAssist)
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, PortailTransaction, TransactionTache
from app.schemas.transaction_tache import (
    TransactionTacheCreate,
    TransactionTacheUpdate,
    TransactionTacheResponse,
)

router = APIRouter(prefix="/portail/transaction-taches", tags=["portail-taches"])


async def _can_access_transaction(db: AsyncSession, transaction_id: int, user: User) -> PortailTransaction | None:
    result = await db.execute(
        select(PortailTransaction).where(PortailTransaction.id == transaction_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        return None
    if t.courtier_id == user.id:
        return t
    if user.client_invitation_id and t.client_invitation_id == user.client_invitation_id:
        return t
    return None


@router.post("", response_model=TransactionTacheResponse, status_code=status.HTTP_201_CREATED)
async def create_tache(
    data: TransactionTacheCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a task (courtier)."""
    transaction = await _can_access_transaction(db, data.transaction_id, current_user)
    if not transaction or transaction.courtier_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    tache = TransactionTache(
        transaction_id=data.transaction_id,
        titre=data.titre,
        description=data.description,
        priorite=data.priorite,
        categorie=data.categorie,
        echeance=data.echeance,
        cree_par_id=current_user.id,
        completee=False,
    )
    db.add(tache)
    await db.commit()
    await db.refresh(tache)
    return TransactionTacheResponse.model_validate(tache)


@router.get("/transaction/{transaction_id}", response_model=List[TransactionTacheResponse])
async def list_taches(
    transaction_id: int,
    completee: Optional[bool] = Query(None),
    priorite: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tasks for a transaction."""
    transaction = await _can_access_transaction(db, transaction_id, current_user)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction non trouvée")
    query = (
        select(TransactionTache)
        .where(TransactionTache.transaction_id == transaction_id)
    )
    if completee is not None:
        query = query.where(TransactionTache.completee == completee)
    if priorite:
        query = query.where(TransactionTache.priorite == priorite)
    query = query.order_by(TransactionTache.echeance.asc())
    result = await db.execute(query)
    taches = list(result.scalars().all())
    return [TransactionTacheResponse.model_validate(t) for t in taches]


@router.put("/{tache_id}/toggle", response_model=TransactionTacheResponse)
async def toggle_tache(
    tache_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle task completed (courtier or client)."""
    result = await db.execute(
        select(TransactionTache).where(TransactionTache.id == tache_id)
    )
    tache = result.scalar_one_or_none()
    if not tache:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tâche non trouvée")
    transaction = await _can_access_transaction(db, tache.transaction_id, current_user)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    tache.completee = not tache.completee
    tache.date_completion = datetime.now(timezone.utc) if tache.completee else None
    await db.commit()
    await db.refresh(tache)
    return TransactionTacheResponse.model_validate(tache)


@router.put("/{tache_id}", response_model=TransactionTacheResponse)
async def update_tache(
    tache_id: int,
    data: TransactionTacheUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a task (courtier)."""
    result = await db.execute(
        select(TransactionTache).where(TransactionTache.id == tache_id)
    )
    tache = result.scalar_one_or_none()
    if not tache:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tâche non trouvée")
    transaction = await _can_access_transaction(db, tache.transaction_id, current_user)
    if not transaction or transaction.courtier_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(tache, key, value)
    await db.commit()
    await db.refresh(tache)
    return TransactionTacheResponse.model_validate(tache)
