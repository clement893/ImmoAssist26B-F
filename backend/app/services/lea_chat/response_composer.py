"""
Response composer Léa : prépare le contexte (system_prompt, user_context, action_lines, knowledge).
N'appelle pas le LLM — l'endpoint effectue l'appel final.
"""

from typing import List, Optional, Tuple


def build_context(
    user_context: str,
    action_lines: List[str],
    knowledge: Optional[str] = None,
) -> Tuple[str, str, List[str]]:
    """
    Prépare le contexte pour l'appel LLM.
    Retourne (system_prompt, user_context, action_lines).
    """
    system_prompt = ""
    if knowledge:
        system_prompt += f"\n\n{knowledge}"
    return (system_prompt, user_context, action_lines)
