"""
Router Léa : décision structurée (Domain-Intent-Entities).
Appel unique au LLM avec LEA_ROUTING_KNOWLEDGE. Aucune écriture DB.
"""

import json
import re
from typing import Optional

from app.core.logging import logger
from app.services.ai_service import AIService, AIProvider
from app.services.lea_chat.knowledge import load_routing_knowledge
from app.services.lea_chat.schemas import (
    LeaDomain,
    LeaEntity,
    LeaIntentVerb,
    LeaSignals,
    RoutingDecision,
)

ROUTER_CONFIDENCE_THRESHOLD = 0.5


async def _route_legacy_llm(
    message: str,
    last_assistant_message: Optional[str],
    context_summary: str,
    routing_knowledge: str,
) -> Optional[RoutingDecision]:
    """
    Fallback : routeur LLM legacy (format intent plat) si Domain-Intent-Entities échoue.
    Convertit le résultat en RoutingDecision.
    """
    system_prompt = (
        "Tu es le routeur de Léa. Tu analyses le message utilisateur et le dernier message de l'assistant, "
        "puis tu retournes UNIQUEMENT un objet JSON valide, sans texte avant ni après.\n\n"
        f"{routing_knowledge}\n\n"
        "Retourne exactement le JSON tel que décrit. Tous les champs signals doivent être des booléens (true/false). "
        "confidence doit être un nombre entre 0 et 1. Ne retourne RIEN d'autre que le JSON."
    )
    user_content = f"Contexte: {context_summary}\n\n"
    if last_assistant_message and last_assistant_message.strip():
        user_content += f"Dernier message de l'assistant: {last_assistant_message.strip()[:500]}\n\n"
    user_content += f"Message utilisateur: {message.strip()[:500]}"
    try:
        ai = AIService(provider=AIProvider.AUTO)
        resp = await ai.chat_completion(
            [{"role": "user", "content": user_content}],
            system_prompt=system_prompt,
            temperature=0,
            max_tokens=600,
        )
        content = (resp.get("content") or "").strip()
        if "```" in content:
            m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content)
            if m:
                content = m.group(1)
        parsed = json.loads(content)
        if not isinstance(parsed, dict):
            return None
        intent = parsed.get("intent")
        if intent not in ("create_transaction", "create_pa", "fill_pa", "other"):
            domain = parsed.get("domain")
            intent_val = parsed.get("intent")
            if domain == "transaction" and intent_val in ("create", "answer"):
                intent = "create_transaction"
            elif domain == "purchase_offer" and intent_val in ("create", "confirm"):
                intent = "create_pa"
            elif domain == "purchase_offer" and intent_val == "fill":
                intent = "fill_pa"
            else:
                intent = "other"
        domain, intent_verb = _LEGACY_INTENT_MAP.get(intent, ("other", "answer"))
        signals_raw = parsed.get("signals")
        signals: LeaSignals = {}
        if isinstance(signals_raw, dict):
            for k, v in signals_raw.items():
                if isinstance(v, bool):
                    signals[k] = v
        tx_type = (parsed.get("tx_type") or "").strip().lower()[:10]
        if tx_type not in ("vente", "achat"):
            tx_type = ""
        confidence = float(parsed.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))
        return RoutingDecision(
            domain=domain,
            intent=intent_verb,
            entities=[],
            signals=signals,
            tx_type=tx_type,
            transaction_ref=parsed.get("transaction_ref"),
            confidence=confidence,
        )
    except (json.JSONDecodeError, TypeError, ValueError, Exception) as e:
        logger.debug("Router legacy LLM failed: %s", e)
        return None


async def _classify_legacy_minimal(
    message: str,
    last_assistant_message: Optional[str],
    context_summary: str,
) -> Optional[RoutingDecision]:
    """
    Classifieur minimal quand LEA_ROUTING_KNOWLEDGE n'est pas chargé.
    Retourne un RoutingDecision basique (intent uniquement).
    """
    system_prompt = (
        "Tu es un classifieur d'intention. À partir du message utilisateur et du contexte, retourne UNIQUEMENT un des mots suivants, rien d'autre:\n"
        "- create_transaction: l'utilisateur veut créer un nouveau dossier/transaction.\n"
        "- create_pa: l'utilisateur veut créer une promesse d'achat / formulaire PA.\n"
        "- fill_pa: l'utilisateur fournit des données pour remplir le formulaire PA en cours.\n"
        "- other: autre intention.\n"
        "Ne retourne que le mot, en minuscules, sans ponctuation."
    )
    user_content = f"Contexte: {context_summary}\n\n"
    if last_assistant_message and last_assistant_message.strip():
        user_content += f"Dernier message de l'assistant: {last_assistant_message.strip()[:300]}\n\n"
    user_content += f"Message utilisateur: {message.strip()}"
    try:
        ai = AIService(provider=AIProvider.AUTO)
        resp = await ai.chat_completion(
            [{"role": "user", "content": user_content}],
            system_prompt=system_prompt,
            temperature=0,
            max_tokens=20,
        )
        content = (resp.get("content") or "").strip().lower()
        for intent in ("create_transaction", "create_pa", "fill_pa", "other"):
            if intent in content or content == intent:
                domain, intent_verb = _LEGACY_INTENT_MAP[intent]
                return RoutingDecision(
                    domain=domain,
                    intent=intent_verb,
                    entities=[],
                    signals={},
                    tx_type="",
                    confidence=0.8,
                )
        return RoutingDecision(domain="other", intent="answer", entities=[], signals={}, confidence=0.5)
    except Exception as e:
        logger.debug("Minimal classifier failed: %s", e)
        return None


# Mapping intent legacy → domain + intent
_LEGACY_INTENT_MAP: dict[str, tuple[LeaDomain, LeaIntentVerb]] = {
    "create_transaction": ("transaction", "create"),
    "create_pa": ("purchase_offer", "create"),
    "fill_pa": ("purchase_offer", "fill"),
    "other": ("other", "answer"),
}

VALID_DOMAINS: frozenset[str] = frozenset(
    {"transaction", "purchase_offer", "general_assistance", "other"}
)
VALID_INTENTS: frozenset[str] = frozenset(
    {"create", "fill", "update", "confirm", "cancel", "resume", "ask_help", "answer"}
)


def _parse_router_response(content: str) -> Optional[RoutingDecision]:
    """Parse la réponse JSON du LLM et retourne un RoutingDecision valide."""
    content = (content or "").strip()
    if not content:
        return None
    # Extraire le JSON (parfois dans ```json ... ```)
    if "```" in content:
        m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content)
        if m:
            content = m.group(1)
    try:
        parsed = json.loads(content)
        if not isinstance(parsed, dict):
            return None
    except (json.JSONDecodeError, TypeError, ValueError) as e:
        logger.debug("Router JSON parse failed: %s", e)
        return None

    # Nouveau format : domain + intent
    domain = parsed.get("domain")
    intent = parsed.get("intent")

    # Fallback : format legacy (intent = create_transaction, create_pa, etc.)
    if not domain or domain not in VALID_DOMAINS:
        legacy = parsed.get("intent")
        if legacy and legacy in _LEGACY_INTENT_MAP:
            domain, intent = _LEGACY_INTENT_MAP[legacy]
        else:
            domain = "other"
            intent = "answer"

    if intent not in VALID_INTENTS:
        intent = "answer"

    entities_raw = parsed.get("entities")
    entities: list[LeaEntity] = []
    if isinstance(entities_raw, list):
        for e in entities_raw:
            if isinstance(e, dict) and e.get("name"):
                entities.append(
                    LeaEntity(
                        name=str(e["name"]),
                        value=e.get("value"),
                        confidence=float(e.get("confidence", 0.8)),
                        source_text=e.get("source_text"),
                    )
                )

    signals_raw = parsed.get("signals")
    signals: LeaSignals = {}
    if isinstance(signals_raw, dict):
        for k, v in signals_raw.items():
            if isinstance(v, bool):
                signals[k] = v

    confidence = float(parsed.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))

    tx_type = (parsed.get("tx_type") or "").strip().lower()[:10]
    if tx_type not in ("vente", "achat"):
        tx_type = ""

    # Extraire transaction_type des entities si présent
    if not tx_type and entities:
        for e in entities:
            if e.get("name") == "transaction_type" and e.get("value"):
                val = str(e["value"]).lower()
                if val in ("vente", "achat"):
                    tx_type = val
                    break

    return RoutingDecision(
        domain=domain,
        intent=intent,
        entities=entities,
        signals=signals,
        tx_type=tx_type,
        transaction_ref=parsed.get("transaction_ref"),
        confidence=confidence,
        rationale=parsed.get("rationale"),
    )


async def route_user_message(
    message: str,
    last_assistant_message: Optional[str],
    context_summary: str,
) -> Optional[RoutingDecision]:
    """
    Analyse le message via le LLM et retourne une RoutingDecision.
    Retourne None si le LLM échoue ou si le message est vide.
    """
    if not message or not message.strip():
        return None

    routing_knowledge = load_routing_knowledge()
    if not routing_knowledge:
        logger.warning("LEA_ROUTING_KNOWLEDGE not loaded, using minimal classifier")
        return await _classify_legacy_minimal(message, last_assistant_message, context_summary)

    system_prompt = (
        "Tu es le routeur de Léa, un assistant pour courtiers immobiliers au Québec. "
        "Tu analyses le message utilisateur, le dernier message de l'assistant et le contexte, "
        "puis tu retournes UNIQUEMENT un objet JSON valide, sans texte avant ni après.\n\n"
        f"{routing_knowledge}\n\n"
        "Retourne exactement le JSON tel que décrit. "
        "Tous les champs signals doivent être des booléens (true/false). "
        "confidence doit être un nombre entre 0 et 1. "
        "entities doit être un tableau d'objets avec name, value et optionnellement confidence. "
        "Ne retourne RIEN d'autre que le JSON."
    )
    user_content = f"Contexte: {context_summary}\n\n"
    if last_assistant_message and last_assistant_message.strip():
        user_content += f"Dernier message de l'assistant: {last_assistant_message.strip()[:500]}\n\n"
    user_content += f"Message utilisateur: {message.strip()[:500]}"

    try:
        ai = AIService(provider=AIProvider.AUTO)
        resp = await ai.chat_completion(
            [{"role": "user", "content": user_content}],
            system_prompt=system_prompt,
            temperature=0,
            max_tokens=800,
        )
        content = (resp.get("content") or "").strip()
        decision = _parse_router_response(content)
        if decision:
            return decision
    except Exception as e:
        logger.debug("Router LLM failed: %s", e)

    # Fallback : routeur legacy (format intent plat) si Domain-Intent-Entities échoue
    return await _route_legacy_llm(message, last_assistant_message, context_summary, routing_knowledge)
