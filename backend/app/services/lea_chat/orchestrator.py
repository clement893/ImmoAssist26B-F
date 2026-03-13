"""
Orchestrateur Léa : point d'entrée pour l'exécution des actions.
Coordonne router (Domain-Intent-Entities) et executor. Aucune dépendance directe à lea.py.
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RealEstateTransaction

from app.services.lea_chat.context_loader import load_active_conversation_context
from app.services.lea_chat.router import ROUTER_CONFIDENCE_THRESHOLD, route_user_message
from app.services.lea_chat.schemas import RoutingDecision
from app.services.lea_chat.executor import execute_actions


def _routing_decision_to_legacy(decision: dict) -> dict:
    """Convertit une RoutingDecision (domain+intent+entities) en format legacy pour l'executor."""
    domain = decision.get("domain") or "other"
    intent = decision.get("intent") or "answer"
    _domain_intent_to_legacy = {
        ("transaction", "create"): "create_transaction",
        ("transaction", "answer"): "create_transaction",
        ("transaction", "update"): "other",
        ("purchase_offer", "create"): "create_pa",
        ("purchase_offer", "confirm"): "create_pa",
        ("purchase_offer", "fill"): "fill_pa",
        ("purchase_offer", "update"): "fill_pa",
        ("purchase_offer", "ask_help"): "fill_pa",
    }
    legacy_intent = _domain_intent_to_legacy.get((domain, intent), "other")
    entities = decision.get("entities") or []
    if isinstance(entities, list):
        entities = [e for e in entities if isinstance(e, dict)]
    return {
        "intent": legacy_intent,
        "intent_verb": intent,
        "domain": domain,
        "tx_type": (decision.get("tx_type") or "")[:10],
        "signals": decision.get("signals") or {},
        "confidence": float(decision.get("confidence", 0.5)),
        "entities": entities,
    }


async def run(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    session_id: Optional[str] = None,
) -> tuple[list, Optional[RealEstateTransaction]]:
    """
    Exécute les actions Léa (création transaction, mise à jour adresse, promesse d'achat).
    1. Charge le contexte (load_active_conversation_context)
    2. Route via route_user_message (Domain-Intent-Entities)
    3. Délègue l'exécution à executor (router_decision passée pour éviter double routage)
    Retourne (liste de lignes pour « Action effectuée », transaction créée si création).
    """
    router_decision: Optional[dict] = None
    if message and len((message or "").strip()) >= 3:
        active_ctx = await load_active_conversation_context(
            db, user_id, session_id, last_assistant_message=last_assistant_message
        )
        context_summary = active_ctx.get("summary", "") or (
            "Conversation générale, pas de dossier en cours de création ni de formulaire PA en cours de remplissage."
        )
        decision: Optional[RoutingDecision] = await route_user_message(
            message, last_assistant_message, context_summary
        )
        if decision and decision.get("confidence", 0) >= ROUTER_CONFIDENCE_THRESHOLD:
            router_decision = _routing_decision_to_legacy(dict(decision))
    return await execute_actions(
        db,
        user_id,
        message,
        last_assistant_message,
        session_id,
        router_decision=router_decision,
    )
