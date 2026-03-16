"""Progress router - GET /api/progress (courtage advancement)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Transaction, PromesseAchat
from app.schemas import ProgressResponse
from app.services.state import load_state, get_transaction_progress, get_pa_progress

from app.routers.transactions import _tx_progress, _pa_progress

router = APIRouter()


@router.get("/progress/{conversation_id}", response_model=ProgressResponse)
async def get_progress(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get courtage advancement: transaction + PA progress for a conversation.
    When tx/PA are created, use DB as source of truth (state can be incomplete).
    """
    state = await load_state(conversation_id, db=db)

    tx_progress = get_transaction_progress(state)
    pa_progress = get_pa_progress(state)

    # When transaction is created, enrich from DB (source of truth)
    tx_state = state.get("transaction", {})
    if tx_state.get("status") == "created" and tx_state.get("id"):
        res = await db.execute(select(Transaction).where(Transaction.id == tx_state["id"]))
        tx = res.scalar_one_or_none()
        if tx:
            tx_progress = _tx_progress(tx)

    # When PA is created, enrich from DB (source of truth)
    pa_state = state.get("promesse_achat", {})
    if pa_state.get("status") == "created" and pa_state.get("id"):
        res = await db.execute(select(PromesseAchat).where(PromesseAchat.id == pa_state["id"]))
        pa = res.scalar_one_or_none()
        if pa:
            pa_progress = _pa_progress(pa)

    return ProgressResponse(
        active_domain=state.get("active_domain"),
        transaction={
            "status": state.get("transaction", {}).get("status"),
            "id": state.get("transaction", {}).get("id"),
            "filled": tx_progress["filled"],
            "total": tx_progress["total"],
            "fields": tx_progress["fields"],
        },
        promesse_achat={
            "status": state.get("promesse_achat", {}).get("status"),
            "id": state.get("promesse_achat", {}).get("id"),
            "filled": pa_progress["filled"],
            "total": pa_progress["total"],
            "fields": pa_progress["fields"],
        },
        transaction_complete=state.get("transaction", {}).get("status") == "created",
        pa_complete=state.get("promesse_achat", {}).get("status") == "created",
    )
