"""Transactions router - list and detail avec progression (Transaction / Promesse d'achat)."""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Transaction, PromesseAchat

router = APIRouter()

TX_FIELDS = frozenset({
    "property_address", "sellers", "buyers", "offered_price", "transaction_type",
})

# Champs PA utilisés pour le calcul de progression (aligné avec state.py)
PA_FIELD_COLS = [
    "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
    "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
    "description_immeuble", "acompte", "date_acompte", "delai_remise_depot",
    "mode_paiement", "montant_hypotheque", "delai_financement",
    "date_acte_vente", "condition_inspection", "date_limite_inspection",
    "condition_documents", "inclusions", "exclusions", "autres_conditions",
    "delai_acceptation",
]


def _tx_progress(tx: Transaction) -> dict:
    """Compute Transaction (5 champs) progress from DB model."""
    filled = 0
    fields = {}
    for k in TX_FIELDS:
        v = getattr(tx, k, None)
        fields[k] = v
        if v is not None and v != [] and v != "":
            filled += 1
    return {"filled": filled, "total": 5, "fields": fields}


def _pa_progress(pa: PromesseAchat) -> dict:
    """Compute PA (21 champs) progress from DB model."""
    filled = 0
    fields = {}
    for k in PA_FIELD_COLS:
        v = getattr(pa, k, None)
        fields[k] = v
        if v is not None and v != [] and v != "":
            filled += 1
    return {"filled": filled, "total": len(PA_FIELD_COLS), "fields": fields}


def _row_to_tx_summary(tx: Transaction, pa_count: int = 0) -> dict:
    """Convert Transaction to summary dict for list view."""
    sellers = tx.sellers or []
    buyers = tx.buyers or []
    seller_names = [s.get("name", s) if isinstance(s, dict) else str(s) for s in sellers][:2]
    buyer_names = [b.get("name", b) if isinstance(b, dict) else str(b) for b in buyers][:2]
    return {
        "id": tx.id,
        "property_address": tx.property_address,
        "sellers": seller_names,
        "buyers": buyer_names,
        "offered_price": tx.offered_price,
        "transaction_type": tx.transaction_type or "vente",
        "status": tx.status,
        "created_at": tx.created_at.isoformat() if tx.created_at else None,
        "updated_at": tx.updated_at.isoformat() if tx.updated_at else None,
        "has_pa": pa_count > 0,
    }


@router.get("/transactions")
async def list_transactions(
    transaction_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Liste des transactions immobilières.
    transaction_type: 'achat' | 'vente' (optionnel).
    """
    q = select(Transaction)
    if transaction_type:
        k = str(transaction_type).strip().lower()
        if k == "achat":
            q = q.where(Transaction.transaction_type == "achat")
        elif k == "vente":
            # vente ou null (défaut)
            q = q.where(or_(Transaction.transaction_type == "vente", Transaction.transaction_type.is_(None)))

    q = q.order_by(Transaction.updated_at.desc().nullslast(), Transaction.id.desc())
    result = await db.execute(q)
    rows = result.scalars().all()

    # Compter les PA par transaction
    pa_counts = {}
    if rows:
        pa_res = await db.execute(
            select(PromesseAchat.transaction_id, func.count().label("c"))
            .where(PromesseAchat.transaction_id.in_([r.id for r in rows]))
            .group_by(PromesseAchat.transaction_id)
        )
        for r in pa_res:
            pa_counts[r.transaction_id] = r.c

    transactions = [_row_to_tx_summary(tx, pa_counts.get(tx.id, 0)) for tx in rows]
    return {"transactions": transactions}


@router.get("/transactions/{transaction_id}")
async def get_transaction_detail(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Détail d'une transaction avec progression (Transaction 5 champs + Promesse d'achat 21 champs).
    Indique l'étape actuelle : Transaction ou Promesse d'achat.
    """
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    # PA liée (la plus récente si plusieurs)
    pa_result = await db.execute(
        select(PromesseAchat)
        .where(PromesseAchat.transaction_id == transaction_id)
        .order_by(PromesseAchat.updated_at.desc().nullslast())
        .limit(1)
    )
    pa = pa_result.scalar_one_or_none()

    tx_progress = _tx_progress(tx)
    pa_progress = _pa_progress(pa) if pa else {"filled": 0, "total": len(PA_FIELD_COLS), "fields": {}}

    # Étape actuelle
    if pa and pa_progress["filled"] > 0:
        etape = "promesse_achat"
        etape_label = "Promesse d'achat"
    else:
        etape = "transaction"
        etape_label = "Transaction (5 champs)"

    return {
        "id": tx.id,
        "property_address": tx.property_address,
        "sellers": tx.sellers or [],
        "buyers": tx.buyers or [],
        "offered_price": tx.offered_price,
        "transaction_type": tx.transaction_type or "vente",
        "status": tx.status,
        "created_at": tx.created_at.isoformat() if tx.created_at else None,
        "updated_at": tx.updated_at.isoformat() if tx.updated_at else None,
        "conversation_id": tx.conversation_id,
        "etape": etape,
        "etape_label": etape_label,
        "transaction_progress": tx_progress,
        "promesse_achat_progress": pa_progress,
        "promesse_achat_id": pa.id if pa else None,
    }
