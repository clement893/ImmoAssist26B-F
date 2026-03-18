"""LLM service - OpenAI function calling + streaming text."""

import json
import re
from pathlib import Path
from typing import AsyncGenerator

from app.config import get_settings

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

APP_DIR = Path(__file__).parent.parent
FULL_PROMPT_PATH = APP_DIR.parent / "docs" / "lea_courtier_assistant.md"

FALLBACK_MESSAGE = "Désolé, une erreur s'est produite. Pouvez-vous réessayer ?"

_SYSTEM_PROMPT_CACHE: str | None = None

TX_REQUIRED = ["property_address", "sellers", "buyers", "offered_price", "transaction_type"]

PA_REQUIRED = [
    "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
    "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
    "description_immeuble", "acompte", "date_acompte", "delai_remise_depot",
    "mode_paiement", "delai_financement", "date_acte_vente",
    "condition_inspection", "condition_documents",
    "inclusions", "exclusions", "delai_acceptation",
]

# ---------------------------------------------------------------------------
# Tools (function calling)
# Le LLM décide quand les appeler — il répond en texte libre ET appelle les tools
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "geocode_address",
            "description": (
                "Géocoder une adresse partielle (numéro + rue) pour obtenir l'adresse complète. "
                "Appeler dès que le courtier mentionne un numéro civique + rue "
                "et que transaction.fields.property_address est vide dans le draft. "
                "NE PAS appeler si l'adresse est déjà confirmée."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "partial_address": {"type": "string", "description": "Ex: '5554 rue saint denis'"}
                },
                "required": ["partial_address"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_draft",
            "description": (
                "OBLIGATOIRE : Sauvegarder TOUS les champs extraits du message dans le draft. "
                "Appeler à CHAQUE message dès que le courtier fournit une info (adresse, nom, téléphone, courriel, prix, etc.). "
                "La barre gauche se met à jour avec ces champs. Sans cet appel, les infos sont perdues."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "transaction_fields": {
                        "type": "object",
                        "description": "Champs transaction extraits",
                        "properties": {
                            "sellers": {"type": "array", "items": {"type": "string"}},
                            "buyers": {"type": "array", "items": {"type": "string"}},
                            "offered_price": {"type": "number"},
                            "transaction_type": {"type": "string", "enum": ["vente", "achat"]}
                        }
                    },
                    "pa_fields": {
                        "type": "object",
                        "description": "Champs PA extraits du message"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_transaction",
            "description": (
                "Créer la transaction en base de données. "
                "Appeler SEULEMENT quand les 5 champs sont remplis ET le courtier confirme."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "property_address": {"type": "string"},
                    "sellers": {"type": "array", "items": {"type": "string"}},
                    "buyers": {"type": "array", "items": {"type": "string"}},
                    "offered_price": {"type": "number"},
                    "transaction_type": {"type": "string", "enum": ["vente", "achat"]}
                },
                "required": ["property_address", "sellers", "buyers", "offered_price", "transaction_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_pa",
            "description": (
                "Créer la Promesse d'Achat en base de données. "
                "Appeler SEULEMENT quand transaction.status = 'created' ET tous les champs PA sont remplis ET le courtier confirme."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "acheteur_adresse": {"type": "string"},
                    "acheteur_telephone": {"type": "string"},
                    "acheteur_courriel": {"type": "string"},
                    "vendeur_adresse": {"type": "string"},
                    "vendeur_telephone": {"type": "string"},
                    "vendeur_courriel": {"type": "string"},
                    "description_immeuble": {"type": "string"},
                    "acompte": {"type": "number"},
                    "date_acompte": {"type": "string"},
                    "delai_remise_depot": {"type": "string"},
                    "mode_paiement": {"type": "string"},
                    "montant_hypotheque": {"type": "number"},
                    "delai_financement": {"type": "string"},
                    "date_acte_vente": {"type": "string"},
                    "condition_inspection": {"type": "boolean"},
                    "date_limite_inspection": {"type": "string"},
                    "condition_documents": {"type": "boolean"},
                    "inclusions": {"type": "array", "items": {"type": "string"}},
                    "exclusions": {"type": "string"},
                    "autres_conditions": {"type": "string"},
                    "delai_acceptation": {"type": "string"}
                },
                "required": [
                    "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
                    "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
                    "description_immeuble", "acompte", "date_acompte", "delai_remise_depot",
                    "mode_paiement", "delai_financement", "date_acte_vente",
                    "condition_inspection", "condition_documents", "inclusions",
                    "exclusions", "delai_acceptation"
                ]
            }
        }
    }
]

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTIONS = """
Tu es Léa, assistante courtier immobilier québécois.

RÈGLES ABSOLUES — MODE VOCAL :
- Réponds TOUJOURS en français québécois
- JAMAIS de tirets, bullet points, listes ou markdown — tu parles, tu n'écris pas
- Maximum 2-3 phrases par réponse, langage oral naturel
- Une seule question à la fois
- Tu utilises les tools pour toutes tes actions
- Démarre calmement — évite les salutations abruptes ou agressives (ex: préfère "Bonjour, pour créer..." à "Bonjour !" seul)

RÉCAPITULATIF TRANSACTION — format oral obligatoire :
❌ JAMAIS : "- Type : Achat\n- Adresse : ...\n- Vendeur(s) : ..."
✅ TOUJOURS : "J'ai bien noté un achat au 5554 Rue Saint-Denis, vendeur Jennifer Ford, acheteur Diana Clark, 811 000 dollars. Je confirme ?"

RÉCAPITULATIF PA — format oral obligatoire :
❌ JAMAIS : "- Acheteur : ...\n- Vendeur : ..."
✅ TOUJOURS : "Parfait, j'ai tout. Acheteur Myriam Drew, vendeur Anne Sophie, acompte 15 000 le 20 mai, hypothèque 400 000, acte de vente le 30 juin, inspection oui, inclusions laveuse sécheuse réfrigérateur, délai 24 heures. Je crée la promesse d'achat ?"

- "oui", "ok", "go", "parfait", "c'est bon" = confirmation → action immédiate
- Ne jamais re-géocoder si l'adresse est déjà dans le draft
"""


def _get_missing_fields(state: dict) -> tuple[list, list]:
    tx_fields = state.get("transaction", {}).get("fields", {})
    pa_fields = state.get("promesse_achat", {}).get("fields", {})

    def _filled(v) -> bool:
        if v is None or v == "" or v == []:
            return False
        if isinstance(v, bool):
            return True
        return True

    tx_missing = [k for k in TX_REQUIRED if not _filled(tx_fields.get(k))]
    pa_missing = [k for k in PA_REQUIRED if not _filled(pa_fields.get(k))]

    mode = str(pa_fields.get("mode_paiement", "")).lower()
    if "hypothèque" in mode or "hypotheque" in mode:
        if not _filled(pa_fields.get("montant_hypotheque")):
            if "montant_hypotheque" not in pa_missing:
                pa_missing.append("montant_hypotheque")

    if pa_fields.get("condition_inspection") is True:
        if not _filled(pa_fields.get("date_limite_inspection")):
            if "date_limite_inspection" not in pa_missing:
                pa_missing.append("date_limite_inspection")

    return tx_missing, pa_missing


def _load_system_prompt() -> str:
    global _SYSTEM_PROMPT_CACHE
    if _SYSTEM_PROMPT_CACHE is None:
        base = ""
        if FULL_PROMPT_PATH.exists():
            base = FULL_PROMPT_PATH.read_text(encoding="utf-8")
        _SYSTEM_PROMPT_CACHE = base + "\n\n" + SYSTEM_INSTRUCTIONS
    return _SYSTEM_PROMPT_CACHE


def reset_prompt_cache() -> None:
    global _SYSTEM_PROMPT_CACHE
    _SYSTEM_PROMPT_CACHE = None


def _build_system(state: dict, user: dict | None = None) -> str:
    """Construit le system prompt avec le contexte dynamique."""
    tx_missing, pa_missing = _get_missing_fields(state)

    draft = {
        "transaction": state.get("transaction", {}),
        "promesse_achat": state.get("promesse_achat", {}),
        "active_domain": state.get("active_domain"),
        "awaiting_field": state.get("awaiting_field"),
    }

    tx_fields = state.get("transaction", {}).get("fields", {})
    addr_confirmed = bool(tx_fields.get("property_address"))
    tx_status = state.get("transaction", {}).get("status")
    needs_geocode = not addr_confirmed and tx_status != "created"

    context = f"""
## Draft actuel
{json.dumps(draft, ensure_ascii=False)}

## Champs manquants
- Transaction : {tx_missing if tx_missing else "AUCUN — transaction complète"}
- PA : {pa_missing if pa_missing else "AUCUN — PA complète"}

## Adresse : {"⚠️ NON confirmée → appeler geocode_address si numéro+rue dans le message" if needs_geocode else "✅ Déjà confirmée — NE PAS re-géocoder"}

## Courtier : {(user or {}).get('full_name', 'Courtier')} | Permis : {(user or {}).get('permis_number', 'N/A')}
"""
    return _load_system_prompt() + context


def _build_messages(user_message: str, state: dict, user: dict | None = None) -> list:
    """Construit la liste de messages pour OpenAI."""
    system = _build_system(state, user)
    history = state.get("history", [])
    messages = [{"role": "system", "content": system}]
    for m in history[-6:]:
        role = m.get("role", "")
        content = (m.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            limit = 1200 if role == "user" else 400
            messages.append({"role": role, "content": content[:limit]})
    messages.append({"role": "user", "content": user_message})
    return messages


def _parse_tool_calls(tool_calls) -> tuple[list, dict]:
    """Parse les tool calls OpenAI en liste d'actions."""
    actions = []
    state_fields = {}

    for tc in (tool_calls or []):
        fn_name = tc.function.name
        try:
            args = json.loads(tc.function.arguments)
        except Exception:
            continue

        if fn_name == "geocode_address":
            actions.append({"type": "geocode_address", "payload": args})

        elif fn_name == "update_draft":
            tx = args.get("transaction_fields") or {}
            pa = args.get("pa_fields") or {}
            state_fields.update(tx)
            state_fields.update(pa)

        elif fn_name == "create_transaction":
            actions.append({"type": "create_transaction", "payload": args})
            state_fields.update({k: v for k, v in args.items() if v is not None})

        elif fn_name == "create_pa":
            actions.append({"type": "create_pa", "payload": args})

    return actions, state_fields


# ---------------------------------------------------------------------------
# call_llm — mode non-streaming (fallback + voice)
# ---------------------------------------------------------------------------

async def call_llm(
    user_message: str,
    state: dict,
    user: dict | None = None,
    last_turn: list | None = None,
) -> dict:
    """Appel OpenAI avec function calling. Retourne {message, actions, state_updates}."""
    if not OPENAI_AVAILABLE:
        return {"message": "OpenAI non installé.", "actions": [], "state_updates": {}}

    settings = get_settings()
    if not settings.openai_api_key:
        return {"message": "OPENAI_API_KEY manquant.", "actions": [], "state_updates": {}}

    # Utiliser last_turn si fourni (override historique)
    if last_turn:
        state_with_history = dict(state)
        state_with_history["history"] = last_turn
    else:
        state_with_history = state

    messages = _build_messages(user_message, state_with_history, user)

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model=settings.llm_model,
            max_tokens=1024,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
    except Exception as e:
        return {"message": f"Erreur IA : {str(e)}", "actions": [], "state_updates": {}}

    choice = response.choices[0]
    message_text = (choice.message.content or "").strip()
    tool_calls = choice.message.tool_calls or []

    actions, state_fields = _parse_tool_calls(tool_calls)

    # Fallback message si LLM n'a retourné que des tool calls sans texte
    if not message_text:
        if any(a["type"] == "create_transaction" for a in actions):
            message_text = "Transaction enregistrée avec succès. Voulez-vous préparer la Promesse d'Achat ?"
        elif any(a["type"] == "create_pa" for a in actions):
            message_text = "Promesse d'Achat enregistrée avec succès."
        elif any(a["type"] == "geocode_address" for a in actions):
            message_text = "Je vérifie l'adresse..."
        else:
            message_text = FALLBACK_MESSAGE

    return {
        "message": message_text,
        "actions": actions,
        "state_updates": {"fields": state_fields} if state_fields else {},
    }


# ---------------------------------------------------------------------------
# call_llm_stream — mode streaming (texte immédiat + tool calls à la fin)
# ---------------------------------------------------------------------------

async def call_llm_stream(
    user_message: str,
    state: dict,
    user: dict | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Stream OpenAI avec function calling.
    Yield des événements :
      {"type": "text_delta", "delta": "mot "}
      {"type": "done", "message": "...", "actions": [...], "state_fields": {...}}
    """
    if not OPENAI_AVAILABLE:
        yield {"type": "done", "message": "OpenAI non installé.", "actions": [], "state_fields": {}}
        return

    settings = get_settings()
    if not settings.openai_api_key:
        yield {"type": "done", "message": "OPENAI_API_KEY manquant.", "actions": [], "state_fields": {}}
        return

    messages = _build_messages(user_message, state, user)

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        stream = await client.chat.completions.create(
            model=settings.llm_model,
            max_tokens=1024,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            stream=True,
        )
    except Exception as e:
        yield {"type": "done", "message": f"Erreur IA : {str(e)}", "actions": [], "state_fields": {}}
        return

    full_text = ""
    # Accumulation des tool calls (arrivent fragmentés en streaming)
    tool_calls_raw: dict[int, dict] = {}

    async for chunk in stream:
        choice = chunk.choices[0] if chunk.choices else None
        if not choice:
            continue

        delta = choice.delta

        # Stream du texte — yield immédiatement chaque delta
        if delta.content:
            full_text += delta.content
            yield {"type": "text_delta", "delta": delta.content}

        # Accumulation des tool calls fragmentés
        if delta.tool_calls:
            for tc in delta.tool_calls:
                idx = tc.index
                if idx not in tool_calls_raw:
                    tool_calls_raw[idx] = {
                        "id": tc.id or "",
                        "name": tc.function.name if tc.function else "",
                        "arguments": ""
                    }
                if tc.id:
                    tool_calls_raw[idx]["id"] = tc.id
                if tc.function:
                    if tc.function.name:
                        tool_calls_raw[idx]["name"] = tc.function.name
                    if tc.function.arguments:
                        tool_calls_raw[idx]["arguments"] += tc.function.arguments

    # Parser les tool calls complets
    class _FakeFn:
        def __init__(self, name, arguments):
            self.name = name
            self.arguments = arguments

    class _FakeTc:
        def __init__(self, d):
            self.function = _FakeFn(d["name"], d["arguments"])

    fake_tcs = [_FakeTc(d) for d in tool_calls_raw.values()]
    actions, state_fields = _parse_tool_calls(fake_tcs)

    # Fallback message
    if not full_text:
        if any(a["type"] == "create_transaction" for a in actions):
            full_text = "Transaction enregistrée avec succès. Voulez-vous préparer la Promesse d'Achat ?"
        elif any(a["type"] == "create_pa" for a in actions):
            full_text = "Promesse d'Achat enregistrée avec succès."
        elif any(a["type"] == "geocode_address" for a in actions):
            full_text = "Je vérifie l'adresse..."
        else:
            full_text = FALLBACK_MESSAGE

    yield {
        "type": "done",
        "message": full_text,
        "actions": actions,
        "state_fields": state_fields,
    }
