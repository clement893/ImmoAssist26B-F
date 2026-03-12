"""
Router Léa : décision structurée (domain + intent + signals).
Aucune écriture DB, aucune logique métier — retourne LeaIntent uniquement.
"""

from typing import Optional

from app.services.lea_chat.schemas import LeaIntent, LeaSignals


def compute_intent(
    message: str,
    last_assistant_message: Optional[str] = None,
    context: Optional[dict] = None,
) -> LeaIntent:
    """
    Analyse le message et retourne une décision structurée (LeaIntent).
    À terme : LLM + fallback heuristique. Phase 1 : structure de base.
    """
    ctx = context or {}
    signals: LeaSignals = {}

    # Phase 1 : retourne une intent par défaut (general_assistance)
    # Les heuristiques restent dans lea.py ; le router sera branché progressivement
    return LeaIntent(
        domain="general_assistance",
        intent="answer",
        signals=signals,
        tx_type="",
        transaction_ref=None,
        confidence=0.0,
    )
