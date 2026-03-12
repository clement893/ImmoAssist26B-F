"""
Schémas pour le module lea_chat.
Contract entre router, actions et response_composer.
"""

from typing import Literal, Optional, TypedDict


# --- Domain + Intent (extensible) ---

LeaDomain = Literal["transaction", "purchase_offer", "general_assistance", "other"]
LeaIntentVerb = Literal["create", "fill", "update", "answer", "confirm"]


class LeaSignals(TypedDict, total=False):
    """Signaux conversationnels (phase actuelle). Extensible."""
    asked_property_for_form: bool  # Dernier msg assistant = demande propriété pour formulaire
    user_confirmed: bool  # Message = confirmation courte (oui, exact, c'est ça)
    user_gave_address: bool  # Message contient une adresse


class LeaIntent(TypedDict, total=False):
    """Décision structurée retournée par le router. Aucune écriture DB."""
    domain: LeaDomain
    intent: LeaIntentVerb
    signals: LeaSignals
    tx_type: Literal["vente", "achat", ""]
    transaction_ref: Optional[str]
    confidence: float


# --- ActionResult (contract actions -> response_composer) ---

class ActionResult(TypedDict, total=False):
    """Résultat d'une action backend. Agrégé par response_composer."""
    action_type: str
    success: bool
    action_lines: list[str]
    transaction_id: Optional[int]
    form_submission_id: Optional[int]
    next_step: Optional[str]
    metadata: dict
