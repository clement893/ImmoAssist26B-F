"""Session state management (DB-primary with in-memory fallback)."""

import json
import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

# In-memory store for fallback (no Redis)
_state_store: dict = {}
# List of conversations (fallback when DB unavailable)
_conversations_list: list = []

PA_FIELDS = {
    "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
    "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
    "description_immeuble", "acompte", "date_acompte", "delai_remise_depot",
    "mode_paiement", "montant_hypotheque", "delai_financement",
    "date_acte_vente", "condition_inspection", "date_limite_inspection",
    "condition_documents", "inclusions", "exclusions", "autres_conditions",
    "delai_acceptation",
}

TX_FIELDS = {
    "property_address", "sellers", "buyers", "offered_price", "transaction_type",
}

# Mapping LLM keys → notre schéma (transaction)
TX_KEY_ALIASES = {
    "vendeurs": "sellers", "vendeur": "sellers",
    "acheteurs": "buyers", "acheteur": "buyers",
    "prix_offert": "offered_price", "prix": "offered_price",
    "type": "transaction_type",
}


def _normalize_and_route_fields(raw: dict) -> tuple[dict, dict]:
    """Normalise les clés et sépare transaction vs promesse_achat."""
    tx_fields = {}
    pa_fields = {}
    for k, v in (raw or {}).items():
        if v is None or v == "":
            continue
        key = TX_KEY_ALIASES.get(k, k)
        if key in TX_FIELDS:
            if key in ("sellers", "buyers"):
                tx_fields[key] = [v] if isinstance(v, str) else (v if isinstance(v, list) else [])
            elif key == "offered_price":
                if isinstance(v, (int, float)):
                    tx_fields[key] = float(v)
                elif isinstance(v, str):
                    try:
                        tx_fields[key] = float(str(v).replace(" ", "").replace(",", "."))
                    except ValueError:
                        tx_fields[key] = v
                else:
                    tx_fields[key] = v
            else:
                tx_fields[key] = v
        elif key in PA_FIELDS:
            pa_fields[k] = v
    return tx_fields, pa_fields


def default_state(conversation_id: str, user_id: str = "1") -> dict:
    return {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "active_domain": None,
        "transaction": {
            "id": None,
            "status": "pending",
            "fields": {
                "property_address": None,
                "sellers": [],
                "buyers": [],
                "offered_price": None,
                "transaction_type": None,
            },
        },
        "promesse_achat": {
            "id": None,
            "status": "pending",
            "fields": {},
        },
        "awaiting_field": None,
        "history": [],
    }


async def load_state(
    conversation_id: Optional[str],
    user_id: str = "1",
    db: Optional["AsyncSession"] = None,
) -> dict:
    if not conversation_id:
        cid = str(uuid.uuid4())
        return default_state(cid, user_id)
    # Try DB first when session available
    if db:
        try:
            from app.services.conversation_db import load_conversation
            state = await load_conversation(db, conversation_id, int(user_id) if user_id.isdigit() else 1)
            if state:
                return state
        except Exception:
            pass  # Fallback to in-memory
    data = _state_store.get(f"session:{conversation_id}")
    if data:
        return json.loads(data) if isinstance(data, str) else data
    return default_state(conversation_id, user_id)


async def save_state(
    conversation_id: str,
    state: dict,
    db: Optional["AsyncSession"] = None,
) -> None:
    _state_store[f"session:{conversation_id}"] = json.dumps(state, ensure_ascii=False)
    # Persist to DB when session available
    if db:
        try:
            from app.services.conversation_db import save_conversation
            user_id = int(state.get("user_id", "1")) if str(state.get("user_id", "1")).isdigit() else 1
            await save_conversation(db, conversation_id, state, user_id)
        except Exception:
            pass  # In-memory already saved
    # Update in-memory list for history sidebar (fallback)
    now = datetime.utcnow().isoformat()
    history = state.get("history", [])
    first_user = next((m for m in history if m.get("role") == "user"), None)
    raw_title = first_user.get("content", "").strip() if first_user else ""
    title = (raw_title[:48] + "…") if len(raw_title) > 48 else (raw_title or "Nouvelle conversation")
    existing = next((c for c in _conversations_list if c["id"] == conversation_id), None)
    if existing:
        existing["title"] = title
        existing["updated_at"] = now
    else:
        _conversations_list.append({"id": conversation_id, "title": title, "updated_at": now})
    _conversations_list.sort(key=lambda c: c["updated_at"], reverse=True)


def merge_state(state: dict, updates: dict) -> dict:
    """Merge updates into state. Route fields to transaction or promesse_achat."""
    if not updates:
        return state
    if "active_domain" in updates:
        state["active_domain"] = updates["active_domain"]
    if "awaiting_field" in updates:
        state["awaiting_field"] = updates["awaiting_field"]
    if "fields" in updates:
        tx_new, pa_new = _normalize_and_route_fields(updates["fields"])
        if tx_new:
            state.setdefault("transaction", {}).setdefault("fields", {}).update(tx_new)
        if pa_new:
            state.setdefault("promesse_achat", {}).setdefault("fields", {}).update(pa_new)
        if tx_new and not pa_new and not state.get("active_domain"):
            state["active_domain"] = "transaction"
        if pa_new and not tx_new and not state.get("active_domain"):
            state["active_domain"] = "promesse_achat"
    return state


def get_transaction_progress(state: dict) -> dict:
    """Returns { filled: int, total: 5, fields: {...} }."""
    tx = state.get("transaction", {}).get("fields", {})
    filled = sum(1 for k in TX_FIELDS if tx.get(k) is not None and tx.get(k) != [] and tx.get(k) != "")
    return {"filled": filled, "total": 5, "fields": tx}


def _pa_field_filled(k: str, v) -> bool:
    """Un champ PA est rempli si valeur valide. exclusions/autres_conditions='aucune' = rempli."""
    if v is None or v == "" or v == []:
        return False
    if isinstance(v, str) and v.strip().lower() in ("aucune", "aucun", "n/a", "pas besoin", "rien", "non"):
        return True
    if isinstance(v, list) and len(v) == 1 and str(v[0]).strip().lower() in ("aucune", "aucun", "pas besoin"):
        return True
    if isinstance(v, list) and len(v) == 0:
        return False
    return True


def get_pa_progress(state: dict) -> dict:
    """Returns { filled: int, total: int, fields: {...} }."""
    pa = state.get("promesse_achat", {}).get("fields", {})
    total = len(PA_FIELDS)
    filled = sum(1 for k in PA_FIELDS if _pa_field_filled(k, pa.get(k)))
    return {"filled": filled, "total": total, "fields": pa}


async def list_conversations(
    limit: int = 50,
    db: Optional["AsyncSession"] = None,
) -> List[dict]:
    """Returns list of conversations for history sidebar. Uses DB when db provided."""
    if db:
        try:
            from app.services.conversation_db import list_conversations_db
            return await list_conversations_db(db, limit)
        except Exception:
            pass
    return _conversations_list[:limit]
