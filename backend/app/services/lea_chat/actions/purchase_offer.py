"""
Actions purchase_offer : création PA, remplissage PA, extraction LLM.
"""

import json
from typing import List, Tuple

from app.core.logging import logger
from app.services.ai_service import AIService, AIProvider


async def extract_pa_fields_llm(
    message: str, field_descriptions: List[Tuple[str, str, str]]
) -> dict:
    """Extrait des champs PA depuis le message utilisateur via LLM.
    Retourne un dict field_id -> value.
    En cas d'erreur (timeout, JSON invalide, pas de clé API), retourne {} pour ne jamais bloquer."""
    if not message or not field_descriptions:
        return {}
    lines = [f"- {fid}: {label} (type: {ftype})" for fid, label, ftype in field_descriptions]
    field_list = "\n".join(lines)
    system_prompt = (
        "Tu es un assistant qui extrait des données d'un message utilisateur pour un formulaire "
        "de promesse d'achat (Québec). Retourne UNIQUEMENT un objet JSON valide, sans texte avant ou après. "
        "Clés = identifiants de champs exactement comme listés ci-dessous. Valeurs = données extraites. "
        "Types : string pour texte, number pour montants et délais en jours, date en YYYY-MM-DD, "
        "datetime en YYYY-MM-DDTHH:MM. N'inclure que les champs pour lesquels tu as trouvé une valeur claire."
    )
    user_content = f"Champs à extraire (id: label, type):\n{field_list}\n\nMessage utilisateur:\n{message}"
    try:
        ai = AIService(provider=AIProvider.AUTO)
        resp = await ai.chat_completion(
            [{"role": "user", "content": user_content}],
            system_prompt=system_prompt,
            temperature=0.1,
            max_tokens=2000,
        )
        content = (resp.get("content") or "").strip()
        if not content:
            return {}
        start = content.find("{")
        end = content.rfind("}") + 1
        if start < 0 or end <= start:
            return {}
        content = content[start:end]
        out = json.loads(content)
        return out if isinstance(out, dict) else {}
    except Exception as e:
        logger.debug(f"LLM PA extraction failed (non-blocking): {e}")
        return {}
