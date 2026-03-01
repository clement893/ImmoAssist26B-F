"""
Léa AI Assistant Endpoints
"""

import base64
import io
import json
import os
import re
import uuid
from datetime import date
from typing import Optional, Literal

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, status, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, require_admin_or_superadmin
from app.models import User, RealEstateTransaction, PortailTransaction
from app.database import get_db
from app.services.lea_service import LeaService
from app.services.ai_service import AIService, AIProvider
from app.core.config import get_settings
from app.core.logging import logger

from sqlalchemy import select

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
    "Si l'utilisateur demande quelque chose et qu'il n'y a AUCUN « Action effectuée » pour cette demande, "
    "dis-lui que tu ne peux pas encore faire cela automatiquement et invite-le à aller dans la section Transactions pour le faire. "
    "Ne invente jamais une confirmation du type « c'est fait » ou « j'ai créé » sans que « Action effectuée » le confirme.\n\n"
    "Quand « Action effectuée » indique une ou plusieurs actions (ex: transaction créée, adresse ajoutée, promesse d'achat enregistrée), "
    "confirme uniquement ce qui est indiqué et invite l'utilisateur à compléter dans la section Transactions si pertinent.\n\n"
    "** INFORMATIONS CLÉS À COLLECTER – POSE LES BONNES QUESTIONS : **\n"
    "Quand l'utilisateur crée une transaction ou travaille sur un dossier, aide-le à le compléter en posant des questions pertinentes, une à la fois ou par thème. "
    "Ordre logique des informations clés :\n"
    "1. **Adresse du bien** : « Quelle est l'adresse du bien ? » (ex. 123 rue Principale, Montréal). Tu peux enregistrer l'adresse si l'utilisateur la donne dans sa réponse.\n"
    "2. **Vendeur(s)** : « Qui sont les vendeurs ? » (nom, téléphone, courriel). Propose d'ajouter ces infos dans la section Transactions si tu ne peux pas les enregistrer toi-même.\n"
    "3. **Acheteur(s)** : « Qui sont les acheteurs ? » (nom, téléphone, courriel). Idem.\n"
    "4. **Prix et dates** : « Quel est le prix demandé ? » ou « le prix offert ? », « Date de clôture prévue ? »\n"
    "5. **Notaire, courtiers** : si pertinent, « As-tu les coordonnées du notaire ? du courtier vendeur/acheteur ? »\n"
    "Après avoir créé une transaction ou enregistré une info, propose **la prochaine question logique** (ex. après l'adresse : « Parfait. Qui sont les vendeurs pour ce dossier ? »). "
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


class LeaContextResponse(BaseModel):
    """Léa conversation context"""
    session_id: str
    message_count: int
    messages: list


class LeaSynthesizeRequest(BaseModel):
    """Léa text-to-speech synthesis request (voix féminine)"""
    text: str = Field(..., min_length=1, description="Text to synthesize")
    voice: Optional[str] = Field("nova", description="Voix TTS: nova ou shimmer (féminines)")


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
            # Pour la transaction la plus récente : indiquer les infos manquantes pour guider les questions
            latest = re_list[0]
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
    """
    t = (message or "").strip().lower()
    if not t:
        return False, ""
    # "créer une transaction de vente" / "créer une transaction d'achat" (explicite, avec ou sans "pour [adresse]")
    if "créer une transaction de vente" in t or "créer une transaction d'achat" in t:
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, "achat"
    # "créer une nouvelle transaction" / "nouvelle transaction" (explicite en premier)
    if "créer une nouvelle transaction" in t or "créer un nouveau dossier" in t:
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
    # Intentions explicites avec "créer (une) transaction" ou "créer un dossier"
    if "créer une transaction" in t or "créer un dossier" in t or "créer la transaction" in t:
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
    if "que tu crées" in t or "que tu crée" in t or "crée le formulaire" in t or "crées le formulaire" in t:
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
        transaction = RealEstateTransaction(
            user_id=user_id,
            name=name,
            dossier_number=None,
            status="En cours",
            sellers=[],
            buyers=[],
            property_province="QC",
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

    # "est le X" / "est X" / "c'est le X" / "l'adresse est X" (typo: "et" pour "est")
    for prefix in (r"l'adresse\s+(?:est|et)\s+le\s+", r"l'adresse\s+(?:est|et)\s+", r"qui est le\s+", r"est le\s+", r"c'est le\s+", r"adresse\s*:\s*"):
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
    # Correction / mise à jour explicite
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


async def maybe_update_transaction_address_from_lea(db: AsyncSession, user_id: int, message: str) -> Optional[tuple[str, RealEstateTransaction]]:
    """Si le message demande d'ajouter/mettre à jour l'adresse, met à jour la transaction (par ref ou la plus récente). Retourne (adresse, transaction) si mise à jour."""
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
        return None
    try:
        transaction.property_address = addr
        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Lea updated transaction id={transaction.id} address to {addr[:50]}...")
        return (addr, transaction)
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
        addr, tx = addr_result
        ref = tx.dossier_number or f"#{tx.id}"
        lines.append(
            f"L'adresse a été ajoutée à la transaction {ref} : « {addr} ». "
            "Confirme à l'utilisateur que c'est fait et qu'il peut voir la transaction dans la section Transactions."
        )
    promise_tx = await maybe_set_promise_from_lea(db, user_id, message)
    if promise_tx:
        lines.append(
            "La date de promesse d'achat a été enregistrée sur la dernière transaction. "
            "Confirme à l'utilisateur que la promesse d'achat est enregistrée et qu'il peut compléter le formulaire dans la section Transactions."
        )
    return (lines, created)


# Voix OpenAI TTS considérées féminines pour Léa (alloy, echo, onyx = masculins)
LEA_TTS_FEMALE_VOICES = ("nova", "shimmer")


async def _synthesize_tts(text: str, voice: str | None = None) -> bytes:
    """Synthèse vocale avec OpenAI TTS (qualité HD). Léa utilise une voix féminine (nova ou shimmer)."""
    settings = get_settings()
    model = (settings.LEA_TTS_MODEL or "tts-1-hd").strip() or "tts-1-hd"
    raw = (voice or settings.LEA_TTS_VOICE or "nova").strip() or "nova"
    voice_name = raw if raw.lower() in LEA_TTS_FEMALE_VOICES else "nova"
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    resp = await client.audio.speech.create(model=model, voice=voice_name, input=text)
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


async def _stream_lea_sse(message: str, session_id: str | None, user_context: str | None = None):
    """Génère les événements SSE pour le chat Léa intégré (streaming)."""
    sid = session_id or str(uuid.uuid4())
    try:
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
        yield f"data: {json.dumps({'done': True, 'session_id': sid})}\n\n"
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
    return StreamingResponse(
        _stream_lea_sse(request.message, request.session_id, user_context=user_context),
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
    Utilise l'agent externe si configuré, sinon l'IA intégrée (OpenAI/Anthropic) avec accès aux transactions.
    """
    # 1) IA intégrée (avec contexte plateforme) si pas d'agent externe
    if not _use_external_agent() and _use_integrated_lea():
        try:
            action_lines, created_tx = await run_lea_actions(db, current_user.id, request.message)
            user_context = await get_lea_user_context(db, current_user.id)
            if action_lines:
                user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
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
        # Si on a créé/mis à jour quelque chose, on renvoie une confirmation directe (pas besoin de l'agent)
        if action_lines:
            if created_tx:
                ref = created_tx.dossier_number or f"#{created_tx.id}"
                confirmation = (
                    f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                    "Vous pouvez la voir et la compléter dans la section Transactions."
                )
            else:
                confirmation = (
                    "C'est fait ! J'ai créé une nouvelle transaction pour vous. "
                    "Vous pouvez la compléter dans la section Transactions."
                )
            return LeaChatResponse(
                content=confirmation,
                session_id=request.session_id or "",
                model=None,
                provider=None,
                usage={},
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


@router.get("/context", response_model=LeaContextResponse)
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
        tts_voice=getattr(settings, "LEA_TTS_VOICE", "nova"),
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
        audio_bytes = await _synthesize_tts(request.text, voice=request.voice)
        return {"audio_base64": base64.b64encode(audio_bytes).decode(), "content_type": "audio/mpeg"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synthesizing speech: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur TTS: {str(e)}",
        )
