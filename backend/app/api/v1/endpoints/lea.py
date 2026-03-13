"""
Léa AI Assistant Endpoints
"""

import base64
import asyncio
import io
import json
from io import BytesIO
import os
import re
import unicodedata
import uuid
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Optional, Literal, List, Tuple, Any

import httpx
from fastapi import APIRouter, Depends, File as FileParam, Form as FormParam, HTTPException, Query, Request, status, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_lea_user, require_admin_or_superadmin, require_superadmin
from app.models import User, RealEstateTransaction, PortailTransaction, RealEstateContact, TransactionContact, ContactType, File
from app.models.lea_conversation import LeaSessionTransactionLink, LeaConversation
from app.models.form import Form, FormSubmission, FormSubmissionVersion
try:
    from app.models.lea_knowledge_content import LeaKnowledgeContent
except ModuleNotFoundError:
    LeaKnowledgeContent = None  # Optional: model may be missing in some deployments
from app.database import get_db
from app.services.lea_service import LeaService
from app.services.ai_service import AIService, AIProvider
from app.services.s3_service import S3Service
from app.core.config import get_settings
from app.core.logging import logger
from app.core.rate_limit import rate_limit_decorator
from app.utils.pa_sync import sync_pa_data_to_transaction
from app.services.lea_chat.actions.session import (
    get_transaction_for_session,
    link_lea_session_to_transaction,
    get_or_create_lea_conversation,
)
from app.services.lea_chat.actions.transaction import (
    maybe_create_transaction_from_lea,
    create_transaction_record,
    build_transaction_creation_confirmation,
    compute_missing_transaction_fields,
    parse_names_for_pending,
    update_transaction_record,
    _extract_address_from_message,
    _extract_price_from_message,
    _extract_seller_buyer_names_list,
    _extract_sellers_and_buyers_from_creation_message,
    _wants_to_create_transaction,
)
from app.services.lea_chat.actions.purchase_offer import extract_pa_fields_llm as _extract_pa_fields_llm
from app.services.lea_chat.orchestrator import run as run_lea_actions_from_orchestrator
from app.services.lea_chat.context_loader import load_active_conversation_context
from app.services.lea_chat.knowledge import (
    load_lea_knowledge_async as load_lea_knowledge_from_module,
    LEA_KNOWLEDGE_FOLDER,
    LEA_KNOWLEDGE_KEY_OACIQ,
    LEA_OACIQ_KNOWLEDGE_PATH,
)
from app.services.lea_chat.prompts import LEA_SYSTEM_PROMPT
from app.services.lea_chat.response_composer import build_context as build_lea_context
from app.services.lea_chat.heuristics import (
    _format_canadian_postal_code,
    _extract_transaction_ref_from_message,
    _extract_address_hint_from_message,
    _extract_address_hint_from_assistant_message,
    _last_message_asked_for_address,
    _last_message_asked_for_property_for_form,
    _last_message_asked_to_confirm_pa_creation,
    _is_short_confirmation_message,
    _last_message_asked_for_sellers,
    _last_message_asked_for_buyers,
    _wants_to_update_address,
    _wants_to_set_promise,
    _extract_postal_code_from_message,
    _extract_city_correction_from_message,
    _is_correcting_postal_or_city,
    _wants_to_geocode_existing_address,
    _extract_seller_buyer_contact_from_message,
    _extract_seller_buyer_names_from_assistant_question,
    _extract_rename_seller_buyer_from_message,
    _extract_remove_person_from_message,
    _wants_to_update_price,
    _wants_to_create_oaciq_form_for_transaction,
    _get_oaciq_form_code_for_lea_message,
    _wants_lea_to_complete_form,
    _wants_help_filling_oaciq,
)

from sqlalchemy import select, and_, or_, insert
from sqlalchemy.exc import ProgrammingError, OperationalError
from sqlalchemy.orm.attributes import flag_modified

try:
    from openai import AsyncOpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False
    AsyncOpenAI = None

try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    _GEOPY_AVAILABLE = True
except ImportError:
    Nominatim = None
    GeocoderTimedOut = GeocoderServiceError = None
    _GEOPY_AVAILABLE = False

AGENT_ERR_MSG = (
    "AGENT_API_URL and AGENT_API_KEY must be set in the Backend service (Railway → Backend → Variables). "
    "Example: AGENT_API_URL=https://agentia-immo-production.up.railway.app"
)

# Constantes de connaissance Léa : importées depuis lea_chat.knowledge (centralisées)

# Cache in-memory pour la base de connaissance Léa (réduit DB + fichiers à chaque requête)
_LEA_KNOWLEDGE_CACHE_TTL_SEC = 60
_lea_knowledge_cache: Optional[Tuple[float, str]] = None


def _get_lea_knowledge_cache() -> Optional[str]:
    """Retourne le contenu en cache si encore valide."""
    global _lea_knowledge_cache
    if _lea_knowledge_cache is None:
        return None
    expiry, value = _lea_knowledge_cache
    if expiry and (datetime.now().timestamp() - expiry) < _LEA_KNOWLEDGE_CACHE_TTL_SEC:
        return value
    _lea_knowledge_cache = None
    return None


def _set_lea_knowledge_cache(value: str) -> None:
    """Enregistre le contenu en cache avec TTL."""
    global _lea_knowledge_cache
    _lea_knowledge_cache = (datetime.now().timestamp(), value)


def _invalidate_lea_knowledge_cache() -> None:
    """Invalide le cache (ex. après mise à jour du contenu OACIQ par l'admin)."""
    global _lea_knowledge_cache
    _lea_knowledge_cache = None


async def _load_lea_knowledge_async() -> str:
    """
    Charge la base de connaissance Léa (cache 60s ou nouvelle session DB).
    Peut être appelée en parallèle de get_lea_user_context pour réduire la latence.
    """
    cached = _get_lea_knowledge_cache()
    if cached is not None:
        return cached
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db2:
        content = await _get_lea_knowledge_for_prompt(db2)
    if content:
        _set_lea_knowledge_cache(content)
    return content


async def _get_lea_knowledge_for_prompt(db: AsyncSession) -> str:
    """Délègue au module knowledge pour charger la base de connaissance Léa."""
    return await load_lea_knowledge_from_module(db)

# URL front : onglet Formulaires d'une transaction (Phase 3). Pattern : /dashboard/transactions/{id}?tab=forms
LEA_TRANSACTION_FORMS_TAB_PATH = "/dashboard/transactions/{id}?tab=forms"

# Règles métier : formulaires OACIQ recommandés par type de transaction (Phase 2)
OACIQ_FORM_RECOMMENDED_BY_KIND: dict = {
    "achat": ["PA"],   # Promesse d'achat
    "vente": ["DIA"],  # Déclaration d'intention d'achat (côté vendeur)
}

router = APIRouter(prefix="/lea", tags=["lea"])


class LeaChatRequest(BaseModel):
    """Léa chat request"""
    message: str = Field(..., min_length=1, description="User message")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    last_assistant_message: Optional[str] = Field(None, description="Dernier message assistant (pour confirmer « oui enregistrez » avec les noms)")
    transaction_id: Optional[int] = Field(None, description="ID de la transaction (pour lier la session et prioriser les mises à jour contacts)")
    provider: Optional[Literal["openai", "anthropic", "auto"]] = Field(
        default="auto",
        description="AI provider to use"
    )


class LeaChatResponse(BaseModel):
    """Léa chat response"""
    content: str
    session_id: str
    model: Optional[str] = None
    provider: Optional[str] = None
    usage: Optional[dict] = None
    actions: Optional[List[str]] = None  # Actions effectuées côté backend (logs)


class LeaContextResponse(BaseModel):
    """Léa conversation context"""
    session_id: str
    message_count: int
    messages: list


class LeaConversationItem(BaseModel):
    """Single item in Léa conversations list"""
    session_id: str
    title: str
    updated_at: Optional[str] = None


class LeaSynthesizeRequest(BaseModel):
    """Léa text-to-speech synthesis request (voix féminine, douce et naturelle)"""
    text: str = Field(..., min_length=1, description="Text to synthesize")
    voice: Optional[str] = Field("shimmer", description="Voix TTS: shimmer (chaleureuse) ou nova (neutre)")
    speed: Optional[float] = Field(1.35, ge=0.25, le=2.0, description="Vitesse de parole (1.0 = normal, 1.35 = lecture accélérée)")


class LeaSettingsResponse(BaseModel):
    """Léa settings (admin)"""
    system_prompt: str
    max_tokens: int
    tts_model: str
    tts_voice: str


class LeaSettingsUpdate(BaseModel):
    """Léa settings update (admin)"""
    system_prompt: Optional[str] = None
    max_tokens: Optional[int] = Field(None, ge=64, le=1024)
    tts_model: Optional[str] = None
    tts_voice: Optional[str] = None


# Actions que Léa peut effectuer (affichées dans Paramètres Léa)
LEA_CAPABILITIES = [
    {"id": "create_transaction", "label": "Créer une transaction", "description": "Léa peut créer un dossier (transaction d'achat ou de vente) depuis la conversation."},
    {"id": "update_transaction", "label": "Modifier une transaction", "description": "Léa peut mettre à jour une transaction : pendant la création (brouillon) ou après. Adresse, vendeurs, acheteurs, prix, promesse d'achat, date de clôture, etc. Ex. « enregistre les vendeurs Lily et Lilou », « les acheteurs sont Paul et Marie », « en fait le prix c'est 500 000 », « les vendeurs c'est seulement Paul ». Léa peut changer le nom d'un acheteur ou vendeur, ou supprimer un vendeur/acheteur (ex. « retirer le vendeur Pierre »)."},
    {"id": "create_contact", "label": "Créer un contact", "description": "À venir : Léa pourra créer un contact dans le Réseau (API contacts)."},
    {"id": "update_contact", "label": "Modifier un contact", "description": "À venir : Léa pourra modifier un contact existant dans le Réseau."},
    {"id": "access_oaciq_forms", "label": "Accéder aux formulaires OACIQ", "description": "Léa peut lister les formulaires OACIQ disponibles et l'état des formulaires (brouillon/complété/signé) pour vos transactions."},
    {"id": "modify_oaciq_forms", "label": "Modifier des formulaires OACIQ", "description": "Léa peut créer ou modifier des soumissions de formulaires OACIQ."},
]


def _use_external_agent() -> bool:
    """Retourne True si l'API agent externe est configurée."""
    settings = get_settings()
    url = (settings.AGENT_API_URL or "").strip().rstrip("/")
    key = (settings.AGENT_API_KEY or "").strip()
    return bool(url and key)


def _use_integrated_lea() -> bool:
    """Retourne True si l'IA intégrée (OpenAI/Anthropic) est configurée pour Léa en mode rapide."""
    return AIService.is_configured()


def _use_integrated_voice() -> bool:
    """True si on peut faire le vocal intégré (Whisper + LLM + TTS) avec OpenAI."""
    return bool(_OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY") and AIService.is_configured())


async def get_lea_user_context(db: AsyncSession, user_id: int) -> str:
    """
    Récupère un résumé des transactions de l'utilisateur (dossiers immo + portail)
    pour l'injecter dans le contexte de Léa.
    """
    lines = ["Données plateforme (transactions et dossiers de l'utilisateur connecté) :"]
    try:
        # Référentiel formulaires OACIQ disponibles (code, nom, catégorie, objectif si présent)
        try:
            q_forms = select(Form).where(Form.code.isnot(None)).order_by(Form.code)
            res_forms = await db.execute(q_forms)
            forms = res_forms.scalars().all()
            if forms:
                ref_parts = []
                for f in forms:
                    part = f"{f.code} – {f.name or f.code}" + (f" ({f.category})" if f.category else "")
                    objective = None
                    if getattr(f, "fields", None) and isinstance(f.fields, dict):
                        meta = f.fields.get("metadata") or {}
                        objective = meta.get("objective") if isinstance(meta, dict) else None
                    if not objective and getattr(f, "description", None):
                        objective = f.description
                    if objective:
                        part += f" — {objective[:200]}" + ("…" if len(str(objective)) > 200 else "")
                    ref_parts.append(part)
                lines.append("Formulaires OACIQ disponibles : " + "; ".join(ref_parts) + ".")
        except Exception:
            pass
        # Transactions immobilières (dossiers du courtier)
        q_re = (
            select(RealEstateTransaction)
            .where(RealEstateTransaction.user_id == user_id)
            .order_by(RealEstateTransaction.updated_at.desc())
            .limit(15)
        )
        res_re = await db.execute(q_re)
        re_list = res_re.scalars().all()
        if re_list:
            lines.append("Transactions immobilières (dossiers) :")
            # Indiquer explicitement la transaction la plus récente (priorité pour Léa)
            latest = re_list[0]
            ref_latest = latest.dossier_number or f"#{latest.id}"
            lines.append(f"  → Transaction la plus récente (à utiliser par défaut) : {ref_latest}.")
            lines.append("  → Ne jamais mentionner ou basculer vers une autre transaction sauf si l'utilisateur le demande explicitement par son numéro.")
            for t in re_list:
                prov = (getattr(t, "property_province", None) or "").strip().upper()
                prov_display = "Québec" if prov == "QC" else ("Ontario" if prov == "ON" else (t.property_province or ""))
                addr = _format_full_address_ca(
                    t.property_address or "",
                    t.property_city or "",
                    prov_display,
                    getattr(t, "property_postal_code", None) or "",
                )
                if not addr.strip():
                    addr = t.property_address or t.property_city or "Sans adresse"
                num = t.dossier_number or f"#{t.id}"
                # Pour chaque transaction : afficher vendeur(s)/acheteur(s) déjà enregistrés (singulier si 1, pluriel sinon)
                detail = []
                if t.sellers and isinstance(t.sellers, list) and len(t.sellers) > 0:
                    names_s = [e.get("name") for e in t.sellers if isinstance(e, dict) and e.get("name")]
                    if names_s:
                        label_s = "vendeur: " if len(names_s) == 1 else "vendeurs: "
                        detail.append(f"{label_s}{', '.join(names_s)}")
                    else:
                        detail.append("vendeurs: (aucun)")
                else:
                    detail.append("vendeurs: (aucun)")
                if t.buyers and isinstance(t.buyers, list) and len(t.buyers) > 0:
                    names_b = [e.get("name") for e in t.buyers if isinstance(e, dict) and e.get("name")]
                    if names_b:
                        label_b = "acheteur: " if len(names_b) == 1 else "acheteurs: "
                        detail.append(f"{label_b}{', '.join(names_b)}")
                    else:
                        detail.append("acheteurs: (aucun)")
                else:
                    detail.append("acheteurs: (aucun)")
                lines.append(f"  - {num}: {t.name} — {addr} — statut: {t.status} — {' ; '.join(detail)}")
            # Pour la transaction la plus récente : détail vendeurs/acheteurs/prix pour ne pas redemander
            latest = re_list[0]
            detail_parts = []
            if latest.sellers and isinstance(latest.sellers, list) and len(latest.sellers) > 0:
                names_s = [e.get("name") for e in latest.sellers if isinstance(e, dict) and e.get("name")]
                if names_s:
                    label_s = "vendeur: " if len(names_s) == 1 else "vendeurs: "
                    detail_parts.append(f"{label_s}{', '.join(names_s)}")
            if latest.buyers and isinstance(latest.buyers, list) and len(latest.buyers) > 0:
                names_b = [e.get("name") for e in latest.buyers if isinstance(e, dict) and e.get("name")]
                if names_b:
                    label_b = "acheteur: " if len(names_b) == 1 else "acheteurs: "
                    detail_parts.append(f"{label_b}{', '.join(names_b)}")
            if latest.listing_price is not None or latest.offered_price is not None:
                p = latest.listing_price or latest.offered_price
                detail_parts.append(f"prix: {p:,.0f} $")
            if getattr(latest, "expected_closing_date", None):
                d = latest.expected_closing_date
                detail_parts.append(f"date de clôture prévue: {d.strftime('%d/%m/%Y')}")
            if detail_parts:
                lines.append(f"  → Dernière transaction ({latest.dossier_number or f'#{latest.id}'}) : {'; '.join(detail_parts)}.")
                lines.append(f"  → Ne pas redemander les informations déjà enregistrées pour cette transaction.")
                if any("vendeur:" in p for p in detail_parts):
                    lines.append("  → Ne jamais redemander « Qui sont les vendeurs ? » pour cette transaction.")
                if any("acheteur:" in p for p in detail_parts):
                    lines.append("  → Ne jamais redemander « Qui sont les acheteurs ? » pour cette transaction.")
                if any("prix:" in p for p in detail_parts):
                    lines.append("  → Ne jamais redemander le prix pour cette transaction.")
            # Infos manquantes pour guider les questions
            missing = []
            if not (latest.property_address or latest.property_city):
                missing.append("adresse du bien")
            else:
                # Adresse partielle (rue sans ville/code postal) = incomplète, ne pas passer à la suite
                has_city = bool(getattr(latest, "property_city", None) and str(latest.property_city).strip() and str(latest.property_city).strip() not in ("À compléter", ""))
                has_postal = bool(getattr(latest, "property_postal_code", None) and str(latest.property_postal_code).strip() and str(latest.property_postal_code).strip() not in ("À compléter", ""))
                if not (has_city and has_postal):
                    lines.append(
                        "  → Adresse du bien enregistrée mais INCOMPLÈTE (il manque ville et/ou code postal). "
                        "Ne PAS poser « Qui sont les vendeurs ? » ni aucune autre question. Demande uniquement la **ville** à l'utilisateur (pas le code postal) ; une fois la ville donnée, propose de trouver le code postal en ligne (géocodage)."
                    )
            address_complete = bool(latest.property_address or latest.property_city) and (
                bool(getattr(latest, "property_city", None) and str(latest.property_city or "").strip() not in ("", "À compléter"))
                and bool(getattr(latest, "property_postal_code", None) and str(latest.property_postal_code or "").strip() not in ("", "À compléter"))
            )
            sellers_ok = latest.sellers and len(latest.sellers) > 0 if isinstance(latest.sellers, list) else bool(latest.sellers)
            if not sellers_ok and address_complete:
                missing.append("vendeur(s)")
            buyers_ok = latest.buyers and len(latest.buyers) > 0 if isinstance(latest.buyers, list) else bool(latest.buyers)
            if not buyers_ok and address_complete:
                missing.append("acheteur(s)")
            if not latest.listing_price and not latest.offered_price and address_complete:
                missing.append("prix (demandé ou offert)")
            if missing:
                ref = latest.dossier_number or f"#{latest.id}"
                lines.append(f"  → Pour {ref}, infos principales à compléter : {', '.join(missing)}. Pose uniquement la question correspondante (adresse, vendeurs, acheteurs ou prix).")
            else:
                ref = latest.dossier_number or f"#{latest.id}"
                lines.append(f"  → Pour {ref}, les 4 infos principales (adresse, vendeurs, acheteurs, prix) sont complètes. Propose à l'utilisateur : « Souhaitez-vous ajouter une autre information (date de clôture, notaire, etc.) ? » — ne pose pas de question spécifique sur la date de clôture ou le notaire sans qu'il ait dit oui.")
            # Formulaires OACIQ pour la transaction la plus récente (Phase 1.2 + 2.2 : détail par code + prochaine étape)
            try:
                q_oaciq = (
                    select(FormSubmission, Form.code)
                    .join(Form, FormSubmission.form_id == Form.id)
                    .where(
                        FormSubmission.transaction_id == latest.id,
                        Form.code.isnot(None),
                    )
                )
                res_oaciq = await db.execute(q_oaciq)
                oaciq_rows = res_oaciq.all()
                status_by_code = {row[1]: getattr(row[0], "status", None) for row in oaciq_rows if row[1]}
                q_all_codes = select(Form.code).where(Form.code.isnot(None)).order_by(Form.code)
                res_codes = await db.execute(q_all_codes)
                all_codes = [r[0] for r in res_codes.all() if r[0]]
                if all_codes:
                    detail_parts = []
                    for code in all_codes:
                        st = status_by_code.get(code)
                        if st == "draft":
                            detail_parts.append(f"{code} : brouillon")
                        elif st == "completed":
                            detail_parts.append(f"{code} : complété")
                        elif st == "signed":
                            detail_parts.append(f"{code} : signé")
                        else:
                            detail_parts.append(f"{code} : non créé")
                    ref_tx = latest.dossier_number or f"#{latest.id}"
                    lines.append(f"  → Formulaires OACIQ pour la transaction {ref_tx} : {' ; '.join(detail_parts)}.")
                    # Prochaine étape document (Phase 2.2)
                    kind = (getattr(latest, "transaction_kind", None) or "").strip().lower() or "achat"
                    recommended = OACIQ_FORM_RECOMMENDED_BY_KIND.get(kind, ["PA"])
                    next_steps = []
                    for code in recommended:
                        st = status_by_code.get(code)
                        if st == "draft":
                            next_steps.append(f"compléter le formulaire {code}")
                        elif not st:
                            next_steps.append(f"créer le formulaire {code}")
                    if next_steps:
                        lines.append(f"  → Prochaine étape document : {' ; '.join(next_steps)}. Indique à l'utilisateur d'aller dans Transactions → cette transaction → onglet Formulaire.")
                elif oaciq_rows:
                    draft_count = sum(1 for row in oaciq_rows if getattr(row[0], "status", None) == "draft")
                    total = len(oaciq_rows)
                    codes = list({row[1] for row in oaciq_rows if row[1]})
                    if draft_count > 0:
                        lines.append(f"  → Formulaires OACIQ pour cette transaction : {total} formulaire(s) (dont {draft_count} en brouillon). Codes : {', '.join(codes)}.")
                    else:
                        lines.append(f"  → Formulaires OACIQ pour cette transaction : {total} formulaire(s). Codes : {', '.join(codes)}.")
            except Exception:
                pass
        else:
            lines.append("Transactions immobilières : aucune pour le moment. (L'utilisateur n'a pas encore de dossier.)")

        # Dossiers portail client (où l'utilisateur est le courtier)
        q_pt = (
            select(PortailTransaction)
            .where(PortailTransaction.courtier_id == user_id)
            .order_by(PortailTransaction.date_debut.desc())
            .limit(15)
        )
        res_pt = await db.execute(q_pt)
        pt_list = res_pt.scalars().all()
        if pt_list:
            lines.append("Dossiers portail client (vos clients) :")
            for t in pt_list:
                addr = t.adresse or t.ville or "—"
                lines.append(f"  - {t.type} — {addr} — statut: {t.statut}")
        else:
            lines.append("Dossiers portail client : aucun pour le moment.")
    except Exception as e:
        logger.warning(f"get_lea_user_context: {e}", exc_info=True)
        return "Données plateforme : temporairement indisponibles. (Dire à l'utilisateur de réessayer dans un instant.)"
    return "\n".join(lines)


async def get_user_latest_transaction(db: AsyncSession, user_id: int):
    """Retourne la transaction la plus récente de l'utilisateur, ou None."""
    q = (
        select(RealEstateTransaction)
        .where(RealEstateTransaction.user_id == user_id)
        .order_by(RealEstateTransaction.updated_at.desc())
        .limit(1)
    )
    r = await db.execute(q)
    return r.scalar_one_or_none()


# Transaction doublon : un dossier déjà existant pour le même utilisateur qui est encore « vide »
# (adresse à compléter, aucun vendeur, aucun acheteur, aucun prix). Créer une nouvelle transaction
# dans ce cas ferait un doublon ; on bloque la création et on indique à l'utilisateur d'utiliser le dossier existant.
def _is_empty_transaction(tx: RealEstateTransaction) -> bool:
    """True si la transaction est un dossier vide (adresse à compléter, pas de vendeurs/acheteurs/prix)."""
    addr = (tx.property_address or "").strip()
    if addr and addr != "À compléter":
        return False
    sellers = tx.sellers if isinstance(tx.sellers, list) else []
    buyers = tx.buyers if isinstance(tx.buyers, list) else []
    if sellers or buyers:
        return False
    if getattr(tx, "listing_price", None) is not None or getattr(tx, "offered_price", None) is not None:
        return False
    return True


async def get_existing_empty_transaction(
    db: AsyncSession, user_id: int
) -> Optional[RealEstateTransaction]:
    """
    Retourne une transaction existante de l'utilisateur qui est encore vide (doublon potentiel).
    Une transaction vide : adresse « À compléter » ou vide, aucun vendeur, aucun acheteur, aucun prix.
    Retourne la plus récente si plusieurs (pour afficher son numéro à l'utilisateur).
    """
    q = (
        select(RealEstateTransaction)
        .where(RealEstateTransaction.user_id == user_id)
        .order_by(RealEstateTransaction.updated_at.desc())
        .limit(20)
    )
    r = await db.execute(q)
    for tx in r.scalars().all():
        if _is_empty_transaction(tx):
            return tx
    return None


async def get_user_transaction_by_ref(
    db: AsyncSession, user_id: int, ref: str
) -> Optional[RealEstateTransaction]:
    """
    Retourne une transaction de l'utilisateur par id ou numéro de dossier.
    ref peut être "4" -> on cherche id=4 ou dossier_number="4".
    """
    if not ref or not ref.strip():
        return None
    ref = ref.strip()
    # Essayer par id
    try:
        tid = int(ref)
        q = select(RealEstateTransaction).where(
            RealEstateTransaction.user_id == user_id,
            RealEstateTransaction.id == tid,
        )
        r = await db.execute(q)
        tx = r.scalar_one_or_none()
        if tx:
            return tx
    except ValueError:
        pass
    # Essayer par dossier_number
    q = (
        select(RealEstateTransaction)
        .where(
            RealEstateTransaction.user_id == user_id,
            RealEstateTransaction.dossier_number == ref,
        )
    )
    r = await db.execute(q)
    return r.scalar_one_or_none()


async def get_user_transaction_by_address_hint(
    db: AsyncSession, user_id: int, hint: str
) -> Optional[RealEstateTransaction]:
    """Retourne une transaction de l'utilisateur dont l'adresse ou la ville contient hint (ex: Bordeaux)."""
    if not hint or len(hint.strip()) < 2:
        return None
    h = hint.strip()
    q = (
        select(RealEstateTransaction)
        .where(RealEstateTransaction.user_id == user_id)
        .where(
            or_(
                RealEstateTransaction.property_address.ilike(f"%{h}%"),
                RealEstateTransaction.property_city.ilike(f"%{h}%"),
            )
        )
        .order_by(RealEstateTransaction.updated_at.desc())
        .limit(1)
    )
    r = await db.execute(q)
    return r.scalar_one_or_none()


# En-têtes pour éviter les réponses en cache et obtenir les données de géocodage les plus récentes
_GEOCODE_NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


def _build_address_for_geocode(addr_clean: str) -> List[str]:
    """
    Construit une ou plusieurs variantes d'adresse pour le géocodage (priorité Montréal/Québec).
    Retourne une liste d'adresses à essayer dans l'ordre.
    """
    addr_lower = addr_clean.lower()
    has_city = "," in addr_clean or "montréal" in addr_lower or "montreal" in addr_lower or "québec" in addr_lower
    variants = []
    if "montréal" in addr_lower or "montreal" in addr_lower:
        if not addr_clean.endswith(", Québec, Canada") and not addr_clean.endswith(", Quebec, Canada"):
            variants.append(addr_clean + ", Québec, Canada")
    montreal_street_indicators = (
        "sherbrooke est", "sherbrooke ouest", "sherbrooke e.", "sherbrooke o.",
        "papineau", "lorimier", "saint-denis", "saint-laurent", "drolet",
        "rue sherbrooke", "av. sherbrooke", "avenue sherbrooke",
        "rue de bordeaux", "de bordeaux", "waverly", "rue waverly",
    )
    if not has_city and any(ind in addr_lower for ind in montreal_street_indicators):
        variants.append(addr_clean + ", Montréal, Québec, Canada")
    if not has_city:
        variants.append(addr_clean + ", Québec, Canada")
        variants.append(addr_clean + ", Montréal, Québec, Canada")
    if has_city:
        variants.append(addr_clean)
    else:
        variants.append(addr_clean + ", Québec, Canada")
    return variants


def _geocode_geopy_sync(addr: str, limit: int = 5) -> Optional[dict]:
    """
    Géocodage synchrone via geopy (Nominatim / OpenStreetMap).
    Retourne un dict avec postcode, city, state, country_code pour adresses Canada.
    Utilisé dans un thread pour ne pas bloquer l'event loop.
    """
    if not _GEOPY_AVAILABLE or not Nominatim or not addr or len(addr.strip()) < 5:
        return None
    addr = _normalize_address_for_geocode(addr.strip())
    try:
        geolocator = Nominatim(user_agent="ImmoAssist-Lea/1.0 (contact@immoassist.com)", timeout=10)
        locations = geolocator.geocode(addr, addressdetails=True, exactly_one=False, limit=limit)
    except (GeocoderTimedOut, GeocoderServiceError, Exception) as e:
        logger.debug("Lea geopy geocode failed for %s: %s", addr[:50], e)
        return None
    if not locations:
        return None
    # Construire la liste au format attendu par _pick_best_geocode_result (address dict)
    data = []
    for loc in locations:
        raw = getattr(loc, "raw", None) or {}
        adr = raw.get("address") if isinstance(raw, dict) else {}
        if isinstance(adr, dict) and adr.get("country_code", "").upper() == "CA":
            data.append({"address": adr})
    if not data:
        return None
    best = _pick_best_geocode_result(data, addr)
    if not best:
        # Premier résultat Canada — extraire postcode via raw['address'] (recommandé geopy/Nominatim)
        adr = data[0].get("address") or {}
        best = {}
        postcode = adr.get("postcode") or adr.get("postal_code")
        if postcode:
            best["postcode"] = str(postcode).strip()
        if adr.get("city") or adr.get("town") or adr.get("village") or adr.get("municipality"):
            best["city"] = str(
                adr.get("city") or adr.get("town") or adr.get("village") or adr.get("municipality") or ""
            ).strip()
        if adr.get("state") or adr.get("province"):
            best["state"] = str(adr.get("state") or adr.get("province") or "").strip()
        best["country_code"] = "CA"
    return best if best else None


async def _geocode_geopy(addr: str) -> Optional[dict]:
    """Géocodage via geopy (Nominatim) en async (exécution dans un thread)."""
    if not addr or len(addr.strip()) < 5:
        return None
    try:
        return await asyncio.to_thread(_geocode_geopy_sync, addr, 5)
    except Exception as e:
        logger.debug("Lea geopy async geocode failed: %s", e)
        return None


async def _geocode_geocoder_ca(addr: str) -> Optional[dict]:
    """
    Géocodage via geocoder.ca (données Canada à jour, meilleur pour codes postaux).
    Utilisé en priorité si disponible ; requêtes avec no-cache pour données fraîches.
    Option : GEOCODER_CA_AUTH pour compte (gratuit 2500/jour ou payant).
    Retourne un dict avec postcode, city, state, country_code ou None.
    """
    if not addr or len(addr.strip()) < 5:
        return None
    addr = _normalize_address_for_geocode(addr.strip())
    url = "https://geocoder.ca"
    params = {
        "locate": addr,
        "geoit": "xml",
        "json": 1,
        "region": "canada",
        "standard": 1,
        "showpostal": 1,
        "showcountry": 1,
    }
    auth = os.environ.get("GEOCODER_CA_AUTH", "").strip()
    if auth:
        params["auth"] = auth
    headers = {
        "User-Agent": "ImmoAssist-Lea/1.0 (contact@immoassist.com)",
        **_GEOCODE_NO_CACHE_HEADERS,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params, headers=headers)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.debug(f"Lea geocoder.ca request failed for {addr[:50]}: {e}")
        return None
    if not data or not isinstance(data, dict):
        return None
    # Erreur API (ex: 008 = no results, 003 = auth not found)
    if data.get("error"):
        logger.debug(f"Lea geocoder.ca error: {data.get('error')}")
        return None
    # Pas de coordonnées = pas de résultat valide
    latt = data.get("latt")
    longt = data.get("longt")
    if (latt is None or longt is None) or (str(latt).strip() == "" or str(longt).strip() == ""):
        return None
    # Confidence < 0.5 = suggestion, pas un vrai match
    confidence = data.get("confidence")
    if confidence is not None:
        try:
            if float(confidence) < 0.5:
                return None
        except (TypeError, ValueError):
            pass
    # Pays : seulement Canada
    country = data.get("country") or data.get("Country") or data.get("showcountry") or "CA"
    if isinstance(country, str):
        country = country.upper() if len(country) == 2 else "CA"
    if country != "CA":
        return None
    # Ville/province dans "standard" ou en top-level
    standard = data.get("standard")
    if isinstance(standard, dict):
        city = standard.get("city") or standard.get("City")
        state = standard.get("prov") or standard.get("Province")
    else:
        city = state = None
    city = city or data.get("city") or data.get("City") or data.get("locality")
    state = state or data.get("prov") or data.get("province") or data.get("Province") or data.get("state")
    postcode = data.get("postal") or data.get("postcode") or data.get("PostalCode")
    result = {}
    if postcode:
        result["postcode"] = str(postcode).strip()
    if city:
        result["city"] = str(city).strip()
    if state:
        result["state"] = str(state).strip()
    result["country_code"] = "CA"
    # Exiger au moins code postal ou ville pour être utile
    if not result.get("postcode") and not result.get("city"):
        return None
    return result


async def _validate_address_via_geocode(addr: str) -> Optional[dict]:
    """
    Vérifie une adresse via géocodage avec fallback du plus fiable au moins fiable :
    1) geocoder.ca (uniquement si GEOCODER_CA_AUTH est défini — payant ou gratuit 2500/jour avec compte)
    2) geopy / Nominatim (OpenStreetMap) — gratuit, sans clé
    3) Nominatim HTTP direct
    Sans clé geocoder.ca, seuls Nominatim (2 et 3) sont utilisés. Les requêtes envoient no-cache pour données fraîches.
    Retourne un dict avec postcode, city, state (province), country_code pour que Léa puisse confirmer à l'utilisateur.
    """
    if not addr or len(addr.strip()) < 5:
        return None
    addr_clean = addr.strip()
    addr_lower = addr_clean.lower()
    has_city = "," in addr_clean or "montréal" in addr_lower or "montreal" in addr_lower or "québec" in addr_lower

    def _is_valid_ca_result(result: Optional[dict]) -> bool:
        if not result or (result.get("country_code") or "").upper() != "CA":
            return False
        return bool(result.get("postcode") or result.get("city"))

    # 1) geocoder.ca — seulement si clé configurée (payant / gratuit avec compte)
    if os.environ.get("GEOCODER_CA_AUTH", "").strip():
        for to_try in _build_address_for_geocode(addr_clean):
            result = await _geocode_geocoder_ca(to_try)
            if _is_valid_ca_result(result):
                return result

    # 2) geopy (Nominatim / OpenStreetMap)
    for to_try in _build_address_for_geocode(addr_clean):
        result = await _geocode_geopy(to_try)
        if _is_valid_ca_result(result):
            return result

    # 3) Fallback Nominatim HTTP
    for to_try in _build_address_for_geocode(addr_clean):
        result = await _geocode_one(to_try)
        if _is_valid_ca_result(result):
            return result
    if has_city:
        result = await _geocode_one(addr_clean)
    else:
        result = await _geocode_one(addr_clean + ", Québec, Canada")
    if result:
        if not has_city and (result.get("country_code") or "").upper() != "CA":
            return None
        return result
    return None


def _pick_best_geocode_result(data: list, addr_clean: str) -> Optional[dict]:
    """
    Parmi plusieurs résultats Nominatim, choisit le meilleur : Canada, numéro civique cohérent, ville Montréal.
    """
    if not data or not isinstance(data, list):
        return None
    # Extraire le numéro civique de l'adresse recherchée (ex. "7236" de "7236 rue Waverly")
    addr_num_match = re.search(r"^(\d+)\s", addr_clean.strip())
    want_house_number = addr_num_match.group(1) if addr_num_match else None
    best = None
    best_score = -1
    for item in data:
        if not isinstance(item, dict):
            continue
        adr = item.get("address") or {}
        if not isinstance(adr, dict):
            continue
        country = (adr.get("country_code") or "").upper()
        if country != "CA":
            continue
        city = (adr.get("city") or adr.get("town") or adr.get("village") or adr.get("municipality") or "").lower()
        house_num = str(adr.get("house_number") or "").strip()
        postcode = adr.get("postcode") or adr.get("postal_code")
        score = 0
        if "montreal" in city or "montréal" in city:
            score += 10
        if want_house_number and house_num == want_house_number:
            score += 20
        if postcode and len(str(postcode).strip()) >= 6:
            score += 5
        if score > best_score:
            best_score = score
            best = item
    if best:
        adr = best.get("address") or {}
        postcode = adr.get("postcode") or adr.get("postal_code")
        city = adr.get("city") or adr.get("town") or adr.get("village") or adr.get("municipality") or adr.get("county")
        state = adr.get("state") or adr.get("province")
        country = adr.get("country_code", "").upper() if adr.get("country_code") else None
        result = {}
        if postcode:
            result["postcode"] = str(postcode).strip()
        if city:
            result["city"] = str(city).strip()
        if state:
            result["state"] = str(state).strip()
        if country:
            result["country_code"] = country
        return result if result else None
    return None


def _normalize_address_for_geocode(addr: str) -> str:
    """
    Expandit les abréviations courantes pour améliorer le taux de succès Nominatim
    (ex. Bd Décarie -> Boulevard Décarie).
    """
    if not addr or not addr.strip():
        return addr
    t = addr.strip()
    replacements = [
        (r"\bBd\b", "Boulevard"),
        (r"\bBlvd\b", "Boulevard"),
        (r"\bAv\.?\b", "Avenue"),
        (r"\bAve\.?\b", "Avenue"),
        (r"\bCh\.?\b", "Chemin"),
        (r"\bRte\b", "Route"),
    ]
    for pattern, repl in replacements:
        t = re.sub(pattern, repl, t, flags=re.I)
    return t


async def _geocode_one(addr: str, limit: int = 5) -> Optional[dict]:
    """
    Appel Nominatim. Retourne le meilleur résultat pour les adresses québécoises.
    Avec limit>1, sélectionne le résultat le plus pertinent (même numéro civique, Montréal, Canada).
    """
    addr = _normalize_address_for_geocode(addr)
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": addr.strip(), "format": "json", "addressdetails": 1, "limit": limit}
    headers = {
        "User-Agent": "ImmoAssist-Lea/1.0 (contact@immoassist.com)",
        **_GEOCODE_NO_CACHE_HEADERS,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params, headers=headers)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.warning(f"Lea geocode address failed: {e}", exc_info=False)
        return None
    if not data or not isinstance(data, list) or len(data) == 0:
        return None
    addr_clean = addr.strip()
    if limit > 1:
        best = _pick_best_geocode_result(data, addr_clean)
        if best:
            return best
    item = data[0]
    if not isinstance(item, dict):
        return None
    adr = item.get("address") or {}
    if not isinstance(adr, dict):
        return None
    postcode = adr.get("postcode") or adr.get("postal_code")
    city = adr.get("city") or adr.get("town") or adr.get("village") or adr.get("municipality") or adr.get("county")
    state = adr.get("state") or adr.get("province")
    country = adr.get("country_code", "").upper() if adr.get("country_code") else None
    result = {}
    if postcode:
        result["postcode"] = str(postcode).strip()
    if city:
        result["city"] = str(city).strip()
    if state:
        result["state"] = str(state).strip()
    if country:
        result["country_code"] = country
    if not result:
        return None
    return result


def _format_full_address_ca(street: str, city: str, province: str, postcode: str) -> str:
    """
    Formate une adresse complète au format canadien standard :
    « 2643 Sherbrooke Est, Montréal (Québec) H2K 1E1 »
    """
    street = (street or "").strip()
    city = (city or "").strip()
    province = (province or "").strip()
    postcode = _format_canadian_postal_code(postcode or "")
    parts = []
    if street:
        parts.append(street)
    if city:
        if province:
            parts.append(f"{city} ({province})")
        else:
            parts.append(city)
    if postcode:
        parts.append(postcode)
    return ", ".join(parts) if parts else ""


async def maybe_update_transaction_address_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    transaction_preferred: Optional[RealEstateTransaction] = None,
) -> Optional[Tuple[str, RealEstateTransaction, Optional[dict]]]:
    """Si le message demande d'ajouter/mettre à jour l'adresse, met à jour la transaction (session liée, ref ou la plus récente). Retourne (adresse, transaction, infos_géocodage) si mise à jour."""
    if not _wants_to_update_address(message):
        return None
    addr = _extract_address_from_message(message)
    if not addr:
        return None
    ref = _extract_transaction_ref_from_message(message)
    if ref:
        transaction = await get_user_transaction_by_ref(db, user_id, ref)
    elif transaction_preferred:
        transaction = transaction_preferred
    else:
        transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None
    try:
        transaction.property_address = addr
        validation = await _validate_address_via_geocode(addr)
        if validation:
            if validation.get("state"):
                state = validation["state"]
                if "québec" in state.lower() or "quebec" in state.lower() or state.upper() == "QC":
                    transaction.property_province = "QC"
                elif state.upper() in ("ON", "ONTARIO"):
                    transaction.property_province = "ON"
            if validation.get("city"):
                transaction.property_city = validation["city"]
            if validation.get("postcode"):
                transaction.property_postal_code = _format_canadian_postal_code(validation["postcode"])
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea updated transaction id={transaction.id} address to {addr[:50]}...")
        return (addr, transaction, validation)
    except Exception as e:
        logger.warning(f"Lea update address failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def _update_transaction_address_from_context(
    db: AsyncSession,
    user_id: int,
    addr: str,
    transaction_preferred: Optional[RealEstateTransaction] = None,
) -> Optional[Tuple[str, RealEstateTransaction, Optional[dict]]]:
    """
    Enregistre l'adresse sur la transaction (session liée ou dernière) quand l'utilisateur répond par une adresse
    à la question de Léa (« Quelle est l'adresse du bien ? »). Retourne (adresse, transaction, validation).
    """
    if not addr or len(addr.strip()) < 5:
        return None
    addr = addr.strip()
    transaction = transaction_preferred if transaction_preferred else await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None
    try:
        transaction.property_address = addr
        validation = await _validate_address_via_geocode(addr)
        if validation:
            if validation.get("state"):
                state = validation["state"]
                if "québec" in state.lower() or "quebec" in state.lower() or state.upper() == "QC":
                    transaction.property_province = "QC"
                elif state.upper() in ("ON", "ONTARIO"):
                    transaction.property_province = "ON"
            if validation.get("city"):
                transaction.property_city = validation["city"]
            if validation.get("postcode"):
                transaction.property_postal_code = _format_canadian_postal_code(validation["postcode"])
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea updated transaction id={transaction.id} address from context to {addr[:50]}...")
        return (addr, transaction, validation)
    except Exception as e:
        logger.warning(f"Lea update address from context failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_correct_transaction_postal_or_city_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str],
) -> Optional[Tuple[RealEstateTransaction, Literal["postal", "city"], str]]:
    """
    Si l'utilisateur corrige le code postal ou la ville pour la transaction en cours,
    met à jour la transaction et retourne (transaction, "postal"|"city", nouvelle_valeur).
    """
    if not _is_correcting_postal_or_city(message, last_assistant_message):
        return None
    transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None
    new_postal = _extract_postal_code_from_message(message)
    new_city = _extract_city_correction_from_message(message)
    if new_postal:
        try:
            transaction.property_postal_code = _format_canadian_postal_code(new_postal)
            await db.commit()
            await db.refresh(transaction)
            logger.info(f"Lea corrected postal code to {transaction.property_postal_code} for transaction id={transaction.id}")
            return (transaction, "postal", transaction.property_postal_code)
        except Exception as e:
            logger.warning(f"Lea correct postal code failed: {e}", exc_info=True)
            await db.rollback()
            return None
    if new_city:
        try:
            transaction.property_city = new_city.strip()
            await db.commit()
            await db.refresh(transaction)
            logger.info(f"Lea corrected city to {transaction.property_city} for transaction id={transaction.id}")
            return (transaction, "city", transaction.property_city)
        except Exception as e:
            logger.warning(f"Lea correct city failed: {e}", exc_info=True)
            await db.rollback()
            return None
    return None


def _looks_like_city_only(message: str) -> bool:
    """True si le message ressemble à une simple indication de ville (ex. « Montréal », « Québec »), sans verbe ni adresse complète."""
    if not message or len(message.strip()) < 2:
        return False
    t = message.strip()
    # Une ou deux mots, pas de chiffres (ou seulement code postal en fin)
    words = t.split()
    if len(words) > 3:
        return False
    # Pas de motif "l'adresse est" / "c'est" / numéro civique en début
    t_lower = t.lower()
    if any(x in t_lower for x in ("l'adresse", "adresse est", "c'est ", "est au", "le bien", "numéro")):
        return False
    # Accepte : tout en lettres (avec accents), éventuellement tirets (Saint-Laurent)
    if words and not any(c.isdigit() for c in t):
        return True
    return False


def _transaction_has_partial_address(tx: RealEstateTransaction) -> bool:
    """True si la transaction a une adresse (rue) mais sans ville ou sans code postal complétés."""
    addr = (getattr(tx, "property_address", None) or "").strip()
    if not addr or len(addr) < 5:
        return False
    city = (getattr(tx, "property_city", None) or "").strip()
    postal = (getattr(tx, "property_postal_code", None) or "").strip()
    if not city or not postal or city.lower() in ("à compléter", "a completer", ""):
        return True
    if len(postal) < 6 or "compléter" in postal.lower():
        return True
    return False


def _is_confirmation_to_search_postal_code(message: str, last_assistant_message: Optional[str] = None) -> bool:
    """True si l'utilisateur confirme qu'il veut la recherche du code postal (ex. « ok », « oui ») après que Léa ait proposé de chercher en ligne."""
    if not message or not last_assistant_message:
        return False
    t = (message or "").strip().lower()
    if len(t) > 50:
        return False
    last_lower = (last_assistant_message or "").strip().lower()
    proposal_phrases = (
        "code postal en ligne",
        "cherche le code postal",
        "chercher le code postal",
        "recherche en ligne pour le code postal",
        "voulez-vous que je cherche",
        "veux-tu que je cherche",
        "trouver le code postal en ligne",
        "géocodage",
        "pour compléter l'adresse",
        "recherche en ligne",
    )
    if not any(p in last_lower for p in proposal_phrases):
        return False
    confirmation_words = (
        "ok", "oui", "d'accord", "accord", "vas-y", "oui merci", "oui stp", "oui s'il te plaît",
        "oui s'il vous plaît", "s'il te plaît", "s'il vous plaît", "oui fais", "fais-le", "go",
    )
    normalized = t.rstrip(".!?").strip().lower()
    return normalized in confirmation_words


async def maybe_geocode_on_user_confirmation(
    db: AsyncSession, user_id: int, message: str, last_assistant_message: Optional[str] = None
) -> Optional[Tuple[str, RealEstateTransaction, dict]]:
    """
    Quand l'utilisateur confirme (ex. « ok », « oui ») après que Léa ait proposé de chercher le code postal en ligne,
    effectue le géocodage et retourne le résultat pour que la réponse inclue l'adresse complète (rue, ville, code postal).
    """
    if not _is_confirmation_to_search_postal_code(message, last_assistant_message):
        return None
    transaction = await get_user_latest_transaction(db, user_id)
    if not transaction or not _transaction_has_partial_address(transaction):
        return None
    addr_base = (transaction.property_address or "").strip()
    if not addr_base:
        return None
    city = (getattr(transaction, "property_city", None) or "").strip()
    if city and city.lower() not in ("à compléter", "a completer", ""):
        addr_to_geocode = f"{addr_base}, {city}" if "," not in addr_base else addr_base
    else:
        addr_to_geocode = addr_base
    validation = await _validate_address_via_geocode(addr_to_geocode)
    if not validation:
        return None
    try:
        if "," not in addr_base and city and city.lower() not in ("à compléter", "a completer", ""):
            transaction.property_address = addr_to_geocode
        if validation.get("state"):
            state = validation["state"]
            if "québec" in state.lower() or "quebec" in state.lower() or state.upper() == "QC":
                transaction.property_province = "QC"
            elif state.upper() in ("ON", "ONTARIO"):
                transaction.property_province = "ON"
        if validation.get("city"):
            transaction.property_city = validation["city"]
        if validation.get("postcode"):
            transaction.property_postal_code = _format_canadian_postal_code(validation["postcode"])
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea geocoded on user confirmation for transaction id={transaction.id}")
        return (addr_to_geocode, transaction, validation)
    except Exception as e:
        logger.warning(f"Lea geocode on confirmation failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_complete_address_with_city_then_geocode(
    db: AsyncSession, user_id: int, message: str
) -> Optional[Tuple[str, RealEstateTransaction, dict]]:
    """
    Si le message est une ville seule (ex. « Montréal ») et que la dernière transaction a une adresse partielle (rue sans ville),
    combine « rue, ville » et lance le géocodage. Retourne (adresse_complète, transaction, validation) pour les action lines.
    Évite que Léa réponde « Je vais chercher... Un instant » sans que le géocodage soit fait dans le même tour.
    """
    if not _looks_like_city_only(message):
        return None
    transaction = await get_user_latest_transaction(db, user_id)
    if not transaction or not _transaction_has_partial_address(transaction):
        return None
    addr_base = (transaction.property_address or "").strip()
    if not addr_base or "," in addr_base:
        return None
    combined = f"{addr_base}, {message.strip()}"
    validation = await _validate_address_via_geocode(combined)
    if not validation:
        return None
    try:
        transaction.property_address = combined
        if validation.get("state"):
            state = validation["state"]
            if "québec" in state.lower() or "quebec" in state.lower() or state.upper() == "QC":
                transaction.property_province = "QC"
            elif state.upper() in ("ON", "ONTARIO"):
                transaction.property_province = "ON"
        if validation.get("city"):
            transaction.property_city = validation["city"]
        if validation.get("postcode"):
            transaction.property_postal_code = _format_canadian_postal_code(validation["postcode"])
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea completed address with city for transaction id={transaction.id}, geocoded")
        return (combined, transaction, validation)
    except Exception as e:
        logger.warning(f"Lea complete address with city failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_geocode_existing_transaction_address(
    db: AsyncSession, user_id: int, message: str, last_assistant_message: Optional[str] = None
) -> Optional[Tuple[str, RealEstateTransaction, dict]]:
    """Géocode l'adresse de la transaction indiquée (ou la plus récente si pas de ref). Utilise la ref du message ou du dernier message assistant (ex. « transaction 26 »)."""
    if not _wants_to_geocode_existing_address(message):
        return None
    ref = _extract_transaction_ref_from_message(message)
    if not ref and last_assistant_message:
        ref = _extract_transaction_ref_from_message(last_assistant_message)
    if ref:
        transaction = await get_user_transaction_by_ref(db, user_id, ref)
    else:
        transaction = await get_user_latest_transaction(db, user_id)
    if not transaction or not (transaction.property_address and transaction.property_address.strip()):
        return None
    addr = transaction.property_address.strip()
    validation = await _validate_address_via_geocode(addr)
    if not validation:
        return None
    try:
        if validation.get("state"):
            state = validation["state"]
            if "québec" in state.lower() or "quebec" in state.lower() or state.upper() == "QC":
                transaction.property_province = "QC"
            elif state.upper() in ("ON", "ONTARIO"):
                transaction.property_province = "ON"
        if validation.get("city"):
            transaction.property_city = validation["city"]
        if validation.get("postcode"):
            transaction.property_postal_code = _format_canadian_postal_code(validation["postcode"])
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea geocoded existing transaction id={transaction.id} address")
        return (addr, transaction, validation)
    except Exception as e:
        logger.warning(f"Lea geocode existing address failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_set_promise_from_lea(
    db: AsyncSession, user_id: int, message: str, last_assistant_message: Optional[str] = None
):
    """
    Si le message demande de créer la promesse d'achat, enregistre la date sur la transaction concernée.
    N'utilise la dernière transaction que si l'utilisateur (ou le contexte) a référencé une transaction (ref ou adresse).
    Sinon retourne None : ne pas assumer une adresse d'une ancienne conversation.
    """
    if not _wants_to_set_promise(message):
        return None
    ref = _extract_transaction_ref_from_message(message) or (
        _extract_transaction_ref_from_message(last_assistant_message or "") if last_assistant_message else None
    )
    if ref:
        transaction = await get_user_transaction_by_ref(db, user_id, ref)
    else:
        hint = (
            _extract_address_hint_from_message(message)
            or _extract_address_hint_from_message(last_assistant_message or "")
            or _extract_address_hint_from_assistant_message(last_assistant_message or "")
        )
        transaction = await get_user_transaction_by_address_hint(db, user_id, hint) if hint else None
        if not transaction:
            # Ne pas utiliser la dernière transaction : l'utilisateur n'a pas précisé laquelle
            return None
    if not transaction:
        return None
    try:
        transaction.promise_to_purchase_date = date.today()
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea set promise_to_purchase_date on transaction id={transaction.id}")
        return transaction
    except Exception as e:
        logger.warning(f"Lea set promise failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_update_seller_buyer_name_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    transaction_preferred: Optional[RealEstateTransaction] = None,
) -> Optional[str]:
    """
    Si l'utilisateur demande de changer le nom d'un vendeur ou acheteur,
    met à jour l'entrée correspondante dans la transaction. Retourne une ligne pour « Action effectuée » ou None.
    """
    extracted = _extract_rename_seller_buyer_from_message(message, last_assistant_message)
    if not extracted:
        return None
    old_name_search, new_name, role = extracted
    old_lower = old_name_search.lower().strip()
    new_name = new_name.strip()
    if not new_name or len(new_name) < 2:
        return None

    transaction = transaction_preferred
    if not transaction:
        ref = _extract_transaction_ref_from_message(message) or (
            _extract_transaction_ref_from_message(last_assistant_message or "") if last_assistant_message else None
        )
        if ref:
            transaction = await get_user_transaction_by_ref(db, user_id, ref)
        else:
            hint = (
                _extract_address_hint_from_message(message)
                or _extract_address_hint_from_message(last_assistant_message or "")
                or _extract_address_hint_from_assistant_message(last_assistant_message or "")
            )
            transaction = await get_user_transaction_by_address_hint(db, user_id, hint) if hint else None
            if not transaction:
                transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None

    def _name_matches(entry_name: str) -> bool:
        if not entry_name:
            return False
        if old_lower == "*":
            return True
        return old_lower in (entry_name or "").lower()

    list_name = "sellers" if role == "Vendeur" else "buyers"
    items = list(getattr(transaction, list_name, []) or [])
    if not items:
        return None
    updated = False
    for e in items:
        if isinstance(e, dict) and _name_matches(e.get("name") or ""):
            e["name"] = new_name
            updated = True
            break
    if not updated:
        return None
    try:
        setattr(transaction, list_name, items)
        flag_modified(transaction, list_name)
        await db.commit()
        await db.refresh(transaction)
        ref_label = transaction.dossier_number or f"#{transaction.id}"
        role_label = "vendeur" if role == "Vendeur" else "acheteur"
        logger.info(f"Lea renamed {role_label} to « {new_name} » in transaction id={transaction.id}")
        return (
            f"Le nom du {role_label} a été corrigé en « {new_name} » pour la transaction {ref_label}. "
            "Confirme à l'utilisateur que c'est enregistré dans la transaction."
        )
    except Exception as e:
        logger.warning(f"Lea update seller/buyer name failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_add_seller_buyer_contact_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    transaction_preferred: Optional[RealEstateTransaction] = None,
) -> Optional[str]:
    """
    Si le message contient les coordonnées d'un vendeur ou acheteur (ou une liste "les vendeurs sont A et B"),
    ou si l'utilisateur confirme "oui enregistrez" et le dernier message assistant contient "X et Y comme vendeurs",
    crée le(s) contact(s) et l'ajoute à la transaction. Retourne une ligne pour « Action effectuée » ou None.
    """
    # Cas "les vendeurs sont Joseph Perrault et Matthieu Dufour"
    names_list = _extract_seller_buyer_names_list(message, last_assistant_message)
    # Cas "oui enregistrez les" après « Souhaitez-vous enregistrer Michel et Lucie Zapata comme vendeurs ? »
    if not names_list and last_assistant_message:
        t_msg = (message or "").strip().lower()
        if any(
            t_msg.startswith(p) or p in t_msg
            for p in ("oui", "oui enregistrez", "oui enregistrez-les", "oui enregistrez les", "oui enregistrer")
        ) and len(t_msg) < 80:
            names_list = _extract_seller_buyer_names_from_assistant_question(last_assistant_message)
    if names_list:
        role, names = names_list
        transaction = transaction_preferred
        if not transaction:
            ref = _extract_transaction_ref_from_message(message) or (
                _extract_transaction_ref_from_message(last_assistant_message or "") if last_assistant_message else None
            )
            if ref:
                transaction = await get_user_transaction_by_ref(db, user_id, ref)
            else:
                hint = _extract_address_hint_from_message(message) or _extract_address_hint_from_message(last_assistant_message or "") or _extract_address_hint_from_assistant_message(last_assistant_message or "")
                transaction = await get_user_transaction_by_address_hint(db, user_id, hint) if hint else None
                if not transaction:
                    transaction = await get_user_latest_transaction(db, user_id)
        if not transaction or not names:
            return None
        # Mode remplacement : si Léa venait de demander les "nouveaux vendeurs/acheteurs", on remplace la liste au lieu d'ajouter
        last_lower = (last_assistant_message or "").strip().lower()
        replace_sellers = (
            role == "Vendeur"
            and any(
                phrase in last_lower
                for phrase in ("nouveaux vendeurs", "changer les vendeurs", "modifier les vendeurs", "remplacer les vendeurs")
            )
        )
        replace_buyers = (
            role == "Acheteur"
            and any(
                phrase in last_lower
                for phrase in ("nouveaux acheteurs", "changer les acheteurs", "modifier les acheteurs", "remplacer les acheteurs")
            )
        )
        replace_mode = replace_sellers or replace_buyers
        try:
            added = []
            sellers = [] if replace_sellers else list(transaction.sellers) if transaction.sellers else []
            buyers = [] if replace_buyers else list(transaction.buyers) if transaction.buyers else []
            for first_name, last_name in names:
                contact = RealEstateContact(
                    first_name=first_name,
                    last_name=last_name,
                    phone=None,
                    email=None,
                    type=ContactType.CLIENT,
                    user_id=user_id,
                )
                db.add(contact)
                await db.flush()
                await db.refresh(contact)
                tc = TransactionContact(
                    transaction_id=transaction.id,
                    contact_id=contact.id,
                    role=role,
                )
                db.add(tc)
                entry = {"name": f"{first_name} {last_name}".strip(), "phone": None, "email": None}
                if role == "Vendeur":
                    sellers.append(entry)
                else:
                    buyers.append(entry)
                added.append(f"{first_name} {last_name}")
            if role == "Vendeur":
                transaction.sellers = sellers
                flag_modified(transaction, "sellers")
            else:
                transaction.buyers = buyers
                flag_modified(transaction, "buyers")
            await db.commit()
            await db.refresh(transaction)
            ref_label = transaction.dossier_number or f"#{transaction.id}"
            logger.info(f"Lea added {role}s {added} to transaction id={transaction.id}" + (" (replaced)" if replace_mode else ""))
            n = len(added)
            role_lower = role.lower()
            # Singulier : L'acheteur / Le vendeur, a été enregistré / mis à jour
            if n == 1:
                nom = added[0]
                if role_lower == "acheteur":
                    sujet = "L'acheteur"
                else:
                    sujet = "Le vendeur"
                if replace_mode:
                    return (
                        f"{sujet} a été mis à jour pour la transaction {ref_label} : {nom}. "
                        "Confirme à l'utilisateur que c'est enregistré."
                    )
                return (
                    f"{sujet}, {nom}, a été enregistré pour la transaction {ref_label}. "
                    "Confirme à l'utilisateur que c'est enregistré."
                )
            # Pluriel
            if replace_mode:
                return (
                    f"Les {role_lower}s ont été mis à jour pour la transaction {ref_label} : {', '.join(added)}. "
                    "Confirme à l'utilisateur que c'est enregistré."
                )
            return (
                f"Les {role_lower}s ({', '.join(added)}) ont été enregistrés pour la transaction {ref_label}. "
                "Confirme à l'utilisateur que c'est enregistré."
            )
        except Exception as e:
            logger.warning(f"Lea add sellers/buyers list failed: {e}", exc_info=True)
            await db.rollback()
            return None

    extracted = _extract_seller_buyer_contact_from_message(message, last_assistant_message)
    if not extracted:
        return None
    first_name, last_name, phone, email, role = extracted
    transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None
    try:
        contact = RealEstateContact(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            type=ContactType.CLIENT,
            user_id=user_id,
        )
        db.add(contact)
        await db.flush()
        await db.refresh(contact)
        tc = TransactionContact(
            transaction_id=transaction.id,
            contact_id=contact.id,
            role=role,
        )
        db.add(tc)
        sellers = list(transaction.sellers) if transaction.sellers else []
        buyers = list(transaction.buyers) if transaction.buyers else []
        entry = {"name": f"{first_name} {last_name}".strip(), "phone": phone, "email": email}
        if role == "Vendeur":
            sellers.append(entry)
            transaction.sellers = sellers
        else:
            buyers.append(entry)
            transaction.buyers = buyers
        await db.commit()
        await db.refresh(transaction)
        ref = transaction.dossier_number or f"#{transaction.id}"
        logger.info(f"Lea added {role} contact {first_name} {last_name} to transaction id={transaction.id}")
        return (
            f"Les coordonnées du {role.lower()} ({first_name} {last_name}) ont été ajoutées à la transaction {ref}. "
            "Confirme à l'utilisateur que c'est enregistré et qu'il peut voir la transaction dans la section Transactions."
        )
    except Exception as e:
        logger.warning(f"Lea add seller/buyer contact failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_remove_seller_buyer_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    transaction_preferred: Optional[RealEstateTransaction] = None,
) -> Optional[str]:
    """
    Si le message demande de supprimer/retirer un vendeur ou acheteur, le retire de la transaction.
    Retourne une ligne pour « Action effectuée » ou None.
    """
    extracted = _extract_remove_person_from_message(message)
    if not extracted:
        return None
    name_search, role_hint = extracted
    name_lower = name_search.lower().strip()
    if not name_lower:
        return None
    # Récupérer la transaction
    transaction = transaction_preferred
    if not transaction:
        ref = _extract_transaction_ref_from_message(message) or (
            _extract_transaction_ref_from_message(last_assistant_message or "") if last_assistant_message else None
        )
        if ref:
            transaction = await get_user_transaction_by_ref(db, user_id, ref)
        else:
            hint = (
                _extract_address_hint_from_message(message)
                or _extract_address_hint_from_message(last_assistant_message or "")
                or _extract_address_hint_from_assistant_message(last_assistant_message or "")
            )
            transaction = await get_user_transaction_by_address_hint(db, user_id, hint) if hint else None
            if not transaction:
                transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None

    def _name_matches(entry_name: str) -> bool:
        if not entry_name:
            return False
        return name_lower in (entry_name or "").lower()

    removed_from: List[str] = []
    try:
        # 1. Mettre à jour le JSON sellers/buyers
        for list_name, role, role_label in [
            ("sellers", "Vendeur", "vendeur"),
            ("buyers", "Acheteur", "acheteur"),
        ]:
            if role_hint and role_hint != role:
                continue
            items = list(getattr(transaction, list_name, []) or [])
            if not items:
                continue
            original_len = len(items)
            new_items = [e for e in items if not (isinstance(e, dict) and _name_matches(e.get("name") or ""))]
            if len(new_items) < original_len:
                setattr(transaction, list_name, new_items)
                flag_modified(transaction, list_name)
                removed = next(
                    (e.get("name") for e in items if isinstance(e, dict) and _name_matches(e.get("name") or "")),
                    name_search,
                )
                removed_from.append(f"{role_label} {removed}")
        if not removed_from:
            return None
        # 2. Supprimer les TransactionContact correspondants (contacts dont le nom matche)
        from app.models.transaction_contact import TransactionContact
        from sqlalchemy.orm import selectinload

        tc_query = (
            select(TransactionContact)
            .options(selectinload(TransactionContact.contact))
            .join(RealEstateContact, TransactionContact.contact_id == RealEstateContact.id)
            .where(
                TransactionContact.transaction_id == transaction.id,
                RealEstateContact.user_id == user_id,
            )
        )
        if role_hint:
            tc_query = tc_query.where(TransactionContact.role == role_hint)
        tc_result = await db.execute(tc_query)
        for tc in tc_result.scalars().all():
            contact = tc.contact
            full_name = f"{getattr(contact, 'first_name', '') or ''} {getattr(contact, 'last_name', '') or ''}".strip()
            if _name_matches(full_name) or _name_matches(getattr(contact, "first_name", "") or "") or _name_matches(getattr(contact, "last_name", "") or ""):
                await db.delete(tc)
        await db.commit()
        await db.refresh(transaction)
        ref_label = transaction.dossier_number or f"#{transaction.id}"
        logger.info(f"Lea removed {removed_from} from transaction id={transaction.id}")
        return (
            f"{', '.join(removed_from)} a été retiré de la transaction {ref_label}. "
            "Confirme à l'utilisateur que c'est fait."
        )
    except Exception as e:
        logger.warning(f"Lea remove seller/buyer failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_update_transaction_price_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    transaction_preferred: Optional[RealEstateTransaction] = None,
) -> Optional[Tuple[Decimal, RealEstateTransaction, str]]:
    """
    Si le message contient un prix (demandé ou offert), met à jour la transaction (session liée ou dernière).
    Retourne (montant, transaction, "listing"|"offered") ou None.
    """
    if not _wants_to_update_price(message):
        return None
    extracted = _extract_price_from_message(message)
    if not extracted:
        return None
    amount, kind = extracted
    transaction = transaction_preferred if transaction_preferred else await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None
    try:
        if kind == "listing":
            transaction.listing_price = amount
        else:
            transaction.offered_price = amount
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea updated transaction id={transaction.id} {kind} price to {amount}")
        return (amount, transaction, kind)
    except Exception as e:
        logger.warning(f"Lea update price failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def apply_lea_price_from_assistant_content(
    db: AsyncSession, user_id: int, assistant_content: str
) -> str:
    """
    Parse la réponse assistant pour PRIX_LISTING: ou PRIX_OFFERT: (définis dans le prompt Léa),
    met à jour la dernière transaction, et retire ces lignes du contenu renvoyé.
    Retourne le contenu nettoyé (sans les lignes de prix).
    """
    if not assistant_content or not isinstance(assistant_content, str):
        return assistant_content or ""
    content = assistant_content
    transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        return content
    # PRIX_LISTING: 600000 ou PRIX_OFFERT: 500000 (nombre entier, optionnellement espaces autour du :)
    listing_m = re.search(r"PRIX_LISTING\s*:\s*(\d+)", content, re.I)
    offered_m = re.search(r"PRIX_OFFERT\s*:\s*(\d+)", content, re.I)
    try:
        if listing_m:
            amount = Decimal(listing_m.group(1).strip())
            if amount > 0 and amount <= 999_999_999:
                transaction.listing_price = amount
                await db.commit()
                await db.refresh(transaction)
                logger.info(f"Lea updated transaction id={transaction.id} listing_price to {amount} (from LLM)")
        if offered_m:
            amount = Decimal(offered_m.group(1).strip())
            if amount > 0 and amount <= 999_999_999:
                transaction.offered_price = amount
                await db.commit()
                await db.refresh(transaction)
                logger.info(f"Lea updated transaction id={transaction.id} offered_price to {amount} (from LLM)")
    except Exception as e:
        logger.warning(f"Lea apply price from assistant content failed: {e}", exc_info=True)
        await db.rollback()
    # Retirer les lignes pour ne pas les afficher ni les persister
    content = re.sub(r"\s*PRIX_LISTING\s*:\s*\d+\s*", "\n", content, flags=re.I).strip()
    content = re.sub(r"\s*PRIX_OFFERT\s*:\s*\d+\s*", "\n", content, flags=re.I).strip()
    content = re.sub(r"\n{2,}", "\n\n", content).strip()
    return content


def _parse_french_date_from_message(message: str, last_assistant_message: Optional[str] = None) -> Optional[date]:
    """
    Parse une date en français dans le message (ex: "le 15 mars 2026", "15 mars 2026").
    Si last_assistant_message demande la « date de clôture » ou « date d'écriture », accepte une réponse courte (ex: "le 15 mars 2026").
    Retourne un date ou None.
    """
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()
    # Nettoyer artefacts vocaux
    t = re.sub(r"\s+(?:vocal|local|locales?)\s+terminé.*$", "", t, flags=re.I).strip()
    if len(t) < 5:
        return None
    # Mois en français (avec et sans accents)
    months = {
        "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5,
        "juin": 6, "juillet": 7, "août": 8, "aout": 8, "septembre": 9,
        "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
    }
    # Pattern: (le)? 15 mars 2026 ou 15/03/2026
    m = re.search(
        r"(?:le\s+)?(\d{1,2})\s+(" + "|".join(months.keys()) + r")\s+(\d{4})",
        t,
        re.I,
    )
    if m:
        day, month_name, year = int(m.group(1)), months.get(m.group(2).lower()), int(m.group(3))
        if month_name and 1 <= day <= 31 and 2000 <= year <= 2100:
            try:
                return date(year, month_name, day)
            except ValueError:
                return None
    # Format court 15/03/2026
    m = re.search(r"(?:le\s+)?(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", t)
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= day <= 31 and 1 <= month <= 12 and 2000 <= year <= 2100:
            try:
                return date(year, month, day)
            except ValueError:
                return None
    # Réponse très courte après une question sur la date (ex: "le 15 mars 2026" seul)
    last_lower = (last_assistant_message or "").strip().lower()
    if last_assistant_message and (
        "date de clôture" in last_lower or "date d'écriture" in last_lower
        or "date d écriture" in last_lower or "clôture prévue" in last_lower
    ):
        if len(t) <= 50 and re.search(r"\d{1,2}\s*(?:/|\s)\s*(?:\d{1,2}|(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre))\s*(?:/|\s)\s*\d{4}", t, re.I):
            return _parse_french_date_from_message(t, None)
    return None


async def maybe_set_expected_closing_date_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    transaction_preferred: Optional[RealEstateTransaction] = None,
) -> Optional[Tuple[date, RealEstateTransaction]]:
    """
    Si le message contient une date de clôture/écriture prévue, met à jour la transaction (session liée ou dernière).
    Retourne (date, transaction) ou None.
    """
    parsed = _parse_french_date_from_message(message, last_assistant_message)
    if not parsed:
        return None
    transaction = transaction_preferred if transaction_preferred else await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None
    try:
        transaction.expected_closing_date = parsed
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea set expected_closing_date on transaction id={transaction.id} to {parsed}")
        return (parsed, transaction)
    except Exception as e:
        logger.warning(f"Lea set expected_closing_date failed: {e}", exc_info=True)
        await db.rollback()
        return None


def _get_lea_guidance_lines(message: str) -> list[str]:
    """
    Pour les demandes reconnues mais sans action concrète (modifier transaction, ajouter contact,
    formulaire OACIQ), retourne des lignes de guidage pour le bloc « Action effectuée » afin que
    Léa pose les bonnes questions au lieu de dire « je ne peux pas ».
    """
    t = (message or "").strip().lower()
    if not t:
        return []
    lines = []

    # Message = uniquement artefact vocal ("local terminé") — rester sur la transaction en cours
    if re.match(r"^(local|locales|vocal|vocale)\s+terminé\.?$", t, re.I) or t.strip() in ("local terminé", "locales terminé", "vocal terminé"):
        lines.append(
            "L'utilisateur a peut-être dit « local terminé » (artefact de fin de phrase vocale). "
            "Rester sur la transaction en cours (la plus récente) ; ne pas mentionner une autre transaction. Demander de clarifier ou poursuivre (ex. qui sont les acheteurs, quel est le prix)."
        )

    # « se coucher » / « c'est couché » : probable reconnaissance vocale de « c'est bon » / « c'est correct » — traiter comme confirmation
    if re.match(r"^(se\s+coucher|c['']est\s+couché|couche)\s*\.?$", t, re.I) or t.strip() in ("se coucher", "c'est couché", "couché"):
        lines.append(
            "L'utilisateur a peut-être dit « c'est bon » ou « c'est correct » (reconnaissance vocale : « se coucher »). "
            "Interprète comme une confirmation. Passe à la section suivante du formulaire ou confirme que c'est noté, puis propose la prochaine étape (ex. demander la ville pour l'adresse puis proposer le géocodage pour le code postal, ou section suivante)."
        )

    # "Je t'ai déjà donné les vendeurs" / "je t'ai déjà dit" (prix, vendeurs, etc.) — ne pas redemander
    if any(
        phrase in t
        for phrase in ("déjà donné", "déjà dit", "je t'ai dit", "j'ai déjà")
    ) and any(word in t for word in ("vendeur", "acheteur", "prix", "adresse")):
        lines.append(
            "L'utilisateur indique avoir déjà fourni cette information. Confirme que c'est noté, présente tes excuses si besoin, et ne redemande pas cette information."
        )

    # "Je viens de parler de cette transaction" — rester sur la même transaction, ne pas redemander les vendeurs/acheteurs
    if "je viens de parler" in t and "transaction" in t:
        lines.append(
            "L'utilisateur parle de la même transaction que dans l'échange précédent. "
            "Ne redemande pas « Qui sont les vendeurs ? » ni les acheteurs si l'utilisateur vient de les donner. "
            "Passe à la prochaine des 4 infos (adresse, vendeurs, acheteurs, prix) si il en manque ; sinon propose « Souhaitez-vous ajouter une autre information ? » ou confirme."
        )

    # Pas d'acheteurs / mise en vente — ne pas redemander les acheteurs
    if any(
        phrase in t
        for phrase in (
            "pas d'acheteurs",
            "pas encore d'acheteurs",
            "aucun acheteur",
            "mettons la maison en vente",
            "on met en vente",
            "mise en vente",
            "pas d acheteurs",
        )
    ):
        lines.append(
            "L'utilisateur a indiqué qu'il n'y a pas encore d'acheteurs (mise en vente). "
            "Ne pas redemander les acheteurs ; passer à la suite (ex. prix demandé, autres détails)."
        )

    # Supprimer / retirer un vendeur ou acheteur (sans nom clair) — demander de préciser
    if any(
        phrase in t
        for phrase in ("supprimer", "supprime", "retirer", "retire", "enlever", "enlève")
    ) and not _extract_remove_person_from_message(message):
        lines.append(
            "L'utilisateur souhaite supprimer ou retirer quelqu'un de la transaction. "
            "Demande-lui le nom de la personne à retirer et si c'est un vendeur ou un acheteur (ex. « supprimer Hind » ou « retirer le vendeur Pierre »). "
            "Une fois qu'il aura précisé, tu pourras effectuer la suppression. Ne dis pas que tu ne peux pas."
        )

    # Changer / modifier les vendeurs ou les acheteurs (sans nouveaux noms encore) — demander les noms pour pouvoir les enregistrer
    if not lines and (
        ("vendeur" in t and ("changer" in t or "changeons" in t or "modifier" in t or "modifions" in t))
        or ("acheteur" in t and ("changer" in t or "changeons" in t or "modifier" in t or "modifions" in t))
    ):
        role_label = "vendeurs" if "vendeur" in t else "acheteurs"
        lines.append(
            f"L'utilisateur souhaite modifier les {role_label} pour une transaction. "
            f"Demande-lui : « Qui sont les nouveaux {role_label} pour cette transaction ? » "
            "Une fois qu'il aura donné les noms (ex. « c'est Jean et Marie »), tu pourras les enregistrer à la place des actuels. Ne dis pas que tu ne peux pas."
        )

    # Modifier une transaction (en cours) — demander quoi modifier (sauf si on vient de traiter vendeurs/acheteurs)
    if not lines and (
        any(
            phrase in t
            for phrase in (
                "modifier une transaction",
                "modifier la transaction",
                "modifier un dossier",
                "changer une transaction",
                "modifier une transaction en cours",
                "modifier ma transaction",
            )
        )
        or ("modifier" in t and "transaction" in t)
    ):
        lines.append(
            "L'utilisateur souhaite modifier une transaction. "
            "Demande-lui quoi modifier (adresse, prix, vendeurs/acheteurs, promesse d'achat) ou sur quelle transaction il veut travailler ; "
            "une fois qu'il aura donné les détails, tu pourras enregistrer les changements. Ne dis pas que tu ne peux pas le faire."
        )

    # Ajouter un contact — demander transaction, rôle et nom
    if not lines and (
        "ajouter un contact" in t
        or "ajouter une contact" in t
        or ("ajouter" in t and "contact" in t)
        or "ajouter un vendeur" in t
        or "ajouter un acheteur" in t
        or "ajouter une vendeur" in t
        or "ajouter une acheteur" in t
    ):
        lines.append(
            "L'utilisateur souhaite ajouter un contact. "
            "Demande pour quelle transaction (ou dis que tu prends la dernière) et quel rôle (vendeur ou acheteur), et le nom du contact ; "
            "une fois qu'il aura donné ces informations, tu pourras l'ajouter à la transaction. Ne dis pas que tu ne peux pas."
        )

    # Formulaires OACIQ / ROI / CQ
    if not lines and (
        "formulaire roi" in t
        or "formulaire cq" in t
        or "formula roi" in t
        or "formula cq" in t
        or "formulaire oaciq" in t
        or "formulaires oaciq" in t
        or "remplir un formulaire" in t
        or "remplir le formulaire" in t
        or "remplir un formula" in t
        or ("formulaire" in t and ("roi" in t or "cq" in t or "oaciq" in t))
        or ("formula" in t and ("roi" in t or "cq" in t))
    ):
        lines.append(
            "L'utilisateur souhaite remplir un formulaire OACIQ. "
            "Pour la promesse d'achat (PA), propose de le remplir avec toi dans le chat (une question à la fois) ; ne dis pas « allez dans Formulaires OACIQ pour compléter ». "
            "S'il a déjà un formulaire en brouillon, il peut te dire « toi complète le » ou « aide-moi à remplir la promesse d'achat » et tu préremplis puis tu guides champ par champ. Pour les autres formulaires, il peut ouvrir Transactions → la transaction → onglet Formulaires OACIQ. Ne dis pas que tu ne peux pas."
        )

    return lines


# Tournures françaises où "as" = verbe avoir (ne pas interpréter comme code OACIQ AS)
_AS_FALSE_POSITIVE_PREFIXES = ("as-t-on", "as-tu", "as-t-il", "as-t-elle", "as-t-ils", "as-t-elles")


def _action_lines_contain_oaciq_form_creation(action_lines: list) -> bool:
    """True si une des lignes d'action indique la création d'un formulaire OACIQ."""
    if not action_lines:
        return False
    for line in action_lines:
        s = (line or "").strip()
        if s.startswith(OACIQ_FORM_CREATION_PREFIX) or OACIQ_FORM_CREATION_MARKER in s:
            return True
    return False


def _action_lines_contain_first_field_question(action_lines: list) -> bool:
    """True si les actions demandent de poser la question du premier champ (guidage PA en conversation)."""
    if not action_lines:
        return False
    for line in action_lines:
        s = (line or "").strip().lower()
        if "demande immédiatement" in s and "premier champ" in s:
            return True
    return False


def _action_lines_contain_pa_form_complete(action_lines: list) -> bool:
    """True si les actions indiquent que le formulaire PA est entièrement rempli."""
    if not action_lines:
        return False
    for line in (action_lines or []):
        s = (line or "").strip().lower()
        if "tous les champs requis du formulaire pa sont remplis" in s:
            return True
    return False


def _action_lines_contain_pa_fill_next_section(action_lines: list) -> bool:
    """True si les actions demandent de poser la question pour la section suivante (remplissage PA)."""
    if not action_lines:
        return False
    for line in (action_lines or []):
        s = (line or "").strip().lower()
        if "pour la section" in s and "il me manque" in s:
            return True
    return False


def _build_pa_form_complete_response(action_lines: list) -> Optional[str]:
    """Réponse quand le formulaire PA est entièrement rempli."""
    if not _action_lines_contain_pa_form_complete(action_lines):
        return None
    # Extraire la date de clôture si mentionnée
    date_cloture = None
    for line in (action_lines or []):
        m = re.search(r"date de clôture prévue.*?(\d{1,2}\s+\w+\s+\d{4})", line, re.I)
        if m:
            date_cloture = m.group(1).strip()
            break
    msg = (
        "Tous les champs du formulaire PA sont remplis. "
        "Vous pouvez aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier et signer (les signatures se font dans l'interface)."
    )
    if date_cloture:
        msg = f"La date de clôture ({date_cloture}) a été enregistrée. " + msg
    return msg


def _build_pa_fill_next_section_response(action_lines: list) -> Optional[str]:
    """Construit la réponse quand il faut demander la section suivante du PA (bypass LLM pour garantir la question)."""
    for line in (action_lines or []):
        line = (line or "").strip()
        m = re.search(r"Pour la section « ([^»]+) », il me manque : ([^.]+)", line)
        if m:
            section_title = m.group(1).strip()
            labels_str = m.group(2).strip()
            return (
                f"Merci, les informations ont été enregistrées. "
                f"Pour la section « {section_title} », il me manque : {labels_str}. "
                "Tu peux tout envoyer en un seul message."
            )
    return None


def _build_oaciq_form_creation_confirmation(action_lines: list) -> str:
    """Construit le message de confirmation utilisateur quand un formulaire OACIQ a été créé."""
    tx_label = None
    form_name = None
    code = None
    section_fields = None  # (section_title, liste des labels)

    for line in (action_lines or []):
        line = (line or "").strip()
        # Ligne "Demande immédiatement... les infos pour la section « X » : A, B, C"
        if "demande immédiatement" in line.lower() and "les infos pour la section" in line.lower():
            m_sect = re.search(r"section « ([^»]+) » : ([^.]+)\. Il peut", line)
            if m_sect:
                section_title = m_sect.group(1).strip()
                labels_str = m_sect.group(2).strip()
                section_fields = (section_title, labels_str)
        # Ligne création formulaire
        if line.startswith(OACIQ_FORM_CREATION_PREFIX) or OACIQ_FORM_CREATION_MARKER in line:
            m = re.search(r"formulaire OACIQ « ([^»]+) » \(code (\w+)\) pour la transaction ([^.]+)\.", line)
            if m:
                form_name, code, tx_label = m.group(1).strip(), m.group(2), m.group(3).strip()

    if tx_label and (code or "").upper() == "PA":
        if section_fields:
            section_title, labels_str = section_fields
            return (
                f"C'est fait ! J'ai créé la promesse d'achat pour la transaction {tx_label}. "
                f"Pour la section {section_title}, il me faut : {labels_str}. "
                "Vous pouvez tout envoyer en un seul message."
            )
        return (
            f"C'est fait ! J'ai créé la promesse d'achat pour la transaction {tx_label}. "
            "Je vais vous guider pour remplir les champs dans ce chat — répondez à ma prochaine question."
        )
    if tx_label and form_name and code:
        return (
            f"C'est fait ! J'ai créé le formulaire OACIQ « {form_name} » (code {code}) pour la transaction {tx_label}. "
            "Vous pouvez le compléter dans Transactions → cette transaction → onglet Formulaires OACIQ."
        )
    return (
        "C'est fait ! J'ai créé la promesse d'achat pour cette transaction. "
        "Je vais vous guider pour remplir les champs dans ce chat — répondez à ma prochaine question."
    )


async def _create_oaciq_form_submission_for_transaction(
    db: AsyncSession, user_id: int, transaction: RealEstateTransaction, form_code: str = "PA"
) -> Optional[Tuple[str, RealEstateTransaction]]:
    """Crée une soumission (brouillon) du formulaire OACIQ pour la transaction donnée. Retourne (ligne d'action, transaction) ou None."""
    try:
        result = await db.execute(select(Form).where(Form.code == form_code).limit(1))
        form = result.scalar_one_or_none()
        if not form:
            logger.warning(f"Lea OACIQ form not found: code={form_code}")
            return None
        initial_data: dict = {}
        if form_code == "PA" and getattr(form, "fields", None):
            initial_data = _build_pa_initial_data_from_transaction(transaction, form.fields)
        submission = FormSubmission(
            form_id=form.id,
            data=initial_data,
            user_id=user_id,
            status="draft",
            transaction_id=transaction.id,
            ip_address=None,
            user_agent=None,
        )
        db.add(submission)
        await db.flush()
        await db.refresh(submission)
        version = FormSubmissionVersion(submission_id=submission.id, data=dict(initial_data))
        db.add(version)
        # Faire apparaître la transaction dans la colonne « Promesse d'achat » du pipeline (à la place de « Création du dossier »)
        if form_code == "PA":
            transaction.pipeline_stage = "promesse_achat"
            if not transaction.promise_to_purchase_date:
                transaction.promise_to_purchase_date = date.today()
            flag_modified(transaction, "pipeline_stage")
            flag_modified(transaction, "promise_to_purchase_date")
            await db.flush()
        await db.commit()
        await db.refresh(submission)
        ref_label = transaction.dossier_number or f"#{transaction.id}"
        addr_short = (transaction.property_address or transaction.property_city or "").strip()
        tx_label = f"{addr_short} ({ref_label})" if addr_short else ref_label
        form_name = form.name or f"Formulaire {form_code}"
        logger.info(f"Lea created OACIQ form submission id={submission.id} form_code={form_code} for transaction id={transaction.id}")
        # Message neutre : le guidage (premier champ) sera ajouté par run_lea_actions si session/conv disponibles.
        # Si guidage ajouté, le LLM ne doit pas dire « allez dans Formulaires OACIQ » mais poser la question.
        line = (
            f"Tu viens de créer le formulaire OACIQ « {form_name} » (code {form_code}) pour la transaction {tx_label}. "
            "La soumission est en brouillon. Confirme à l'utilisateur que c'est fait. "
            "Tu DOIS remplir le formulaire AVEC L'UTILISATEUR en conversation : pose UNE question à la fois pour les champs indiqués ci-dessous. "
            "NE PAS indiquer d'aller dans Formulaires OACIQ pour compléter seul — c'est toi qui guides le remplissage ici."
        )
        return (line, transaction)
    except Exception as e:
        logger.warning(f"Lea create OACIQ form submission for transaction failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_create_oaciq_form_submission_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    *,
    wants_create_pa_from_router: Optional[bool] = None,
) -> Optional[Tuple[str, RealEstateTransaction]]:
    """
    Si l'utilisateur demande de créer une promesse d'achat / un formulaire OACIQ pour une transaction,
    crée la soumission (brouillon) liée à la transaction et retourne une ligne pour « Action effectuée ».
    Si wants_create_pa_from_router est True (décision LLM), on ne vérifie pas l'heuristique.
    """
    if wants_create_pa_from_router is not True and not _wants_to_create_oaciq_form_for_transaction(message):
        return None
    form_code = _get_oaciq_form_code_for_lea_message(message)
    ref = _extract_transaction_ref_from_message(message) or (
        _extract_transaction_ref_from_message(last_assistant_message or "") if last_assistant_message else None
    )
    if ref:
        transaction = await get_user_transaction_by_ref(db, user_id, ref)
    else:
        hint = (
            _extract_address_hint_from_message(message)
            or _extract_address_hint_from_message(last_assistant_message or "")
            or _extract_address_hint_from_assistant_message(last_assistant_message or "")
        )
        transaction = await get_user_transaction_by_address_hint(db, user_id, hint) if hint else None
        # Fallback : si l'utilisateur dit « cette transaction », « cette propriété », « pour cette transaction », utiliser la dernière.
        if not transaction and message:
            msg_lower = message.strip().lower()
            if any(
                p in msg_lower
                for p in (
                    "cette transaction",
                    "cette propriété",
                    "pour cette transaction",
                    "pour cette propriété",
                    "la même transaction",
                    "la transaction dont on parlait",
                )
            ):
                transaction = await get_user_latest_transaction(db, user_id)
        # Fallback : si le dernier message de Léa indique qu'on vient de créer une transaction, utiliser la dernière.
        if not transaction and last_assistant_message:
            last_lower = last_assistant_message.strip().lower()
            if (
                "créé la transaction" in last_lower
                or "créé le dossier" in last_lower
                or "created the transaction" in last_lower
                or "a été créée" in last_lower
                or "a ete creee" in last_lower
            ):
                transaction = await get_user_latest_transaction(db, user_id)
        if not transaction:
            return None
    if not transaction:
        return None
    return await _create_oaciq_form_submission_for_transaction(db, user_id, transaction, form_code)  # (line, transaction) or None


def _is_pa_signature_field(field_id: str, field_label: str) -> bool:
    """True si le champ est une signature / acceptation (fiche technique : ne jamais demander dans le chat)."""
    if not field_id and not field_label:
        return False
    s = f"{(field_id or '').lower()} {(field_label or '').lower()}"
    return "signature" in s and ("acheteur" in s or "vendeur" in s or "courtier" in s or "acceptation" in s)


def _get_next_empty_pa_field(form_fields: object, current_data: dict) -> Tuple[Optional[str], Optional[str]]:
    """Retourne (field_id, label) du prochain champ vide (requis d'abord, puis optionnels), ou (None, None).
    Utilise PA_FIELDS_ORDER pour que Léa collecte coordonnées (adresse/tél/courriel acheteur et vendeur)
    et tous les champs métier avant de considérer le formulaire complet (fiche technique). Exclut signatures."""
    flat = _flatten_oaciq_field_defs(form_fields)
    current = current_data or {}
    by_key = {}
    for f in flat:
        key = str(f.get("name") or f.get("id") or "").strip()
        if not key or _is_pa_signature_field(key, str(f.get("label") or "")):
            continue
        by_key[key] = f
    # Ordre : PA_FIELDS_ORDER puis tout champ du formulaire non listé
    ordered_keys: List[str] = []
    for fid in PA_FIELDS_ORDER:
        if fid in by_key:
            ordered_keys.append(fid)
    for key in by_key:
        if key not in ordered_keys:
            ordered_keys.append(key)
    # Requis d'abord (dans cet ordre)
    for key in ordered_keys:
        f = by_key.get(key)
        if not f or not f.get("required"):
            continue
        if not _value_is_filled(current.get(key)):
            return (key, str(f.get("label") or f.get("id") or key))
    # Puis optionnels (dans cet ordre)
    for key in ordered_keys:
        f = by_key.get(key)
        if not f or f.get("required"):
            continue
        if not _value_is_filled(current.get(key)):
            return (key, str(f.get("label") or f.get("id") or key))
    return (None, None)


# Premier champ à demander pour la PA si _get_next_empty_pa_field ne retourne rien (form sans sections ou tout prérempli)
PA_FIRST_FIELD_FALLBACK: Tuple[str, str] = ("acompte", "Montant de l'acompte ($)")

# Ordre de collecte PA (fiche technique) : coordonnées et champs métier avant les autres optionnels
# pour que Léa collecte TOUTES les infos (adresse/tél/courriel acheteur et vendeur, dépôt, conditions, etc.)
PA_FIELDS_ORDER: List[str] = [
    # Déjà souvent préremplis par la transaction (requis)
    "acheteurs", "vendeurs",
    "property_address", "property_city", "property_postal_code", "property_province",
    "prix_offert", "prix_achat", "acompte", "date_acte_vente",
    # Coordonnées des parties (fiche technique §2)
    "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
    "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
    # Dépôt et paiement
    "date_acompte", "delai_remise_depot", "mode_paiement",
    "montant_hypotheque", "delai_financement",
    # Dates et occupation
    "date_occupation",
    # Conditions et documents
    "condition_inspection", "date_limite_inspection", "condition_documents",
    "declarations_vendeur", "declarations_communes",
    # Inclusions / exclusions / autres
    "inclusions", "exclusions", "autres_conditions", "annexes",
    # Acceptation et notaire
    "delai_acceptation", "nom_notaire",
    # Courtier et description
    "courtier_nom", "courtier_permis", "description_immeuble",
]

# Champs PA dont la source de vérité est la transaction : adresse du bien, prix offert, noms acheteurs/vendeurs.
# Le formulaire PA les récupère de la transaction ; on ne les écrase jamais avec les données extraites du message.
PA_FIELDS_FROM_TRANSACTION: frozenset = frozenset({
    "property_address", "property_city", "property_postal_code", "property_province",
    "adresse", "ville", "code_postal", "full_address", "adresse_complete",
    "adresse_immeuble", "adresse_bien", "adresse_complete_immeuble",
    "prix_offert", "prix_achat", "offered_price", "purchase_price", "prix", "prix_demandé", "listing_price",
    "acheteurs", "vendeurs", "buyers", "sellers", "acheteur", "vendeur", "noms_acheteurs", "noms_vendeurs",
})


def _is_valid_pa_value_for_field(field_type: str, value: Any) -> bool:
    """True si la valeur est acceptable pour le type de champ (évite d'enregistrer une phrase comme nombre)."""
    if value is None:
        return False
    t = (field_type or "").strip().lower()
    if t in ("number", "currency"):
        return isinstance(value, (int, float)) and (value == value)
    if t == "date":
        return isinstance(value, str) and len(value) >= 8
    if t in ("datetime-local", "datetime"):
        return isinstance(value, str) and len(value) >= 10
    return True


def _normalize_pa_value(field_type: str, raw: str) -> Any:
    """Normalise la réponse utilisateur pour un champ PA (number, date, text, etc.)."""
    if raw is None:
        return None
    s = (raw or "").strip()
    if not s:
        return None
    t = (field_type or "").strip().lower()
    if t in ("number", "currency"):
        s = re.sub(r"[^\d.,\-]", "", s.replace(",", "."))
        try:
            return float(s) if "." in s else int(s)
        except ValueError:
            return None
    if t == "date":
        # Formats courants: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
            try:
                return datetime.strptime(s[:10], fmt).date().isoformat()
            except ValueError:
                continue
        return s
    if t in ("datetime-local", "datetime"):
        # Garder ISO si déjà yyyy-mm-ddThh:mm ou yyyy-mm-ddThh:mm:ss
        if re.match(r"^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}", s):
            return s[:16] if len(s) >= 16 else s
        for fmt, s_slice in (
            ("%Y-%m-%d %H:%M", s[:16].replace("T", " ")),
            ("%Y-%m-%dT%H:%M", s[:16]),
            ("%d/%m/%Y %H:%M", s[:16].replace("T", " ")),
        ):
            try:
                dt = datetime.strptime(s_slice, fmt)
                return dt.strftime("%Y-%m-%dT%H:%M")
            except ValueError:
                continue
        for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
            try:
                dt = datetime.strptime(s[:10], fmt)
                return dt.strftime("%Y-%m-%dT12:00")
            except ValueError:
                continue
        return s
    return s


async def get_draft_pa_submission_for_transaction(
    db: AsyncSession, user_id: int, transaction: RealEstateTransaction
) -> Optional[Tuple[Any, str, str, object]]:
    """Retourne (FormSubmission, form_code, form_name, form_fields) pour le brouillon PA de la transaction, ou None."""
    try:
        q = (
            select(FormSubmission, Form.code, Form.name, Form.fields)
            .join(Form, FormSubmission.form_id == Form.id)
            .where(
                FormSubmission.transaction_id == transaction.id,
                FormSubmission.user_id == user_id,
                FormSubmission.status == "draft",
                Form.code == "PA",
            )
            .order_by(FormSubmission.submitted_at.desc())
        )
        res = await db.execute(q)
        row = res.first()
        if not row:
            return None
        return (row[0], row[1], row[2], row[3])
    except Exception as e:
        logger.warning(f"get_draft_pa_submission_for_transaction failed: {e}", exc_info=True)
        return None


def _build_fillable_field_by_key(form_fields: object) -> dict:
    """Retourne un dict field_id -> {label, type, ...} pour tous les champs remplissables (hors signature)."""
    flat = _flatten_oaciq_field_defs(form_fields)
    by_key: dict = {}
    for f in flat:
        key = str(f.get("name") or f.get("id") or "").strip()
        if not key or _is_pa_signature_field(key, str(f.get("label") or "")):
            continue
        by_key[key] = f
    return by_key


async def _merge_extracted_pa_and_save(
    db: AsyncSession,
    submission: FormSubmission,
    form_fields: object,
    current: dict,
    extracted: dict,
    by_key: dict,
) -> bool:
    """Fusionne les valeurs extraites (valides) dans current, sauvegarde submission et sync tx.
    Les champs adresse/prix/acheteurs/vendeurs restent toujours pris de la transaction (jamais du message)."""
    tx = None
    if submission.transaction_id:
        tx_r = await db.execute(
            select(RealEstateTransaction).where(RealEstateTransaction.id == submission.transaction_id)
        )
        tx = tx_r.scalar_one_or_none()
    current_with_tx = _overlay_pa_current_with_transaction(tx, current) if tx else dict(current)
    merged = False
    for fid, raw in extracted.items():
        if fid not in by_key or fid in PA_FIELDS_FROM_TRANSACTION:
            continue
        f = by_key[fid]
        ftype = str(f.get("type") or "text")
        if isinstance(raw, str):
            value = _normalize_pa_value(ftype, raw)
        else:
            value = raw
        if value is not None and _is_valid_pa_value_for_field(ftype, value):
            current_with_tx[fid] = value
            merged = True
    if not merged:
        return False
    submission.data = current_with_tx
    flag_modified(submission, "data")
    await db.flush()
    version = FormSubmissionVersion(submission_id=submission.id, data=current)
    db.add(version)
    if submission.transaction_id and tx:
        sync_pa_data_to_transaction(tx, current_with_tx)
    await db.commit()
    await db.refresh(submission)
    return True


async def maybe_oaciq_fill_help_or_save(
    db: AsyncSession,
    user_id: int,
    session_id: Optional[str],
    message: str,
    transaction_preferred: Optional[RealEstateTransaction],
    conv: Optional[LeaConversation],
) -> Tuple[List[str], Optional[dict]]:
    """
    Soit enregistre la réponse de l'utilisateur (extraction LLM multi-champs ou champ unique),
    soit entre en mode « aide au remplissage » et demande les infos par section.
    Retourne (lignes pour Action effectuée, mise à jour de conv.context['oaciq_fill'] ou None).
    """
    if not conv or not session_id:
        return ([], None)
    ctx = conv.context or {}
    oaciq_fill = ctx.get("oaciq_fill")

    async def _load_submission(sub_id: int):
        return await db.execute(
            select(FormSubmission, Form.fields)
            .join(Form, FormSubmission.form_id == Form.id)
            .where(
                FormSubmission.id == int(sub_id),
                FormSubmission.user_id == user_id,
                FormSubmission.status == "draft",
            )
        )

    # --- Réponse en mode section (last_asked_section + missing_in_section) ---
    if isinstance(oaciq_fill, dict) and oaciq_fill.get("last_asked_section"):
        sub_id = oaciq_fill.get("submission_id")
        if not sub_id:
            return ([], {"submission_id": None, "last_asked_field": None, "last_asked_section": None, "missing_in_section": None})
        r = await _load_submission(int(sub_id))
        row = r.first()
        if not row:
            return (["La soumission PA en brouillon n'existe plus. Tu peux proposer à l'utilisateur de créer un nouveau formulaire PA."], {"submission_id": None, "last_asked_field": None, "last_asked_section": None, "missing_in_section": None})
        submission, form_fields = row[0], row[1]
        current = dict(submission.data) if isinstance(submission.data, dict) else {}
        if submission.transaction_id:
            tx_r = await db.execute(
                select(RealEstateTransaction).where(RealEstateTransaction.id == submission.transaction_id)
            )
            tx = tx_r.scalar_one_or_none()
            if tx:
                current = _overlay_pa_current_with_transaction(tx, current)
        by_key = _build_fillable_field_by_key(form_fields)
        missing_in_section = oaciq_fill.get("missing_in_section") or []
        # Extraire depuis tout le formulaire (tous champs vides) pour qu'un long message remplisse plusieurs sections d'un coup
        field_descriptions = _get_all_empty_pa_fields(form_fields, current)
        extracted = await _extract_pa_fields_llm(message, field_descriptions) if field_descriptions else {}
        if extracted:
            await _merge_extracted_pa_and_save(db, submission, form_fields, current, extracted, by_key)
            current = dict(submission.data) if isinstance(submission.data, dict) else {}
        next_section = _get_next_empty_pa_section(form_fields, current)
        if not extracted and missing_in_section:
            section_title = oaciq_fill.get("section_title") or "cette section"
            labels = [item[1] if isinstance(item, (list, tuple)) and len(item) > 1 else (item.get("label", "") if isinstance(item, dict) else "") for item in missing_in_section]
            line = (
                f"Pour la section « {section_title} », il me manque : {', '.join(l for l in labels if l)}. "
                "Tu peux tout envoyer en un seul message."
            )
            return ([line], oaciq_fill)
        if next_section:
            section_id, section_title, missing = next_section
            labels = [m[1] for m in missing]
            missing_ctx = [[m[0], m[1]] for m in missing]
            line = (
                "Valeur(s) enregistrée(s). "
                f"Pour la section « {section_title} », il me manque : {', '.join(labels)}. "
                "Tu peux tout envoyer en un seul message."
            )
            return ([line], {"submission_id": sub_id, "last_asked_section": section_id, "section_title": section_title, "missing_in_section": missing_ctx})
        line = (
            "Tous les champs requis du formulaire PA sont remplis. "
            "Confirme à l'utilisateur et indique-lui d'aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier et signer (les signatures se font dans l'interface). Ne dis pas « pour compléter » — le remplissage s'est fait avec toi dans le chat."
        )
        return ([line], {"submission_id": None, "last_asked_field": None, "last_asked_section": None, "missing_in_section": None})

    # --- Réponse en mode champ (last_asked_field) : essai extraction LLM puis fallback single-field ---
    if isinstance(oaciq_fill, dict) and oaciq_fill.get("last_asked_field"):
        sub_id = oaciq_fill.get("submission_id")
        if not sub_id:
            return ([], {"submission_id": None, "last_asked_field": None})
        r = await _load_submission(int(sub_id))
        row = r.first()
        if not row:
            return (["La soumission PA en brouillon n'existe plus. Tu peux proposer à l'utilisateur de créer un nouveau formulaire PA."], {"submission_id": None, "last_asked_field": None})
        submission, form_fields = row[0], row[1]
        last_asked = oaciq_fill.get("last_asked_field")
        flat = _flatten_oaciq_field_defs(form_fields)
        by_key = _build_fillable_field_by_key(form_fields)
        field_def = next((f for f in flat if (f.get("name") or f.get("id")) == last_asked), None)
        field_type = str(field_def.get("type") or "text") if field_def else "text"
        label = str(field_def.get("label") or last_asked) if field_def else last_asked
        current = dict(submission.data) if isinstance(submission.data, dict) else {}
        if submission.transaction_id:
            tx_r = await db.execute(
                select(RealEstateTransaction).where(RealEstateTransaction.id == submission.transaction_id)
            )
            tx = tx_r.scalar_one_or_none()
            if tx:
                current = _overlay_pa_current_with_transaction(tx, current)

        # Tenter extraction LLM (ne bloque jamais)
        field_descriptions = [(k, str(f.get("label") or k), str(f.get("type") or "text")) for k, f in by_key.items()]
        extracted = await _extract_pa_fields_llm(message, field_descriptions)
        if extracted:
            merged = await _merge_extracted_pa_and_save(db, submission, form_fields, current, extracted, by_key)
            if merged:
                current = dict(submission.data) if isinstance(submission.data, dict) else {}
                next_section = _get_next_empty_pa_section(form_fields, current)
                if next_section:
                    section_id, section_title, missing = next_section
                    labels = [m[1] for m in missing]
                    missing_ctx = [[m[0], m[1]] for m in missing]
                    line = (
                        "Valeur(s) enregistrée(s). "
                        f"Pour la section « {section_title} », il me manque : {', '.join(labels)}. "
                        "Tu peux tout envoyer en un seul message."
                    )
                    return ([line], {"submission_id": sub_id, "last_asked_section": section_id, "section_title": section_title, "missing_in_section": missing_ctx})
                line = (
                    "Tous les champs requis du formulaire PA sont remplis. "
                    "Confirme à l'utilisateur et indique-lui d'aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier et signer (les signatures se font dans l'interface). Ne dis pas « pour compléter » — le remplissage s'est fait avec toi dans le chat."
                )
                return ([line], {"submission_id": None, "last_asked_field": None})

        # Fallback : message = valeur du champ attendu uniquement
        value = _normalize_pa_value(field_type, message)
        if value is not None and _is_valid_pa_value_for_field(field_type, value):
            current[last_asked] = value
            submission.data = current
            flag_modified(submission, "data")
            await db.flush()
            version = FormSubmissionVersion(submission_id=submission.id, data=current)
            db.add(version)
            if submission.transaction_id:
                tx_r = await db.execute(
                    select(RealEstateTransaction).where(RealEstateTransaction.id == submission.transaction_id)
                )
                tx = tx_r.scalar_one_or_none()
                if tx:
                    sync_pa_data_to_transaction(tx, current)
            await db.commit()
            await db.refresh(submission)
            logger.info(f"Lea saved PA field {last_asked}={value} for submission id={submission.id}")
            current_after = dict(submission.data) if isinstance(submission.data, dict) else {}
            if submission.transaction_id:
                tx_r = await db.execute(
                    select(RealEstateTransaction).where(RealEstateTransaction.id == submission.transaction_id)
                )
                tx_after = tx_r.scalar_one_or_none()
                if tx_after:
                    current_after = _overlay_pa_current_with_transaction(tx_after, current_after)
            next_section = _get_next_empty_pa_section(form_fields, current_after)
            if next_section:
                section_id, section_title, missing = next_section
                labels = [m[1] for m in missing]
                missing_ctx = [[m[0], m[1]] for m in missing]
                line = (
                    f"Valeur enregistrée pour le champ « {label} ». "
                    f"Pour la section « {section_title} », il me manque : {', '.join(labels)}. Tu peux tout envoyer en un seul message."
                )
                return ([line], {"submission_id": sub_id, "last_asked_section": section_id, "section_title": section_title, "missing_in_section": missing_ctx})
            next_id, next_label = _get_next_empty_pa_field(form_fields, current_after)
            if next_id:
                line = (
                    f"Valeur enregistrée pour le champ « {label} ». "
                    f"Demande à l'utilisateur la valeur pour le champ suivant : « {next_label} » ({next_id}). Une seule question."
                )
                return ([line], {"submission_id": sub_id, "last_asked_field": next_id})
            line = (
                "Tous les champs requis du formulaire PA sont remplis. "
                "Confirme à l'utilisateur et indique-lui d'aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier et signer (les signatures se font dans l'interface). Ne dis pas « pour compléter » — le remplissage s'est fait avec toi dans le chat."
            )
            return ([line], {"submission_id": None, "last_asked_field": None})
        if value is not None and not _is_valid_pa_value_for_field(field_type, value):
            line = (
                f"La valeur fournie n'est pas valide pour le champ « {label} ». "
                f"Redemande à l'utilisateur la valeur pour le champ « {label} » ({last_asked}). Une seule question."
            )
            return ([line], {"submission_id": sub_id, "last_asked_field": last_asked})
        line = (
            f"La réponse ne correspond pas au format attendu pour le champ « {label} ». "
            f"Redemande à l'utilisateur la valeur pour le champ « {label} » ({last_asked}). Une seule question."
        )
        return ([line], {"submission_id": sub_id, "last_asked_field": last_asked})

    # --- Entrée en mode aide : demander par section ---
    if not _wants_help_filling_oaciq(message) or not transaction_preferred:
        return ([], None)
    draft = await get_draft_pa_submission_for_transaction(db, user_id, transaction_preferred)
    if not draft:
        return (
            [
                "L'utilisateur demande de l'aide pour remplir le formulaire mais il n'y a pas de formulaire PA en brouillon pour cette transaction. "
                "Indique-lui d'aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour créer ou ouvrir le formulaire PA, puis de revenir te demander de l'aide pour le remplir."
            ],
            None,
        )
    submission, form_code, form_name, form_fields = draft[0], draft[1], draft[2], draft[3]
    current = dict(submission.data) if isinstance(submission.data, dict) else {}
    if submission.transaction_id:
        tx_r = await db.execute(
            select(RealEstateTransaction).where(RealEstateTransaction.id == submission.transaction_id)
        )
        tx = tx_r.scalar_one_or_none()
        if tx:
            current = _overlay_pa_current_with_transaction(tx, current)
    next_section = _get_next_empty_pa_section(form_fields, current)
    if next_section:
        section_id, section_title, missing = next_section
        labels = [m[1] for m in missing]
        missing_ctx = [[m[0], m[1]] for m in missing]
        line = (
            f"Tu aides l'utilisateur à remplir le formulaire PA par section. "
            f"Pour la section « {section_title} », il me manque : {', '.join(labels)}. "
            "Demande-lui ces infos (il peut tout envoyer en un seul message)."
        )
        return ([line], {"submission_id": submission.id, "last_asked_section": section_id, "section_title": section_title, "missing_in_section": missing_ctx})
    next_id, next_label = _get_next_empty_pa_field(form_fields, current)
    if not next_id:
        return (
            [
                "Le formulaire PA est déjà entièrement rempli. Indique à l'utilisateur d'aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier et signer."
            ],
            None,
        )
    line = (
        f"Tu aides l'utilisateur à remplir le formulaire PA champ par champ. "
        f"Demande-lui UNE SEULE question : quelle est la valeur pour le champ « {next_label} » (identifiant technique : {next_id}) ? Ne liste pas d'autres champs."
    )
    return ([line], {"submission_id": submission.id, "last_asked_field": next_id})


def _build_oaciq_prefill_from_transaction(tx: RealEstateTransaction) -> dict:
    """
    Préremplissage strict : uniquement les données qu'on a en amont (fiche technique).
    - Parties : noms des acheteurs, noms des vendeurs
    - Propriété : adresse, ville, code postal, province
    - Prix : prix offert, prix d'achat
    Le reste des champs n'est pas prérempli ; l'assistant les demandera.
    """
    full_addr = _format_full_address_ca(
        tx.property_address or "",
        tx.property_city or "",
        getattr(tx, "property_province", None) or "",
        getattr(tx, "property_postal_code", None) or "",
    )
    prefill = {
        "full_address": full_addr.strip() or None,
        "property_address": (tx.property_address or "").strip() or None,
        "property_city": (tx.property_city or "").strip() or None,
        "property_postal_code": (getattr(tx, "property_postal_code", None) or "").strip() or None,
        "property_province": (getattr(tx, "property_province", None) or "").strip() or None,
        "adresse_complete": full_addr.strip() or None,
        "adresse": (tx.property_address or "").strip() or None,
        "ville": (tx.property_city or "").strip() or None,
        "code_postal": (getattr(tx, "property_postal_code", None) or "").strip() or None,
    }
    # Parties : noms seulement (pas les coordonnées)
    if tx.sellers and isinstance(tx.sellers, list):
        names = [e.get("name") for e in tx.sellers if isinstance(e, dict) and e.get("name")]
        if names:
            prefill["sellers"] = names
            prefill["vendeurs"] = ", ".join(names)
    if tx.buyers and isinstance(tx.buyers, list):
        names = [e.get("name") for e in tx.buyers if isinstance(e, dict) and e.get("name")]
        if names:
            prefill["buyers"] = names
            prefill["acheteurs"] = ", ".join(names)
    # Prix
    if tx.listing_price is not None:
        prefill["listing_price"] = float(tx.listing_price)
        prefill["prix_demandé"] = float(tx.listing_price)
    if tx.offered_price is not None:
        prefill["offered_price"] = float(tx.offered_price)
        prefill["prix_offert"] = float(tx.offered_price)
    # Alias pour le formulaire PA
    if prefill.get("property_address"):
        prefill["adresse_immeuble"] = prefill["property_address"]
        prefill["adresse_bien"] = prefill["property_address"]
    if prefill.get("offered_price") is not None:
        prefill["prix_achat"] = prefill["offered_price"]
        prefill["purchase_price"] = prefill["offered_price"]
        prefill["prix"] = prefill["offered_price"]
    if prefill.get("vendeurs"):
        prefill["vendeur"] = prefill["vendeurs"]
        prefill["noms_vendeurs"] = prefill["vendeurs"]
    if prefill.get("acheteurs"):
        prefill["acheteur"] = prefill["acheteurs"]
        prefill["noms_acheteurs"] = prefill["acheteurs"]
    if prefill.get("full_address"):
        prefill["adresse_complete_immeuble"] = prefill["full_address"]
    return {k: v for k, v in prefill.items() if v is not None}


def _overlay_pa_current_with_transaction(
    tx: RealEstateTransaction, current: dict
) -> dict:
    """
    Retourne une copie de current où les champs « source transaction » (adresse, prix, acheteurs, vendeurs)
    sont toujours pris depuis la transaction. Utilisé pour que le PA affiche et utilise les données
    du dossier, pas celles éventuellement collées dans le message.
    """
    prefill = _build_oaciq_prefill_from_transaction(tx)
    out = dict(current)
    for k, v in prefill.items():
        if k in PA_FIELDS_FROM_TRANSACTION and v is not None:
            out[k] = v
    return out


def _build_pa_initial_data_from_transaction(
    transaction: RealEstateTransaction, form_fields: object
) -> dict:
    """
    Construit les données initiales du brouillon PA à partir de la transaction uniquement
    (fiche technique : tous les champs qu'on peut récupérer automatiquement).
    Seuls les clés qui existent dans le formulaire PA sont incluses.
    """
    prefill = _build_oaciq_prefill_from_transaction(transaction)
    flat = _flatten_oaciq_field_defs(form_fields)
    form_keys = set()
    for f in flat:
        key = str(f.get("name") or f.get("id") or "").strip()
        if key:
            form_keys.add(key)
    return {k: v for k, v in prefill.items() if k in form_keys and v is not None}


def _flatten_oaciq_field_defs(form_fields: object) -> list[dict]:
    """Aplatit la structure fields d'un formulaire OACIQ en liste de définitions de champs."""
    if not isinstance(form_fields, dict):
        return []
    sections = form_fields.get("sections")
    if not isinstance(sections, list):
        return []
    out: list[dict] = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        fields = section.get("fields")
        if not isinstance(fields, list):
            continue
        for f in fields:
            if isinstance(f, dict):
                out.append(f)
    return out


def _get_all_empty_pa_fields(form_fields: object, current_data: dict) -> List[Tuple[str, str, str]]:
    """Retourne la liste de tous les champs vides du formulaire PA (toutes sections), ordre des sections.
    Exclut les champs signature. Utilisé pour extraire en une fois tout ce que l'utilisateur envoie."""
    if not isinstance(form_fields, dict):
        return []
    sections = form_fields.get("sections")
    if not isinstance(sections, list):
        return []
    current = current_data or {}
    ordered = [(i, s) for i, s in enumerate(sections) if isinstance(s, dict)]
    ordered.sort(key=lambda x: (x[1].get("order", 999), x[0]))
    out: List[Tuple[str, str, str]] = []
    for _idx, section in ordered:
        fields = section.get("fields")
        if not isinstance(fields, list):
            continue
        for f in fields:
            if not isinstance(f, dict):
                continue
            key = str(f.get("name") or f.get("id") or "").strip()
            if not key or _is_pa_signature_field(key, str(f.get("label") or "")):
                continue
            if not _value_is_filled(current.get(key)):
                label = str(f.get("label") or f.get("id") or key)
                ftype = str(f.get("type") or "text")
                out.append((key, label, ftype))
    return out


def _get_next_empty_pa_section(
    form_fields: object, current_data: dict
) -> Optional[Tuple[str, str, List[Tuple[str, str, str]]]]:
    """Retourne la première section qui a encore des champs vides : (section_id, section_title, [(field_id, label, type), ...]).
    Exclut les champs signature. Ordre des sections = order du formulaire."""
    if not isinstance(form_fields, dict):
        return None
    sections = form_fields.get("sections")
    if not isinstance(sections, list):
        return None
    current = current_data or {}
    # tri par order
    ordered = [(i, s) for i, s in enumerate(sections) if isinstance(s, dict)]
    ordered.sort(key=lambda x: (x[1].get("order", 999), x[0]))
    for _idx, section in ordered:
        section_id = str(section.get("id") or section.get("title") or "")
        section_title = str(section.get("title") or section.get("name") or section_id or "Section")
        fields = section.get("fields")
        if not isinstance(fields, list):
            continue
        missing: List[Tuple[str, str, str]] = []
        for f in fields:
            if not isinstance(f, dict):
                continue
            key = str(f.get("name") or f.get("id") or "").strip()
            if not key or _is_pa_signature_field(key, str(f.get("label") or "")):
                continue
            if not _value_is_filled(current.get(key)):
                label = str(f.get("label") or f.get("id") or key)
                ftype = str(f.get("type") or "text")
                missing.append((key, label, ftype))
        if missing:
            return (section_id, section_title, missing)
    return None


ROUTER_CONFIDENCE_THRESHOLD = 0.5  # En dessous, on bascule sur les heuristiques


def _routing_decision_to_legacy(decision: dict) -> dict:
    """Convertit une RoutingDecision (domain+intent+entities) en format legacy pour run_lea_actions."""
    domain = decision.get("domain") or "other"
    intent = decision.get("intent") or "answer"
    _domain_intent_to_legacy = {
        ("transaction", "create"): "create_transaction",
        ("transaction", "answer"): "create_transaction",
        ("transaction", "update"): "other",
        ("purchase_offer", "create"): "create_pa",
        ("purchase_offer", "confirm"): "create_pa",
        ("purchase_offer", "fill"): "fill_pa",
        ("purchase_offer", "update"): "fill_pa",
        ("purchase_offer", "ask_help"): "fill_pa",
    }
    legacy_intent = _domain_intent_to_legacy.get((domain, intent), "other")
    entities = decision.get("entities") or []
    if isinstance(entities, list):
        entities = [e for e in entities if isinstance(e, dict)]
    return {
        "intent": legacy_intent,
        "tx_type": (decision.get("tx_type") or "")[:10],
        "signals": decision.get("signals") or {},
        "confidence": float(decision.get("confidence", 0.5)),
        "entities": entities,
        "domain": domain,
    }


async def _route_lea_llm(
    message: str,
    last_assistant_message: Optional[str],
    context_summary: str,
) -> Optional[dict]:
    """
    Délègue au routeur lea_chat pour les décisions de routage.
    Le routeur gère Domain-Intent-Entities, fallback legacy et classifieur minimal.
    Retourne un dict avec intent, tx_type, signals, confidence. None si échec (heuristiques).
    """
    if not message or not message.strip():
        return None
    try:
        from app.services.lea_chat import route_user_message

        decision = await route_user_message(message, last_assistant_message, context_summary)
        if decision:
            return _routing_decision_to_legacy(decision)
    except Exception as e:
        logger.debug("lea_chat router failed: %s", e)
    return None


async def _classify_lea_intent_llm(
    message: str,
    last_assistant_message: Optional[str],
    context_summary: str,
) -> Optional[str]:
    """
    Wrapper pour compatibilité : appelle _route_lea_llm et retourne uniquement intent.
    Utilisé en fallback quand on a besoin que d'intent.
    """
    out = await _route_lea_llm(message, last_assistant_message, context_summary)
    return out.get("intent") if out else None


def _value_is_filled(v: object) -> bool:
    if v is None:
        return False
    if isinstance(v, str):
        return bool(v.strip())
    if isinstance(v, list):
        return len(v) > 0
    return True


def _build_pa_field_fallback_value(field_name: str, field_type: str, tx: RealEstateTransaction) -> object | None:
    """
    Fallback pour remplir un maximum de champs PA.
    On privilégie les données transaction; sinon placeholder explicite pour les champs texte.
    """
    n = (field_name or "").strip().lower()
    t = (field_type or "").strip().lower()

    def _iso(val: object) -> str | None:
        if val is None:
            return None
        return val.isoformat() if hasattr(val, "isoformat") else str(val)

    # Valeurs issues de la transaction
    if n in {"acompte", "deposit_amount"} and getattr(tx, "deposit_amount", None) is not None:
        return float(tx.deposit_amount)
    if n in {"montant_hypotheque", "mortgage_amount"} and getattr(tx, "mortgage_amount", None) is not None:
        return float(tx.mortgage_amount)
    if n in {"date_acompte", "date_signature_acheteur"} and getattr(tx, "promise_to_purchase_date", None):
        return _iso(tx.promise_to_purchase_date)
    if n in {"date_signature_vendeur"} and getattr(tx, "promise_acceptance_date", None):
        return _iso(tx.promise_acceptance_date)
    if n in {"date_occupation", "possession_date"} and getattr(tx, "possession_date", None):
        return _iso(tx.possession_date)
    if n in {"date_limite_inspection", "inspection_deadline"} and getattr(tx, "inspection_deadline", None):
        return _iso(tx.inspection_deadline)
    if n in {"delai_financement"} and getattr(tx, "financing_deadline", None):
        try:
            return max(0, (tx.financing_deadline - date.today()).days)
        except Exception:
            return None
    if n in {"condition_inspection"} and getattr(tx, "inspection_deadline", None):
        try:
            return max(0, (tx.inspection_deadline - date.today()).days)
        except Exception:
            return None
    if n in {"inclusions"} and isinstance(getattr(tx, "inclusions", None), list):
        vals = [str(v).strip() for v in (tx.inclusions or []) if str(v).strip()]
        return ", ".join(vals) if vals else None
    if n in {"exclusions"} and isinstance(getattr(tx, "exclusions", None), list):
        vals = [str(v).strip() for v in (tx.exclusions or []) if str(v).strip()]
        return ", ".join(vals) if vals else None
    if n in {"description_immeuble"}:
        parts = []
        if getattr(tx, "property_type", None):
            parts.append(str(tx.property_type))
        if getattr(tx, "bedrooms", None) is not None:
            parts.append(f"{tx.bedrooms} chambres")
        if getattr(tx, "bathrooms", None) is not None:
            parts.append(f"{tx.bathrooms} salles de bain")
        return " - ".join(parts) if parts else None
    if n in {"courtier_nom"} and getattr(tx, "buyer_broker_name", None):
        return str(tx.buyer_broker_name)
    if n in {"courtier_permis"} and getattr(tx, "buyer_broker_oaciq", None):
        return str(tx.buyer_broker_oaciq)

    # Champs texte: placeholder explicite pour permettre un formulaire "entièrement rempli"
    if t in {"text", "textarea"}:
        return "A completer"
    # Champs numériques/date restants: ne pas inventer de valeur.
    return None


async def maybe_prefill_oaciq_form_from_lea(
    db: AsyncSession, user_id: int, message: str, last_assistant_message: Optional[str] = None
) -> Optional[str]:
    """
    Si l'utilisateur demande à Léa de compléter le formulaire (« toi complète le », « remplis le »),
    identifie la transaction, trouve une soumission en brouillon, préremplit avec les données
    de la transaction (adresse, vendeurs, acheteurs, prix, date de clôture) et retourne une ligne d'action.
    """
    if not _wants_lea_to_complete_form(message):
        return None
    ref = _extract_transaction_ref_from_message(message) or (
        _extract_transaction_ref_from_message(last_assistant_message or "") if last_assistant_message else None
    )
    if ref:
        transaction = await get_user_transaction_by_ref(db, user_id, ref)
    else:
        hint = (
            _extract_address_hint_from_message(message)
            or _extract_address_hint_from_message(last_assistant_message or "")
            or _extract_address_hint_from_assistant_message(last_assistant_message or "")
        )
        transaction = await get_user_transaction_by_address_hint(db, user_id, hint) if hint else None
    if not transaction and (message or last_assistant_message):
        # Secours : prendre la dernière transaction si on vient de parler d'un formulaire (ex. « toi complète le » juste après)
        transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        return None
    try:
        q = (
            select(FormSubmission, Form.code, Form.name, Form.fields)
            .join(Form, FormSubmission.form_id == Form.id)
            .where(
                FormSubmission.transaction_id == transaction.id,
                FormSubmission.user_id == user_id,
                FormSubmission.status == "draft",
                Form.code.isnot(None),
            )
            .order_by(FormSubmission.submitted_at.desc())
        )
        res = await db.execute(q)
        row = res.first()
        if not row:
            return (
                "L'utilisateur demande de compléter le formulaire mais il n'y a pas de formulaire en brouillon pour cette transaction. "
                "Indique-lui d'aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour créer ou ouvrir un formulaire, puis de revenir te demander de le préremplir."
            )
        submission, form_code, form_name, form_fields = row[0], row[1], row[2], row[3]
        # Préremplissage strict : uniquement parties (noms), propriété (adresse, ville, CP, province), prix (fiche technique).
        prefill = _build_oaciq_prefill_from_transaction(transaction)
        current = dict(submission.data) if isinstance(submission.data, dict) else {}
        for k, v in prefill.items():
            if v is not None and (k not in current or current[k] in (None, "", [])):
                current[k] = v
        # PA : on n'ajoute pas d'autres champs (pas de fallback) — le reste sera demandé par l'assistant.
        submission.data = current
        sync_pa_data_to_transaction(transaction, current)
        await db.flush()
        version = FormSubmissionVersion(submission_id=submission.id, data=current)
        db.add(version)
        await db.commit()
        await db.refresh(submission)
        ref_label = transaction.dossier_number or f"#{transaction.id}"
        addr_short = (transaction.property_address or transaction.property_city or "").strip()
        tx_label = f"{addr_short} ({ref_label})" if addr_short else ref_label
        name = form_name or f"Formulaire {form_code}"
        logger.info(f"Lea prefilled OACIQ submission id={submission.id} form_code={form_code} for transaction id={transaction.id}")
        if (form_code or "").upper() == "PA":
            return (
                f"Tu viens de préremplir la promesse d'achat pour la transaction {tx_label} avec les données du dossier (adresse, vendeurs, acheteurs, prix, date de clôture). "
                "Confirme que c'est fait. Propose de continuer avec toi dans le chat pour remplir les champs restants (acompte, coordonnées, conditions, etc.). Ne dis pas « allez dans Formulaires OACIQ pour compléter »."
            )
        return (
            f"Tu viens de préremplir le formulaire OACIQ « {name} » (code {form_code}) pour la transaction {tx_label} avec les données du dossier : adresse, vendeurs, acheteurs, prix, date de clôture. "
            "Confirme à l'utilisateur que c'est fait. Il peut aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier."
        )
    except Exception as e:
        logger.warning(f"Lea prefill OACIQ form failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def run_lea_actions(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
    session_id: Optional[str] = None,
    router_decision_override: Optional[dict] = None,
) -> tuple[list, Optional[RealEstateTransaction]]:
    """
    Exécute les actions Léa (création transaction, mise à jour adresse, promesse d'achat).
    Retourne (liste de lignes pour « Action effectuée », transaction créée si création).
    last_assistant_message : dernier message de Léa (pour confirmer « oui enregistrez » avec les noms).
    session_id : si fourni, la transaction liée à la session est utilisée en priorité pour les mises à jour contacts.
    router_decision_override : si fourni par l'orchestrateur, utilisé au lieu du routage interne (évite double LLM).
    """
    lines = []
    transaction_preferred: Optional[RealEstateTransaction] = None
    if session_id:
        transaction_preferred = await get_transaction_for_session(db, user_id, session_id)
    has_transaction = (
        transaction_preferred is not None or (await get_user_latest_transaction(db, user_id)) is not None
    )
    conv = None
    need_conv_commit = False
    deferred_oaciq_fill = None
    pending: dict = {}
    if session_id:
        conv, _ = await get_or_create_lea_conversation(db, user_id, session_id)
        ctx = conv.context or {}
        pending = dict(ctx.get("pending_transaction_creation") or {})
        # Pipeline stricte de création: type -> adresse (géocodée) -> vendeurs -> acheteurs -> prix.
        if pending and not pending.get("stage"):
            if not pending.get("type"):
                pending["stage"] = "type"
            elif not pending.get("address") or not pending.get("city") or not pending.get("postal_code"):
                pending["stage"] = "address"
            elif not pending.get("sellers"):
                pending["stage"] = "sellers"
            elif not pending.get("buyers"):
                pending["stage"] = "buyers"
            elif pending.get("price") is None:
                pending["stage"] = "price"
            else:
                pending["stage"] = "ready"

    # Décisions de routage : utiliser override de l'orchestrateur si fourni, sinon routage interne (LLM/heuristiques)
    router_out: Optional[dict] = router_decision_override
    llm_intent: Optional[str] = None
    llm_tx_type = ""
    asked_property_for_form = False
    user_confirmed_pa = False
    wants_oaciq_or_promise = False
    if not router_decision_override and conv and session_id and message and len(message.strip()) >= 3:
        active_ctx = await load_active_conversation_context(
            db, user_id, session_id, last_assistant_message=last_assistant_message
        )
        context_summary = active_ctx.get("summary", "") or (
            "Conversation générale, pas de dossier en cours de création ni de formulaire PA en cours de remplissage."
        )
        try:
            router_out = await _route_lea_llm(message, last_assistant_message, context_summary)
        except Exception as e:
            logger.debug("LLM router failed: %s", e)
    if router_out and router_out.get("confidence", 0) >= ROUTER_CONFIDENCE_THRESHOLD:
        llm_intent = router_out.get("intent")
        llm_tx_type = (router_out.get("tx_type") or "")[:10]
        sig = router_out.get("signals") or {}
        asked_property_for_form = bool(sig.get("asked_property_for_form"))
        user_confirmed_pa = bool(sig.get("user_confirmed") and sig.get("last_message_asked_to_confirm_pa"))
        wants_oaciq_or_promise = bool(sig.get("user_wants_create_oaciq_form") or sig.get("user_wants_set_promise"))
    else:
        llm_intent = router_out.get("intent") if router_out else None
        asked_property_for_form = _last_message_asked_for_property_for_form(last_assistant_message)
        user_confirmed_pa = _is_short_confirmation_message(message) and _last_message_asked_to_confirm_pa_creation(last_assistant_message)
        wants_oaciq_or_promise = _wants_to_set_promise(message) or _wants_to_create_oaciq_form_for_transaction(message)

    # Cas transversal : intent=cancel — vider le brouillon et réinitialiser le flow
    if (
        router_out
        and router_out.get("intent_verb") == "cancel"
        and conv
        and session_id
        and (ctx.get("pending_transaction_creation") or ctx.get("oaciq_fill"))
    ):
        ctx["pending_transaction_creation"] = {}
        ctx.pop("oaciq_fill", None)
        pending.clear()
        need_conv_commit = True
        lines.append(
            "L'utilisateur a annulé. Confirme que le flow en cours a été abandonné et que vous pouvez commencer une nouvelle conversation."
        )

    # Fusionner les entities du routeur dans pending (Domain-Intent-Entities)
    if router_out and llm_intent == "create_transaction" and conv and session_id:
        entities = router_out.get("entities") or []
        for e in entities:
            if not isinstance(e, dict) or not e.get("name"):
                continue
            name, val = e.get("name"), e.get("value")
            if val is None or val == "":
                continue
            if name == "transaction_type":
                v = str(val).lower()
                if v in ("vente", "achat"):
                    pending["type"] = v
                    if not pending.get("stage"):
                        pending["stage"] = "address"
            elif name in ("property_reference", "address") and isinstance(val, str) and len(val.strip()) >= 5:
                pending["address"] = val.strip()
                if not pending.get("stage"):
                    pending["stage"] = "sellers"
            elif name == "seller_names" and isinstance(val, str):
                sellers = parse_names_for_pending(val)
                if sellers:
                    pending["sellers"] = sellers
                    if not pending.get("stage"):
                        pending["stage"] = "buyers"
            elif name == "buyer_names" and isinstance(val, str):
                buyers = parse_names_for_pending(val)
                if buyers:
                    pending["buyers"] = buyers
                    if not pending.get("stage"):
                        pending["stage"] = "price"
            elif name == "listing_price":
                try:
                    pending["price"] = float(Decimal(str(val)))
                    pending["price_kind"] = "listing"
                except (ValueError, TypeError):
                    pass
            elif name in ("offer_price", "offered_price"):
                try:
                    pending["price"] = float(Decimal(str(val)))
                    pending["price_kind"] = "offered"
                except (ValueError, TypeError):
                    pass

    # Création de transaction : ne lancer que si l'intention n'est pas "create_pa".
    created: Optional[RealEstateTransaction] = None
    duplicate_line = None
    if llm_intent != "create_pa":
        created, duplicate_line = await maybe_create_transaction_from_lea(
            db, user_id, message, last_assistant_message=last_assistant_message
        )
    _ok_create, _tx_type = _wants_to_create_transaction(message)
    ok_create = False if llm_intent == "create_pa" else _ok_create
    tx_type = "" if llm_intent == "create_pa" else (llm_tx_type if llm_tx_type else _tx_type)
    if duplicate_line:
        lines.append(duplicate_line)
        if ok_create and tx_type and conv is not None:
            pending["type"] = tx_type
            pending["stage"] = "address"
    elif created:
        lines.append(
            f"Tu viens de créer une nouvelle transaction pour l'utilisateur : « {created.name} » (id {created.id}). "
            "Confirme-lui que c'est fait et qu'il peut la compléter dans la section Transactions. Ne pose AUCUNE question après (pas d'adresse, etc.) — le dossier est créé."
        )
    else:
        if ok_create and not tx_type:
            lines.append(
                "L'utilisateur souhaite créer une transaction mais n'a pas précisé si c'est une vente ou un achat. "
                "Ta réponse doit contenir **uniquement** la question : « Est-ce une vente ou un achat ? » — NE PAS demander l'adresse ni aucune autre info tant qu'il n'a pas répondu (vente ou achat)."
            )
        elif ok_create and tx_type and conv is not None and llm_intent != "create_pa":
            pending["type"] = tx_type
            pending["stage"] = "address"

    # Si on vient de créer une transaction dans ce tour, cibler celle-ci pour toutes les mises à jour.
    # Si l'utilisateur est en train de constituer un brouillon (pending) sans transaction créée, ne pas
    # appliquer les mises à jour à une transaction existante (chaque nouveau dossier a ses propres données).
    building_new_only = bool(
        pending.get("type") and created is None and session_id
    )
    if created is not None:
        transaction_preferred = created
    elif building_new_only:
        transaction_preferred = None

    # En mode remplissage PA (oaciq_fill avec submission_id), ne pas appliquer les mises à jour transaction
    # (adresse, prix, date de clôture) pour éviter d'interpréter le message PA comme des modifs de la fiche.
    in_pa_fill = bool(
        conv
        and isinstance((conv.context or {}).get("oaciq_fill"), dict)
        and (conv.context or {}).get("oaciq_fill", {}).get("submission_id")
    )

    # T10 : Mise à jour transaction selon entities du routeur (domain=transaction, intent=update)
    if (
        not building_new_only
        and not in_pa_fill
        and transaction_preferred
        and router_out
        and router_out.get("domain") == "transaction"
        and router_out.get("intent_verb") == "update"
    ):
        entities = router_out.get("entities") or []
        if entities:
            updated_tx = await update_transaction_record(db, transaction_preferred, entities)
            if updated_tx:
                ref = updated_tx.dossier_number or f"#{updated_tx.id}"
                lines.append(
                    f"La transaction {ref} a été mise à jour avec les informations fournies. "
                    "Confirme à l'utilisateur que les modifications ont été enregistrées."
                )

    addr_result = None
    if not building_new_only and not in_pa_fill:
        addr_result = await maybe_update_transaction_address_from_lea(
            db, user_id, message, transaction_preferred=transaction_preferred
        )
        if not addr_result and last_assistant_message and _last_message_asked_for_address(last_assistant_message):
            addr_from_msg = _extract_address_from_message(message)
            if addr_from_msg:
                addr_result = await _update_transaction_address_from_context(
                    db, user_id, addr_from_msg, transaction_preferred=transaction_preferred
                )
    if addr_result:
        addr, tx, validation = addr_result[0], addr_result[1], addr_result[2] if len(addr_result) >= 3 else None
        ref = tx.dossier_number or f"#{tx.id}"
        lines.append(
            f"L'adresse a été ajoutée à la transaction {ref} : « {addr} ». "
            "Confirme à l'utilisateur que c'est fait. Ne redemande pas l'adresse dans ta réponse."
        )
        if validation:
            parts = []
            if validation.get("postcode"):
                parts.append(f"code postal {str(validation['postcode'])}")
            if validation.get("city"):
                parts.append(str(validation["city"]))
            if validation.get("state"):
                parts.append(str(validation["state"]))
            if validation.get("country_code"):
                v = validation["country_code"]
                parts.append(str(v) if not isinstance(v, str) else v)
            if parts:
                geocode_str = " — ".join(parts)
                city = validation.get("city") or ""
                postcode = validation.get("postcode") or ""
                state = validation.get("state") or ""
                full_formatted = _format_full_address_ca(addr, city, state, postcode)
                if city and postcode:
                    lines.append(
                        f"Recherche en ligne (géocodage) : « {geocode_str} ». "
                        f"Adresse complète au format officiel à indiquer à l'utilisateur : « {full_formatted} ». "
                        "Tu DOIS écrire cette adresse complète dans ta réponse (format : rue, ville (province) code postal), sans rien enlever. "
                        "INTERDICTION de poser « Qui sont les vendeurs ? » ou toute autre question avant d'avoir écrit cette adresse complète. Une seule phrase pour l'adresse, puis tu pourras poser la suite."
                    )
                    # Si l'utilisateur n'a pas donné la ville (ex. seulement « 8569 delorimier »), exiger confirmation de la ville avant de valider
                    if "," not in (addr or "").strip():
                        lines.append(
                            f"L'utilisateur n'a pas indiqué la ville. Tu DOIS lui demander de confirmer la ville avant de valider l'adresse (ex. « Est-ce bien à {city} ? » ou « La ville est-elle bien {city} ? »). "
                            "Indique l'adresse trouvée avec la ville du géocodage, puis demande explicitement confirmation de la ville ; seulement après sa confirmation tu pourras passer aux vendeurs."
                        )
                else:
                    lines.append(
                        f"Recherche en ligne (géocodage) : « {geocode_str} ». "
                        "Confirme à l'utilisateur que l'adresse a été vérifiée (ville, code postal, province)."
                    )
        else:
            lines.append(
                "La recherche de l'adresse complète en ligne n'a pas donné de résultat. "
                "L'adresse n'est donc PAS encore complète. INTERDICTION de passer aux vendeurs, acheteurs ou prix. "
                "Tu DOIS rester sur l'adresse : demande uniquement la **ville** à l'utilisateur (ne demande pas le code postal). Une fois la ville donnée, propose de trouver le code postal en ligne (géocodage). "
                "Ne pose PAS « Qui sont les vendeurs ? » ni aucune autre question tant que l'adresse n'a pas ville + code postal."
            )
        # Si Léa venait de demander « pour quelle propriété préparer le formulaire » et que l'utilisateur a répondu par l'adresse, créer le formulaire PA pour cette transaction
        if _last_message_asked_for_property_for_form(last_assistant_message):
            oaciq_after_addr = await _create_oaciq_form_submission_for_transaction(db, user_id, tx, "PA")
            if oaciq_after_addr:
                oaciq_line, _oaciq_tx = oaciq_after_addr
                lines.append(oaciq_line)
                # Inclure la liste des champs de la première section dans la même réponse (pas seulement « répondez à ma prochaine question »)
                if session_id and conv:
                    draft = await get_draft_pa_submission_for_transaction(db, user_id, tx)
                    if draft:
                        submission, _fc, _fn, form_fields = draft[0], draft[1], draft[2], draft[3]
                        current = dict(submission.data) if isinstance(submission.data, dict) else {}
                        current = _overlay_pa_current_with_transaction(tx, current)
                        next_section = _get_next_empty_pa_section(form_fields, current)
                        if next_section:
                            section_id, section_title, missing = next_section
                            labels = [m[1] for m in missing]
                            lines.append(
                                f"Demande immédiatement à l'utilisateur les infos pour la section « {section_title} » : {', '.join(labels)}. Il peut tout envoyer en un seul message. "
                                "Tu DOIS écrire dans ta réponse la liste de ces champs (ne pas dire seulement « répondez à ma prochaine question »)."
                            )
                            deferred_oaciq_fill = {
                                "submission_id": submission.id,
                                "last_asked_section": section_id,
                                "section_title": section_title,
                                "missing_in_section": [[m[0], m[1]] for m in missing],
                            }
                        else:
                            next_id, next_label = _get_next_empty_pa_field(form_fields, current)
                            if not next_id or not next_label:
                                next_id, next_label = PA_FIRST_FIELD_FALLBACK
                            lines.append(
                                f"Demande immédiatement à l'utilisateur la valeur pour le premier champ : « {next_label} » ({next_id}). "
                                "Tu DOIS poser la question dans ce message (ex. « Quel est le montant de l'acompte ($) ? »), pas seulement « répondez à ma prochaine question »."
                            )
                            deferred_oaciq_fill = {"submission_id": submission.id, "last_asked_field": next_id}
    # Enregistrer l'adresse dans le brouillon de création (pending) si on collecte pour un nouveau dossier
    # (pas de transaction existante, ou on est en mode « nouveau dossier » depuis une session liée à une autre tx)
    # Ne pas traiter le message comme adresse pour un nouveau dossier si l'utilisateur est en train de remplir un PA.
    if (
        not addr_result
        and pending.get("type")
        and session_id
        and (not has_transaction or building_new_only)
        and pending.get("stage") in (None, "address")
        and not in_pa_fill
    ):
        addr_from_msg = _extract_address_from_message(message)
        if addr_from_msg:
            pending["address"] = addr_from_msg
            validation = await _validate_address_via_geocode(addr_from_msg)
            if validation:
                if validation.get("city"):
                    pending["city"] = validation["city"]
                if validation.get("postcode"):
                    pending["postal_code"] = _format_canadian_postal_code(validation["postcode"])
                # Donner à Léa l'adresse complète géocodée pour qu'elle l'affiche à l'utilisateur
                city = validation.get("city") or ""
                postcode = validation.get("postcode") or ""
                state = validation.get("state") or ""
                full_formatted = _format_full_address_ca(
                    addr_from_msg, city, state, postcode
                )
                if city and postcode:
                    pending["stage"] = "sellers"
                    lines.append(
                        "Recherche en ligne (géocodage) effectuée pour le dossier en cours de création. "
                        f"Adresse complète au format officiel à indiquer à l'utilisateur : « {full_formatted} ». "
                        "Tu DOIS écrire cette adresse complète dans ta réponse (rue, ville (province) code postal), puis confirmer que c'est enregistré, puis poser la question suivante : « Qui sont les vendeurs ? ». "
                        "Ne dis pas seulement « adresse notée » sans afficher l'adresse complète."
                    )
                else:
                    pending["stage"] = "address"
                    lines.append(
                        f"Géocodage partiel : « {full_formatted} ». "
                        "Indique cette adresse à l'utilisateur et demande la ville pour compléter."
                    )
            if not validation:
                pending["stage"] = "address"
                lines.append(
                    f"Adresse notée pour le dossier en cours de création : « {addr_from_msg} ». "
                    "Ne passe pas encore aux vendeurs/acheteurs/prix. Demande uniquement la ville (pas le code postal), puis relance la recherche en ligne."
                )
    # Pendant la création d'un nouveau dossier, si l'utilisateur répond par la ville seule, compléter l'adresse et géocoder.
    if (
        building_new_only
        and pending.get("type")
        and pending.get("address")
        and pending.get("stage") == "address"
        and not addr_result
    ):
        t_city = (message or "").strip()
        city_candidate = None
        m_city = re.search(r"\b(?:à|a)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-\s]{1,40})\s*$", t_city, re.I)
        if m_city:
            city_candidate = m_city.group(1).strip(" .,!?:;")
        elif (
            len(t_city) <= 40
            and not re.search(r"\d", t_city)
            and re.match(r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-\s]+$", t_city)
        ):
            city_candidate = t_city.strip(" .,!?:;")
        if city_candidate:
            addr_with_city = f"{pending['address']}, {city_candidate}"
            validation = await _validate_address_via_geocode(addr_with_city)
            if validation and validation.get("city") and validation.get("postcode"):
                pending["city"] = validation["city"]
                pending["postal_code"] = _format_canadian_postal_code(validation["postcode"])
                pending["stage"] = "sellers"
                full_formatted = _format_full_address_ca(
                    pending["address"],
                    pending["city"],
                    validation.get("state") or "",
                    pending["postal_code"],
                )
                lines.append(
                    f"Adresse complétée et vérifiée pour le dossier en cours de création : « {full_formatted} ». "
                    "Confirme que c'est enregistré puis demande: « Qui sont les vendeurs ? »."
                )
            else:
                lines.append(
                    f"Ville notée (« {city_candidate} »), mais le code postal n'a pas été confirmé automatiquement. "
                    "Reste sur l'adresse et propose de rechercher le code postal en ligne."
                )
    # Correction par l'utilisateur du code postal ou de la ville (sans refournir toute l'adresse) — appliquer en base.
    # Ne pas appliquer en contexte remplissage PA : le message peut contenir plusieurs adresses (acheteur, vendeur, bien)
    # et on ne doit pas écraser l'adresse du bien avec le premier code postal trouvé (ex. H2J 2S4 de l'acheteur).
    if not addr_result and not building_new_only and not in_pa_fill:
        correction_result = await maybe_correct_transaction_postal_or_city_from_lea(
            db, user_id, message, last_assistant_message
        )
        if correction_result:
            tx, field, new_value = correction_result
            ref = tx.dossier_number or f"#{tx.id}"
            if field == "postal":
                lines.append(
                    f"Le code postal de la transaction {ref} a été corrigé en « {new_value} ». "
                    "Confirme à l'utilisateur que la correction est bien enregistrée dans la transaction."
                )
            else:
                lines.append(
                    f"La ville de la transaction {ref} a été corrigée en « {new_value} ». "
                    "Confirme à l'utilisateur que la correction est bien enregistrée dans la transaction."
                )
    # Utilisateur a répondu par la ville seule (ex. « Montréal ») : compléter l'adresse partielle et géocoder dans le même tour
    city_geocode_result = None
    if not addr_result and not building_new_only and not in_pa_fill:
        city_geocode_result = await maybe_complete_address_with_city_then_geocode(db, user_id, message)
        if city_geocode_result:
            addr, tx, validation = city_geocode_result
            ref = tx.dossier_number or f"#{tx.id}"
            lines.append(
                f"Tu viens de trouver le code postal pour la transaction {ref}. C'est fait. "
                "Ta réponse doit être celle d'APRÈS la recherche : donne immédiatement l'adresse complète dans ce message (rue, ville (province) code postal), confirme que c'est enregistré, puis pose la question suivante. "
                "INTERDICTION de dire « Je vais chercher » ou « Un instant » : tu as déjà le résultat, fournis-le maintenant."
            )
            if validation:
                parts = []
                if validation.get("postcode"):
                    parts.append(f"code postal {str(validation['postcode'])}")
                if validation.get("city"):
                    parts.append(str(validation["city"]))
                if validation.get("state"):
                    parts.append(str(validation["state"]))
                if parts:
                    geocode_str = " — ".join(parts)
                    city = validation.get("city") or ""
                    postcode = validation.get("postcode") or ""
                    state = validation.get("state") or ""
                    full_formatted = _format_full_address_ca(addr, city, state, postcode)
                    lines.append(
                        f"Résultat (à donner à l'utilisateur maintenant) : « {full_formatted} ». "
                        "Écris cette adresse complète dans ta réponse, puis « C'est enregistré. » et la prochaine question (ex. Qui sont les vendeurs ?)."
                    )
    # Utilisateur a répondu « ok » / « oui » après la proposition de chercher le code postal en ligne : géocoder et renvoyer le résultat
    confirmation_geocode_result = None
    if not addr_result and not city_geocode_result and not building_new_only and _is_confirmation_to_search_postal_code(message, last_assistant_message):
        confirmation_geocode_result = await maybe_geocode_on_user_confirmation(db, user_id, message, last_assistant_message)
        if confirmation_geocode_result:
            _addr, _tx, validation = confirmation_geocode_result
            ref = _tx.dossier_number or f"#{_tx.id}"
            lines.append(
                "Tu viens de trouver le code postal. Ta réponse doit être celle d'APRÈS la recherche : donne l'adresse complète dans ce message. "
                "Ne dis pas « Un instant » : tu as déjà le résultat, fournis-le maintenant à l'utilisateur."
            )
            if validation:
                parts = []
                if validation.get("postcode"):
                    parts.append(f"code postal {str(validation['postcode'])}")
                if validation.get("city"):
                    parts.append(str(validation["city"]))
                if validation.get("state"):
                    parts.append(str(validation["state"]))
                if parts:
                    geocode_str = " — ".join(parts)
                    city = validation.get("city") or ""
                    postcode = validation.get("postcode") or ""
                    state = validation.get("state") or ""
                    full_formatted = _format_full_address_ca(_addr, city, state, postcode)
                    lines.append(
                        f"Résultat (à donner maintenant) : « {full_formatted} ». Écris cette adresse dans ta réponse, confirme que c'est enregistré, puis pose la question suivante (ex. Qui sont les vendeurs ?)."
                    )
    # Géocodage de l'adresse déjà enregistrée sur la dernière transaction (sans nouvelle adresse dans le message)
    if not addr_result and not city_geocode_result and not confirmation_geocode_result and not building_new_only and _wants_to_geocode_existing_address(message):
        geocode_result = await maybe_geocode_existing_transaction_address(db, user_id, message, last_assistant_message)
        if geocode_result:
            _addr, _tx, validation = geocode_result
            ref = _tx.dossier_number or f"#{_tx.id}"
            lines.append(
                f"Tu viens d'effectuer la recherche en ligne (géocodage) pour la transaction {ref}. "
                "Confirme à l'utilisateur les informations trouvées (ville, code postal, province). Ne dis pas que tu ne peux pas le faire."
            )
            if validation:
                parts = []
                if validation.get("postcode"):
                    parts.append(f"code postal {str(validation['postcode'])}")
                if validation.get("city"):
                    parts.append(str(validation["city"]))
                if validation.get("state"):
                    parts.append(str(validation["state"]))
                if validation.get("country_code"):
                    v = validation["country_code"]
                    parts.append(str(v) if not isinstance(v, str) else v)
                if parts:
                    geocode_str = " — ".join(parts)
                    city = validation.get("city") or ""
                    postcode = validation.get("postcode") or ""
                    state = validation.get("state") or ""
                    full_formatted = _format_full_address_ca(_addr, city, state, postcode)
                    if city and postcode:
                        lines.append(
                            f"Résultat géocodage : « {geocode_str} ». "
                            f"Adresse complète au format officiel à indiquer : « {full_formatted} ». "
                            "Tu DOIS écrire cette adresse complète dans ta réponse (format : rue, ville (province) code postal) et confirmer que c'est enregistré. "
                            "INTERDICTION de dire « Je ne peux pas effectuer cette action » ou « je ne peux pas » : le géocodage a été fait par le système, confirme le résultat à l'utilisateur. "
                            "INTERDICTION de poser « Qui sont les vendeurs ? » ou toute autre question avant d'avoir écrit cette adresse complète."
                        )
                        # Si l'adresse de la transaction n'avait pas de ville (ex. seulement la rue), exiger confirmation de la ville
                        if "," not in (_addr or "").strip():
                            lines.append(
                                f"L'utilisateur n'a pas indiqué la ville. Tu DOIS lui demander de confirmer la ville avant de valider l'adresse (ex. « Est-ce bien à {city} ? » ou « La ville est-elle bien {city} ? »). "
                                "Indique l'adresse trouvée avec la ville du géocodage, puis demande explicitement confirmation de la ville ; seulement après sa confirmation tu pourras passer aux vendeurs."
                            )
    promise_tx = await maybe_set_promise_from_lea(db, user_id, message, last_assistant_message) if not building_new_only else None
    if promise_tx:
        ref = promise_tx.dossier_number or f"#{promise_tx.id}"
        lines.append(
            f"La date de promesse d'achat a été enregistrée sur la transaction {ref}. "
            "Confirme à l'utilisateur que la promesse d'achat est enregistrée et qu'il peut compléter le formulaire dans la section Transactions."
        )
    oaciq_result = (
        await maybe_create_oaciq_form_submission_from_lea(
            db, user_id, message, last_assistant_message,
            wants_create_pa_from_router=wants_oaciq_or_promise if (router_out and router_out.get("confidence", 0) >= ROUTER_CONFIDENCE_THRESHOLD) else None,
        )
        if not building_new_only
        else None
    )
    # Si Léa venait de demander « pour quelle propriété ? » et que l'utilisateur répond par une ref (ex. « 72 »), créer le PA pour cette transaction.
    if not building_new_only and oaciq_result is None and asked_property_for_form:
        ref = _extract_transaction_ref_from_message(message)
        if ref:
            tx_for_pa = await get_user_transaction_by_ref(db, user_id, ref)
            if tx_for_pa:
                oaciq_result = await _create_oaciq_form_submission_for_transaction(db, user_id, tx_for_pa, "PA")
    # Si l'utilisateur confirme (ex. « oui », « exact ») après « Souhaitez-vous créer la PA pour … », créer le PA.
    if not building_new_only and oaciq_result is None and user_confirmed_pa:
        hint = (
            _extract_address_hint_from_message(message)
            or _extract_address_hint_from_message(last_assistant_message or "")
            or _extract_address_hint_from_assistant_message(last_assistant_message or "")
        )
        tx_for_pa = await get_user_transaction_by_address_hint(db, user_id, hint) if hint else None
        if not tx_for_pa and last_assistant_message:
            tx_for_pa = await get_user_latest_transaction(db, user_id)
        if tx_for_pa:
            oaciq_result = await _create_oaciq_form_submission_for_transaction(db, user_id, tx_for_pa, "PA")
    oaciq_line = oaciq_result[0] if oaciq_result else None
    oaciq_tx = oaciq_result[1] if oaciq_result and len(oaciq_result) > 1 else None
    # deferred_oaciq_fill peut déjà être set par le bloc adresse (PA créé après « pour quelle propriété ? » + adresse)
    if oaciq_line:
        lines.append(oaciq_line)
        # Guidage par défaut : dès la création du PA (pas un autre formulaire), proposer la première question
        created_pa = "code pa)" in oaciq_line.lower() or "(code pa) " in oaciq_line.lower()
        tx_for_pa = oaciq_tx or transaction_preferred
        if created_pa and tx_for_pa and session_id and conv:
            draft = await get_draft_pa_submission_for_transaction(db, user_id, tx_for_pa)
            if draft:
                submission, _fc, _fn, form_fields = draft[0], draft[1], draft[2], draft[3]
                current = dict(submission.data) if isinstance(submission.data, dict) else {}
                current = _overlay_pa_current_with_transaction(tx_for_pa, current)
                next_section = _get_next_empty_pa_section(form_fields, current)
                if next_section:
                    section_id, section_title, missing = next_section
                    labels = [m[1] for m in missing]
                    lines.append(
                        f"Demande immédiatement à l'utilisateur les infos pour la section « {section_title} » : {', '.join(labels)}. Il peut tout envoyer en un seul message. "
                        "Tu DOIS écrire dans ta réponse la liste de ces champs (ne pas dire seulement « répondez à ma prochaine question »)."
                    )
                    deferred_oaciq_fill = {
                        "submission_id": submission.id,
                        "last_asked_section": section_id,
                        "section_title": section_title,
                        "missing_in_section": [[m[0], m[1]] for m in missing],
                    }
                else:
                    next_id, next_label = _get_next_empty_pa_field(form_fields, current)
                    if not next_id or not next_label:
                        next_id, next_label = PA_FIRST_FIELD_FALLBACK
                    lines.append(
                        f"Demande immédiatement à l'utilisateur la valeur pour le premier champ : « {next_label} » ({next_id}). "
                        "Tu DOIS poser la question dans ce message (ex. « Quel est le montant de l'acompte ($) ? »), pas seulement « répondez à ma prochaine question »."
                    )
                    deferred_oaciq_fill = {"submission_id": submission.id, "last_asked_field": next_id}
    prefill_line = await maybe_prefill_oaciq_form_from_lea(db, user_id, message, last_assistant_message) if not building_new_only else None
    if prefill_line:
        lines.append(prefill_line)
    # Aide au remplissage champ par champ (PA) : enregistrer la valeur ou demander le prochain champ
    fill_lines, oaciq_fill_ctx = await maybe_oaciq_fill_help_or_save(
        db, user_id, session_id, message, transaction_preferred, conv
    ) if not building_new_only else ([], None)
    if fill_lines:
        lines.extend(fill_lines)
    if oaciq_fill_ctx is not None and conv is not None:
        conv.context = conv.context or {}
        conv.context["oaciq_fill"] = oaciq_fill_ctx
        flag_modified(conv, "context")
        need_conv_commit = True
    elif deferred_oaciq_fill is not None and conv is not None:
        # Premier champ à demander (création PA ce tour) : activer le guidage pour le prochain message utilisateur
        conv.context = conv.context or {}
        conv.context["oaciq_fill"] = deferred_oaciq_fill
        flag_modified(conv, "context")
        need_conv_commit = True
    # Si l'utilisateur demande une promesse d'achat / formulaire sans préciser la transaction ni l'adresse, ne pas assumer la dernière.
    # Ne pas ajouter cette ligne quand il est en train de remplir un PA (ex. « ajoute ces conditions à la promesse d'achat »).
    oaciq_fill_ctx = (conv.context or {}).get("oaciq_fill") if conv else None
    in_pa_fill = isinstance(oaciq_fill_ctx, dict) and oaciq_fill_ctx.get("submission_id")
    if not promise_tx and not oaciq_line and not in_pa_fill and wants_oaciq_or_promise:
        lines.append(
            "L'utilisateur n'a pas précisé pour quelle propriété ni quelle transaction. "
            "Ne prends PAS la dernière transaction par défaut. Demande-lui : « Pour quelle propriété (adresse ou numéro de transaction) souhaitez-vous préparer ce formulaire ? »"
        )
    rename_line = (
        await maybe_update_seller_buyer_name_from_lea(
            db, user_id, message, last_assistant_message, transaction_preferred
        )
        if not building_new_only and not in_pa_fill
        else None
    )
    if rename_line:
        lines.append(rename_line)
    remove_line = (
        await maybe_remove_seller_buyer_from_lea(
            db, user_id, message, last_assistant_message, transaction_preferred
        )
        if not building_new_only and not in_pa_fill
        else None
    )
    if remove_line:
        lines.append(remove_line)
    contact_line = (
        await maybe_add_seller_buyer_contact_from_lea(
            db, user_id, message, last_assistant_message, transaction_preferred
        )
        if not building_new_only and not in_pa_fill
        else None
    )
    if contact_line:
        lines.append(contact_line)
    if (
        (not has_transaction or building_new_only)
        and pending.get("type")
        and pending.get("address")
        and session_id
        and pending.get("stage") in ("sellers", "buyers")
    ):
        sellers_list, buyers_list = _extract_sellers_and_buyers_from_creation_message(message, last_assistant_message)
        # Si on est dans une étape explicite (vendeurs/acheteurs), forcer l'interprétation dans ce rôle
        # quand l'extraction est ambiguë (ex: message court "Melina Miller" après "Qui sont les acheteurs ?").
        stage = pending.get("stage")
        if stage == "buyers" and not buyers_list and sellers_list:
            buyers_list, sellers_list = sellers_list, []
        elif stage == "sellers" and not sellers_list and buyers_list:
            sellers_list, buyers_list = buyers_list, []
        # Fallback nom simple selon l'étape (évite de rester bloqué si le parseur role-rate le contexte)
        if not sellers_list and not buyers_list:
            t_name = (message or "").strip()
            if (
                len(t_name) <= 80
                and not re.search(r"\d", t_name)
                and not re.search(r"\b(pas|aucun|rien|je ne sais)\b", t_name, re.I)
                and re.match(r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-']+$", t_name)
            ):
                words = [w for w in t_name.split() if w.strip()]
                if words:
                    first_name = words[0]
                    last_name = " ".join(words[1:]) if len(words) > 1 else words[0]
                    if stage == "buyers":
                        buyers_list = [(first_name, last_name)]
                    elif stage == "sellers":
                        sellers_list = [(first_name, last_name)]
        if sellers_list or buyers_list:
            pending.setdefault("sellers", [])
            pending.setdefault("buyers", [])
            # Si Léa venait de demander les vendeurs (ou acheteurs), traiter la réponse comme liste complète → remplacer (modif pendant création)
            if sellers_list and _last_message_asked_for_sellers(last_assistant_message):
                pending["sellers"] = [{"first_name": f, "last_name": l} for f, l in sellers_list]
            else:
                for f, l in sellers_list:
                    pending["sellers"].append({"first_name": f, "last_name": l})
            if buyers_list and _last_message_asked_for_buyers(last_assistant_message):
                pending["buyers"] = [{"first_name": f, "last_name": l} for f, l in buyers_list]
            else:
                for f, l in buyers_list:
                    pending["buyers"].append({"first_name": f, "last_name": l})
            if pending.get("stage") == "sellers" and pending["sellers"]:
                pending["stage"] = "buyers"
            if pending.get("stage") == "buyers" and pending["buyers"]:
                pending["stage"] = "price"
            if not (pending["sellers"] and pending["buyers"]):
                missing = []
                if not pending["sellers"]:
                    missing.append("les vendeurs")
                if not pending["buyers"]:
                    missing.append("les acheteurs")
                if missing:
                    lines.append(
                        f"Noms notés pour le dossier en cours de création. Il manque encore : {', '.join(missing)}. Demande-les à l'utilisateur."
                    )
    # Prix depuis le message utilisateur (ex. « le prix c'est 600 000 », « 500k ») — aussi enregistré via réponse LLM (PRIX_LISTING/PRIX_OFFERT)
    # Ne pas mettre à jour la transaction en mode remplissage PA (le message peut contenir des montants pour le formulaire).
    price_result = (
        await maybe_update_transaction_price_from_lea(
            db, user_id, message, transaction_preferred=transaction_preferred
        )
        if not building_new_only and not in_pa_fill
        else None
    )
    if price_result:
        amount, tx, kind = price_result
        ref = tx.dossier_number or f"#{tx.id}"
        label = "prix demandé" if kind == "listing" else "prix offert"
        lines.append(
            f"Le {label} a été enregistré pour la transaction {ref} : {int(amount):,} $. "
            "Confirme à l'utilisateur que c'est enregistré."
        )
    if (
        not price_result
        and (not has_transaction or building_new_only)
        and pending.get("type")
        and pending.get("address")
        and session_id
        and pending.get("stage") == "price"
    ):
        price_tup = _extract_price_from_message(message)
        if price_tup:
            amount, kind = price_tup
            pending["price"] = float(amount)
            pending["price_kind"] = kind
            pending["stage"] = "ready"
            missing = []
            if not pending.get("sellers"):
                missing.append("les vendeurs")
            if not pending.get("buyers"):
                missing.append("les acheteurs")
            if missing:
                lines.append(
                    f"Prix noté pour le dossier en cours de création : {int(amount):,} $. "
                    f"Il manque encore : {', '.join(missing)}. Demande-les à l'utilisateur."
                )
    # Toujours rappeler à Léa de ne pas redemander les acheteurs si l'utilisateur a dit « pas d'acheteurs » / mise en vente
    if any(
        phrase in (message or "").strip().lower()
        for phrase in (
            "pas d'acheteurs",
            "pas encore d'acheteurs",
            "aucun acheteur",
            "mettons la maison en vente",
            "on met en vente",
            "mise en vente",
        )
    ):
        lines.append(
            "L'utilisateur a indiqué qu'il n'y a pas encore d'acheteurs (mise en vente). "
            "Ne pas redemander les acheteurs ; passer à la suite."
        )
    closing_date_result = (
        await maybe_set_expected_closing_date_from_lea(
            db, user_id, message, last_assistant_message, transaction_preferred=transaction_preferred
        )
        if not building_new_only and not in_pa_fill
        else None
    )
    if closing_date_result:
        closing_date_val, tx = closing_date_result
        ref = tx.dossier_number or f"#{tx.id}"
        mois_fr = ("janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre")
        date_str = f"{closing_date_val.day} {mois_fr[closing_date_val.month - 1]} {closing_date_val.year}"
        lines.append(
            f"La date de clôture prévue a été enregistrée pour la transaction {ref} : {date_str}. "
            "Confirme à l'utilisateur que c'est enregistré."
        )

    # Créer la transaction à partir du brouillon (pending) une fois tout collecté (T8, T9)
    if (
        conv is not None
        and session_id
        and pending.get("type")
        and pending.get("address")
        and pending.get("price") is not None
        and (pending.get("sellers") or [])
        and (pending.get("buyers") or [])
    ):
        try:
            tx_type = pending["type"]
            amount = Decimal(str(pending["price"]))
            price_kind = pending.get("price_kind") or "listing"
            sellers_tuples = [(s.get("first_name", ""), s.get("last_name", "")) for s in (pending.get("sellers") or [])]
            buyers_tuples = [(b.get("first_name", ""), b.get("last_name", "")) for b in (pending.get("buyers") or [])]
            transaction = await create_transaction_record(
                db,
                user_id,
                tx_type,
                pending["address"],
                sellers_tuples,
                buyers_tuples,
                amount,
                price_kind=price_kind,
                city=pending.get("city"),
                postal_code=pending.get("postal_code"),
            )
            if transaction:
                created = transaction
                logger.info(
                    f"Lea created transaction id={transaction.id} from pending (type={tx_type}, address={pending['address'][:50]}...)"
                )
                confirm_msg = build_transaction_creation_confirmation(transaction, has_more_info_to_add=True)
                lines.append(
                    f"Tu viens de créer une nouvelle transaction pour l'utilisateur : « {created.name} » (id {created.id}). "
                    f"Confirme-lui : « {confirm_msg} » Ne pose AUCUNE question après — le dossier est créé."
                )
                pending.clear()
                if conv is not None:
                    conv.context = conv.context or {}
                    conv.context["pending_transaction_creation"] = None
                    flag_modified(conv, "context")
                    await db.commit()
                if session_id and created:
                    await link_lea_session_to_transaction(db, user_id, session_id, created.id)
        except Exception as e:
            logger.warning(f"Lea create from pending failed: {e}", exc_info=True)
            await db.rollback()

    if conv is not None and session_id and (pending or need_conv_commit):
        conv.context = conv.context or {}
        if pending:
            conv.context["pending_transaction_creation"] = pending
        flag_modified(conv, "context")
        try:
            await db.commit()
        except Exception as e:
            logger.warning(f"Lea save context failed: {e}", exc_info=True)
            await db.rollback()

    if not lines:
        lines.extend(_get_lea_guidance_lines(message))
    return (lines, created)


def build_llm_messages_from_history(
    conversation_messages: list, new_user_message: str, max_turns: int = 10
) -> list:
    """Construit la liste de messages {role, content} pour le LLM à partir de l'historique."""
    out = []
    if conversation_messages:
        for m in conversation_messages[-(max_turns * 2) :]:
            if isinstance(m, dict) and m.get("role") in ("user", "assistant") and m.get("content"):
                out.append({"role": m["role"], "content": m["content"]})
    out.append({"role": "user", "content": new_user_message})
    return out


async def persist_lea_messages(
    db: AsyncSession,
    user_id: int,
    session_id: str,
    user_content: str,
    assistant_content: str,
    meta: Optional[dict] = None,
) -> None:
    """Enregistre le message utilisateur et la réponse assistant dans LeaConversation."""
    if not session_id:
        return
    try:
        conv, _ = await get_or_create_lea_conversation(db, user_id, session_id)
        now = datetime.utcnow().isoformat()
        user_msg = {"role": "user", "content": user_content, "timestamp": now}
        asst_msg = {"role": "assistant", "content": assistant_content, "timestamp": now}
        if meta:
            if meta.get("actions"):
                asst_msg["actions"] = meta["actions"]
            if meta.get("model"):
                asst_msg["model"] = meta["model"]
            if meta.get("provider"):
                asst_msg["provider"] = meta["provider"]
            if meta.get("usage"):
                asst_msg["usage"] = meta["usage"]
        conv.messages = (conv.messages or []) + [user_msg, asst_msg]
        conv.updated_at = datetime.utcnow()
        await db.commit()
    except Exception as e:
        logger.warning(f"Lea persist messages failed: {e}", exc_info=True)
        await db.rollback()


LEA_TTS_FEMALE_VOICES = ("nova", "shimmer")


async def _synthesize_tts(text: str, voice: str | None = None, speed: float | None = None) -> bytes:
    """Synthèse vocale avec OpenAI TTS (qualité HD). Léa utilise une voix féminine (shimmer par défaut, plus douce et humaine) et un débit légèrement plus rapide."""
    text = (text or "").strip()
    if not text:
        raise ValueError("Texte vide pour TTS")
    settings = get_settings()
    model = (settings.LEA_TTS_MODEL or "tts-1-hd").strip() or "tts-1-hd"
    raw = (voice or settings.LEA_TTS_VOICE or "shimmer").strip() or "shimmer"
    voice_name = raw if raw.lower() in LEA_TTS_FEMALE_VOICES else "shimmer"
    speed_val = speed if speed is not None else getattr(settings, "LEA_TTS_SPEED", 1.35)
    speed_val = max(0.25, min(2.0, float(speed_val)))
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    resp = await client.audio.speech.create(
        model=model,
        voice=voice_name,
        input=text,
        speed=speed_val,
    )
    return resp.content


async def _call_external_agent_chat(message: str, session_id: str | None, conversation_id: int | None) -> dict:
    """
    Appelle l'API agent externe (Django) pour le chat texte.
    Retourne {"response", "conversation_id", "session_id", "assistant_audio_url", "success"}.
    """
    settings = get_settings()
    url = (settings.AGENT_API_URL or "").strip().rstrip("/")
    key = (settings.AGENT_API_KEY or "").strip()
    if not url or not key:
        raise ValueError("AGENT_API_URL and AGENT_API_KEY must be set")
    endpoint_url = f"{url}/api/external/agent/chat"

    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id
    if conversation_id is not None:
        payload["conversation_id"] = conversation_id

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            r = await client.post(
                endpoint_url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": key,
                },
            )
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                error_msg = (
                    f"Agent endpoint not found (404): {endpoint_url}. "
                    "Please verify that the agent server has the endpoint "
                    "POST /api/external/agent/chat implemented. "
                    f"Agent base URL: {url}"
                )
                logger.error(error_msg)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=error_msg,
                )
            # Re-raise other HTTP errors to be handled by the caller
            raise
        except httpx.RequestError as e:
            logger.error(f"Agent request error: {e} for URL: {endpoint_url}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to connect to agent server: {str(e)}",
            )


async def _stream_lea_sse(
    message: str,
    session_id: str | None,
    last_assistant_message: str | None,
    *,
    transaction_id: Optional[int] = None,
    db: AsyncSession,
    user_id: int,
):
    """
    Génère les événements SSE pour le chat Léa intégré (streaming).
    Envoie immédiatement un premier octet (": ok" + status connecting) pour réduire le TTFB,
    puis exécute run_lea_actions, get_lea_user_context, get_or_create_lea_conversation dans le générateur.
    """
    sid = session_id or str(uuid.uuid4())
    yield ": ok\n\n"
    yield f"data: {json.dumps({'status': 'connecting'})}\n\n"
    try:
        if transaction_id and sid:
            await link_lea_session_to_transaction(db, user_id, sid, transaction_id)
        action_lines, created_tx = await run_lea_actions_from_orchestrator(
            db, user_id, message, last_assistant_message, session_id=sid
        )
        # Ne lier la session qu'à une transaction créée dans ce tour ou à celle passée par le client.
        # Ne jamais lier à get_user_latest_transaction() : cela ferait écraser une transaction existante
        # quand l'utilisateur démarre une nouvelle conversation pour en créer une autre.
        if sid and action_lines:
            tx_to_link = created_tx
            if not tx_to_link and transaction_id:
                r = await db.execute(
                    select(RealEstateTransaction).where(
                        and_(
                            RealEstateTransaction.id == transaction_id,
                            RealEstateTransaction.user_id == user_id,
                        )
                    )
                )
                tx_to_link = r.scalar_one_or_none()
            if tx_to_link:
                await link_lea_session_to_transaction(db, user_id, sid, tx_to_link.id)
        # Charger contexte + conversation (même session) en parallèle avec la base de connaissance (cache/session dédiée)
        knowledge_task = asyncio.create_task(_load_lea_knowledge_async())
        user_context = await get_lea_user_context(db, user_id)
        conv, sid = await get_or_create_lea_conversation(db, user_id, session_id)
        lea_knowledge = await knowledge_task
        if action_lines:
            user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
        messages_for_llm = build_llm_messages_from_history(conv.messages or [], message)
        confirmation_text = None
        if created_tx and action_lines:
            # Le backend indique « Ne pose AUCUNE question — le dossier est terminé » : ne pas ajouter de question.
            ref = created_tx.dossier_number or f"#{created_tx.id}"
            confirmation_text = (
                f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                "Vous pouvez la voir et la compléter dans la section Transactions."
            )
        # Bypass pour section suivante : le LLM conclut trop souvent par « n'hésitez pas... »
        # au lieu de demander les champs → on garantit la question.
        if not confirmation_text and _action_lines_contain_pa_fill_next_section(action_lines):
            confirmation_text = _build_pa_fill_next_section_response(action_lines)
        if not confirmation_text and _action_lines_contain_pa_form_complete(action_lines):
            confirmation_text = _build_pa_form_complete_response(action_lines)
        if confirmation_text:
            for i in range(0, len(confirmation_text), 1):
                yield f"data: {json.dumps({'delta': confirmation_text[i]})}\n\n"
            payload = {"done": True, "session_id": sid}
            if action_lines:
                payload["actions"] = action_lines
            yield f"data: {json.dumps(payload)}\n\n"
            if sid:
                await persist_lea_messages(
                    db, user_id, sid,
                    message, confirmation_text,
                    meta={"actions": action_lines},
                )
            return
        settings = get_settings()
        system, _, _ = build_lea_context(
            user_context, action_lines or [], knowledge=lea_knowledge
        )
        service = AIService(provider=AIProvider.AUTO)
        messages = messages_for_llm
        accumulated = []
        async for delta in service.stream_chat_completion(
            messages=messages,
            system_prompt=system or "",
            max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
        ):
            accumulated.append(delta)
            yield f"data: {json.dumps({'delta': delta})}\n\n"
        content = "".join(accumulated)
        content = await apply_lea_price_from_assistant_content(db, user_id, content)
        payload = {"done": True, "session_id": sid}
        if action_lines:
            payload["actions"] = action_lines
        model = getattr(service, "model", None)
        provider = getattr(service, "provider", None)
        if provider is not None:
            payload["provider"] = provider.value if hasattr(provider, "value") else str(provider)
        if model is not None:
            payload["model"] = model
        yield f"data: {json.dumps(payload)}\n\n"
        if sid:
            await persist_lea_messages(
                db, user_id, sid,
                message, content,
                meta={"actions": action_lines, "model": model, "provider": str(provider) if provider else None},
            )
    except Exception as e:
        logger.error(f"Léa stream error: {e}", exc_info=True)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        payload = {"done": True, "session_id": sid}
        yield f"data: {json.dumps(payload)}\n\n"


@router.post("/chat/stream")
@rate_limit_decorator("30/minute")
async def lea_chat_stream(
    request: Request,
    body: LeaChatRequest,
    current_user: User = Depends(get_lea_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with Léa in streaming mode (SSE).
    Used when OPENAI_API_KEY or ANTHROPIC_API_KEY is set for fast, fluid responses.
    Léa a accès aux transactions de l'utilisateur connecté (injectées dans le contexte).
    """
    if not _use_integrated_lea():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Streaming requires OPENAI_API_KEY or ANTHROPIC_API_KEY in the Backend.",
        )
    return StreamingResponse(
        _stream_lea_sse(
            body.message,
            body.session_id,
            body.last_assistant_message,
            transaction_id=body.transaction_id,
            db=db,
            user_id=current_user.id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat", response_model=LeaChatResponse)
@rate_limit_decorator("30/minute")
async def lea_chat(
    request: Request,
    body: LeaChatRequest,
    current_user: User = Depends(get_lea_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with Léa AI assistant.
    Utilise l'IA intégrée (OpenAI/Anthropic) si configurée, pour que le modèle reçoive toujours
    le contexte plateforme et les actions ; sinon utilise l'agent externe en secours.
    """
    # 1) IA intégrée en priorité : contexte + actions sont injectés dans le prompt → Léa peut confirmer les actions
    if _use_integrated_lea():
        try:
            sid = body.session_id or str(uuid.uuid4())
            if body.transaction_id and sid:
                await link_lea_session_to_transaction(db, current_user.id, sid, body.transaction_id)
            action_lines, created_tx = await run_lea_actions_from_orchestrator(
                db, current_user.id, body.message, body.last_assistant_message, session_id=sid
            )
            # Ne lier la session qu'à une transaction créée dans ce tour ou à celle passée par le client.
            # Ne jamais lier à get_user_latest_transaction() pour éviter d'écraser une transaction existante.
            if sid and action_lines:
                tx_to_link = created_tx
                if not tx_to_link and body.transaction_id:
                    r = await db.execute(
                        select(RealEstateTransaction).where(
                            and_(
                                RealEstateTransaction.id == body.transaction_id,
                                RealEstateTransaction.user_id == current_user.id,
                            )
                        )
                    )
                    tx_to_link = r.scalar_one_or_none()
                if tx_to_link:
                    await link_lea_session_to_transaction(db, current_user.id, sid, tx_to_link.id)
            user_context = await get_lea_user_context(db, current_user.id)
            if action_lines:
                user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
            # Quand une transaction vient d'être créée, renvoyer une confirmation directe (sans appeler l'IA). Ne pas poser de question — le dossier est terminé.
            if created_tx and action_lines:
                ref = created_tx.dossier_number or f"#{created_tx.id}"
                confirmation_content = (
                    f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                    "Vous pouvez la voir et la compléter dans la section Transactions."
                )
                if sid:
                    await persist_lea_messages(
                        db, current_user.id, sid,
                        body.message, confirmation_content,
                        meta={"actions": action_lines},
                    )
                return LeaChatResponse(
                    content=confirmation_content,
                    session_id=sid,
                    model=None,
                    provider=None,
                    usage={},
                    actions=action_lines,
                )
            # Bypass pour section suivante : le LLM conclut par « n'hésitez pas... » au lieu
            # de demander les champs → on garantit la question.
            confirmation_content = None
            if _action_lines_contain_pa_fill_next_section(action_lines):
                confirmation_content = _build_pa_fill_next_section_response(action_lines)
            elif _action_lines_contain_pa_form_complete(action_lines):
                confirmation_content = _build_pa_form_complete_response(action_lines)
            if confirmation_content and sid:
                await persist_lea_messages(
                    db, current_user.id, sid,
                    body.message, confirmation_content,
                    meta={"actions": action_lines},
                )
                return LeaChatResponse(
                    content=confirmation_content,
                    session_id=sid,
                    model=None,
                    provider=None,
                    usage={},
                    actions=action_lines,
                )
            # Charger l'historique pour le LLM
            conv, sid = await get_or_create_lea_conversation(db, current_user.id, body.session_id)
            messages_for_llm = build_llm_messages_from_history(conv.messages or [], body.message)
            lea_knowledge = await _get_lea_knowledge_for_prompt(db)
            system_prompt, _, _ = build_lea_context(
                user_context, action_lines or [], knowledge=lea_knowledge
            )
            settings = get_settings()
            service = AIService(provider=AIProvider.AUTO)
            result = await service.chat_completion(
                messages=messages_for_llm,
                system_prompt=system_prompt,
                max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
            )
            content = result.get("content", "")
            content = await apply_lea_price_from_assistant_content(db, current_user.id, content)
            if sid:
                await persist_lea_messages(
                    db, current_user.id, sid,
                    body.message, content,
                    meta={
                        "actions": action_lines,
                        "model": result.get("model"),
                        "provider": result.get("provider"),
                        "usage": result.get("usage"),
                    },
                )
            return LeaChatResponse(
                content=content,
                session_id=sid or body.session_id or "",
                model=result.get("model"),
                provider=result.get("provider"),
                usage=result.get("usage", {}),
                actions=action_lines if action_lines else None,
            )
        except Exception as e:
            logger.error(f"Léa chat integrated error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Léa service error: {str(e)}",
            )

    # 2) Agent externe : exécuter quand même les actions plateforme (création transaction, etc.)
    if not _use_external_agent():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=AGENT_ERR_MSG,
        )
    try:
        action_lines, created_tx = await run_lea_actions_from_orchestrator(
            db, current_user.id, body.message, body.last_assistant_message, session_id=body.session_id
        )
        # En mode agent externe, ne lier la session qu'à la transaction créée dans ce tour.
        if body.session_id and action_lines and created_tx:
            await link_lea_session_to_transaction(db, current_user.id, body.session_id, created_tx.id)
        # Si on a créé une transaction, renvoyer une confirmation directe (pas besoin d'appeler l'agent)
        if action_lines and created_tx:
            ref = created_tx.dossier_number or f"#{created_tx.id}"
            confirmation = (
                f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                "Vous pouvez la voir et la compléter dans la section Transactions."
            )
            return LeaChatResponse(
                content=confirmation,
                session_id=body.session_id or "",
                model=None,
                provider=None,
                usage={},
                actions=action_lines,
            )
        # Autres actions (adresse, prix, formulaire OACIQ, etc.) : confirmation directe pour éviter que l'agent réponde sans contexte
        if action_lines:
            confirmation = None
            if _action_lines_contain_oaciq_form_creation(action_lines) and not _action_lines_contain_first_field_question(action_lines):
                confirmation = _build_oaciq_form_creation_confirmation(action_lines)
            elif _action_lines_contain_pa_fill_next_section(action_lines):
                confirmation = _build_pa_fill_next_section_response(action_lines)
            elif _action_lines_contain_pa_form_complete(action_lines):
                confirmation = _build_pa_form_complete_response(action_lines)
            elif not _action_lines_contain_oaciq_form_creation(action_lines):
                confirmation = (
                    "C'est fait ! Les informations ont été mises à jour. "
                    "Vous pouvez voir la transaction dans la section Transactions."
                )
            if confirmation is not None:
                return LeaChatResponse(
                    content=confirmation,
                    session_id=body.session_id or "",
                    model=None,
                    provider=None,
                    usage={},
                    actions=action_lines,
                )
        message_to_agent = body.message
        data = await _call_external_agent_chat(
            message=message_to_agent,
            session_id=body.session_id,
            conversation_id=None,
        )
        if not data.get("success"):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=data.get("error", "External agent error"),
            )
        sid = data.get("session_id") or body.session_id or ""
        content = data.get("response", "")
        if sid and content:
            await persist_lea_messages(
                db, current_user.id, sid,
                body.message, content,
                meta={
                    "model": data.get("model"),
                    "provider": data.get("provider"),
                    "usage": data.get("usage"),
                },
            )
        return LeaChatResponse(
            content=content,
            session_id=sid,
            model=data.get("model", "gpt-4o"),
            provider=data.get("provider", "openai"),
            usage=data.get("usage", {}),
        )

    except httpx.HTTPError as e:
        logger.error(f"External agent HTTP error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External agent unavailable: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error in Léa chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Léa service error: {str(e)}",
        )


@router.post("/chat/voice")
async def lea_chat_voice(
    request: Request,
    audio: UploadFile = FileParam(...),
    session_id: Optional[str] = FormParam(None),
    conversation_id: Optional[int] = FormParam(None),
    current_user: User = Depends(get_lea_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Message vocal → transcription + réponse Léa + TTS.
    Si OPENAI_API_KEY est défini : flux intégré (Whisper + LLM + TTS) sur la plateforme.
    Sinon : proxy vers l'agent externe (AGENT_API_URL + AGENT_API_KEY).
    """
    # 1. Voix intégrée (plateforme) : Whisper + AIService + TTS
    if _use_integrated_voice():
        try:
            sid = session_id or str(uuid.uuid4())
            content = await audio.read()
            content_type = audio.content_type or "audio/webm"

            transcription = await _transcribe_whisper(content, content_type)
            if not transcription:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Impossible de transcrire l'audio. Parlez plus distinctement ou vérifiez le format.",
                )

            action_lines, created_tx = await run_lea_actions_from_orchestrator(
                db, current_user.id, transcription, session_id=sid
            )
            if sid and created_tx:
                await link_lea_session_to_transaction(db, current_user.id, sid, created_tx.id)
            user_context = await get_lea_user_context(db, current_user.id)
            if action_lines:
                user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
            lea_knowledge = await _get_lea_knowledge_for_prompt(db)
            system_prompt, _, _ = build_lea_context(
                user_context, action_lines or [], knowledge=lea_knowledge
            )
            service = AIService(provider=AIProvider.AUTO)
            messages = [{"role": "user", "content": transcription}]
            settings = get_settings()
            result = await service.chat_completion(
                messages=messages,
                system_prompt=system_prompt,
                max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
            )
            response_text = result.get("content") or ""
            response_text = await apply_lea_price_from_assistant_content(db, current_user.id, response_text)

            audio_bytes: bytes | None = None
            if response_text:
                try:
                    audio_bytes = await _synthesize_tts(response_text)
                except Exception as tts_err:
                    logger.warning(f"TTS failed, response text only: {tts_err}")

            return {
                "success": True,
                "transcription": transcription,
                "response": response_text,
                "session_id": sid,
                "conversation_id": conversation_id,
                "assistant_audio_url": None,
                "assistant_audio_base64": base64.b64encode(audio_bytes).decode() if audio_bytes else None,
                "actions": action_lines if action_lines else None,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Léa voice integrated error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur agent vocal: {str(e)}",
            )

    # 2. Agent externe (Django)
    if not _use_external_agent():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Vocal nécessite OPENAI_API_KEY (plateforme) ou AGENT_API_URL + AGENT_API_KEY (agent externe).",
        )
    try:
        settings = get_settings()
        url = (settings.AGENT_API_URL or "").strip().rstrip("/")
        key = (settings.AGENT_API_KEY or "").strip()
        content = await audio.read()
        field_name = settings.AGENT_VOICE_FIELD or "audio"
        content_type = audio.content_type or "audio/webm"
        files = {field_name: (audio.filename or "recording.webm", content, content_type)}
        data_form = {
            "user_id": str(current_user.id),
            "user_email": current_user.email or "",
        }
        if session_id:
            data_form["session_id"] = session_id
        if conversation_id is not None:
            data_form["conversation_id"] = str(conversation_id)
        async with httpx.AsyncClient(timeout=90.0) as client:
            r = await client.post(
                f"{url}/api/external/agent/chat/voice",
                files=files,
                data=data_form,
                headers={"X-API-Key": key},
            )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        # 400: format refusé - inclure la réponse agent pour débogage
        body = e.response.text
        try:
            err_json = e.response.json()
            detail_msg = err_json.get("detail", str(err_json))
        except Exception:
            detail_msg = body or str(e)
        logger.error(
            f"External agent voice 400: {e} | body={body[:500] if body else '-'}",
            context={"agent_response": body[:500] if body else None},
            exc_info=e,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Agent a refusé la requête (400): {detail_msg}",
        )
    except httpx.HTTPError as e:
        logger.error(f"External agent voice HTTP error: {e}", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External agent unavailable: {str(e)}",
        )


@router.get("/conversations", response_model=List[LeaConversationItem])
async def list_lea_conversations(
    current_user: User = Depends(get_lea_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    """List current user's Léa conversations (most recent first)."""
    try:
        lea_service = LeaService(db=db, user_id=current_user.id)
        items = await lea_service.list_conversations(limit=limit)
        return [LeaConversationItem(**x) for x in items]
    except Exception as e:
        logger.error(f"Error listing Léa conversations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/conversations/by-transaction/{transaction_id}", response_model=List[LeaConversationItem])
async def list_lea_conversations_by_transaction(
    transaction_id: int,
    current_user: User = Depends(get_lea_user),
    db: AsyncSession = Depends(get_db),
):
    """List Léa conversations linked to the given transaction (for transaction detail page)."""
    try:
        from sqlalchemy import select
        stmt = (
            select(LeaSessionTransactionLink)
            .where(
                LeaSessionTransactionLink.transaction_id == transaction_id,
                LeaSessionTransactionLink.user_id == current_user.id,
            )
            .order_by(LeaSessionTransactionLink.created_at.desc())
        )
        r = await db.execute(stmt)
        links = r.scalars().all()
        items = []
        for link in links:
            dt = link.created_at
            date_str = dt.strftime("%d/%m/%Y %H:%M") if dt else None
            items.append(
                LeaConversationItem(
                    session_id=link.session_id,
                    title=f"Conversation du {date_str}" if date_str else "Conversation Léa",
                    updated_at=date_str,
                )
            )
        return items
    except Exception as e:
        logger.error(f"Error listing Léa conversations by transaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/context", response_model=LeaContextResponse)
async def get_lea_context(
    session_id: Optional[str] = Query(None, description="Session ID of the conversation to load"),
    current_user: User = Depends(get_lea_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get Léa conversation context (messages). Used by loadConversation on the frontend.
    """
    try:
        lea_service = LeaService(db=db, user_id=current_user.id)
        conversation = await lea_service.get_or_create_conversation(session_id)
        
        return LeaContextResponse(
            session_id=conversation.session_id,
            message_count=len(conversation.messages or []),
            messages=conversation.messages or []
        )
        
    except Exception as e:
        logger.error(f"Error getting Léa context: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting context: {str(e)}",
        )


@router.delete("/context")
async def reset_lea_context(
    session_id: Optional[str] = None,
    current_user: User = Depends(get_lea_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset Léa conversation context.
    """
    try:
        from app.models.lea_conversation import LeaConversation
        from sqlalchemy import select, delete
        
        if session_id:
            # Delete specific conversation
            stmt = delete(LeaConversation).where(
                LeaConversation.session_id == session_id,
                LeaConversation.user_id == current_user.id
            )
        else:
            # Delete all user conversations
            stmt = delete(LeaConversation).where(
                LeaConversation.user_id == current_user.id
            )
        
        await db.execute(stmt)
        await db.commit()
        
        return {"message": "Context reset successfully"}
        
    except Exception as e:
        logger.error(f"Error resetting Léa context: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting context: {str(e)}",
        )


@router.get("/settings", response_model=LeaSettingsResponse)
async def get_lea_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin_or_superadmin),
):
    """
    Get Léa settings (admin/superadmin). Returns current config from environment and defaults.
    """
    settings = get_settings()
    return LeaSettingsResponse(
        system_prompt=LEA_SYSTEM_PROMPT,
        max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
        tts_model=getattr(settings, "LEA_TTS_MODEL", "tts-1-hd"),
        tts_voice=getattr(settings, "LEA_TTS_VOICE", "shimmer"),
    )


@router.put("/settings", response_model=LeaSettingsResponse)
async def update_lea_settings(
    payload: LeaSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin_or_superadmin),
):
    """
    Update Léa settings (admin/superadmin). Persistence not implemented yet; returns 501.
    When implemented, store in global_settings and use in chat/voice endpoints.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="L'enregistrement des paramètres Léa n'est pas encore implémenté. Utilisez les variables d'environnement LEA_MAX_TOKENS, LEA_TTS_MODEL, LEA_TTS_VOICE et le prompt dans le code (LEA_SYSTEM_PROMPT) pour l'instant.",
    )


class LeaCapabilityCheckRequest(BaseModel):
    """Request to check one Léa capability"""
    action_id: str = Field(..., description="ID de l'action (ex: create_transaction)")


class LeaCapabilityCheckResponse(BaseModel):
    """Result of a capability check"""
    ok: bool
    message: Optional[str] = None


class LeaKnowledgeDocumentItem(BaseModel):
    """Document in Léa knowledge base"""
    id: str
    filename: str
    original_filename: str
    size: int
    content_type: str
    created_at: str

    class Config:
        from_attributes = True


class LeaKnowledgeDocumentUploadResponse(BaseModel):
    """Response after uploading a document to Léa knowledge base"""
    id: str
    filename: str
    original_filename: str
    size: int
    content_type: str
    created_at: str


class LeaKnowledgeContentResponse(BaseModel):
    """Contenu éditable de la base de connaissance (ex. OACIQ)"""
    content: str


class LeaKnowledgeContentUpdate(BaseModel):
    """Mise à jour du contenu (ex. OACIQ)"""
    content: str = ""


@router.get("/knowledge-base/content", response_model=LeaKnowledgeContentResponse)
async def get_lea_knowledge_content(
    key: str = "oaciq",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_superadmin),
):
    """
    Retourne le contenu éditable de la base de connaissance Léa (ex. key=oaciq pour les formulaires OACIQ).
    Utilisé par la page Base de connaissance Léa pour afficher et éditer le texte.
    """
    if LeaKnowledgeContent is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de connaissance non disponible (modèle manquant).",
        )
    if key != LEA_KNOWLEDGE_KEY_OACIQ:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Clé non supportée.")
    q = select(LeaKnowledgeContent).where(LeaKnowledgeContent.key == key)
    result = await db.execute(q)
    row = result.scalar_one_or_none()
    content = (row.content or "").strip() if row else ""
    if not content and LEA_OACIQ_KNOWLEDGE_PATH.exists():
        try:
            content = LEA_OACIQ_KNOWLEDGE_PATH.read_text(encoding="utf-8").strip()
        except Exception:
            pass
    return LeaKnowledgeContentResponse(content=content or "")


@router.put("/knowledge-base/content", response_model=LeaKnowledgeContentResponse)
async def update_lea_knowledge_content(
    body: LeaKnowledgeContentUpdate,
    key: str = "oaciq",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_superadmin),
):
    """
    Met à jour le contenu éditable de la base de connaissance Léa (ex. key=oaciq).
    Ce contenu est injecté dans le prompt système de Léa à chaque conversation.
    """
    if LeaKnowledgeContent is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de connaissance non disponible (modèle manquant).",
        )
    if key != LEA_KNOWLEDGE_KEY_OACIQ:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Clé non supportée.")
    q = select(LeaKnowledgeContent).where(LeaKnowledgeContent.key == key)
    result = await db.execute(q)
    row = result.scalar_one_or_none()
    content = (body.content or "").strip()
    if row:
        row.content = content
        row.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(row)
    else:
        new_row = LeaKnowledgeContent(key=key, content=content)
        db.add(new_row)
        await db.commit()
        await db.refresh(new_row)
    _invalidate_lea_knowledge_cache()
    return LeaKnowledgeContentResponse(content=content)


@router.get("/capabilities")
async def list_lea_capabilities(
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_admin_or_superadmin),
):
    """
    Liste des actions que Léa peut effectuer (admin). Utilisé dans l'onglet « Actions » des paramètres Léa.
    """
    return {"capabilities": LEA_CAPABILITIES}


@router.post("/capabilities/check", response_model=LeaCapabilityCheckResponse)
async def check_lea_capability(
    payload: LeaCapabilityCheckRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin_or_superadmin),
):
    """
    Vérifie qu'un type d'action est accessible pour Léa (agent intégré ou externe) et retourne
    un message d'erreur précis si la connexion ou les accès ne fonctionnent pas.
    """
    action_id = (payload.action_id or "").strip()
    if not action_id:
        return LeaCapabilityCheckResponse(ok=False, message="Identifiant d'action manquant.")

    valid_ids = {c["id"] for c in LEA_CAPABILITIES}
    if action_id not in valid_ids:
        return LeaCapabilityCheckResponse(
            ok=False,
            message=f"Action inconnue : « {action_id} ». Actions valides : {', '.join(sorted(valid_ids))}.",
        )

    # Actions qui passent par l'agent (chat) : il faut que Léa soit opérationnelle (intégrée ou externe)
    agent_actions = {"create_transaction", "update_transaction", "create_contact", "update_contact", "access_oaciq_forms", "modify_oaciq_forms"}
    if action_id in agent_actions:
        use_ext = _use_external_agent()
        use_int = _use_integrated_lea()
        if not use_ext and not use_int:
            return LeaCapabilityCheckResponse(
                ok=False,
                message=(
                    "Léa n'est pas configurée : ni agent externe (AGENT_API_URL + AGENT_API_KEY), "
                    "ni IA intégrée (OPENAI_API_KEY ou ANTHROPIC_API_KEY). "
                    "Configurez ces variables dans les paramètres du backend (ex. Railway → Backend → Variables)."
                ),
            )
        if use_ext:
            # Vérifier que l'agent externe répond
            settings = get_settings()
            url = (settings.AGENT_API_URL or "").strip().rstrip("/")
            key = (settings.AGENT_API_KEY or "").strip()
            if not url or not key:
                return LeaCapabilityCheckResponse(
                    ok=False,
                    message="Agent externe incomplet : AGENT_API_URL et AGENT_API_KEY doivent être définis.",
                )
            ping_url = f"{url}/api/external/health"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    r = await client.get(ping_url, headers={"X-API-Key": key})
                    if r.status_code == 404:
                        return LeaCapabilityCheckResponse(
                            ok=True,
                            message="Agent externe configuré (URL et clé OK). L'endpoint de santé n'existe pas sur l'agent ; la connexion au chat sera vérifiée à la première utilisation.",
                        )
                    if r.status_code != 200:
                        return LeaCapabilityCheckResponse(
                            ok=False,
                            message=f"L'agent externe a répondu avec le code {r.status_code} sur {ping_url}. Vérifiez que le serveur agent est démarré et que la clé API est valide.",
                        )
            except httpx.ConnectError as e:
                return LeaCapabilityCheckResponse(
                    ok=False,
                    message=f"Impossible de joindre l'agent externe à l'URL {url}. Erreur : {e}. Vérifiez AGENT_API_URL et que le serveur agent est accessible.",
                )
            except httpx.TimeoutException:
                return LeaCapabilityCheckResponse(
                    ok=False,
                    message=f"Délai dépassé en contactant l'agent à {url}. Vérifiez que le serveur agent répond bien.",
                )
            except Exception as e:
                return LeaCapabilityCheckResponse(
                    ok=False,
                    message=f"Erreur de connexion à l'agent : {str(e)}.",
                )

    # Vérifications spécifiques par action (API / base de données)
    try:
        if action_id == "create_transaction":
            # Vérifier que la table et le modèle existent
            q = select(RealEstateTransaction).limit(0)
            await db.execute(q)
            return LeaCapabilityCheckResponse(ok=True, message="Léa peut créer des transactions (contexte et base OK).")
        if action_id == "update_transaction":
            q = select(RealEstateTransaction).limit(0)
            await db.execute(q)
            return LeaCapabilityCheckResponse(ok=True, message="Léa peut modifier des transactions (contexte et base OK).")
        if action_id in ("create_contact", "update_contact"):
            # Les contacts passent par l'API reseau/contacts ; on vérifie juste que l'utilisateur est authentifié
            # et que le module existe (pas d'appel HTTP interne nécessaire)
            return LeaCapabilityCheckResponse(
                ok=True,
                message="L'API contacts (Réseau) est disponible. Léa pourra créer et modifier des contacts lorsque cette action sera branchée à la conversation.",
            )
        if action_id == "access_oaciq_forms":
            from app.models.form import Form
            q = select(Form).where(Form.code.isnot(None)).limit(1)
            await db.execute(q)
            return LeaCapabilityCheckResponse(ok=True, message="Léa peut accéder aux formulaires OACIQ (liste et détails).")
        if action_id == "modify_oaciq_forms":
            from app.models.form import Form, FormSubmission
            q = select(Form).limit(1)
            await db.execute(q)
            q2 = select(FormSubmission).limit(0)
            await db.execute(q2)
            return LeaCapabilityCheckResponse(ok=True, message="Léa peut créer et modifier des soumissions de formulaires OACIQ.")
    except Exception as e:
        logger.warning(f"Lea capability check {action_id}: {e}", exc_info=True)
        return LeaCapabilityCheckResponse(
            ok=False,
            message=f"Erreur lors de la vérification (« {action_id} ») : {str(e)}. Vérifiez les migrations (alembic upgrade head) et l'accès à la base.",
        )

    return LeaCapabilityCheckResponse(ok=True)


# --- Base de connaissance Léa (upload + liste + suppression) ---

@router.get("/knowledge-base/documents", response_model=List[LeaKnowledgeDocumentItem])
async def list_lea_knowledge_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_superadmin),
):
    """
    Liste les documents de la base de connaissance Léa. Réservé aux super admins.
    Sélection explicite des colonnes pour rester compatible si content_text n'existe pas encore (migration 048).
    """
    q = (
        select(
            File.id,
            File.filename,
            File.original_filename,
            File.size,
            File.content_type,
            File.created_at,
        )
        .where(File.user_id == current_user.id, File.folder == LEA_KNOWLEDGE_FOLDER)
        .order_by(File.created_at.desc())
    )
    result = await db.execute(q)
    rows = result.all()
    return [
        LeaKnowledgeDocumentItem(
            id=str(r[0]),
            filename=r[1] or "",
            original_filename=r[2] or r[1] or "",
            size=r[3] or 0,
            content_type=r[4] or "application/octet-stream",
            created_at=r[5].isoformat() if r[5] else "",
        )
        for r in rows
    ]


@router.post("/knowledge-base/documents", response_model=LeaKnowledgeDocumentUploadResponse)
@rate_limit_decorator("30/minute")
async def upload_lea_knowledge_document(
    request: Request,
    file: UploadFile = FileParam(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_superadmin),
):
    """
    Envoie un document dans la base de connaissance Léa. Réservé aux super admins.
    """
    if not file.filename or not file.filename.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom de fichier manquant.",
        )
    allowed_content_types = (
        "application/pdf",
        "application/x-pdf",
        "text/plain",
        "text/markdown",
        "text/x-markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    )
    allowed_extensions = (".pdf", ".txt", ".md", ".doc", ".docx")
    content_type = (file.content_type or "").strip().lower()
    fn_lower = (file.filename or "").lower()
    has_allowed_ext = any(fn_lower.endswith(ext) for ext in allowed_extensions)
    if content_type and content_type not in allowed_content_types:
        if not (content_type == "application/octet-stream" and has_allowed_ext):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Type de fichier non autorisé. Autorisés : PDF, TXT, MD, DOC, DOCX.",
            )
    elif not content_type and not has_allowed_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type de fichier non autorisé. Autorisés : PDF, TXT, MD, DOC, DOCX.",
        )
    if content_type in ("text/plain", "text/markdown", "text/x-markdown") or (
        (not content_type or content_type == "application/octet-stream") and fn_lower.endswith(".md")
    ):
        content_type = content_type or "text/markdown"
    elif not content_type or content_type == "application/octet-stream":
        if fn_lower.endswith(".pdf"):
            content_type = "application/pdf"
        elif fn_lower.endswith(".txt"):
            content_type = "text/plain"
        elif fn_lower.endswith((".doc", ".docx")):
            content_type = content_type or "application/octet-stream"
    if not S3Service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service de stockage non configuré. Impossible d'ajouter des documents.",
        )
    try:
        body = await file.read()
        content_text = None
        if content_type in ("text/plain", "text/markdown", "text/x-markdown"):
            try:
                content_text = body.decode("utf-8", errors="replace").strip()[:100000] or None
            except Exception:
                pass
        from starlette.datastructures import UploadFile as StarletteUploadFile
        refile = StarletteUploadFile(
            file=BytesIO(body),
            filename=file.filename or "document",
            headers={"content-type": content_type or "application/octet-stream"},
        )
        s3_service = S3Service()
        # Run sync S3 upload in thread pool to avoid blocking the event loop
        upload_result = await asyncio.to_thread(
            s3_service.upload_file,
            refile,
            LEA_KNOWLEDGE_FOLDER,
            str(current_user.id),
        )
        if not upload_result or "file_key" not in upload_result:
            logger.error("Upload document base connaissance Léa: S3 upload returned no file_key")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Échec de l'envoi du fichier vers le stockage.",
            )
        filename_val = upload_result.get("filename") or file.filename or "document"
        original_val = file.filename or upload_result.get("filename") or "document"
        content_type_val = upload_result.get("content_type") or content_type or "application/octet-stream"
        size_val = upload_result.get("size", 0)
        url_val = upload_result.get("url", "")

        def _build_fallback_values():
            return {
                "id": uuid.uuid4(),
                "user_id": current_user.id,
                "file_key": upload_result["file_key"],
                "filename": filename_val,
                "original_filename": original_val,
                "content_type": content_type_val,
                "size": size_val,
                "url": url_val,
                "folder": LEA_KNOWLEDGE_FOLDER,
            }

        try:
            file_record = File(
                user_id=current_user.id,
                file_key=upload_result["file_key"],
                filename=filename_val,
                original_filename=original_val,
                content_type=content_type_val,
                size=size_val,
                url=url_val,
                folder=LEA_KNOWLEDGE_FOLDER,
                content_text=content_text,
            )
            db.add(file_record)
            await db.commit()
            await db.refresh(file_record)
            return LeaKnowledgeDocumentUploadResponse(
                id=str(file_record.id),
                filename=file_record.filename or "",
                original_filename=file_record.original_filename or "",
                size=file_record.size or 0,
                content_type=file_record.content_type or "application/octet-stream",
                created_at=file_record.created_at.isoformat() if file_record.created_at else "",
            )
        except (ProgrammingError, OperationalError) as db_err:
            logger.warning("Upload document base connaissance Léa (fallback insert): %s", db_err)
            await db.rollback()
            # Fallback : insert minimal (sans content_text) si colonne manquante ou autre erreur schéma
            file_id = _build_fallback_values()["id"]
            stmt = insert(File.__table__).values(**_build_fallback_values())
            try:
                await db.execute(stmt)
                await db.commit()
            except Exception as insert_err:
                logger.exception("Upload document base connaissance Léa (fallback insert failed): %s", insert_err)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Erreur lors de l'enregistrement du document en base.",
                )
            return LeaKnowledgeDocumentUploadResponse(
                id=str(file_id),
                filename=filename_val,
                original_filename=original_val,
                size=size_val,
                content_type=content_type_val,
                created_at=datetime.utcnow().isoformat() + "Z",
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload document base connaissance Léa: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'ajout du document.",
        )


@router.delete("/knowledge-base/documents/{file_id}")
async def delete_lea_knowledge_document(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_superadmin),
):
    """
    Supprime un document de la base de connaissance Léa. Réservé aux super admins.
    """
    q = select(File).where(
        File.id == file_id,
        File.user_id == current_user.id,
        File.folder == LEA_KNOWLEDGE_FOLDER,
    )
    result = await db.execute(q)
    file_record = result.scalar_one_or_none()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document introuvable ou vous n'êtes pas autorisé à le supprimer.",
        )
    try:
        if S3Service.is_configured():
            s3_service = S3Service()
            s3_service.delete_file(file_record.file_key)
        await db.delete(file_record)
        await db.commit()
        return {"ok": True, "message": "Document supprimé."}
    except Exception as e:
        logger.exception("Delete document base connaissance Léa: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la suppression du document.",
        )


@router.post("/voice/transcribe")
async def transcribe_audio(
    audio: UploadFile = FileParam(...),
    current_user: User = Depends(get_lea_user),
):
    """
    Transcrit l'audio en texte (OpenAI Whisper).
    Nécessite OPENAI_API_KEY.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Transcription nécessite OPENAI_API_KEY.",
        )
    try:
        content = await audio.read()
        text = await _transcribe_whisper(content, audio.content_type or "audio/webm")
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur transcription: {str(e)}",
        )


@router.post("/voice/synthesize")
async def synthesize_speech(
    request: LeaSynthesizeRequest,
    current_user: User = Depends(get_lea_user),
):
    """
    Synthèse vocale (OpenAI TTS). Retourne l'audio en base64.
    Nécessite OPENAI_API_KEY.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="TTS nécessite OPENAI_API_KEY.",
        )
    try:
        audio_bytes = await _synthesize_tts(request.text, voice=request.voice, speed=request.speed)
        return {"audio_base64": base64.b64encode(audio_bytes).decode(), "content_type": "audio/mpeg"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synthesizing speech: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur TTS: {str(e)}",
        )
