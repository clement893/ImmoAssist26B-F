"""Execute Léa actions: create_transaction, create_pa."""

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Transaction, PromesseAchat, User
from app.services.geocode import looks_partial

# Champs PA de type Date — JSON → date object pour la BD
PA_DATE_FIELDS = {"date_acompte", "date_acte_vente", "date_limite_inspection"}
PA_BOOLEAN_FIELDS = {"condition_inspection", "condition_documents"}


def _parse_date(v) -> date | None:
    """Parse string ISO ou 'JJ mois' en date. Retourne None si invalide."""
    if v is None or isinstance(v, date):
        return v
    s = str(v).strip()
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])  # "2023-05-20" ou "2023-05-20T..."
    except (ValueError, TypeError):
        pass
    # "20 mai" "25 juin" — fallback: garder string (certains champs pourraient accepter)
    return None


async def execute_action(
    action: dict,
    state: dict,
    user: dict,
    db: AsyncSession,
) -> dict:
    """
    Execute a single action. Returns { id, status } for create_* actions.
    """
    if not isinstance(action, dict):
        return {"status": "skipped", "reason": "invalid_action"}
    action_type = action.get("type")
    payload = action.get("payload", {})

    if action_type == "create_transaction":
        tx_fields = state.get("transaction", {}).get("fields", {})
        prop_addr = payload.get("property_address") or tx_fields.get("property_address")
        if not prop_addr or looks_partial(str(prop_addr)):
            return {
                "status": "rejected",
                "reason": "validation_error",
                "message": "L'adresse est incomplète ou n'a pas été confirmée. Pouvez-vous la préciser ou confirmer le géocodage ?",
            }
        # Validation types
        invalid = []
        sellers = payload.get("sellers") if payload.get("sellers") is not None else tx_fields.get("sellers") or []
        buyers = payload.get("buyers") if payload.get("buyers") is not None else tx_fields.get("buyers") or []
        if not isinstance(sellers, list):
            invalid.append("sellers (attendu: liste de noms)")
        if not isinstance(buyers, list):
            invalid.append("buyers (attendu: liste de noms)")
        price = payload.get("offered_price") if payload.get("offered_price") is not None else tx_fields.get("offered_price")
        if price is not None and not isinstance(price, (int, float)):
            invalid.append("offered_price (attendu: nombre)")
        if invalid:
            return {
                "status": "rejected",
                "reason": "validation_error",
                "message": "Certains champs de la transaction ont un format incorrect. Pourriez-vous les préciser ?\n\n" + "\n".join(f"• {x}" for x in invalid),
                "invalid_fields": invalid,
            }
        tx = Transaction(
            user_id=user.get("id", 1),
            conversation_id=state.get("conversation_id"),
            property_address=prop_addr,
            sellers=sellers,
            buyers=buyers,
            offered_price=float(price) if price is not None else None,
            transaction_type=payload.get("transaction_type") or tx_fields.get("transaction_type"),
        )
        db.add(tx)
        await db.flush()
        await db.refresh(tx)
        return {"id": tx.id, "status": "created"}

    if action_type == "create_pa":
        tx_fields = state.get("transaction", {}).get("fields", {})
        pa_fields = state.get("promesse_achat", {}).get("fields", {})
        merged = {k: v for k, v in pa_fields.items() if v is not None and v != [] and v != ""}
        merged.update({k: v for k, v in payload.items() if v is not None})

        # Validation : en cas de mismatch, ne pas créer — discuter avec le courtier
        invalid = []
        # Booléens : doivent être true/false, pas "oui"/"non"
        for k in PA_BOOLEAN_FIELDS:
            if k in merged:
                v = merged[k]
                if not isinstance(v, bool):
                    invalid.append(f"{k} (attendu: true ou false, pas « oui »/« non »)")
        # Dates : doivent être parsables en date
        for k in PA_DATE_FIELDS:
            if k in merged and _parse_date(merged[k]) is None:
                invalid.append(f"{k} (format attendu: AAAA-MM-JJ, ex. 2025-05-20)")
        if invalid:
            return {
                "status": "rejected",
                "reason": "validation_error",
                "message": (
                    "Certains champs ont un format incorrect. Pourriez-vous les préciser ?\n\n"
                    + "\n".join(f"• {x}" for x in invalid)
                ),
                "invalid_fields": invalid,
            }

        # Convertir les dates pour la BD
        for k in PA_DATE_FIELDS:
            if k in merged:
                merged[k] = _parse_date(merged[k])
        pa_data = {
            "transaction_id": state.get("transaction", {}).get("id"),
            "user_id": user.get("id", 1),
            "acheteurs": tx_fields.get("buyers", []),
            "vendeurs": tx_fields.get("sellers", []),
            "property_address": tx_fields.get("property_address"),
            "prix_offert": tx_fields.get("offered_price"),
            "prix_achat": tx_fields.get("offered_price"),
            **merged,
        }
        if tx_fields.get("transaction_type") == "vente":
            pa_data["courtier_vendeur_nom"] = user.get("full_name", "Courtier")
            pa_data["courtier_vendeur_permis"] = user.get("permis_number", "")
        else:
            pa_data["courtier_acheteur_nom"] = user.get("full_name", "Courtier")
            pa_data["courtier_acheteur_permis"] = user.get("permis_number", "")

        pa = PromesseAchat(**pa_data)
        db.add(pa)
        await db.flush()
        await db.refresh(pa)
        return {"id": pa.id, "status": "created"}

    return {"status": "no_action"}
