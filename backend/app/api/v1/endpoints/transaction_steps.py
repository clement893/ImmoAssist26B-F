"""
Transaction Steps Endpoints
Endpoints pour les étapes guidées (parcours acheteur/vendeur)
"""

from datetime import date, datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, RealEstateTransaction
from app.config.transaction_steps import BUYER_STEPS, VENDOR_STEPS

router = APIRouter(prefix="/transactions", tags=["transaction-steps"])


def _get_date(value: Any) -> Optional[str]:
    """Extrait une date ISO du champ transaction."""
    if value is None:
        return None
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, str):
        return value[:10] if len(value) >= 10 else value
    return None


def _compute_step_status(
    step: dict,
    completed_steps: list,
    completed_actions: list,
    transaction: RealEstateTransaction,
) -> str:
    """Calcule le statut d'une étape: completed, current, overdue, upcoming."""
    step_code = step["code"]
    actions = step.get("actions", [])

    # Toutes les actions requises complétées → completed
    required_codes = [a["code"] for a in actions if a.get("required", True)]
    all_required_done = all(c in (completed_actions or []) for c in required_codes)
    if all_required_done and required_codes:
        return "completed"

    # Au moins une action complétée ou étape marquée complète → current si pas tout fait
    any_done = any(a["code"] in (completed_actions or []) for a in actions)
    if step_code in (completed_steps or []) or any_done:
        return "current"

    # Étape précédente complétée → current
    steps_list = BUYER_STEPS + VENDOR_STEPS
    view_steps = [s for s in steps_list if s.get("view") == step.get("view")]
    idx = next((i for i, s in enumerate(view_steps) if s["code"] == step_code), -1)
    if idx > 0:
        prev_step = view_steps[idx - 1]
        prev_required = [a["code"] for a in prev_step.get("actions", []) if a.get("required", True)]
        prev_done = all(c in (completed_actions or []) for c in prev_required)
        if prev_done:
            return "current"

    # Première étape sans action complétée → current
    if idx == 0:
        return "current"

    return "upcoming"


def _build_steps_response(
    steps_config: list,
    transaction: RealEstateTransaction,
) -> list[dict]:
    """Construit la liste des étapes avec statuts et actions."""
    completed_steps = transaction.completed_steps or []
    completed_actions = transaction.completed_actions or []

    result = []
    for step in steps_config:
        actions_out = []
        for action in step.get("actions", []):
            code = action["code"]
            due_date = None
            due_date_field = action.get("due_date_field")
            if due_date_field:
                val = getattr(transaction, due_date_field, None)
                due_date = _get_date(val)

            actions_out.append({
                "code": code,
                "title": action["title"],
                "description": action.get("description", ""),
                "required": action.get("required", True),
                "completed": code in completed_actions,
                "due_date": due_date,
                "documents": action.get("documents", []),
                "lea_guidance": action.get("lea_guidance", ""),
            })

        status_val = _compute_step_status(
            step, completed_steps, completed_actions, transaction
        )

        completed_date = None
        if status_val == "completed":
            if step.get("completed_date_field"):
                completed_date = _get_date(
                    getattr(transaction, step["completed_date_field"], None)
                )
            if not completed_date and step["code"] == "preparation":
                completed_date = _get_date(transaction.created_at)
            if not completed_date and step["code"] == "submit_offer":
                completed_date = _get_date(transaction.promise_to_purchase_date)
            if not completed_date and step["code"] == "accept_offer":
                completed_date = _get_date(transaction.promise_acceptance_date)

        due_date = None
        for a in step.get("actions", []):
            df = a.get("due_date_field")
            if df:
                due_date = _get_date(getattr(transaction, df, None))
                break

        reminders = []
        for a in actions_out:
            if a["due_date"] and not a["completed"]:
                reminders.append({
                    "id": f"r-{a['code']}",
                    "type": "deadline",
                    "title": a["title"],
                    "due_date": a["due_date"],
                    "priority": "high" if a["required"] else "medium",
                })

        result.append({
            "code": step["code"],
            "title": step["title"],
            "description": step.get("description", ""),
            "status": status_val,
            "completed_date": completed_date,
            "due_date": due_date,
            "actions": actions_out,
            "reminders": reminders,
        })

    return result


def _compute_progress(transaction: RealEstateTransaction) -> int:
    """Calcule le pourcentage de progression global."""
    completed_actions = transaction.completed_actions or []
    all_actions = []
    for s in BUYER_STEPS + VENDOR_STEPS:
        for a in s.get("actions", []):
            if a.get("required", True):
                all_actions.append(a["code"])
    # Dédupliquer (certains codes peuvent être dans les deux vues)
    unique = list(dict.fromkeys(all_actions))
    if not unique:
        return 0
    done = sum(1 for c in unique if c in completed_actions)
    return min(100, int(100 * done / len(unique)))


@router.get("/{transaction_id}/steps")
async def get_transaction_steps(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Récupère les étapes, actions et rappels pour une transaction.
    Retourne les parcours acheteur et vendeur.
    """
    result = await db.execute(
        select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable",
        )

    buyers = transaction.buyers or []
    sellers = transaction.sellers or []
    buyer_name = buyers[0].get("name", "-") if buyers else "-"
    seller_name = sellers[0].get("name", "-") if sellers else "-"

    address_parts = [
        transaction.property_address or "",
        transaction.property_city or "",
        transaction.property_postal_code or "",
    ]
    address = ", ".join(p for p in address_parts if p).strip() or "-"

    price = None
    if transaction.final_sale_price is not None:
        price = float(transaction.final_sale_price)
    elif transaction.offered_price is not None:
        price = float(transaction.offered_price)
    elif transaction.listing_price is not None:
        price = float(transaction.listing_price)

    progress = _compute_progress(transaction)

    tx_data = {
        "id": transaction.id,
        "name": transaction.name or f"Transaction #{transaction.id}",
        "address": address,
        "price": price,
        "buyer": buyer_name,
        "seller": seller_name,
        "status": transaction.status or "En cours",
        "progress": progress,
    }

    buyer_steps = _build_steps_response(BUYER_STEPS, transaction)
    vendor_steps = _build_steps_response(VENDOR_STEPS, transaction)

    return {
        "transaction": tx_data,
        "buyer_steps": buyer_steps,
        "vendor_steps": vendor_steps,
    }


class CompleteActionRequest(BaseModel):
    completed: bool = True


@router.post("/{transaction_id}/step-actions/{action_code}/complete")
async def complete_step_action(
    transaction_id: int,
    action_code: str,
    data: CompleteActionRequest = CompleteActionRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Marque ou démarque une action d'étape comme complétée.
    """
    result = await db.execute(
        select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable",
        )

    completed_actions = list(transaction.completed_actions or [])

    if data.completed:
        if action_code not in completed_actions:
            completed_actions.append(action_code)
    else:
        if action_code in completed_actions:
            completed_actions.remove(action_code)

    transaction.completed_actions = completed_actions
    await db.commit()
    await db.refresh(transaction)

    return {
        "success": True,
        "action_code": action_code,
        "completed": data.completed,
        "completed_actions": completed_actions,
    }


class CompleteStepRequest(BaseModel):
    completed: bool = True


@router.post("/{transaction_id}/steps/{step_code}/complete")
async def complete_step(
    transaction_id: int,
    step_code: str,
    data: CompleteStepRequest = CompleteStepRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Marque ou démarque une étape complète comme complétée.
    """
    result = await db.execute(
        select(RealEstateTransaction).where(
            and_(
                RealEstateTransaction.id == transaction_id,
                RealEstateTransaction.user_id == current_user.id,
            )
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable",
        )

    completed_steps = list(transaction.completed_steps or [])

    if data.completed:
        if step_code not in completed_steps:
            completed_steps.append(step_code)
    else:
        if step_code in completed_steps:
            completed_steps.remove(step_code)

    transaction.completed_steps = completed_steps
    await db.commit()
    await db.refresh(transaction)

    return {
        "success": True,
        "step_code": step_code,
        "completed": data.completed,
        "completed_steps": completed_steps,
    }
