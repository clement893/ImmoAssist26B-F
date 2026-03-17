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

APP_DIR = Path(__file__).parent.parent
FULL_PROMPT_PATH = APP_DIR.parent / "docs" / "lea_courtier_assistant.md"

FALLBACK_MESSAGE = "Désolé, une erreur s'est produite. Pouvez-vous réessayer ?"

# Cache du prompt — chargé une seule fois au démarrage
_SYSTEM_PROMPT_CACHE: str | None = None

# Champs obligatoires — utilisés pour calculer ce qui manque et l'injecter dans le contexte
TX_REQUIRED = ["property_address", "sellers", "buyers", "offered_price", "transaction_type"]

PA_REQUIRED = [
    "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
    "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
    "description_immeuble", "acompte", "date_acompte", "delai_remise_depot",
    "mode_paiement", "delai_financement", "date_acte_vente",
    "condition_inspection", "condition_documents",
    "inclusions", "exclusions", "delai_acceptation",
]

# Format de réponse — injecté à la fin du prompt
RESPONSE_FORMAT = """

## Format de réponse obligatoire

Réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown :
{"message": "texte conversationnel en français", "actions": [], "state_updates": {"active_domain": null, "awaiting_field": null, "fields": {}}}

- message = texte naturel parlé, jamais de markdown ni bullet points, max 2-3 phrases
- Une seule question à la fois
- actions = geocode_address | create_transaction | create_pa
- Dates = YYYY-MM-DD, booléens = true/false
- inclusions = toujours un tableau JSON ["item1", "item2"]
- delai_acceptation = valeur exacte ("24 heures"), jamais "aucune"
"""


def _get_missing_fields(state: dict) -> tuple[list, list]:
    """Calcule les champs manquants TX et PA depuis le draft."""
    tx_fields = state.get("transaction", {}).get("fields", {})
    pa_fields = state.get("promesse_achat", {}).get("fields", {})

    def _filled(v) -> bool:
        if v is None or v == "" or v == []:
            return False
        if isinstance(v, bool):
            return True  # false est une valeur valide
        return True

    tx_missing = [k for k in TX_REQUIRED if not _filled(tx_fields.get(k))]
    pa_missing = [k for k in PA_REQUIRED if not _filled(pa_fields.get(k))]

    # montant_hypotheque obligatoire si mode_paiement = hypothèque
    mode = str(pa_fields.get("mode_paiement", "")).lower()
    if "hypothèque" in mode or "hypotheque" in mode:
        if not _filled(pa_fields.get("montant_hypotheque")):
            if "montant_hypotheque" not in pa_missing:
                pa_missing.append("montant_hypotheque")

    # date_limite_inspection obligatoire si condition_inspection = true
    if pa_fields.get("condition_inspection") is True:
        if not _filled(pa_fields.get("date_limite_inspection")):
            if "date_limite_inspection" not in pa_missing:
                pa_missing.append("date_limite_inspection")

    return tx_missing, pa_missing


def _sanitize_message(msg: str) -> str:
    """Retire tout contenu technique qui aurait fuité dans le message."""
    if not msg or not isinstance(msg, str):
        return FALLBACK_MESSAGE
    s = msg.strip()
    if not s:
        return FALLBACK_MESSAGE
    if s.startswith("{") or '"state_updates"' in s or ',"actions":' in s or '"actions": [' in s:
        return FALLBACK_MESSAGE
    s = re.sub(r"\s*```[\s\S]*?```\s*", "", s)
    return s.strip() or FALLBACK_MESSAGE


def _load_system_prompt() -> str:
    """Charge le .md une seule fois (cache). Toutes les règles métier sont dans le .md."""
    global _SYSTEM_PROMPT_CACHE
    if _SYSTEM_PROMPT_CACHE is None:
        base = ""
        if FULL_PROMPT_PATH.exists():
            base = FULL_PROMPT_PATH.read_text(encoding="utf-8")
        _SYSTEM_PROMPT_CACHE = base + RESPONSE_FORMAT
    return _SYSTEM_PROMPT_CACHE


def reset_prompt_cache() -> None:
    """Vider le cache si lea_courtier_assistant.md est modifié."""
    global _SYSTEM_PROMPT_CACHE
    _SYSTEM_PROMPT_CACHE = None


async def call_llm(
    user_message: str,
    state: dict,
    user: dict | None = None,
    last_turn: list | None = None,
) -> dict:
    """Appel OpenAI et retourne JSON parsé : message, actions, state_updates."""
    if not OPENAI_AVAILABLE:
        return {"message": "OpenAI n'est pas installé. pip install openai", "actions": [], "state_updates": {}}

    settings = get_settings()
    if not settings.openai_api_key:
        return {"message": "OPENAI_API_KEY manquant dans .env", "actions": [], "state_updates": {}}

    # Calculer les champs manquants — injectés dans le contexte pour aider le LLM
    tx_missing, pa_missing = _get_missing_fields(state)

    draft = {
        "transaction": state.get("transaction", {}),
        "promesse_achat": state.get("promesse_achat", {}),
        "active_domain": state.get("active_domain"),
        "awaiting_field": state.get("awaiting_field"),
    }

    # Contexte dynamique injecté à chaque appel (draft + champs manquants)
    # Les règles métier sont dans le .md — ici seulement l'état courant

    # Vérifier si une adresse partielle est présente et non encore géocodée
    tx_fields_current = state.get("transaction", {}).get("fields", {})
    addr_confirmed = bool(tx_fields_current.get("property_address"))
    tx_status = state.get("transaction", {}).get("status")
    needs_geocode = not addr_confirmed and tx_status != "created"

    state_context = f"""
## État actuel de la conversation

### Draft
{json.dumps(draft, ensure_ascii=False)}

### Champs manquants
- Transaction : {tx_missing if tx_missing else "AUCUN — transaction complète"}
- Promesse d'Achat : {pa_missing if pa_missing else "AUCUN — PA complète"}

### PRIORITÉ ABSOLUE — GÉOCODAGE
{"⚠️ L'adresse n'est PAS encore confirmée. Si le message contient un numéro civique + rue → inclure geocode_address EN PREMIER dans actions, AVANT de poser d'autres questions. Ne jamais demander d'autres champs tant que l'adresse n'est pas géocodée et confirmée." if needs_geocode else "✅ Adresse déjà confirmée — NE PAS re-géocoder."}

### Courtier connecté
- Nom : {(user or {}).get('full_name', 'Courtier')}
- Permis : {(user or {}).get('permis_number', 'N/A')}

### Rappel extraction transaction_type
Si le message contient "achat" → transaction_type = "achat" dans state_updates.fields
Si le message contient "vente" → transaction_type = "vente" dans state_updates.fields
"""

    full_system = _load_system_prompt() + "\n\n" + state_context

    # Historique — max 6 derniers tours
    history = last_turn or state.get("history", [])
    conv_messages = []
    for m in history[-6:]:
        role = m.get("role", "")
        content = (m.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            limit = 1200 if role == "user" else 400
            conv_messages.append({"role": role, "content": content[:limit]})
    conv_messages.append({"role": "user", "content": user_message})

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model=settings.llm_model,
            max_tokens=1024,
            messages=[{"role": "system", "content": full_system}] + conv_messages,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
    except Exception as e:
        return {"message": f"Erreur IA : {str(e)}", "actions": [], "state_updates": {}}

    try:
        clean = re.sub(r"```json|```", "", raw).strip()
        parsed = json.loads(clean)
        parsed["message"] = _sanitize_message(parsed.get("message", "")) or FALLBACK_MESSAGE
        return parsed
    except json.JSONDecodeError:
        return {"message": _sanitize_message(raw), "actions": [], "state_updates": {}}
