"""
Léa AI Assistant Endpoints
"""

import base64
import io
import json
import os
import re
import unicodedata
import uuid
from datetime import date
from decimal import Decimal
from typing import Optional, Literal, List, Tuple, Any

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, status, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, require_admin_or_superadmin
from app.models import User, RealEstateTransaction, PortailTransaction, RealEstateContact, TransactionContact, ContactType
from app.models.lea_conversation import LeaSessionTransactionLink
from app.database import get_db
from app.services.lea_service import LeaService
from app.services.ai_service import AIService, AIProvider
from app.core.config import get_settings
from app.core.logging import logger

from sqlalchemy import select, and_

try:
    from openai import AsyncOpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False
    AsyncOpenAI = None

AGENT_ERR_MSG = (
    "AGENT_API_URL and AGENT_API_KEY must be set in the Backend service (Railway → Backend → Variables). "
    "Example: AGENT_API_URL=https://agentia-immo-production.up.railway.app"
)

LEA_SYSTEM_PROMPT = (
    "Tu es Léa, une assistante immobilière experte au Québec. "
    "Tu aides les courtiers et les particuliers : transactions, formulaires OACIQ, vente, achat.\n\n"
    "Tu as TOUJOURS accès aux données de la plateforme pour l'utilisateur connecté. "
    "Un bloc « Données plateforme » est fourni ci-dessous avec ses transactions et dossiers. "
    "Base-toi UNIQUEMENT sur ces données pour répondre aux questions sur ses transactions en cours, ses dossiers, etc.\n\n"
    "** RÈGLE CRUCIALE - ACTIONS RÉELLES : **\n"
    "Tu ne dois JAMAIS prétendre avoir fait une action (créer une transaction, mettre à jour une adresse, créer une promesse d'achat, etc.) "
    "si le bloc « Action effectuée » ci-dessous ne le mentionne pas explicitement. "
    "** Quand le bloc « Action effectuée » est présent et indique qu'une action a été faite (ex: transaction créée), tu DOIS confirmer à l'utilisateur que c'est fait — ne dis pas que tu ne peux pas. ** "
    "Si l'utilisateur demande quelque chose et qu'il n'y a AUCUN bloc « Action effectuée » pour cette demande, "
    "dis-lui que tu ne peux pas encore faire cela automatiquement et invite-le à aller dans la section Transactions pour le faire. "
    "Ne invente jamais une confirmation du type « c'est fait » ou « j'ai créé » sans que « Action effectuée » le confirme.\n\n"
    "Quand « Action effectuée » indique une ou plusieurs actions (ex: transaction créée, adresse ajoutée, promesse d'achat enregistrée), "
    "confirme uniquement ce qui est indiqué et invite l'utilisateur à compléter dans la section Transactions si pertinent.\n\n"
    "** INFORMATIONS CLÉS À COLLECTER – POSE LES BONNES QUESTIONS : **\n"
    "Quand l'utilisateur crée une transaction ou travaille sur un dossier, aide-le à le compléter en posant des questions pertinentes, une à la fois ou par thème. "
    "Ordre logique des informations clés :\n"
    "1. **Adresse du bien** : « Quelle est l'adresse du bien ? » (ex. 123 rue Principale, Montréal). Tu peux enregistrer l'adresse si l'utilisateur la donne dans sa réponse.\n"
    "2. **Vendeur(s)** : « Qui sont les vendeurs ? » (nom, téléphone, courriel). Tu peux enregistrer ces infos si l'utilisateur les donne.\n"
    "3. **Acheteur(s)** : « Qui sont les acheteurs ? » (nom, téléphone, courriel). Idem.\n"
    "4. **Prix et dates** : « Quel est le prix demandé ? » ou « le prix offert ? », « Date de clôture prévue ? »\n"
    "5. **Notaire, courtiers** : si pertinent, « As-tu les coordonnées du notaire ? du courtier vendeur/acheteur ? »\n"
    "Après avoir créé une transaction ou enregistré une info, propose **la prochaine question logique** (ex. après l'adresse : « Qui sont les vendeurs pour ce dossier ? »). "
    "**Ne redemande jamais une information déjà fournie** (ex. le prix, l'adresse, les coordonnées d'un vendeur/acheteur déjà donnés). Utilise le bloc « Données plateforme » et l'historique pour proposer la prochaine étape (ex. coordonnées acheteur si le vendeur est fait, ou date de clôture). "
    "Si le bloc « Données plateforme » indique déjà des vendeurs ou acheteurs pour la dernière transaction, ne redemande pas « Qui sont les vendeurs ? » ou « Qui sont les acheteurs ? » — passe à l'étape suivante (ex. prix). "
    "Si dans l'échange précédent tu as toi-même répondu en listant les vendeurs (ex. « Les vendeurs sont X et Y »), ne redemande jamais « Qui sont les vendeurs ? » : considère que c'est enregistré et passe à la suite (acheteurs ou prix). "
    "Si l'utilisateur dit qu'il n'y a pas encore d'acheteurs (ex. « en période de vente », « pas encore d'acheteurs », « aucun acheteur pour l'instant »), considère que c'est noté et propose la suite (ex. « Quel est le prix demandé ? »). Ne redemande pas les vendeurs ni les acheteurs dans ce cas.\n\n"
    "Reste concise : une question à la fois, ou deux maximum si le contexte s'y prête.\n\n"
    "Règles générales:\n"
    "- Réponds en français, de façon courtoise et professionnelle.\n"
    "- Garde tes réponses **courtes** (2 à 4 phrases max), sauf si l'utilisateur demande explicitement plus de détails.\n"
    "- Pour faire avancer la conversation, **pose une question pertinente** ou propose la prochaine étape quand c'est naturel.\n"
    "- Sois directe et efficace : pas de formules de politesse longues, va à l'essentiel."
)

router = APIRouter(prefix="/lea", tags=["lea"])


class LeaChatRequest(BaseModel):
    """Léa chat request"""
    message: str = Field(..., min_length=1, description="User message")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
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
    speed: Optional[float] = Field(1.2, ge=0.25, le=2.0, description="Vitesse de parole (1.0 = normal, 1.2 = un peu plus rapide)")


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
    {"id": "update_transaction", "label": "Modifier une transaction", "description": "Léa peut mettre à jour l'adresse, la promesse d'achat, etc. sur une transaction existante."},
    {"id": "create_contact", "label": "Créer un contact", "description": "Léa peut créer un contact dans le Réseau (API contacts)."},
    {"id": "update_contact", "label": "Modifier un contact", "description": "Léa peut modifier un contact existant dans le Réseau."},
    {"id": "access_oaciq_forms", "label": "Accéder aux formulaires OACIQ", "description": "Léa peut consulter la liste et les détails des formulaires OACIQ."},
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
            for t in re_list:
                addr = t.property_address or t.property_city or "Sans adresse"
                num = t.dossier_number or f"#{t.id}"
                lines.append(f"  - {num}: {t.name} — {addr} — statut: {t.status}")
            # Pour la transaction la plus récente : détail vendeurs/acheteurs/prix pour ne pas redemander
            latest = re_list[0]
            detail_parts = []
            if latest.sellers and isinstance(latest.sellers, list) and len(latest.sellers) > 0:
                names_s = [e.get("name") for e in latest.sellers if isinstance(e, dict) and e.get("name")]
                if names_s:
                    detail_parts.append(f"vendeurs: {', '.join(names_s)}")
            if latest.buyers and isinstance(latest.buyers, list) and len(latest.buyers) > 0:
                names_b = [e.get("name") for e in latest.buyers if isinstance(e, dict) and e.get("name")]
                if names_b:
                    detail_parts.append(f"acheteurs: {', '.join(names_b)}")
            if latest.listing_price is not None or latest.offered_price is not None:
                p = latest.listing_price or latest.offered_price
                detail_parts.append(f"prix: {p:,.0f} $")
            if detail_parts:
                lines.append(f"  → Dernière transaction ({latest.dossier_number or f'#{latest.id}'}) : {'; '.join(detail_parts)}.")
            # Infos manquantes pour guider les questions
            missing = []
            if not (latest.property_address or latest.property_city):
                missing.append("adresse du bien")
            sellers_ok = latest.sellers and len(latest.sellers) > 0 if isinstance(latest.sellers, list) else bool(latest.sellers)
            if not sellers_ok:
                missing.append("vendeur(s)")
            buyers_ok = latest.buyers and len(latest.buyers) > 0 if isinstance(latest.buyers, list) else bool(latest.buyers)
            if not buyers_ok:
                missing.append("acheteur(s)")
            if not latest.listing_price and not latest.offered_price:
                missing.append("prix (demandé ou offert)")
            if missing:
                ref = latest.dossier_number or f"#{latest.id}"
                lines.append(f"  → Pour {ref}, infos à compléter : {', '.join(missing)}. Pose la question correspondante pour faire avancer le dossier.")
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


def _wants_to_create_transaction(message: str) -> tuple[bool, str]:
    """
    Détecte si l'utilisateur demande de créer une transaction (achat ou vente).
    Retourne (True, "achat"|"vente") ou (False, "").
    Utilise une version normalisée (sans accents) pour tolérer les transcriptions vocales.
    """
    t = (message or "").strip().lower()
    if not t:
        return False, ""

    def n(s: str) -> str:
        """Normalise pour comparaison insensible aux accents (ex: transcription vocale)."""
        return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    nt = n(t)

    # Phrase très courte : "et une transaction", "une transaction" (sous-entendu : créer)
    if len(t) <= 35:
        if "et une transaction" in t or "et un dossier" in t:
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, "achat"
        if ("une transaction" in t or "un dossier" in t) and ("veux" in t or "donne" in t or "crée" in t or "cree" in nt or "ajoute" in t):
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, "achat"

    # Phrase courte explicite : "Créer une transaction" (bouton, saisie ou vocal)
    if len(t) <= 60 and ("créer une transaction" in t or "creer une transaction" in nt):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # Idem pour "créer un dossier"
    if len(t) <= 60 and ("créer un dossier" in t or "creer un dossier" in nt):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"

    # "je veux que tu crées/cree/crees une nouvelle transaction" (+ optionnel "tout de suite")
    if "nouvelle transaction" in t or "nouvelle transaction" in nt:
        if (
            "que tu crées" in t or "que tu crée" in t or "que tu crees" in nt or "que tu cree " in nt or "que tu creer" in nt
            or "que léa crée" in t or "que lea crée" in t or "que lea cree" in nt or "que lea crees" in nt
        ):
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, "achat"
        if "tout de suite" in t and ("crée" in t or "crées" in t or "creer" in nt or "cree " in nt or "crees" in nt):
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, "achat"
        if "crée une nouvelle" in t or "crées une nouvelle" in t or "creer une nouvelle" in nt or "crees une nouvelle" in nt:
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, "achat"

    # "crée-moi une (nouvelle) transaction" / "crée moi une transaction"
    if ("crée-moi" in t or "cree-moi" in nt or "crée moi" in t or "cree moi" in nt) and ("transaction" in t or "dossier" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"

    # "créer une transaction de vente" / "créer une transaction d'achat" (explicite, avec ou sans "pour [adresse]")
    if "créer une transaction de vente" in t or "créer une transaction d'achat" in t:
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # "créer une nouvelle transaction" / "nouvelle transaction" (explicite, avec ou sans accents pour vocal)
    if (
        "créer une nouvelle transaction" in t
        or "creer une nouvelle transaction" in t
        or "creer une nouvelle transaction" in nt
        or "créer un nouveau dossier" in t
        or "creer un nouveau dossier" in t
        or "creer un nouveau dossier" in nt
    ):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # "créer une transaction avec toi" / "créer une transaction avec Léa"
    if "créer une transaction" in t and ("avec toi" in t or "avec léa" in t or "avec lea" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    if "nouvelle transaction" in t and ("créer" in t or "voudrais" in t or "veux" in t or "aimerais" in t or "souhaite" in t or "voulons" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # "aide-moi à créer (une) transaction" / "aide-moi à créer un dossier"
    if "aide-moi" in t or "aide-moi " in t or "aidez-moi" in t or "m'aider" in t or "m’aider" in t:
        if "créer" in t and ("transaction" in t or "dossier" in t):
            if "achat" in t or "d'achat" in t:
                return True, "achat"
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, "achat"
        if "créer une transaction" in t or "créer un dossier" in t:
            return True, "achat"
    # "peux-tu créer" / "tu peux créer" / "pourrais-tu créer"
    if ("peux-tu" in t or "tu peux" in t or "pourrais-tu" in t or "pourrais tu" in t) and "créer" in t and (
        "transaction" in t or "dossier" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, "achat"
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # Intentions explicites avec "créer (une) transaction" ou "créer un dossier" (avec ou sans accents)
    if (
        "créer une transaction" in t
        or "creer une transaction" in t
        or "creer une transaction" in nt
        or "créer un dossier" in t
        or "creer un dossier" in t
        or "creer un dossier" in nt
        or "créer la transaction" in t
        or "creer la transaction" in nt
    ):
        if "achat" in t:
            return True, "achat"
        if "vente" in t:
            return True, "vente"
        return True, "achat"  # défaut
    # "nous voulons / on veut créer (une) transaction" / "créer une transaction ensemble"
    if ("voulons" in t or "vouloir" in t) and "créer" in t and ("transaction" in t or "dossier" in t):
        if "achat" in t or "d'achat" in t:
            return True, "achat"
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    if "créer" in t and "transaction" in t and (
        "ensemble" in t or "voulons" in t or "veux" in t or "aimerais" in t or "voudrais" in t
        or "souhaite" in t or "souhaites" in t or "souhaitons" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, "achat"
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # "nouvelle transaction" + volonté (aimerais, voudrais, veux, etc.)
    if "nouvelle transaction" in t and (
        "créer" in t or "aimerais" in t or "voudrais" in t or "veux" in t or "souhaite" in t or "souhaites" in t or "voulons" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, "achat"
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # Formulations du type "j'aimerais / je voudrais créer..."
    if ("aimerais créer" in t or "voudrais créer" in t or "veux créer" in t or "souhaite créer" in t) and (
        "transaction" in t or "dossier" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, "achat"
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # "que tu crées" / "que tu crée" (subjonctif) / "crée une transaction" — avec ou sans accents (vocal)
    if (
        "que tu crées" in t or "que tu crée" in t or "que tu crees" in nt or "que tu cree " in nt
        or "que tu creer" in nt or "que léa crées" in t or "que lea crées" in t or "que lea crees" in nt
        or "crée une transaction" in t or "crees une transaction" in nt or "cree une transaction" in nt
        or "que tu create" in t  # transcription anglaise
    ):
        if "achat" in t:
            return True, "achat"
        if "vente" in t:
            return True, "vente"
        return True, "achat"
    if "crée la transaction" in t or "crées la transaction" in t or "crée une transaction" in t:
        if "achat" in t:
            return True, "achat"
        if "vente" in t:
            return True, "vente"
        return True, "achat"
    if "transaction d'achat" in t and ("créer" in t or "créé" in t or "veux" in t or "voudrais" in t or "réer" in t or "voulons" in t):
        return True, "achat"
    if "transaction de vente" in t and ("créer" in t or "créé" in t or "veux" in t or "voudrais" in t or "réer" in t or "voulons" in t):
        return True, "vente"
    # Typo courant: "réer" au lieu de "créer"
    if "réer une transaction" in t or "réer la transaction" in t:
        if "achat" in t:
            return True, "achat"
        if "vente" in t:
            return True, "vente"
        return True, "achat"
    return False, ""


async def maybe_create_transaction_from_lea(db: AsyncSession, user_id: int, message: str):
    """
    Si le message indique une demande de création de transaction, crée une transaction minimale
    (achat ou vente) et retourne la transaction créée. Sinon retourne None.
    """
    ok, tx_type = _wants_to_create_transaction(message)
    if not ok:
        return None
    try:
        name = f"Transaction {tx_type.capitalize()}"
        # DB may still have NOT NULL on property_* from initial migration
        transaction = RealEstateTransaction(
            user_id=user_id,
            name=name,
            dossier_number=None,
            status="En cours",
            sellers=[],
            buyers=[],
            property_province="QC",
            property_address="À compléter",
            property_city="À compléter",
            property_postal_code="À compléter",
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea created transaction id={transaction.id} type={tx_type} for user_id={user_id}")
        return transaction
    except Exception as e:
        logger.warning(f"Lea create transaction failed: {e}", exc_info=True)
        await db.rollback()
        return None


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


def _extract_transaction_ref_from_message(message: str) -> Optional[str]:
    """
    Extrait une référence à une transaction (numéro de dossier ou id) du message.
    Ex: "transaction 4", "transaction #4", "#4", "dossier 4", "la transaction 4".
    Retourne "4" ou None.
    """
    if not message or len(message.strip()) < 2:
        return None
    t = message.strip()
    # #4 ou # 4
    m = re.search(r"#\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    # "transaction 4" / "transaction #4" / "la transaction 4" / "pour la transaction 4"
    m = re.search(r"(?:pour\s+)?(?:la\s+)?transaction\s+#?\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    # "dossier 4"
    m = re.search(r"dossier\s+#?\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
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


def _extract_address_from_message(message: str) -> Optional[str]:
    """Extrait une adresse du message (ex: 'l'adresse est le 6/840 avenue Papineau', 'l'adresse est le 6 8 4 0 avenue Papineau à Montréal code postal h2g2x7')."""
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()

    def normalize_address(raw: str) -> str:
        """Normalise espaces dans les chiffres (6 8 4 0 -> 6840) et code postal (h2g2x7 -> H2G 2X7)."""
        s = raw.strip()
        # Collapse digits separated by spaces: "6 8 4 0" -> "6840"
        s = re.sub(r'\b(\d)\s+(\d)\s+(\d)\s+(\d)\b', r'\1\2\3\4', s)
        s = re.sub(r'\b(\d)\s+(\d)\s+(\d)\b', r'\1\2\3', s)
        s = re.sub(r'\b(\d)\s+(\d)\b', r'\1\2', s)
        # Code postal québécois: h2g2x7 -> H2G 2X7 (A1A 1A1)
        cp = re.search(r'(?:code\s+postal|cp)\s*[:\s]*([a-zA-Z]\d[A-Za-z]\d[A-Za-z]\d)', s, re.I)
        if cp:
            c = cp.group(1).upper()
            if len(c) == 6:
                s = re.sub(r'(?:code\s+postal|cp)\s*[:\s]*[a-zA-Z]\d[A-Za-z]\d[A-Za-z]\d', f'code postal {c[0:3]} {c[3:6]}', s, flags=re.I)
        return s

    # "l'adresse n'est pas la bonne (,) l'adresse est ..." / "non l'adresse est ..." (typo: "et" pour "est")
    m = re.search(r"(?:l'adresse\s+n'est\s+pas\s+la\s+bonne|pas\s+la\s+bonne\s+adresse|non,?\s*l'adresse)\s*,?\s*(?:l'adresse\s+(?:est|et)\s+(?:le\s+)?|c'est\s+(?:le\s+)?|est\s+(?:le\s+)?)(.+?)(?:\s+(?:vocal|vacal)\s+terminé|\.|$)", t, re.I | re.DOTALL)
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5 and any(c.isdigit() for c in addr):
            return addr

    # "est le X" / "est X" / "c'est le X" / "l'adresse est X" / "l'adresse du bien et le X" (typo: "et" pour "est")
    for prefix in (
        r"l'adresse\s+du\s+bien\s+(?:est|et)\s+le\s+",
        r"l'adresse\s+du\s+bien\s+(?:est|et)\s+",
        r"l'adresse\s+(?:est|et)\s+le\s+",
        r"l'adresse\s+(?:est|et)\s+",
        r"qui est le\s+",
        r"est le\s+",
        r"c'est le\s+",
        r"adresse\s*:\s*",
    ):
        m = re.search(prefix + r"(.+?)(?:\s+(?:vocal|vacal)\s+terminé|\.|$|\s+et\s+)", t, re.I | re.DOTALL)
        if m:
            addr = normalize_address(m.group(1).strip())
            if len(addr) >= 5 and any(c.isdigit() for c in addr):
                return addr
    # "ajoute(l')adresse 123 rue X" / "ajouter l'adresse 123 rue X"
    m = re.search(
        r"ajout(?:er?|es?)\s+(?:l')?adresse\s+([^\n.]+?)(?:\.|$|\s+pour\s+|\s+vocal)",
        t,
        re.I | re.DOTALL,
    )
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5 and any(c.isdigit() for c in addr):
            return addr
    # "corriger l'adresse ... 6840 avenue..." / "changer l'adresse ..." (suit une adresse)
    m = re.search(
        r"(?:corriger|changer|modifier)\s+(?:l')?adresse\s+(?:c'est\s+)?(?:le\s+)?(.+?)(?:\s+vocal\s+terminé|\.|$)",
        t,
        re.I | re.DOTALL,
    )
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5 and any(c.isdigit() for c in addr):
            return addr
    # "adresse 123 rue X" (sans préfixe verbe) — support chiffres espacés: "6 8 4 0 avenue"
    m = re.search(
        r"(?:l')?adresse\s+(?:est\s+)?(?:le\s+)?(\d(?:\s*\d)*\s+(?:avenue|av\.?|rue|boulevard|blvd\.?|boul\.?)\s+[\w\s-]+(?:\s+à\s+[\w\s-]+)?(?:\s+code\s+postal\s+[A-Za-z0-9\s]+)?)",
        t,
        re.I,
    )
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5:
            return addr
    # Fallback: motif "123 rue X" ou "6 8 4 0 avenue X" (chiffres possibles avec espaces)
    m = re.search(r"(\d(?:\s*\d)*\s+(?:avenue|av\.?|rue|boulevard|blvd\.?|boul\.?)\s+[\w\s-]+(?:\s+à\s+[\w\s-]+)?(?:\s+code\s+postal\s+[A-Za-z0-9\s]+)?)", t, re.I)
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5:
            return addr
    return None


def _wants_to_update_address(message: str) -> bool:
    t = (message or "").strip().lower()
    if not t:
        return False
    if "adresse" not in t:
        return False
    # Correction / mise à jour explicite (incl. "l'adresse du bien et le X" — typo "et" pour "est")
    if (
        "n'est pas la bonne" in t
        or "pas la bonne adresse" in t
        or "corriger" in t
        or "changer l'adresse" in t
        or "modifier l'adresse" in t
        or "mettre" in t
        or "rentrer" in t
        or "rentre" in t
        or "est le" in t
        or "et le" in t
        or "du bien" in t
        or "est " in t
        or "c'est " in t
        or "enregistrer" in t
        or "ajouter" in t
        or "ajoutes" in t
        or "ajoute " in t
    ):
        return _extract_address_from_message(message) is not None
    return False


def _wants_to_set_promise(message: str) -> bool:
    t = (message or "").strip().lower()
    if not t:
        return False
    return (
        "promesse" in t and ("achat" in t or "d'achat" in t) and
        ("créer" in t or "crée" in t or "crééz" in t or "générer" in t or "faire" in t or "créez" in t)
    )


async def _validate_address_via_geocode(addr: str) -> Optional[dict]:
    """
    Vérifie une adresse via géocodage (Nominatim / OpenStreetMap).
    Retourne un dict avec postcode, city, state (province), country_code pour que Léa puisse confirmer à l'utilisateur.
    """
    if not addr or len(addr.strip()) < 5:
        return None
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": addr.strip(), "format": "json", "addressdetails": 1, "limit": 1}
    headers = {"User-Agent": "ImmoAssist-Lea/1.0 (contact@immoassist.com)"}
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


async def maybe_update_transaction_address_from_lea(db: AsyncSession, user_id: int, message: str) -> Optional[Tuple[str, RealEstateTransaction, Optional[dict]]]:
    """Si le message demande d'ajouter/mettre à jour l'adresse, met à jour la transaction (par ref ou la plus récente). Si aucune transaction n'existe, en crée une puis y met l'adresse. Retourne (adresse, transaction, infos_géocodage) si mise à jour ; infos_géocodage peut être None."""
    if not _wants_to_update_address(message):
        return None
    addr = _extract_address_from_message(message)
    if not addr:
        return None
    ref = _extract_transaction_ref_from_message(message)
    if ref:
        transaction = await get_user_transaction_by_ref(db, user_id, ref)
    else:
        transaction = await get_user_latest_transaction(db, user_id)
    if not transaction:
        try:
            transaction = RealEstateTransaction(
                user_id=user_id,
                name="Transaction Vente",
                dossier_number=None,
                status="En cours",
                sellers=[],
                buyers=[],
                property_province="QC",
                property_address=addr,
                property_city="À compléter",
                property_postal_code="À compléter",
            )
            db.add(transaction)
            await db.flush()
            await db.refresh(transaction)
            logger.info(f"Lea created transaction id={transaction.id} (from address) for user_id={user_id}")
        except Exception as e:
            logger.warning(f"Lea create transaction from address failed: {e}", exc_info=True)
            await db.rollback()
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
                transaction.property_postal_code = validation["postcode"]
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea updated transaction id={transaction.id} address to {addr[:50]}...")
        return (addr, transaction, validation)
    except Exception as e:
        logger.warning(f"Lea update address failed: {e}", exc_info=True)
        await db.rollback()
        return None


async def maybe_set_promise_from_lea(db: AsyncSession, user_id: int, message: str):
    """Si le message demande de créer la promesse d'achat, enregistre la date sur la dernière transaction."""
    if not _wants_to_set_promise(message):
        return None
    transaction = await get_user_latest_transaction(db, user_id)
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


def _extract_seller_buyer_names_list(message: str) -> Optional[tuple[str, List[tuple[str, str]]]]:
    """
    Extrait une liste de noms pour "les vendeurs sont A et B" / "les acheteurs sont A, B et C".
    Retourne (role, [(first_name, last_name), ...]) ou None.
    """
    if not message or len(message.strip()) < 15:
        return None
    t = message.strip()
    role: Optional[str] = None
    if re.search(r"les\s+vendeurs\s+sont\s+", t, re.I):
        role = "Vendeur"
    elif re.search(r"les\s+acheteurs\s+sont\s+", t, re.I):
        role = "Acheteur"
    if not role:
        return None
    m = re.search(r"les\s+vendeurs\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
    if not m and role == "Acheteur":
        m = re.search(r"les\s+acheteurs\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
    if not m:
        return None
    raw = m.group(1).strip()
    # Artifact vocal en fin de phrase : "vocal terminé", "local terminé" (faute de reconnaissance)
    raw = re.sub(r"\s+(?:vocal|vacal|cale|local)\s+terminé.*$", "", raw, flags=re.I).strip()
    if not raw:
        return None
    # Séparateurs : " et ", virgule, ou " les " (vocal dit parfois "A les B" au lieu de "A et B")
    parts = re.split(r"\s+et\s+|\s*,\s*|\s+les\s+", raw)
    names: List[tuple[str, str]] = []
    for part in parts:
        part = part.strip()
        if not part or len(part) < 2:
            continue
        words = part.split()
        if len(words) >= 2:
            first_name, last_name = words[0], " ".join(words[1:])
        else:
            first_name = last_name = words[0]
        if len(first_name) >= 1 and len(last_name) >= 1:
            names.append((first_name.strip(), last_name.strip()))
    if not names:
        return None
    return (role, names)


def _extract_seller_buyer_contact_from_message(message: str) -> Optional[tuple[str, str, Optional[str], Optional[str], str]]:
    """
    Détecte si l'utilisateur donne les coordonnées d'un vendeur ou d'un acheteur.
    Retourne (first_name, last_name, phone, email, role) où role est "Vendeur" ou "Acheteur", ou None.
    Ex: "ajoute la coordonnée du vendeur il s'appelle Michael Jordan son numéro est le 514 266-5543"
    """
    if not message or len(message.strip()) < 10:
        return None
    t = message.strip()
    role: Optional[str] = None
    if re.search(r"\bvendeur(s?)\b", t, re.I) or "coordonnée du vendeur" in t.lower() or "coordonnées du vendeur" in t.lower():
        role = "Vendeur"
    elif re.search(r"\bacheteur(s?)\b", t, re.I) or "coordonnée de l'acheteur" in t.lower() or "coordonnées de l'acheteur" in t.lower():
        role = "Acheteur"
    if not role:
        return None

    # "les vendeurs sont A et B" / "les vendeurs sont A, B et C" → géré par _extract_seller_buyer_names_list
    if re.search(r"les\s+vendeurs\s+sont\s+.+\s+et\s+", t, re.I) or re.search(r"les\s+acheteurs\s+sont\s+.+\s+et\s+", t, re.I):
        return None

    # Nom : "il s'appelle X" / "s'appelle X" / "c'est X"
    name_match = re.search(
        r"(?:il\s+)?s['']appelle\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s+son\s+numéro|\s+numéro|\s+téléphone|\s+phone|\s+courriel|\s+email|$|,)",
        t,
        re.I,
    )
    if not name_match:
        name_match = re.search(r"c'est\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s+son\s+numéro|\s+numéro|\s+téléphone|$|,)", t, re.I)
    name = name_match.group(1).strip() if name_match else None
    if not name or len(name) < 2:
        return None
    parts = name.split()
    if len(parts) >= 2:
        first_name, last_name = parts[0], " ".join(parts[1:])
    else:
        first_name = last_name = parts[0]
    # Téléphone : 514-266-5543, 514 266 5543, 5142665543, "son numéro de téléphone est le 514 266-5543"
    phone_match = re.search(
        r"(?:numéro|téléphone|phone)(?:\s+de\s+(?:téléphone|phone))?\s*(?:est\s*)?(?:le\s*)?[:\s]*(\d{3}[\s.\-]*\d{3}[\s.\-]*\d{4})",
        t,
        re.I,
    )
    if not phone_match:
        phone_match = re.search(r"\b(\d{3}[\s.\-]\d{3}[\s.\-]\d{4})\b", t)
    phone = phone_match.group(1).replace(" ", "").replace(".", "").replace("-", "") if phone_match else None
    if phone and len(phone) == 10:
        phone = f"{phone[0:3]}-{phone[3:6]}-{phone[6:10]}"
    # Email optionnel
    email_match = re.search(r"(?:courriel|email)\s*(?:est\s*)?[:\s]*([^\s,\.]+@[^\s,\.]+)", t, re.I)
    email = email_match.group(1).strip() if email_match else None
    return (first_name.strip(), last_name.strip(), phone, email, role)


async def maybe_add_seller_buyer_contact_from_lea(
    db: AsyncSession, user_id: int, message: str
) -> Optional[str]:
    """
    Si le message contient les coordonnées d'un vendeur ou acheteur (ou une liste "les vendeurs sont A et B"),
    crée le(s) contact(s) et l'ajoute à la transaction. Retourne une ligne pour « Action effectuée » ou None.
    """
    # Cas "les vendeurs sont Joseph Perrault et Matthieu Dufour"
    names_list = _extract_seller_buyer_names_list(message)
    if names_list:
        role, names = names_list
        transaction = await get_user_latest_transaction(db, user_id)
        if not transaction or not names:
            return None
        try:
            added = []
            sellers = list(transaction.sellers) if transaction.sellers else []
            buyers = list(transaction.buyers) if transaction.buyers else []
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
            else:
                transaction.buyers = buyers
            await db.commit()
            await db.refresh(transaction)
            ref = transaction.dossier_number or f"#{transaction.id}"
            logger.info(f"Lea added {role}s {added} to transaction id={transaction.id}")
            return (
                f"Les {role.lower()}s ({', '.join(added)}) ont été enregistrés pour la transaction {ref}. "
                "Confirme à l'utilisateur que c'est enregistré."
            )
        except Exception as e:
            logger.warning(f"Lea add sellers/buyers list failed: {e}", exc_info=True)
            await db.rollback()
            return None

    extracted = _extract_seller_buyer_contact_from_message(message)
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


def _extract_price_from_message(message: str) -> Optional[Tuple[Decimal, str]]:
    """
    Extrait un prix du message (ex. "650 mille dollars", "500 000 $", "le prix c'est 600 000").
    Retourne (montant, "listing"|"offered") ou None. "listing" = prix demandé, "offered" = prix offert.
    """
    if not message or len(message.strip()) < 3:
        return None
    t = (message or "").strip().lower()
    # Typo vocal : "piles" pour "mille" (ex. "725 piles" = 725 000)
    t = re.sub(r"\bpiles\b", "mille", t, flags=re.I)
    # Déterminer si c'est un prix offert ou demandé
    is_offered = bool(
        re.search(r"\bprix\s+offert\b", t)
        or re.search(r"\boffert\s*[:\s]*\d", t)
        or "offre" in t and re.search(r"\d", t)
    )
    kind = "offered" if is_offered else "listing"
    # Nombre avec espaces : 650 000, 500 000 $
    m = re.search(r"(?:prix\s+)?(?:c'est\s+)?(?:est\s+)?(\d[\d\s]*)\s*(?:mille|k\b|k\s|000\b|millions?)?", t, re.I)
    if not m:
        m = re.search(r"(\d[\d\s]{2,})\s*(?:\$|dollars?|cad)?", t, re.I)
    if not m:
        return None
    raw = m.group(1).replace(" ", "").strip()
    if not raw.isdigit():
        return None
    value = int(raw)
    # "650 mille" → 650 * 1000 = 650000 (le groupe a capté "650" et "mille" est après)
    if re.search(r"(\d+)\s*mille\b", t, re.I):
        mm = re.search(r"(\d+)\s*mille", t, re.I)
        if mm:
            value = int(mm.group(1)) * 1000
    elif re.search(r"(\d+)\s*million", t, re.I):
        mm = re.search(r"(\d+)\s*million", t, re.I)
        if mm:
            value = int(mm.group(1)) * 1_000_000
    if value <= 0 or value > 999_999_999:
        return None
    return (Decimal(str(value)), kind)


def _wants_to_update_price(message: str) -> bool:
    """True si le message semble donner un prix pour la transaction."""
    if not message or len(message.strip()) < 5:
        return False
    t = (message or "").strip().lower()
    if "prix" not in t and "million" not in t and "mille" not in t and "piles" not in t:
        # "650 000" ou "650000$" sans mot-clé
        if re.search(r"\d{2,}[\s]*\d{3}", t) or re.search(r"\d{1,3}\s*mille", t, re.I):
            return True
    if "prix" in t or "mille" in t or "million" in t or "piles" in t:
        return _extract_price_from_message(message) is not None
    return False


async def maybe_update_transaction_price_from_lea(
    db: AsyncSession, user_id: int, message: str
) -> Optional[Tuple[Decimal, RealEstateTransaction, str]]:
    """
    Si le message contient un prix (demandé ou offert), met à jour la dernière transaction.
    Retourne (montant, transaction, "listing"|"offered") ou None.
    """
    if not _wants_to_update_price(message):
        return None
    extracted = _extract_price_from_message(message)
    if not extracted:
        return None
    amount, kind = extracted
    transaction = await get_user_latest_transaction(db, user_id)
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


async def run_lea_actions(db: AsyncSession, user_id: int, message: str) -> tuple[list, Optional[RealEstateTransaction]]:
    """
    Exécute les actions Léa (création transaction, mise à jour adresse, promesse d'achat).
    Retourne (liste de lignes pour « Action effectuée », transaction créée si création).
    """
    lines = []
    created: Optional[RealEstateTransaction] = None
    created = await maybe_create_transaction_from_lea(db, user_id, message)
    if created:
        lines.append(
            f"Tu viens de créer une nouvelle transaction pour l'utilisateur : « {created.name} » (id {created.id}). "
            "Confirme-lui que c'est fait et qu'il peut la compléter dans la section Transactions."
        )
    addr_result = await maybe_update_transaction_address_from_lea(db, user_id, message)
    if addr_result:
        addr, tx, validation = addr_result[0], addr_result[1], addr_result[2] if len(addr_result) >= 3 else None
        ref = tx.dossier_number or f"#{tx.id}"
        lines.append(
            f"L'adresse a été ajoutée à la transaction {ref} : « {addr} ». "
            "Confirme à l'utilisateur que c'est fait et qu'il peut voir la transaction dans la section Transactions."
        )
        if validation:
            parts = []
            if validation.get("postcode"):
                parts.append(f"code postal {validation['postcode']}")
            if validation.get("city"):
                parts.append(validation["city"])
            if validation.get("state"):
                parts.append(validation["state"])
            if validation.get("country_code"):
                parts.append(validation["country_code"])
            if parts:
                geocode_str = " — ".join(parts)
                city = validation.get("city") or ""
                postcode = validation.get("postcode") or ""
                state = validation.get("state") or ""
                if city and postcode:
                    lines.append(
                        f"Recherche web (géocodage) : « {geocode_str} ». "
                        f"Dans ta réponse, confirme à l'utilisateur que l'adresse a été vérifiée en mentionnant explicitement : ville {city}, code postal {postcode}" + (f", {state}" if state else "") + "."
                    )
                else:
                    lines.append(
                        f"Recherche web (géocodage) : « {geocode_str} ». "
                        "Confirme à l'utilisateur que l'adresse a été vérifiée (ville, code postal, province)."
                    )
    promise_tx = await maybe_set_promise_from_lea(db, user_id, message)
    if promise_tx:
        lines.append(
            "La date de promesse d'achat a été enregistrée sur la dernière transaction. "
            "Confirme à l'utilisateur que la promesse d'achat est enregistrée et qu'il peut compléter le formulaire dans la section Transactions."
        )
    contact_line = await maybe_add_seller_buyer_contact_from_lea(db, user_id, message)
    if contact_line:
        lines.append(contact_line)
    price_result = await maybe_update_transaction_price_from_lea(db, user_id, message)
    if price_result:
        amount, tx, kind = price_result
        ref = tx.dossier_number or f"#{tx.id}"
        label = "prix demandé" if kind == "listing" else "prix offert"
        lines.append(
            f"Le {label} a été enregistré pour la transaction {ref} : {amount:,.0f} $. "
            "Confirme à l'utilisateur que c'est enregistré et qu'il peut voir la transaction dans la section Transactions."
        )
    return (lines, created)


async def link_lea_session_to_transaction(
    db: AsyncSession, user_id: int, session_id: str, transaction_id: int
) -> None:
    """Enregistre un lien entre une session Léa et une transaction (pour l'historique sur la fiche transaction)."""
    if not session_id or not transaction_id:
        return
    try:
        r = await db.execute(
            select(LeaSessionTransactionLink).where(
                LeaSessionTransactionLink.session_id == session_id,
                LeaSessionTransactionLink.transaction_id == transaction_id,
                LeaSessionTransactionLink.user_id == user_id,
            ).limit(1)
        )
        if r.scalar_one_or_none() is not None:
            return  # déjà lié
        link = LeaSessionTransactionLink(
            session_id=session_id,
            transaction_id=transaction_id,
            user_id=user_id,
        )
        db.add(link)
        await db.commit()
        logger.info(f"Lea linked session {session_id[:8]}... to transaction id={transaction_id}")
    except Exception as e:
        logger.warning(f"Lea link session to transaction failed: {e}", exc_info=True)
        await db.rollback()

LEA_TTS_FEMALE_VOICES = ("nova", "shimmer")


async def _synthesize_tts(text: str, voice: str | None = None, speed: float | None = None) -> bytes:
    """Synthèse vocale avec OpenAI TTS (qualité HD). Léa utilise une voix féminine (shimmer par défaut, plus douce et humaine) et un débit légèrement plus rapide."""
    settings = get_settings()
    model = (settings.LEA_TTS_MODEL or "tts-1-hd").strip() or "tts-1-hd"
    raw = (voice or settings.LEA_TTS_VOICE or "shimmer").strip() or "shimmer"
    voice_name = raw if raw.lower() in LEA_TTS_FEMALE_VOICES else "shimmer"
    speed_val = speed if speed is not None else getattr(settings, "LEA_TTS_SPEED", 1.2)
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
    user_context: str | None = None,
    action_lines: list | None = None,
    confirmation_text: str | None = None,
):
    """
    Génère les événements SSE pour le chat Léa intégré (streaming).
    Si confirmation_text est fourni (ex: transaction créée), on envoie ce texte en stream
    sans appeler l'IA, pour garantir que l'utilisateur voit la confirmation.
    """
    sid = session_id or str(uuid.uuid4())
    try:
        if confirmation_text:
            # Réponse directe sans appeler l'IA (ex: transaction créée)
            for i in range(0, len(confirmation_text), 1):
                yield f"data: {json.dumps({'delta': confirmation_text[i]})}\n\n"
            payload = {"done": True, "session_id": sid}
            if action_lines:
                payload["actions"] = action_lines
            yield f"data: {json.dumps(payload)}\n\n"
            return
        settings = get_settings()
        system = LEA_SYSTEM_PROMPT
        if user_context:
            system += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context
        service = AIService(provider=AIProvider.AUTO)
        messages = [{"role": "user", "content": message}]
        async for delta in service.stream_chat_completion(
            messages=messages,
            system_prompt=system,
            max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
        ):
            yield f"data: {json.dumps({'delta': delta})}\n\n"
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
    except Exception as e:
        logger.error(f"Léa stream error: {e}", exc_info=True)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@router.post("/chat/stream")
async def lea_chat_stream(
    request: LeaChatRequest,
    current_user: User = Depends(get_current_user),
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
    action_lines, created_tx = await run_lea_actions(db, current_user.id, request.message)
    user_context = await get_lea_user_context(db, current_user.id)
    if action_lines:
        user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
    # Lier la session à la transaction pour l'historique sur la fiche transaction
    if request.session_id and action_lines:
        tx_to_link = created_tx if created_tx else await get_user_latest_transaction(db, current_user.id)
        if tx_to_link:
            await link_lea_session_to_transaction(db, current_user.id, request.session_id, tx_to_link.id)
    # Quand une transaction vient d'être créée, confirmation directe en stream (comme pour l'agent externe)
    confirmation_text = None
    if created_tx and action_lines:
        ref = created_tx.dossier_number or f"#{created_tx.id}"
        confirmation_text = (
            f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
            "Vous pouvez la voir et la compléter dans la section Transactions. "
            "Quelle est l'adresse du bien ?"
        )
    return StreamingResponse(
        _stream_lea_sse(
            request.message,
            request.session_id,
            user_context=user_context,
            action_lines=action_lines if action_lines else None,
            confirmation_text=confirmation_text,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat", response_model=LeaChatResponse)
async def lea_chat(
    request: LeaChatRequest,
    current_user: User = Depends(get_current_user),
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
            action_lines, created_tx = await run_lea_actions(db, current_user.id, request.message)
            if request.session_id and action_lines:
                tx_to_link = created_tx if created_tx else await get_user_latest_transaction(db, current_user.id)
                if tx_to_link:
                    await link_lea_session_to_transaction(db, current_user.id, request.session_id, tx_to_link.id)
            user_context = await get_lea_user_context(db, current_user.id)
            if action_lines:
                user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
            # Quand une transaction vient d'être créée, renvoyer une confirmation directe (sans appeler l'IA)
            if created_tx and action_lines:
                ref = created_tx.dossier_number or f"#{created_tx.id}"
                return LeaChatResponse(
                    content=(
                        f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                        "Vous pouvez la voir et la compléter dans la section Transactions. "
                        "Quelle est l'adresse du bien ?"
                    ),
                    session_id=request.session_id or "",
                    model=None,
                    provider=None,
                    usage={},
                    actions=action_lines,
                )
            system_prompt = LEA_SYSTEM_PROMPT
            if user_context:
                system_prompt += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context
            settings = get_settings()
            service = AIService(provider=AIProvider.AUTO)
            result = await service.chat_completion(
                messages=[{"role": "user", "content": request.message}],
                system_prompt=system_prompt,
                max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
            )
            return LeaChatResponse(
                content=result.get("content", ""),
                session_id=request.session_id or "",
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
        action_lines, created_tx = await run_lea_actions(db, current_user.id, request.message)
        if request.session_id and action_lines:
            tx_to_link = created_tx if created_tx else await get_user_latest_transaction(db, current_user.id)
            if tx_to_link:
                await link_lea_session_to_transaction(db, current_user.id, request.session_id, tx_to_link.id)
        # Si on a créé une transaction, renvoyer une confirmation directe (pas besoin d'appeler l'agent)
        if action_lines and created_tx:
            ref = created_tx.dossier_number or f"#{created_tx.id}"
            confirmation = (
                f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                "Vous pouvez la voir et la compléter dans la section Transactions."
            )
            return LeaChatResponse(
                content=confirmation,
                session_id=request.session_id or "",
                model=None,
                provider=None,
                usage={},
                actions=action_lines,
            )
        # Autres actions (adresse, prix, etc.) : confirmation directe pour éviter que l'agent réponde sans contexte
        if action_lines:
            confirmation = (
                "C'est fait ! Les informations ont été mises à jour. "
                "Vous pouvez voir la transaction dans la section Transactions."
            )
            return LeaChatResponse(
                content=confirmation,
                session_id=request.session_id or "",
                model=None,
                provider=None,
                usage={},
                actions=action_lines,
            )
        message_to_agent = request.message
        data = await _call_external_agent_chat(
            message=message_to_agent,
            session_id=request.session_id,
            conversation_id=None,
        )
        if not data.get("success"):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=data.get("error", "External agent error"),
            )
        return LeaChatResponse(
            content=data["response"],
            session_id=data.get("session_id", request.session_id or ""),
            model=data.get("model", "gpt-4o-mini"),
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
    audio: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    conversation_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
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

            action_lines, _ = await run_lea_actions(db, current_user.id, transcription)
            if sid and action_lines:
                tx_to_link = await get_user_latest_transaction(db, current_user.id)
                if tx_to_link:
                    await link_lea_session_to_transaction(db, current_user.id, sid, tx_to_link.id)
            user_context = await get_lea_user_context(db, current_user.id)
            if action_lines:
                user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
            system_prompt = LEA_SYSTEM_PROMPT
            if user_context:
                system_prompt += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context

            service = AIService(provider=AIProvider.AUTO)
            messages = [{"role": "user", "content": transcription}]
            settings = get_settings()
            result = await service.chat_completion(
                messages=messages,
                system_prompt=system_prompt,
                max_tokens=getattr(settings, "LEA_MAX_TOKENS", 256),
            )
            response_text = result.get("content") or ""

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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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
async def get_lea_context(
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get Léa conversation context.
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
    current_user: User = Depends(get_current_user),
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


@router.post("/voice/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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
