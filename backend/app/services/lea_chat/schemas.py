"""
Schémas pour le module lea_chat.
Contract entre router, actions et response_composer.
Structure Domain-Intent-Entities selon le plan de refactor.
"""

from typing import Any, Literal, Optional, TypedDict


# --- Domain (extensible) ---
LeaDomain = Literal["transaction", "purchase_offer", "general_assistance", "other"]

# --- Intent (générique) ---
LeaIntentVerb = Literal[
    "create",
    "fill",
    "update",
    "confirm",
    "cancel",
    "resume",
    "ask_help",
    "answer",
]


class LeaEntity(TypedDict, total=False):
    """Donnée extraite du message utilisateur."""
    name: str
    value: Any
    confidence: float
    source_text: Optional[str]


class LeaSignals(TypedDict, total=False):
    """Signaux conversationnels. Extensible."""
    asked_property_for_form: bool
    user_confirmed: bool
    user_gave_address: bool
    user_correcting_postal_or_city: bool
    user_wants_geocode: bool
    user_confirmed_geocode: bool
    looks_like_city_only: bool
    user_wants_update_address: bool
    user_wants_update_price: bool
    user_wants_lea_to_complete_form: bool
    user_wants_help_filling_oaciq: bool
    last_message_asked_for_address: bool
    last_message_asked_for_sellers: bool
    last_message_asked_for_buyers: bool
    last_message_asked_to_confirm_pa: bool
    user_wants_create_oaciq_form: bool
    user_wants_set_promise: bool
    flow_interruption: bool


class RoutingDecision(TypedDict, total=False):
    """Décision structurée retournée par le router LLM."""
    domain: LeaDomain
    intent: LeaIntentVerb
    entities: list[LeaEntity]
    signals: LeaSignals
    tx_type: Literal["vente", "achat", ""]
    transaction_ref: Optional[str]
    confidence: float
    rationale: Optional[str]


