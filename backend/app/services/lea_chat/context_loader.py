"""
Context loader Léa : charge l'état actif de la conversation.
Utilisé par le router pour fournir le contexte au LLM.
"""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RealEstateTransaction
from app.models.lea_conversation import LeaConversation
from app.services.lea_chat.actions.session import (
    get_or_create_lea_conversation,
    get_transaction_for_session,
)


async def load_active_conversation_context(
    db: AsyncSession,
    user_id: int,
    session_id: Optional[str],
    last_assistant_message: Optional[str] = None,
) -> dict[str, Any]:
    """
    Charge le contexte actif de la conversation :
    - transaction_active : transaction liée à la session ou dernière
    - pa_active : draft PA en cours (submission_id, section, champ)
    - pending_transaction : brouillon de création transaction (type, stage, address, etc.)
    - last_assistant_message : dernier message de Léa
    - summary : résumé texte pour le prompt LLM
    """
    ctx: dict[str, Any] = {
        "transaction_active": None,
        "pa_active": None,
        "pending_transaction": None,
        "last_assistant_message": last_assistant_message or "",
        "summary": "",
    }

    if not session_id:
        ctx["summary"] = "Pas de session active. Conversation générale."
        return ctx

    conv: Optional[LeaConversation] = None
    try:
        conv, _ = await get_or_create_lea_conversation(db, user_id, session_id)
    except Exception:
        pass

    conv_ctx = (conv.context or {}) if conv else {}

    # Transaction active
    transaction = await get_transaction_for_session(db, user_id, session_id)
    if transaction:
        ctx["transaction_active"] = {
            "id": transaction.id,
            "dossier_number": getattr(transaction, "dossier_number", None),
            "property_address": getattr(transaction, "property_address", None),
            "property_city": getattr(transaction, "property_city", None),
        }

    # PA en cours de remplissage
    oaciq_fill = conv_ctx.get("oaciq_fill")
    if isinstance(oaciq_fill, dict) and oaciq_fill.get("submission_id"):
        ctx["pa_active"] = {
            "submission_id": oaciq_fill.get("submission_id"),
            "last_asked_section": oaciq_fill.get("last_asked_section"),
            "last_asked_field": oaciq_fill.get("last_asked_field"),
            "section_title": oaciq_fill.get("section_title"),
            "missing_in_section": oaciq_fill.get("missing_in_section") or [],
        }

    # Brouillon création transaction
    pending = conv_ctx.get("pending_transaction_creation")
    if isinstance(pending, dict) and pending:
        ctx["pending_transaction"] = dict(pending)
        ctx["pending_transaction"].setdefault("stage", "type")

    # Résumé pour le prompt
    summary_parts = []
    if ctx["pa_active"]:
        summary_parts.append(
            "L'utilisateur est en cours de remplissage du formulaire PA (promesse d'achat)."
        )
        if ctx["pa_active"].get("section_title"):
            summary_parts.append(
                f"Section en cours : {ctx['pa_active']['section_title']}. "
            )
        if ctx["pa_active"].get("last_asked_field"):
            summary_parts.append(
                f"Champ attendu : {ctx['pa_active']['last_asked_field']}."
            )
    elif ctx["pending_transaction"] and ctx["pending_transaction"].get("type"):
        stage = ctx["pending_transaction"].get("stage", "type")
        summary_parts.append(
            f"L'utilisateur est en cours de création d'un nouveau dossier (transaction). "
            f"Étape actuelle : {stage}."
        )
    elif ctx["transaction_active"]:
        addr = ctx["transaction_active"].get("property_address") or ctx["transaction_active"].get("property_city") or ""
        summary_parts.append(
            f"L'utilisateur a une transaction active (dossier {ctx['transaction_active'].get('dossier_number', '')}, {addr})."
        )
    else:
        summary_parts.append(
            "Conversation générale. Pas de dossier en cours de création ni de formulaire PA en cours de remplissage."
        )

    ctx["summary"] = " ".join(summary_parts).strip()
    return ctx
