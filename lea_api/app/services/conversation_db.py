"""Database persistence for Léa conversations (lea_conversations table)."""

from datetime import datetime, date
from typing import Optional, List, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import LeaConversation


def _json_serial(obj: Any) -> Any:
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _json_serial(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_json_serial(v) for v in obj]
    return obj


def _state_to_db(state: dict) -> tuple:
    history = state.get("history", [])
    context = {
        "conversation_id": state.get("conversation_id"),
        "user_id": state.get("user_id"),
        "active_domain": state.get("active_domain"),
        "transaction": state.get("transaction", {}),
        "promesse_achat": state.get("promesse_achat", {}),
        "awaiting_field": state.get("awaiting_field"),
        "address_candidates": state.get("address_candidates", []),
        "partial_address_pending": state.get("partial_address_pending"),
    }
    return history, context


def _db_to_state(session_id: str, user_id: str, messages: list, context: dict) -> dict:
    return {
        "conversation_id": session_id,
        "user_id": str(context.get("user_id", user_id)),
        "active_domain": context.get("active_domain"),
        "transaction": context.get("transaction", {"id": None, "status": "pending", "fields": {}}),
        "promesse_achat": context.get("promesse_achat", {"id": None, "status": "pending", "fields": {}}),
        "awaiting_field": context.get("awaiting_field"),
        "address_candidates": context.get("address_candidates", []),
        "partial_address_pending": context.get("partial_address_pending"),
        "history": messages or [],
    }


async def save_conversation(
    db: AsyncSession,
    conversation_id: str,
    state: dict,
    user_id: int = 1,
) -> None:
    messages, context = _state_to_db(state)
    context = _json_serial(context)
    tx_id = state.get("transaction", {}).get("id")
    pa_id = state.get("promesse_achat", {}).get("id")

    result = await db.execute(
        select(LeaConversation).where(LeaConversation.session_id == conversation_id)
    )
    row = result.scalar_one_or_none()

    if row:
        row.messages = messages
        row.context = context
        row.updated_at = datetime.utcnow()
        if tx_id is not None:
            row.transaction_id = tx_id
        if pa_id is not None:
            row.promesse_achat_id = pa_id
    else:
        row = LeaConversation(
            session_id=conversation_id,
            user_id=user_id,
            transaction_id=tx_id,
            promesse_achat_id=pa_id,
            messages=messages,
            context=context,
        )
        db.add(row)

    await db.flush()
    await db.commit()


async def load_conversation(
    db: AsyncSession,
    conversation_id: str,
    user_id: int = 1,
) -> Optional[dict]:
    result = await db.execute(
        select(LeaConversation).where(LeaConversation.session_id == conversation_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        return None
    return _db_to_state(
        conversation_id,
        str(user_id),
        row.messages or [],
        row.context or {},
    )


async def list_conversations_db(
    db: AsyncSession,
    limit: int = 50,
) -> List[dict]:
    result = await db.execute(
        select(LeaConversation)
        .order_by(LeaConversation.updated_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    out = []
    for r in rows:
        first_user = next((m for m in (r.messages or []) if m.get("role") == "user"), None)
        raw = first_user.get("content", "").strip() if first_user else ""
        title = (raw[:48] + "…") if len(raw) > 48 else (raw or "Nouvelle conversation")
        out.append({
            "id": r.session_id,
            "title": title,
            "updated_at": r.updated_at.isoformat() if r.updated_at else "",
            "transaction_id": r.transaction_id,
            "promesse_achat_id": r.promesse_achat_id,
        })
    return out
