"""Execute Léa actions: create_transaction, create_pa."""

from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Transaction, PromesseAchat

PA_DATE_FIELDS = {"date_acompte", "date_acte_vente", "date_limite_inspection"}
PA_BOOLEAN_FIELDS = {"condition_inspection", "condition_documents"}


def _parse_date(v) -> date | None:
    if v is None or isinstance(v, date):
        return v
    s = str(v).strip()
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except (ValueError, TypeError):
        return None


async def execute_action(
    action: dict,
    state: dict,
    user: dict,
    db: AsyncSession,
) -> dict:
    if not isinstance(action, dict):
        return {"status": "skipped", "reason": "invalid_action"}

    action_type = action.get("type")
    payload = action.get("payload") or {}

    # ------------------------------------------------------------------ #
    # create_transaction
    # ------------------------------------------------------------------ #
    if action_type == "create_transaction":
        tx_fields = state.get("transaction", {}).get("fields", {})

        # Merge payload over state fields
        prop_addr = payload.get("property_address") or tx_fields.get("property_address")
        sellers   = payload.get("sellers")   if payload.get("sellers")   is not None else tx_fields.get("sellers") or []
        buyers    = payload.get("buyers")    if payload.get("buyers")    is not None else tx_fields.get("buyers") or []
        price     = payload.get("offered_price") if payload.get("offered_price") is not None else tx_fields.get("offered_price")
        tx_type   = payload.get("transaction_type") or tx_fields.get("transaction_type")

        if not prop_addr:
            return {
                "status": "rejected",
                "reason": "validation_error",
                "message": "L'adresse de la propriété est manquante. Pouvez-vous la fournir ?",
            }

        invalid = []
        if not isinstance(sellers, list):
            invalid.append("sellers (attendu: liste de noms)")
        if not isinstance(buyers, list):
            invalid.append("buyers (attendu: liste de noms)")
        if price is not None and not isinstance(price, (int, float)):
            invalid.append("offered_price (attendu: nombre)")
        if invalid:
            return {
                "status": "rejected",
                "reason": "validation_error",
                "message": "Certains champs ont un format incorrect : " + ", ".join(invalid),
                "invalid_fields": invalid,
            }

        tx = Transaction(
            user_id=user.get("id", 1),
            conversation_id=state.get("conversation_id"),
            property_address=prop_addr,
            sellers=sellers,
            buyers=buyers,
            offered_price=float(price) if price is not None else None,
            transaction_type=tx_type,
        )
        db.add(tx)
        try:
            await db.flush()
            await db.refresh(tx)
            tx_id = tx.id
            await db.commit()
            print(f"DEBUG TX CREATED: id={tx_id}")
            return {"id": tx_id, "status": "created"}
        except Exception as e:
            await db.rollback()
            print(f"DEBUG TX ERROR: {type(e).__name__}: {e}")
            return {"status": "rejected", "reason": "db_error", "message": f"Erreur BD: {e}"}

    # ------------------------------------------------------------------ #
    # create_pa
    # ------------------------------------------------------------------ #
    if action_type == "create_pa":
        tx_fields = state.get("transaction", {}).get("fields", {})
        pa_state_fields = state.get("promesse_achat", {}).get("fields", {})

        # Build merged dict: state PA fields first, then payload overrides
        # This ensures ALL fields collected during chat are included
        merged = {}
        for k, v in pa_state_fields.items():
            if v is not None and v != [] and v != "":
                merged[k] = v
        for k, v in payload.items():
            if v is not None and v != [] and v != "":
                merged[k] = v

        # Validate booleans
        invalid = []
        for k in PA_BOOLEAN_FIELDS:
            if k in merged and not isinstance(merged[k], bool):
                invalid.append(f"{k} (attendu: true ou false)")
        # Validate dates
        for k in PA_DATE_FIELDS:
            if k in merged and _parse_date(merged[k]) is None:
                invalid.append(f"{k} (format attendu: AAAA-MM-JJ)")
        if invalid:
            return {
                "status": "rejected",
                "reason": "validation_error",
                "message": "Certains champs ont un format incorrect : " + ", ".join(invalid),
                "invalid_fields": invalid,
            }

        # Convert date strings to date objects for the DB
        for k in PA_DATE_FIELDS:
            if k in merged:
                merged[k] = _parse_date(merged[k])

        # Build PA record — prefill from transaction, then overlay merged fields
        pa_data = {
            "transaction_id": state.get("transaction", {}).get("id"),
            "user_id": user.get("id", 1),
            # Auto-filled from transaction
            "acheteurs": tx_fields.get("buyers", []),
            "vendeurs": tx_fields.get("sellers", []),
            "property_address": tx_fields.get("property_address"),
            "prix_offert": tx_fields.get("offered_price"),
            "prix_achat": tx_fields.get("offered_price"),
        }

        # Courtier info from user account
        if tx_fields.get("transaction_type") == "vente":
            pa_data["courtier_vendeur_nom"] = user.get("full_name", "Courtier")
            pa_data["courtier_vendeur_permis"] = user.get("permis_number", "")
        else:
            pa_data["courtier_acheteur_nom"] = user.get("full_name", "Courtier")
            pa_data["courtier_acheteur_permis"] = user.get("permis_number", "")

        # Overlay all collected PA fields
        pa_data.update(merged)

        pa = PromesseAchat(**pa_data)
        db.add(pa)
        try:
            await db.flush()
            await db.refresh(pa)
            pa_id = pa.id
            await db.commit()
            print(f"DEBUG PA CREATED: id={pa_id}")
            return {"id": pa_id, "status": "created"}
        except Exception as e:
            await db.rollback()
            print(f"DEBUG PA ERROR: {type(e).__name__}: {e}")
            return {"status": "rejected", "reason": "db_error", "message": f"Erreur BD: {e}"}

    return {"status": "no_action"}
