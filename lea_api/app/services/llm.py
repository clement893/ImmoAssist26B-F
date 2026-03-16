"""LLM service - OpenAI API calls with structured JSON response."""

import json
import re
from pathlib import Path

from app.config import get_settings
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    AsyncOpenAI = None

# Paths
APP_DIR = Path(__file__).parent.parent
FULL_PROMPT_PATH = APP_DIR.parent / "docs" / "lea_courtier_assistant.md"

# Message générique si erreur ou fuite JSON — jamais exposer de technique au courtier
FALLBACK_MESSAGE = "Désolé, une erreur s'est produite. Pouvez-vous réessayer ?"

RESPONSE_FORMAT = """

## Format de réponse obligatoire

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{"message": "Texte en français pour le courtier", "actions": [], "state_updates": {"active_domain": null, "awaiting_field": null, "fields": {}}}

RÈGLES: message = texte naturel. actions = geocode_address, create_transaction, create_pa.
Types: condition_inspection/documents = true/false. dates = YYYY-MM-DD. "pas besoin" → autres_conditions.
"""


def _sanitize_message(msg: str) -> str:
    """Retire tout contenu technique qui aurait fuité. Retourne message safe ou fallback."""
    if not msg or not isinstance(msg, str):
        return FALLBACK_MESSAGE
    s = msg.strip()
    if not s:
        return FALLBACK_MESSAGE
    # Message ressemble à du JSON (objet brut ou structure technique)
    if s.startswith("{") or '"state_updates"' in s or ',"actions":' in s or '"actions": [' in s:
        return FALLBACK_MESSAGE
    # Retirer blocs ``` 
    s = re.sub(r"\s*```[\s\S]*?```\s*", "", s)
    s = s.strip()
    return s or FALLBACK_MESSAGE


def _load_system_prompt() -> str:
    base = ""
    if FULL_PROMPT_PATH.exists():
        base = FULL_PROMPT_PATH.read_text(encoding="utf-8")
    return base + RESPONSE_FORMAT


async def call_llm(user_message: str, state: dict, user: dict | None = None, last_turn: list | None = None) -> dict:
    """
    Call OpenAI API and return parsed JSON with message, actions, state_updates.
    Falls back to plain text if JSON parsing fails.
    """
    if not OPENAI_AVAILABLE:
        return {
            "message": "⚠️ OpenAI n'est pas installé. pip install openai",
            "actions": [],
            "state_updates": {},
        }

    settings = get_settings()
    if not settings.openai_api_key:
        return {
            "message": "⚠️ OPENAI_API_KEY manquant. Définissez-la dans .env",
            "actions": [],
            "state_updates": {},
        }

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    system = _load_system_prompt()

    draft = {
        "transaction": state.get("transaction", {}),
        "promesse_achat": state.get("promesse_achat", {}),
        "active_domain": state.get("active_domain"),
        "awaiting_field": state.get("awaiting_field"),
        "address_candidates": state.get("address_candidates"),
    }
    state_context = f"""
## Draft actuel (source de vérité)
{json.dumps(draft, ensure_ascii=False)}

TU INTERPRÈTES LE MESSAGE ET DÉCIDES LES ACTIONS. Le courtier peut s'exprimer de mille façons : "oui", "je confirme", "absolument", "bien sûr", "sounds good", "go", "c'est parfait", etc. Interprète l'intention, pas les mots exacts.
À CHAQUE message: extrais les entités mentionnées → state_updates.fields.
Quand les 5 champs TX sont remplis ET le courtier exprime une confirmation/accord (sous toute forme) → actions: [create_transaction].
Transaction créée + courtier exprime vouloir la PA → create_pa avec données TX.
Types: booléens true/false, dates YYYY-MM-DD.
"""
    # Dernier échange en messages pour que le LLM comprenne le contexte
    conv_messages = []
    if last_turn:
        for m in last_turn[-4:]:
            role = m.get("role", "")
            content = (m.get("content") or "").strip()
            if role in ("user", "assistant") and content:
                conv_messages.append({"role": role, "content": content[:500]})
    messages = [
        {"role": "system", "content": system + state_context},
        *conv_messages,
        {"role": "user", "content": user_message},
    ]

    try:
        response = await client.chat.completions.create(
            model=settings.llm_model,
            max_tokens=1200,
            messages=messages,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        if not raw:
            raw = "Pas de réponse."
    except Exception as e:
        return {
            "message": f"❌ Erreur LLM: {str(e)}",
            "actions": [],
            "state_updates": {},
        }

    try:
        clean = re.sub(r"```json|```", "", raw).strip()
        parsed = json.loads(clean)
        msg = parsed.get("message", "")
        parsed["message"] = _sanitize_message(msg) if msg else FALLBACK_MESSAGE
        return parsed
    except json.JSONDecodeError:
        return {
            "message": FALLBACK_MESSAGE,
            "actions": [],
            "state_updates": {},
        }
