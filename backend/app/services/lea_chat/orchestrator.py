"""
Orchestrateur Léa : point d'entrée pour l'exécution des actions.
Phase 1 : délègue à run_lea_actions pour comportement identique.
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RealEstateTransaction


async def run(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    session_id: Optional[str] = None,
) -> tuple[list, Optional[RealEstateTransaction]]:
    """
    Exécute les actions Léa (création transaction, mise à jour adresse, promesse d'achat).
    Retourne (liste de lignes pour « Action effectuée », transaction créée si création).
    Phase 1 : délègue à run_lea_actions pour préserver le comportement.
    """
    from app.api.v1.endpoints.lea import run_lea_actions

    return await run_lea_actions(
        db,
        user_id,
        message,
        last_assistant_message=last_assistant_message,
        session_id=session_id,
    )
