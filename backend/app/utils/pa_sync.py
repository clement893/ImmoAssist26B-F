"""
Synchronisation des données du formulaire PA (Promesse d'achat) vers la transaction.
Utilisé à la sauvegarde du formulaire (API) et lors du remplissage par Léa.
Référence: https://www.oaciq.com/media/m5seimcc/promesse-achat-immeuble-pag.pdf
"""
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.real_estate_transaction import RealEstateTransaction


def sync_pa_data_to_transaction(transaction: "RealEstateTransaction", data: dict[str, Any]) -> None:
    """
    Synchronise les champs du formulaire PA (data) vers la transaction
    pour que le bloc « Promesse d'achat (PA) » sur la fiche transaction soit à jour.
    """
    if not data or not isinstance(data, dict):
        return
    # Prix offert
    v = data.get("prix_offert")
    if v is not None and (isinstance(v, (int, float)) or (isinstance(v, str) and str(v).strip())):
        try:
            transaction.offered_price = float(v) if not isinstance(v, (int, float)) else (float(v) if isinstance(v, float) else int(v))
        except (ValueError, TypeError):
            pass
    # Acompte
    v = data.get("acompte")
    if v is not None and (isinstance(v, (int, float)) or (isinstance(v, str) and str(v).strip())):
        try:
            transaction.deposit_amount = float(v) if not isinstance(v, (int, float)) else (float(v) if isinstance(v, float) else int(v))
        except (ValueError, TypeError):
            pass
    # Date limite inspection → Limite inspection
    v = data.get("date_limite_inspection")
    if v:
        if isinstance(v, date):
            transaction.inspection_deadline = v
        elif isinstance(v, str) and len(v) >= 10:
            try:
                transaction.inspection_deadline = datetime.strptime(v[:10], "%Y-%m-%d").date()
            except ValueError:
                pass
    # Date acte de vente → Date clôture prévue
    v = data.get("date_acte_vente")
    if v:
        if isinstance(v, date):
            transaction.expected_closing_date = v
        elif isinstance(v, str) and len(v) >= 10:
            try:
                transaction.expected_closing_date = datetime.strptime(v[:10], "%Y-%m-%d").date()
            except ValueError:
                pass
    # Délai financement (jours) → Limite financement = date promesse + jours
    v = data.get("delai_financement")
    if v is not None and transaction.promise_to_purchase_date:
        try:
            days = int(v) if isinstance(v, (int, float)) else int(float(v))
            if days >= 0:
                transaction.financing_deadline = transaction.promise_to_purchase_date + timedelta(days=days)
        except (ValueError, TypeError):
            pass
    # Date limite financement explicite (si champ présent dans le formulaire)
    v = data.get("date_limite_financement")
    if v:
        if isinstance(v, date):
            transaction.financing_deadline = v
        elif isinstance(v, str) and len(v) >= 10:
            try:
                transaction.financing_deadline = datetime.strptime(v[:10], "%Y-%m-%d").date()
            except ValueError:
                pass
    # Date de prise de possession (champ PA date_occupation)
    v = data.get("date_occupation")
    if v:
        if isinstance(v, date):
            transaction.possession_date = v
        elif isinstance(v, str) and len(v) >= 10:
            try:
                transaction.possession_date = datetime.strptime(v[:10], "%Y-%m-%d").date()
            except ValueError:
                pass
