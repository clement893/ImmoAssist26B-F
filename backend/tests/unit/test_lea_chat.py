"""
Tests unitaires pour le module lea_chat : router, heuristics, schemas, response_composer.
"""

import pytest

from app.services.lea_chat.router import _parse_router_response
from app.services.lea_chat.heuristics import (
    _format_canadian_postal_code,
    _is_short_confirmation_message,
    _last_message_asked_for_property_for_form,
    _last_message_asked_to_confirm_pa_creation,
)
from app.services.lea_chat.actions.transaction import _wants_to_create_transaction
from app.services.lea_chat.response_composer import build_context


class TestRouterParse:
    """Tests pour _parse_router_response."""

    def test_parse_domain_intent_entities(self):
        """Parse une réponse Domain-Intent-Entities valide."""
        content = '''
        {
            "domain": "transaction",
            "intent": "create",
            "entities": [{"name": "transaction_type", "value": "vente", "confidence": 0.9}],
            "signals": {"user_gave_address": false, "user_confirmed": false},
            "confidence": 0.85,
            "tx_type": "vente"
        }
        '''
        result = _parse_router_response(content)
        assert result is not None
        assert result.get("domain") == "transaction"
        assert result.get("intent") == "create"
        assert result.get("confidence") == 0.85
        assert result.get("tx_type") == "vente"
        assert len(result.get("entities", [])) == 1

    def test_parse_legacy_format(self):
        """Parse une réponse legacy (intent plat)."""
        content = '{"intent": "create_pa", "tx_type": "", "signals": {}, "confidence": 0.8}'
        result = _parse_router_response(content)
        assert result is not None
        assert result.get("domain") == "purchase_offer"
        assert result.get("intent") == "create"

    def test_parse_empty_returns_none(self):
        """Chaîne vide ou invalide retourne None."""
        assert _parse_router_response("") is None
        assert _parse_router_response("not json") is None

    def test_parse_with_markdown_fence(self):
        """Parse JSON extrait de bloc ```json ... ```."""
        content = '```json\n{"domain": "other", "intent": "answer", "confidence": 0.5}\n```'
        result = _parse_router_response(content)
        assert result is not None
        assert result.get("domain") == "other"


class TestHeuristics:
    """Tests pour les heuristiques (fallback)."""

    def test_format_canadian_postal_code(self):
        """Formatage code postal canadien."""
        assert _format_canadian_postal_code("h2k1e1") == "H2K 1E1"
        assert _format_canadian_postal_code("H2K 1E1") == "H2K 1E1"

    def test_short_confirmation(self):
        """Messages de confirmation courts."""
        assert _is_short_confirmation_message("oui") is True
        assert _is_short_confirmation_message("ok") is True
        assert _is_short_confirmation_message("exact") is True
        assert _is_short_confirmation_message("c'est ça") is True
        assert _is_short_confirmation_message("Je veux créer une transaction de vente") is False

    def test_last_message_asked_for_property_for_form(self):
        """Dernier message demandait pour quelle propriété."""
        msg = "Pour quelle propriété (adresse ou transaction) souhaitez-vous préparer ce formulaire ?"
        assert _last_message_asked_for_property_for_form(msg) is True
        assert _last_message_asked_for_property_for_form("Quel est le prix ?") is False

    def test_last_message_asked_to_confirm_pa(self):
        """Dernier message demandait confirmation PA."""
        msg = "Souhaitez-vous créer la promesse d'achat pour la transaction au 229 Dufferin ?"
        assert _last_message_asked_to_confirm_pa_creation(msg) is True


class TestTransactionHeuristics:
    """Tests pour _wants_to_create_transaction."""

    def test_wants_create_vente(self):
        """Détecte création transaction vente."""
        ok, tx_type = _wants_to_create_transaction("créer une transaction de vente")
        assert ok is True
        assert tx_type == "vente"

    def test_wants_create_achat(self):
        """Détecte création transaction achat."""
        ok, tx_type = _wants_to_create_transaction("je veux un dossier d'achat")
        assert ok is True
        assert tx_type == "achat"

    def test_not_create_pa(self):
        """Ne confond pas avec création PA."""
        ok, _ = _wants_to_create_transaction("créer une promesse d'achat")
        assert ok is False


class TestResponseComposer:
    """Tests pour build_context."""

    def test_build_context_with_knowledge(self):
        """Construit system_prompt avec knowledge et LEA_SYSTEM_PROMPT."""
        user_ctx = "Données: transaction #1"
        action_lines = ["Action: transaction créée"]
        knowledge = "Instructions PA..."
        system, uctx, alines = build_context(user_ctx, action_lines, knowledge=knowledge)
        assert "Base de connaissance" in system
        assert "Instructions PA" in system
        assert "Règles système" in system
        assert uctx == user_ctx
        assert alines == action_lines

    def test_build_context_without_knowledge(self):
        """Construit system_prompt sans knowledge."""
        system, _, _ = build_context("ctx", [], knowledge=None)
        assert "Règles système" in system
