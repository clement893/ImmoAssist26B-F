"""
Transaction Messages Endpoints (Portail client ImmoAssist)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, PortailTransaction, TransactionMessage
from app.schemas.transaction_message import TransactionMessageCreate, TransactionMessageResponse

router = APIRouter(prefix="/portail/transaction-messages", tags=["portail-messages"])


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


@router.post("", response_model=TransactionMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    data: TransactionMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a transaction."""
    transaction = await _can_access_transaction(db, data.transaction_id, current_user)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction non trouvée")
    msg = TransactionMessage(
        transaction_id=data.transaction_id,
        expediteur_id=current_user.id,
        message=data.message,
        lu=False,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return TransactionMessageResponse.model_validate(msg)


@router.get("/transaction/{transaction_id}", response_model=List[TransactionMessageResponse])
async def list_messages(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List messages for a transaction."""
    transaction = await _can_access_transaction(db, transaction_id, current_user)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction non trouvée")
    result = await db.execute(
        select(TransactionMessage)
        .where(TransactionMessage.transaction_id == transaction_id)
        .order_by(TransactionMessage.date_envoi.asc())
    )
    messages = list(result.scalars().all())
    return [TransactionMessageResponse.model_validate(m) for m in messages]


@router.put("/{message_id}/mark-read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a message as read."""
    result = await db.execute(
        select(TransactionMessage).where(TransactionMessage.id == message_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message non trouvé")
    transaction = await _can_access_transaction(db, msg.transaction_id, current_user)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    msg.lu = True
    await db.commit()
    return {"message": "Message marqué comme lu"}
