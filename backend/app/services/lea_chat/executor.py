"""
Executor Léa : exécute les actions selon la décision du routeur.
Point d'injection pour éviter la dépendance circulaire lea_chat <-> lea.
Pour l'instant délègue à run_lea_actions (lea.py) avec router_decision en override.
"""

from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RealEstateTransaction


async def execute_actions(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str],
    session_id: Optional[str],
    router_decision: Optional[dict[str, Any]] = None,
) -> tuple[list, Optional[RealEstateTransaction]]:
    """
    Exécute les actions Léa (création transaction, PA, remplissage, etc.).
    router_decision : décision du routeur (intent, signals, entities...) ; si fournie,
    run_lea_actions l'utilise au lieu de faire son propre routage.
    """
    from app.api.v1.endpoints.lea import run_lea_actions

    return await run_lea_actions(
        db,
        user_id,
        message,
        last_assistant_message=last_assistant_message,
        session_id=session_id,
        router_decision_override=router_decision,
    )
