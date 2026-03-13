"""
Response composer Léa : prépare le contexte (system_prompt, user_context, action_lines).
Enrichit avec LEA_SYSTEM_PROMPT et la base de connaissance. N'appelle pas le LLM.
"""

from typing import List, Optional, Tuple

from app.services.lea_chat.prompts import LEA_SYSTEM_PROMPT


def build_context(
    user_context: str,
    action_lines: List[str],
    knowledge: Optional[str] = None,
) -> Tuple[str, str, List[str]]:
    """
    Prépare le contexte pour l'appel LLM final.
    Retourne (system_prompt, user_context, action_lines).
    - system_prompt : base de connaissance + LEA_SYSTEM_PROMPT + infos utilisateur + action effectuée
    - user_context : données plateforme (inchangé, peut déjà inclure action_lines)
    - action_lines : liste des actions (pour le frontend)
    """
    system_prompt = ""
    if knowledge and knowledge.strip():
        system_prompt += "--- Base de connaissance Léa (instructions, formulaires OACIQ, documents) ---\n"
        system_prompt += knowledge.strip() + "\n\n"
    system_prompt += "--- Règles système ---\n" + LEA_SYSTEM_PROMPT
    if user_context and user_context.strip():
        system_prompt += "\n\n--- Informations actuelles de l'utilisateur (plateforme) + Action effectuée ---\n"
        system_prompt += user_context.strip()
    return (system_prompt, user_context, action_lines)
