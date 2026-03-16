"""Conversations history - GET /api/conversations, GET /api/conversation/{id}."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.state import load_state, list_conversations
from app.services.conversation_db import load_conversation

router = APIRouter()


@router.get("/conversations")
async def get_conversations(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """List recent conversations for history sidebar (from lea_conversations)."""
    convos = await list_conversations(limit=limit, db=db)
    return {"conversations": convos}


@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single conversation (messages + state) to load it."""
    state = await load_conversation(db, conversation_id, 1)
    if not state:
        state = await load_state(conversation_id, "1", db)
    history = state.get("history", [])
    first_user = next((m for m in history if m.get("role") == "user"), None)
    raw = first_user.get("content", "") if first_user else ""
    title = (raw[:50] + "…") if len(raw) > 50 else (raw or "Nouvelle conversation")
    return {
        "id": conversation_id,
        "title": title,
        "messages": [{"role": m.get("role"), "content": m.get("content", "")} for m in history],
        "state": state,
    }
