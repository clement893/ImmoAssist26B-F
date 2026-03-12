"""
Actions session : liaison session-transaction, récupération conversation.
"""

import uuid
from typing import Optional, Tuple

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models import RealEstateTransaction
from app.models.lea_conversation import LeaConversation, LeaSessionTransactionLink


async def get_transaction_for_session(
    db: AsyncSession, user_id: int, session_id: str
) -> Optional[RealEstateTransaction]:
    """Retourne la transaction liée à la session Léa, ou None."""
    if not session_id:
        return None
    try:
        r = await db.execute(
            select(LeaSessionTransactionLink)
            .where(LeaSessionTransactionLink.session_id == session_id)
            .where(LeaSessionTransactionLink.user_id == user_id)
            .order_by(LeaSessionTransactionLink.created_at.desc())
            .limit(1)
        )
        link = r.scalar_one_or_none()
        if not link:
            return None
        tx_r = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == link.transaction_id,
                    RealEstateTransaction.user_id == user_id,
                )
            )
        )
        return tx_r.scalar_one_or_none()
    except Exception as e:
        logger.warning(f"get_transaction_for_session failed: {e}", exc_info=True)
        return None


async def link_lea_session_to_transaction(
    db: AsyncSession, user_id: int, session_id: str, transaction_id: int
) -> None:
    """Enregistre un lien entre une session Léa et une transaction (pour l'historique sur la fiche transaction)."""
    if not session_id or not transaction_id:
        return
    try:
        r = await db.execute(
            select(LeaSessionTransactionLink).where(
                LeaSessionTransactionLink.session_id == session_id,
                LeaSessionTransactionLink.transaction_id == transaction_id,
                LeaSessionTransactionLink.user_id == user_id,
            ).limit(1)
        )
        if r.scalar_one_or_none() is not None:
            return  # déjà lié
        link = LeaSessionTransactionLink(
            session_id=session_id,
            transaction_id=transaction_id,
            user_id=user_id,
        )
        db.add(link)
        await db.commit()
        logger.info(f"Lea linked session {session_id[:8]}... to transaction id={transaction_id}")
    except Exception as e:
        logger.warning(f"Lea link session to transaction failed: {e}", exc_info=True)
        await db.rollback()


async def get_or_create_lea_conversation(
    db: AsyncSession, user_id: int, session_id: str | None
) -> Tuple[LeaConversation, str]:
    """Retourne (conversation, session_id). Crée la conversation si besoin."""
    if session_id:
        r = await db.execute(
            select(LeaConversation)
            .where(LeaConversation.session_id == session_id)
            .where(LeaConversation.user_id == user_id)
        )
        conv = r.scalar_one_or_none()
        if conv:
            return conv, session_id
    sid = session_id or str(uuid.uuid4())
    conv = LeaConversation(user_id=user_id, session_id=sid, messages=[], context={})
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv, sid
