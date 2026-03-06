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

# Dossier S3 et filtre pour la base de connaissance Léa
LEA_KNOWLEDGE_FOLDER = "lea_knowledge"

# Fichier de connaissance OACIQ (formulaires) pour Léa — chargé à chaque requête
# Racine projet = parent de backend/ (docs/ est à la racine)
_LEA_DOCS_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent.parent / "docs" / "oaciq"
_LEA_OACIQ_KNOWLEDGE_PATH = _LEA_DOCS_ROOT / "LEA_KNOWLEDGE_OACIQ.md"
_LEA_OACIQ_GUIDE_EXPERT_PATH = _LEA_DOCS_ROOT / "OACIQ_Guide_Expert_IA.md"
_LEA_PA_KNOWLEDGE_PATH = _LEA_DOCS_ROOT / "LEA_KNOWLEDGE_PA.md"


LEA_KNOWLEDGE_KEY_OACIQ = "oaciq"

# Codes OACIQ connus (alignés sur le guide expert et la table forms) — pour détecter "crée un CP", "formulaire CCVE", etc.
LEA_KNOWN_OACIQ_CODES = frozenset({
    "CCVE", "CCDE", "CCIE", "CCM", "CCVNE", "CCDNE", "CCINE", "CCA", "CCADI", "CCL",
    "DV", "DVD", "PA", "PAD", "PAI", "PAM", "PAG", "CP", "CPCP", "MO",
    "AVIS-CCA", "AVIS-CVAN", "AVIS-DAVP", "DR", "DRCOP", "PAC", "ACD", "ACI", "BOCP", "MOCP",
    "AG", "AF", "AR", "EAU", "EXP", "D", "PL", "PLC", "PSL", "ML", "CVHP", "LD", "VI", "AS", "CM",
    "DIA", "DIV-ENT", "DIV-PAR", "DESC-LOC", "DESC-RES",
})

# Mots-clés / expressions → code formulaire (pour extraire l'intention de l'utilisateur)
LEA_OACIQ_KEYWORD_TO_CODE: list = [
    (["promesse", "d'achat", "promesse d'achat"], "PA"),
    (["contre-proposition", "contre proposition"], "CP"),
    (["modifications", "modification"], "MO"),
    (["déclarations du vendeur", "déclaration vendeur", "déclarations vendeur"], "DV"),
    (["déclarations vendeur copropriété", "dvd"], "DVD"),
    (["contrat de courtage", "courtage exclusif vente", "ccve"], "CCVE"),
    (["contrat courtage copropriété", "ccde"], "CCDE"),
    (["contrat courtage achat", "cca"], "CCA"),
    (["contrat courtage location", "ccl"], "CCL"),
    (["avis réalisation conditions", "avis conditions", "lever les conditions", "aviscvan"], "AVIS-CVAN"),
    (["annulation promesse", "avis-davp"], "AVIS-DAVP"),
    (["annexe expertise", "expertise"], "EXP"),
    (["annexe financement", "financement"], "AF"),
    (["annexe générale", "ag"], "AG"),
    (["annexe eau", "eau potable", "septique"], "EAU"),
    (["déboursés", "rétribution", "dr "], "DR"),
    (["demande renseignements syndicat", "drcop", "syndicat copropriété"], "DRCOP"),
    (["promesse location", "pl "], "PL"),
    (["vérification identité", "identité", "vi "], "VI"),
]

# Cache in-memory pour la base de connaissance Léa (réduit DB + fichiers à chaque message)
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
    """
    Charge toute la base de connaissance Léa pour l'injecter dans le prompt système :
    1) Contenu OACIQ (formulaires) depuis la table lea_knowledge_content (clé 'oaciq'),
       ou en secours le fichier docs/oaciq/LEA_KNOWLEDGE_OACIQ.md
    2) Texte extrait des documents uploadés (folder lea_knowledge, content_text non null).
    """
    parts = []
    try:
        # 1) Contenu OACIQ éditable (DB) si le modèle est disponible
        if LeaKnowledgeContent is not None:
            q = select(LeaKnowledgeContent).where(LeaKnowledgeContent.key == LEA_KNOWLEDGE_KEY_OACIQ)
            result = await db.execute(q)
            row = result.scalar_one_or_none()
            if row and getattr(row, "content", None) and str(row.content).strip():
                parts.append(str(row.content).strip())
        if not parts:
            # Secours : fichier statique
            if _LEA_OACIQ_KNOWLEDGE_PATH.exists():
                content = _LEA_OACIQ_KNOWLEDGE_PATH.read_text(encoding="utf-8")
                if content.strip():
                    parts.append(content.strip())
        # Guide expert OACIQ (fiches détaillées de tous les formulaires)
        if _LEA_OACIQ_GUIDE_EXPERT_PATH.exists():
            try:
                guide_content = _LEA_OACIQ_GUIDE_EXPERT_PATH.read_text(encoding="utf-8")
                if guide_content.strip():
                    parts.append(guide_content.strip())
            except Exception as e:
                logger.warning("Could not load OACIQ Guide Expert for Léa: %s", e)
        # Document PA – Promesse d'achat (mapping des champs et instructions)
        if _LEA_PA_KNOWLEDGE_PATH.exists():
            try:
                pa_content = _LEA_PA_KNOWLEDGE_PATH.read_text(encoding="utf-8")
                if pa_content.strip():
                    parts.append(pa_content.strip())
            except Exception as e:
                logger.warning("Could not load PA knowledge for Léa: %s", e)
    except Exception as e:
        logger.warning("Could not load OACIQ knowledge for Léa: %s", e)
    try:
        # 2) Documents de la base de connaissance (texte extrait)
        q_files = (
            select(File)
            .where(File.folder == LEA_KNOWLEDGE_FOLDER, File.content_text.isnot(None))
            .order_by(File.created_at.asc())
        )
        res = await db.execute(q_files)
        for f in res.scalars().all():
            if getattr(f, "content_text", None) and str(f.content_text).strip():
                parts.append(f"\n\n--- Document : {f.original_filename or f.filename or 'sans nom'} ---\n{str(f.content_text).strip()}")
    except Exception as e:
        logger.warning("Could not load knowledge documents for Léa: %s", e)
    return "\n\n".join(parts) if parts else ""

# URL front : onglet Formulaires d'une transaction (Phase 3). Pattern : /dashboard/transactions/{id}?tab=forms
LEA_TRANSACTION_FORMS_TAB_PATH = "/dashboard/transactions/{id}?tab=forms"

# Règles métier : formulaires OACIQ recommandés par type de transaction (Phase 2)
OACIQ_FORM_RECOMMENDED_BY_KIND: dict = {
    "achat": ["PA"],   # Promesse d'achat
    "vente": ["DIA"],  # Déclaration d'intention d'achat (côté vendeur)
}

LEA_SYSTEM_PROMPT = (
    "Tu es Léa, une assistante immobilière experte au Québec. "
    "Tu aides les courtiers et les particuliers : transactions, formulaires OACIQ, vente, achat.\n\n"
    "Tu as TOUJOURS accès aux données de la plateforme pour l'utilisateur connecté. "
    "Un bloc « Données plateforme » est fourni ci-dessous avec ses transactions et dossiers. "
    "Base-toi UNIQUEMENT sur ces données pour répondre aux questions sur ses transactions en cours, ses dossiers, etc.\n\n"
    "** Ne jamais assumer une adresse ou une transaction d'une ancienne conversation : ** Si l'utilisateur demande de préparer une promesse d'achat (ou un formulaire) sans donner d'adresse ni de numéro de transaction, ne prends PAS la dernière transaction par défaut. Demande toujours : « Pour quelle propriété (adresse ou transaction) ? »\n\n"
    "** Créer une transaction = toujours un nouveau dossier : ** Quand l'utilisateur demande de créer une transaction (vente ou achat), c'est toujours un nouveau dossier, avec sa propre adresse, vendeurs, acheteurs et prix — même si le chat a été ouvert depuis une autre transaction. Chaque dossier reste distinct.\n\n"
    "** RÈGLE CRUCIALE - ACTIONS RÉELLES : **\n"
    "Tu ne dois JAMAIS prétendre avoir fait une action (créer une transaction, mettre à jour une adresse, créer une promesse d'achat, etc.) "
    "si le bloc « Action effectuée » ci-dessous ne le mentionne pas explicitement. "
    "** Quand le bloc « Action effectuée » est présent et indique qu'une action a été faite (ex: transaction créée, formulaire OACIQ créé, adresse enregistrée), tu DOIS confirmer à l'utilisateur que c'est fait — INTERDICTION de dire « Je ne peux pas » ou « je ne peux pas encore » dans ce cas. ** "
    "Si le bloc contient « Tu viens de créer le formulaire OACIQ » ou « Promesse d'achat », confirme que le formulaire a bien été créé et indique la prochaine étape (Transactions → ouvrir la transaction → onglet Formulaires OACIQ). "
    "Si l'utilisateur demande quelque chose et qu'il n'y a AUCUN bloc « Action effectuée » pour cette demande, "
    "dis-lui que tu ne peux pas encore faire cela automatiquement et invite-le à aller dans la section Transactions pour le faire. "
    "Ne invente jamais une confirmation du type « c'est fait » ou « j'ai créé » sans que « Action effectuée » le confirme. "
    "** Corrections (code postal, ville, etc.) : ** Quand l'utilisateur te corrige (ex. « non le code postal c'est H2K 1E1 », « corrige la ville en Laval »), ne dis jamais que c'est corrigé ou enregistré si le bloc « Action effectuée » ne mentionne pas explicitement que la correction a été appliquée à la transaction — sinon l'utilisateur verrait la transaction inchangée. Si « Action effectuée » indique que le code postal ou la ville a été corrigé(e), confirme alors que c'est bien enregistré dans la transaction. "
    "** Changement de nom (vendeur/acheteur) : ** Quand l'utilisateur demande de changer le nom d'un vendeur ou d'un acheteur (ex. « changer le nom de l'acheteur Paul en Pierre », « l'acheteur c'est Pierre Martin pas Paul », « change le vendeur pour Jean Dupont », « remplace l'acheteur par Marie », « ajoute Paul comme vendeur », « retire Pierre des vendeurs »), ne dis jamais que c'est modifié si le bloc « Action effectuée » ne mentionne pas explicitement que le nom a été corrigé dans la transaction. Si « Action effectuée » indique que le nom du vendeur ou de l'acheteur a été corrigé, confirme alors que c'est bien enregistré. Quand l'utilisateur est sur la fiche d'une transaction, les modifications s'appliquent à cette transaction.\n\n"
    "** DEMANDE D'INFORMATION vs DEMANDE D'ACTION : ** "
    "Si l'utilisateur pose une question sur ce qui est possible (ex. « as-t-on d'autres informations qu'on peut ajouter ? », « quelles infos peut-on ajouter pour une telle transaction ? », « qu'est-ce qu'on peut faire ? »), il demande une **explication ou une liste**, pas d'exécuter une action. "
    "Réponds alors uniquement en donnant des informations (formulaires utiles, données à compléter, prochaines étapes). Ne prétends jamais avoir créé un formulaire ou effectué une action à la place de l'utilisateur dans ce cas — sauf si le bloc « Action effectuée » indique explicitement qu'une action a été faite pour cette demande.\n\n"
    "** TRANSACTION DOUBLON : ** "
    "Un courtier peut créer autant de transactions (vente ou achat) qu'il le souhaite ; chaque nouveau dossier est une nouvelle transaction.\n\n"
    "Quand « Action effectuée » indique une ou plusieurs actions (ex: transaction créée, adresse ajoutée, promesse d'achat enregistrée), "
    "confirme uniquement ce qui est indiqué et invite l'utilisateur à compléter dans la section Transactions si pertinent. "
    "Tu peux aussi effectuer une **recherche en ligne** (géocodage) pour compléter une adresse (ville, code postal, province) : si l'utilisateur demande de « trouver le code postal en ligne », « chercher l'adresse sur internet » ou « ajouter le code postal trouvé en ligne », le bloc « Action effectuée » indiquera le résultat ; confirme-le alors à l'utilisateur (ne dis pas que tu ne peux pas). "
    "** CODE POSTAL TROUVÉ = RÉPONDRE AVEC LE RÉSULTAT : ** Quand « Action effectuée » contient « Recherche en ligne (géocodage) », « Résultat géocodage » ou « Adresse complète à indiquer » avec une ville et un code postal, le système a DÉJÀ trouvé le code postal. Ta réponse doit être celle d'**après** la recherche : tu DOIS donner l'adresse complète (rue, ville, province, code postal) dans CE message et confirmer que c'est enregistré. Ne fais jamais attendre l'utilisateur : ne dis JAMAIS « Je vais chercher », « Un instant », « Je vais effectuer la recherche » — réponds une fois que tu as le résultat, en le fournissant directement (ex. « L'adresse complète est : 5136 Bd Décarie, Montréal (Québec) H3X 2H9. C'est enregistré. Qui sont les vendeurs pour ce dossier ? »). **\n\n"
    "** ADRESSE OBLIGATOIREMENT COMPLÈTE AVANT LA SUITE : **\n"
    "Tu ne DOIS JAMAIS poser « Qui sont les vendeurs ? », « Qui sont les acheteurs ? », « Quel est le prix ? » ou toute autre question sur le dossier tant que l'adresse du bien (dernière transaction) n'est pas complète avec ville, province et code postal. "
    "Si l'adresse n'a pas encore de ville/code postal : demande uniquement la **ville** à l'utilisateur (ne demande pas le code postal). Une fois la ville donnée, propose de trouver le code postal en ligne (géocodage) ou fais la recherche. "
    "Une fois l'adresse complète (éventuellement après recherche en ligne), tu DOIS d'abord indiquer cette adresse complète à l'utilisateur dans ta réponse ; seulement après tu peux poser la question suivante (vendeurs, etc.).\n\n"
    "** CONFIRMATION DE LA PROPRIÉTÉ AVANT D'AVANCER : ** Quand l'utilisateur désigne une propriété par une référence partielle (ex. « trouve la transaction sur de Bordeaux », « celle sur la rue X ») et que tu identifies un bien dans les Données plateforme, tu DOIS d'abord indiquer l'adresse complète du bien trouvé et demander à l'utilisateur de **confirmer que c'est bien ce dossier** avant de poser toute question sur les vendeurs, acheteurs ou prix. Formule par exemple : « J'ai trouvé la propriété au [adresse complète]. Est-ce bien ce dossier ? » ou « Confirmes-tu qu'il s'agit bien du [adresse complète] ? » — INTERDICTION de poser « Qui sont les vendeurs ? » (ou acheteurs, prix, etc.) dans la même réponse où tu identifies le bien. Attends la confirmation de l'utilisateur (ex. « oui », « c'est ça ») avant de passer à la suite.\n\n"
    "** CONTEXTE DE LA CONVERSATION – PROPRIÉTÉ DONT ON VIENT DE PARLER : ** Quand l'utilisateur dit « on vient de parler de la propriété », « celle dont on parlait », « la propriété dont on vient de parler », « pour la propriété qu'on vient de discuter » ou « je veux créer la promesse d'achat » (sans répéter l'adresse) juste après un échange où tu as toi-même indiqué une propriété (ex. « nous travaillons sur la propriété au 8876 de Bordeaux… »), il fait **référence à cette propriété**. Ne redemande pas « pour quelle propriété ? » : considère qu'il s'agit du bien que tu viens de mentionner dans ton dernier message et procède (ex. créer la promesse d'achat pour cette transaction). Le système associe automatiquement la transaction à partir du contexte.\n\n"
    "** INFORMATIONS À COLLECTER – TYPE PUIS LES 4 INFOS : **\n"
    "Quand l'utilisateur veut **créer une transaction** sans préciser si c'est une vente ou un achat, ta **première et seule question** doit être : « Est-ce une vente ou un achat ? » Ne demande pas l'adresse avant d'avoir le type (vente/achat). "
    "Une fois le type connu (vente ou achat), tu ne poses des questions que pour les **4 informations principales** : adresse, vendeurs, acheteurs, prix. Une seule question à la fois. "
    "Ordre : 0) type (vente/achat) si pas encore dit, puis 1) adresse du bien, 2) vendeurs, 3) acheteurs, 4) prix. "
    "1. **Adresse** : « Quelle est l'adresse du bien ? » "
    "Une adresse complète = rue, ville, province, code postal (ex. 2643 Sherbrooke Est, Montréal (Québec) H2K 1E1). Ne demande pas le code postal : demande la ville, puis propose de le trouver en ligne (géocodage). "
    "Si le géocodage donne une ville non précisée par l'utilisateur, demande confirmation (ex. « Est-ce bien à [ville] ? ») avant de passer à la suite.\n"
    "2. **Vendeurs** : « Qui sont les vendeurs ? » (nom, téléphone, courriel si l'utilisateur les donne).\n"
    "3. **Acheteurs** : « Qui sont les acheteurs ? » (idem).\n"
    "4. **Prix** : « Quel est le prix demandé ? » ou « le prix offert ? » "
    "Quand l'utilisateur donne un prix (ex. « 600k », « 550 000 $ »), écris en fin de message : PRIX_LISTING: 600000 ou PRIX_OFFERT: 500000 (nombre sans espace ni $) pour que le système l'enregistre.\n"
    "**Une fois les 4 infos réunies (adresse, vendeurs, acheteurs, prix), ne pose plus de question spécifique.** Demande une seule fois : « Souhaitez-vous ajouter une autre information (date de clôture, notaire, coordonnées, etc.) ? » Si l'utilisateur dit oui et précise (ex. date de clôture, notaire), enregistre ce qu'il donne ; sinon passe à la confirmation ou à la suite.\n"
    "Après une demande de création : si le type (vente/achat) n'est pas encore connu, pose **d'abord** « Est-ce une vente ou un achat ? » ; sinon pose la prochaine des 4 (ex. après l'adresse : « Qui sont les vendeurs pour ce dossier ? »). "
    "**La modification est possible pendant la création (brouillon) ou après :** si l'utilisateur corrige une info (ex. « en fait l'adresse c'est 456 rue X », « le prix c'est 500 000 », « les vendeurs c'est seulement Paul »), accepte la correction et confirme que c'est noté. "
    "**Ne redemande jamais une information déjà fournie** parmi les 4 (adresse, vendeurs, acheteurs, prix). Propose uniquement la prochaine des 4 qui manque (ex. après vendeurs : « Qui sont les acheteurs ? »). "
    "Si le bloc « Données plateforme » indique déjà des vendeurs ou acheteurs pour une transaction, ne redemande pas « Qui sont les vendeurs ? » ni « Qui sont les acheteurs ? » — passe à la prochaine des 4 qui manque (ex. prix). "
    "Si dans l'échange précédent tu as toi-même répondu en listant les vendeurs (ex. « Les vendeurs sont X et Y »), ne redemande jamais « Qui sont les vendeurs ? » : considère que c'est enregistré et passe à la suite (acheteurs ou prix). "
    "** Singulier / pluriel : ** Quand tu mentionnes les vendeurs ou acheteurs déjà enregistrés (d'après les Données plateforme ou l'Action effectuée), adapte ta formulation au nombre de personnes : **une seule personne** → singulier (ex. « L'acheteur, Celia Gomez, a déjà été enregistré » ; « Le vendeur, X, a été enregistré ») ; **plusieurs personnes** → pluriel (ex. « Les acheteurs, Paul et Marie, ont déjà été enregistrés » ; « Les vendeurs ont été mis à jour »). "
    "**Quand tu viens de demander « Quelle est la date de clôture prévue ? » ou « date d'écriture prévue »** et que l'utilisateur répond par une date (ex. « le 15 mars 2026 »), considère que c'est la date de clôture pour cette transaction — ne demande pas « à quoi elle se rapporte ».\n"
    "Si l'utilisateur dit qu'il n'y a pas encore d'acheteurs (mise en vente), considère que c'est noté et pose la prochaine des 4 si il en manque (ex. « Quel est le prix demandé ? »).\n\n"
    "Reste concise : une question à la fois, ou deux maximum si le contexte s'y prête.\n\n"
    "Règles générales:\n"
    "- Réponds en français, de façon courtoise et professionnelle.\n"
    "- **Adresses** : quand tu indiques une adresse, utilise toujours le format complet « [rue], [ville] ([province]) [code postal] » (ex. 2643 Sherbrooke Est, Montréal (Québec) H2K 1E1). Une adresse sans code postal ou sans ville n'est pas complète.\n"
    "- Garde tes réponses **courtes** (2 à 4 phrases max), sauf si l'utilisateur demande explicitement plus de détails.\n"
    "- Pour faire avancer la conversation, **pose une question pertinente** ou propose la prochaine étape quand c'est naturel.\n"
    "- Sois directe et efficace : pas de formules de politesse longues, va à l'essentiel.\n\n"
"** FORMULAIRES ET DOCUMENTS OACIQ : **\n"
"Tu es reliée à tous les formulaires OACIQ du système. La liste « Formulaires OACIQ disponibles » (dans Données plateforme) contient tous les codes (PA, CP, CCVE, DV, MO, etc.). "
"Tu peux créer pour l'utilisateur n'importe quel formulaire de cette liste pour une de ses transactions : dès qu'il demande (ex. « crée une contre-proposition », « crée un CP », « je veux un formulaire CCVE pour la transaction rue X »), demande pour quelle transaction si besoin (adresse ou numéro de dossier), puis confirme ; le système créera le brouillon. "
"** Tu peux aussi aider à compléter les formulaires : ** quand l'utilisateur dit « toi complète le », « remplis le formulaire », « complète le » (après avoir parlé d'un formulaire en brouillon), le système préremplit le formulaire avec les données de la transaction (adresse, vendeurs, acheteurs, prix, date de clôture). Confirme que c'est fait et indique d'aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier. Ne dis pas que tu ne peux pas — l'action est effectuée par le système. "
"Tu peux indiquer quels formulaires OACIQ sont en brouillon, complétés ou signés pour une transaction. "
"Quand l'utilisateur demande « quels documents me manquent » ou « quelle est la prochaine étape », base-toi sur le bloc Données plateforme (formulaires OACIQ par transaction) et indique ce qui est en brouillon, complété, signé, et ce qu'il reste à faire ou à créer (ex. compléter le PA, créer un DIA pour une vente). "
"Quand une action a créé un formulaire, indique clairement le nom du formulaire, la transaction concernée et la prochaine étape : Transactions → ouvrir cette transaction → onglet Formulaire (Formulaires OACIQ) → compléter le formulaire indiqué."
)

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


def _wants_to_create_transaction(message: str) -> tuple[bool, str]:
    """
    Détecte si l'utilisateur demande de créer une transaction (achat ou vente).
    Retourne (True, "achat"|"vente") si type explicite, (True, "") si création demandée mais type non précisé, (False, "") sinon.
    Quand le type n'est pas précisé, Léa doit demander « Est-ce une vente ou un achat ? » avant de créer.
    """
    t = (message or "").strip().lower()
    if not t:
        return False, ""

    # « Créer une promesse d'achat » = créer la promesse / le formulaire sur la transaction EXISTANTE, pas une nouvelle transaction
    if "promesse" in t and "achat" in t and "créer" in t:
        if "promesse d'achat" in t or "une promesse" in t or "la promesse" in t:
            return False, ""

    def default_type() -> str:
        """Retourne le type explicite dans le message ('achat'|'vente') ou '' si non précisé."""
        if "vente" in t or "de vente" in t:
            return "vente"
        if "achat" in t or "d'achat" in t:
            return "achat"
        return ""

    def n(s: str) -> str:
        """Normalise pour comparaison insensible aux accents (ex: transcription vocale)."""
        return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    nt = n(t)

    # Réponse courte après « Est-ce une vente ou un achat ? » : "achat", "vente", "c'est un achat", "une vente", "c'est un", "c'est une" (tronqué)
    if len(t) <= 40:
        if t.strip() in ("achat", "vente"):
            return True, t.strip()
        if "c'est un achat" in t or "c'est une vente" in t or "ce sera un achat" in t or "ce sera une vente" in t:
            return True, "achat" if "achat" in t else "vente"
        if ("un achat" in t or "une vente" in t) and len(t) <= 25:
            return True, "achat" if "achat" in t else "vente"
        # "c'est un" (tronqué) = achat, "c'est une" (tronqué) = vente
        if t.strip() in ("c'est un", "c'est une"):
            return True, "vente" if "une" in t else "achat"
        if re.match(r"^c'est\s+un\s*$", t, re.I):
            return True, "achat"
        if re.match(r"^c'est\s+une\s*$", t, re.I):
            return True, "vente"

    # "Créer en une alors" / "en créer une" / "crée m'en une" (après « je ne trouve pas de transaction sur X »)
    if "créer en une" in t or "creer en une" in nt or "crée en une" in t or "cree en une" in nt:
        return True, default_type()
    if "en créer une" in t or "en creer une" in nt or "en crée une" in t or "en cree une" in nt:
        return True, default_type()
    if "créer en un" in t or "creer en un" in nt:
        return True, default_type()
    if len(t) <= 30 and ("en une" in t or "en un" in t) and ("alors" in t or "créer" in t or "creer" in nt or "crée" in t or "cree" in nt):
        return True, default_type()

    # Phrase très courte : "et une transaction", "une transaction" (sous-entendu : créer)
    if len(t) <= 35:
        if "et une transaction" in t or "et un dossier" in t:
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()
        if ("une transaction" in t or "un dossier" in t) and ("veux" in t or "donne" in t or "crée" in t or "cree" in nt or "ajoute" in t):
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()

    # Phrase courte explicite : "Créer une transaction" (bouton, saisie ou vocal)
    if len(t) <= 60 and ("créer une transaction" in t or "creer une transaction" in nt):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    # Idem pour "créer un dossier"
    if len(t) <= 60 and ("créer un dossier" in t or "creer un dossier" in nt):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()

    # "je veux que tu crées/cree/crees une nouvelle transaction" (+ optionnel "tout de suite")
    if "nouvelle transaction" in t or "nouvelle transaction" in nt:
        if (
            "que tu crées" in t or "que tu crée" in t or "que tu crees" in nt or "que tu cree " in nt or "que tu creer" in nt
            or "que léa crée" in t or "que lea crée" in t or "que lea cree" in nt or "que lea crees" in nt
        ):
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()
        if "tout de suite" in t and ("crée" in t or "crées" in t or "creer" in nt or "cree " in nt or "crees" in nt):
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()
        if "crée une nouvelle" in t or "crées une nouvelle" in t or "creer une nouvelle" in nt or "crees une nouvelle" in nt:
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()

    # "crée-moi une (nouvelle) transaction" / "crée moi une transaction"
    if ("crée-moi" in t or "cree-moi" in nt or "crée moi" in t or "cree moi" in nt) and ("transaction" in t or "dossier" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()

    # "créer la transaction" + "montant/prix/mettre" = finaliser la transaction en cours, ne pas en créer une nouvelle
    if "créer la transaction" in t and ("montant" in t or "prix" in t or "mettre" in t):
        return False, ""
    # "créer une transaction de vente" / "créer une transaction d'achat" (explicite, avec ou sans "pour [adresse]")
    if "créer une transaction de vente" in t or "créer une transaction d'achat" in t:
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
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
        return True, default_type()
    # "créer de nouvelles transactions" / "créer des nouvelles transactions" (pluriel, vocal ou clavier)
    if (
        "créer de nouvelles transactions" in t
        or "creer de nouvelles transactions" in nt
        or "créer des nouvelles transactions" in t
        or "creer des nouvelles transactions" in nt
        or ("créer" in t and "nouvelles transactions" in t)
        or ("creer" in nt and "nouvelles transactions" in nt)
    ):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    # "créer une transaction avec toi" / "créer une transaction avec Léa"
    if "créer une transaction" in t and ("avec toi" in t or "avec léa" in t or "avec lea" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    # "dans ce site une nouvelle transaction avec une adresse différente" / "nouvelle transaction" + adresse
    if "nouvelle transaction" in t and (
        "adresse" in t or "avec" in t or "dans ce site" in t or "différente" in t or "different" in nt
    ):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    if "nouvelle transaction" in t and ("créer" in t or "voudrais" in t or "veux" in t or "aimerais" in t or "souhaite" in t or "voulons" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    # "aide-moi à créer (une) transaction" / "aide-moi à créer un dossier"
    if "aide-moi" in t or "aide-moi " in t or "aidez-moi" in t or "m'aider" in t or "m’aider" in t:
        if "créer" in t and ("transaction" in t or "dossier" in t):
            if "achat" in t or "d'achat" in t:
                return True, default_type()
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()
        if "créer une transaction" in t or "créer un dossier" in t:
            return True, default_type()
    # "peux-tu créer" / "tu peux créer" / "pourrais-tu créer"
    if ("peux-tu" in t or "tu peux" in t or "pourrais-tu" in t or "pourrais tu" in t) and "créer" in t and (
        "transaction" in t or "dossier" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
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
            return True, default_type()
        if "vente" in t:
            return True, "vente"
        return True, default_type()  # défaut
    # "nous voulons / on veut créer (une) transaction" / "créer une transaction ensemble"
    if ("voulons" in t or "vouloir" in t) and "créer" in t and ("transaction" in t or "dossier" in t):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    if "créer" in t and "transaction" in t and (
        "ensemble" in t or "voulons" in t or "veux" in t or "aimerais" in t or "voudrais" in t
        or "souhaite" in t or "souhaites" in t or "souhaitons" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    # "nouvelle transaction" + volonté (aimerais, voudrais, veux, etc.)
    if "nouvelle transaction" in t and (
        "créer" in t or "aimerais" in t or "voudrais" in t or "veux" in t or "souhaite" in t or "souhaites" in t or "voulons" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    # Formulations du type "j'aimerais / je voudrais créer..."
    if ("aimerais créer" in t or "voudrais créer" in t or "veux créer" in t or "souhaite créer" in t) and (
        "transaction" in t or "dossier" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    # "que tu crées" / "que tu crée" (subjonctif) / "crée une transaction" — avec ou sans accents (vocal)
    if (
        "que tu crées" in t or "que tu crée" in t or "que tu crees" in nt or "que tu cree " in nt
        or "que tu creer" in nt or "que léa crées" in t or "que lea crées" in t or "que lea crees" in nt
        or "crée une transaction" in t or "crees une transaction" in nt or "cree une transaction" in nt
        or "que tu create" in t  # transcription anglaise
    ):
        if "achat" in t:
            return True, default_type()
        if "vente" in t:
            return True, "vente"
        return True, default_type()
    if "crée la transaction" in t or "crées la transaction" in t or "crée une transaction" in t:
        if "achat" in t:
            return True, default_type()
        if "vente" in t:
            return True, "vente"
        return True, default_type()
    if "transaction d'achat" in t and ("créer" in t or "créé" in t or "veux" in t or "voudrais" in t or "réer" in t or "voulons" in t):
        return True, default_type()
    if "transaction de vente" in t and ("créer" in t or "créé" in t or "veux" in t or "voudrais" in t or "réer" in t or "voulons" in t):
        return True, "vente"
    # Typo courant: "réer" au lieu de "créer"
    if "réer une transaction" in t or "réer la transaction" in t:
        if "achat" in t:
            return True, default_type()
        if "vente" in t:
            return True, "vente"
        return True, default_type()
    return False, ""


def _parse_names_from_raw(raw: str) -> List[tuple[str, str]]:
    """Parse une chaîne de noms (ex. 'William Ford et Kate Volkswagen') en liste de (prénom, nom)."""
    if not raw or not raw.strip():
        return []
    raw = re.sub(r"\s+est\s+", " et ", raw.strip(), flags=re.I)
    raw = re.sub(r"\s+(?:vocal|vacal|cale|local)\s+terminé.*$", "", raw, flags=re.I).strip()
    parts = re.split(r"\s+et\s+|\s*,\s*", raw)
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
    return names


def _extract_sellers_and_buyers_from_creation_message(
    message: str, last_assistant_message: Optional[str] = None
) -> Tuple[List[tuple[str, str]], List[tuple[str, str]]]:
    """
    Extrait vendeurs et acheteurs d'un message de création (ex. "vendeur William Ford, acheteur Kate Volkswagen").
    Retourne (sellers, buyers) où chaque liste est [(first_name, last_name), ...].
    """
    sellers: List[tuple[str, str]] = []
    buyers: List[tuple[str, str]] = []
    if not message or len(message.strip()) < 5:
        return sellers, buyers
    t = message.strip()

    # "vendeur(s) X" / "les vendeurs sont X" — jusqu'à "acheteur" ou fin
    m_v = re.search(
        r"(?:les\s+)?vendeurs?\s+(?:sont\s+)?:?\s*([^.]+?)(?=\s*[,.]?\s*acheteur|\s*\.|$)",
        t,
        re.I | re.DOTALL,
    )
    if m_v and m_v.group(1).strip():
        sellers = _parse_names_from_raw(m_v.group(1).strip())

    # "acheteur(s) X" / "les acheteurs sont X"
    m_a = re.search(
        r"(?:les\s+)?acheteurs?\s+(?:sont\s+)?:?\s*([^.]+?)(?=\s*\.|$)",
        t,
        re.I | re.DOTALL,
    )
    if m_a and m_a.group(1).strip():
        buyers = _parse_names_from_raw(m_a.group(1).strip())

    # Si un seul rôle dans le message, utiliser _extract_seller_buyer_names_list (contexte assistant)
    if not sellers and not buyers and last_assistant_message:
        names_list = _extract_seller_buyer_names_list(message, last_assistant_message)
        if names_list:
            role, names = names_list
            if role == "Vendeur":
                sellers = names
            else:
                buyers = names

    return sellers, buyers


async def maybe_create_transaction_from_lea(
    db: AsyncSession,
    user_id: int,
    message: str,
    last_assistant_message: Optional[str] = None,
) -> Tuple[Optional[RealEstateTransaction], Optional[str]]:
    """
    Crée une transaction uniquement si le message contient toutes les infos requises :
    type (achat/vente), adresse, prix, au moins un vendeur et un acheteur.
    Sinon retourne (None, instruction) pour que Léa demande les éléments manquants.
    Un courtier peut créer autant de transactions (vente ou achat) qu'il le souhaite ; il n'y a pas de limite ni de doublon.
    """
    ok, tx_type = _wants_to_create_transaction(message)
    if not ok or not tx_type:
        return (None, None)

    # Règle : ne créer que si adresse + prix + au moins un vendeur + au moins un acheteur (date de clôture facultative)
    address = _extract_address_from_message(message)
    price_tup = _extract_price_from_message(message)
    sellers, buyers = _extract_sellers_and_buyers_from_creation_message(message, last_assistant_message)

    missing = []
    if not address:
        missing.append("l'adresse du bien")
    if not price_tup:
        missing.append("le prix")
    if not sellers:
        missing.append("au moins un vendeur")
    if not buyers:
        missing.append("au moins un acheteur")

    if missing:
        missing_str = ", ".join(missing)
        instruction = (
            f"L'utilisateur souhaite créer une transaction ({tx_type}) mais il manque : {missing_str}. "
            "Ne crée pas encore le dossier. "
            "Demande-lui une seule chose à la fois, dans cet ordre : 1) adresse du bien, 2) vendeurs, 3) acheteurs, 4) prix. "
            "Ne liste jamais les 4 points dans un seul message. "
            "Pose une seule question courte parmi les 4 (ex. « Quelle est l'adresse du bien ? », « Qui sont les vendeurs ? ») selon ce qui manque."
        )
        return (None, instruction)

    try:
        name = f"Transaction {tx_type.capitalize()}"
        amount, price_kind = price_tup
        sellers_json = [{"name": f"{f} {l}".strip(), "phone": None, "email": None} for f, l in sellers]
        buyers_json = [{"name": f"{f} {l}".strip(), "phone": None, "email": None} for f, l in buyers]

        transaction = RealEstateTransaction(
            user_id=user_id,
            name=name,
            dossier_number=None,
            status="En cours",
            sellers=sellers_json,
            buyers=buyers_json,
            property_province="QC",
            property_address=address,
            property_city=None,
            property_postal_code=None,
            transaction_kind=tx_type,
            pipeline_stage="creation_dossier",
            listing_price=amount if price_kind == "listing" else None,
            offered_price=amount if price_kind == "offered" else None,
        )
        db.add(transaction)
        await db.flush()
        # Créer les contacts et TransactionContact pour chaque vendeur/acheteur
        for first_name, last_name in sellers:
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
            db.add(TransactionContact(transaction_id=transaction.id, contact_id=contact.id, role="Vendeur"))
        for first_name, last_name in buyers:
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
            db.add(TransactionContact(transaction_id=transaction.id, contact_id=contact.id, role="Acheteur"))
        await db.commit()
        await db.refresh(transaction)
        logger.info(
            f"Lea created transaction id={transaction.id} type={tx_type} for user_id={user_id} "
            f"(address={address}, sellers={len(sellers)}, buyers={len(buyers)})"
        )
        return (transaction, None)
    except Exception as e:
        logger.warning(f"Lea create transaction failed: {e}", exc_info=True)
        await db.rollback()
        return (None, None)


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
    # "transaction 4" / "transaction #4" / "la transaction 4" / "pour la transaction 4" / "de la transaction 4"
    m = re.search(r"(?:pour\s+|de\s+)?(?:la\s+)?transaction\s+#?\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    # "dossier 4"
    m = re.search(r"dossier\s+#?\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    # "transaction numéro 4" / "la transaction numéro 4"
    m = re.search(r"(?:la\s+)?transaction\s+numéro\s+#?\s*(\d+)", t, re.I)
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


def _extract_address_hint_from_message(message: str) -> Optional[str]:
    """Extrait un indice d'adresse du message pour cibler une transaction (ex: 'Bordeaux' dans 'transaction sur de Bordeaux')."""
    if not message or len(message.strip()) < 3:
        return None
    t = message.strip()
    # "sur la transaction de Bordeaux" / "pour la transaction de Bordeaux" / "transaction de Bordeaux"
    m = re.search(r"(?:sur|pour)\s+(?:la\s+)?transaction\s+(?:de\s+|sur\s+)([A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    # "transaction sur (la) rue de Bordeaux" / "transaction sur de Bordeaux" / "rue de Bordeaux"
    m = re.search(r"(?:rue\s+de|sur\s+(?:la\s+)?(?:rue\s+)?(?:de\s+)?)([A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    # "transaction Bordeaux" / "transaction sur de Bordeaux"
    m = re.search(r"transaction\s+(?:sur\s+)?(?:de\s+)?([A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    return None


def _extract_address_hint_from_assistant_message(message: str) -> Optional[str]:
    """
    Extrait un indice d'adresse du message assistant quand Léa vient de donner l'adresse (ex. "est : 8569 delorimier, Val-d'Or",
    "propriété au 8876 de Bordeaux, Val-d'Or"). Permet de cibler la bonne transaction quand l'utilisateur répond sans répéter l'adresse.
    """
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()
    # "propriété au 8876 de Bordeaux, Val-d'Or" / "nous travaillons sur la propriété au 8876 de Bordeaux"
    m = re.search(r"propriété\s+au\s+(\d+\s+(?:de\s+)?[A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    # "au 8876 de Bordeaux, Val-d'Or (Québec)" -> extraire "Bordeaux" ou "8876 de Bordeaux"
    m = re.search(r"au\s+(\d+\s+de\s+[A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    # "L'adresse ... est : 8569 delorimier, Val-d'Or" / "est : 8569 delorimier," / "adresse suivante est : 8569 delorimier"
    m = re.search(r"(?:adresse\s+(?:suivante\s+)?(?:est\s*:\s*)|est\s*:\s*)\s*(\d+\s+[A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    # Mot de rue après "de " (ex. "de Bordeaux", "de Lorimier") dans un contexte d'adresse
    m = re.search(r"\bde\s+([A-Za-zÀ-ÿ]{4,})\s*[,)]", t)
    if m:
        return m.group(1).strip()
    # Dernier recours : un mot typique de rue (ex. "delorimier", "Bordeaux") après "transaction", "dossier" ou "propriété"
    m = re.search(r"(?:transaction|dossier|propriété).*?\b([A-Za-zÀ-ÿ]{4,})\b", t, re.I)
    if m:
        return m.group(1).strip()
    return None


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


def _extract_address_from_message(message: str) -> Optional[str]:
    """Extrait une adresse du message (ex: 'l'adresse est le 6/840 avenue Papineau', 'l'adresse est le 6 8 4 0 avenue Papineau à Montréal code postal h2g2x7')."""
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()

    def normalize_address(raw: str) -> str:
        """Normalise espaces dans les chiffres (6 8 4 0 -> 6840) et code postal. Supprime artefacts vocaux en fin."""
        s = raw.strip()
        # "l'adresse est de 6254 rue X" -> enlever le "de " initial
        s = re.sub(r"^de\s+", "", s, flags=re.I).strip()
        # Artefacts vocaux en fin : "terminé", "à terminer", "donc à terminer", "local terminé", etc.
        s = re.sub(r"\s+(?:donc\s+)?à\s+terminer\s*$", "", s, flags=re.I).strip()
        s = re.sub(r"\s+terminé\s*$", "", s, flags=re.I).strip()
        s = re.sub(r"\s+(?:local|locales|elle|vocal|vacal)\s+terminé\s*$", "", s, flags=re.I).strip()
        # "local" / "locales" seuls en fin (artefact vocal après "local terminé" coupé)
        s = re.sub(r"\s+local(?:es)?\s*$", "", s, flags=re.I).strip()
        # Collapse digits
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
    # "le bien est au X" / "le bien est donc X" / "est au X" / "c'est au X" (vocal: "le biais est au 56 26 de Lorimier")
    for prefix in (
        r"le\s+bien\s+est\s+(?:donc\s+)?(?:au\s+)?",
        r"le\s+biais\s+est\s+au\s+",
        r"est\s+au\s+",
        r"c'est\s+au\s+",
    ):
        m = re.search(prefix + r"(.+?)(?:\s+(?:local|locales|poker|vocal|vacal)\s+terminé|\.|$)", t, re.I | re.DOTALL)
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
    # "les 7 2 3 6 rue Waverly" (vocal : "les" pour "l'adresse est" / "l'est")
    m = re.search(r"\bles\s+(\d(?:\s*\d)*\s+(?:avenue|av\.?|rue|boulevard|blvd\.?|boul\.?)\s+[\w\s-]+)", t, re.I)
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
    # "56 26 de Lorimier" / "6 26 de Lorimier" (numéro + "de" + nom de rue, sans "rue/avenue")
    m = re.search(r"(\d(?:\s*\d)*\s+de\s+[A-Za-zÀ-ÿ\s\-]+?)(?:\s+(?:poker|vocal|vacal)\s+terminé|\.|$|\s+toi\s+|\s+trouve)", t, re.I)
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 8:
            return addr
    return None


def _last_message_asked_for_address(last_assistant_message: Optional[str] = None) -> bool:
    """True si le dernier message de Léa demandait l'adresse du bien (ex. « Quelle est l'adresse du bien ? »)."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 10:
        return False
    t = last_assistant_message.strip().lower()
    return (
        "adresse" in t
        and ("quelle" in t or "du bien" in t or "propriété" in t or "l'adresse" in t or "me dire" in t)
    )


def _last_message_asked_for_sellers(last_assistant_message: Optional[str] = None) -> bool:
    """True si le dernier message de Léa demandait les vendeurs (ex. « Qui sont les vendeurs ? »)."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 5:
        return False
    t = last_assistant_message.strip().lower()
    return "vendeur" in t and ("qui" in t or "quels" in t or "noms" in t or "nom" in t or "?" in t)


def _last_message_asked_for_buyers(last_assistant_message: Optional[str] = None) -> bool:
    """True si le dernier message de Léa demandait les acheteurs (ex. « Qui sont les acheteurs ? »)."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 5:
        return False
    t = last_assistant_message.strip().lower()
    return "acheteur" in t and ("qui" in t or "quels" in t or "noms" in t or "nom" in t or "?" in t)


def _wants_to_update_address(message: str) -> bool:
    t = (message or "").strip().lower()
    if not t:
        return False
    # "créer une transaction (de vente/d'achat) pour 123 rue X" — adresse dans la même phrase que la création
    if ("créer" in t or "creer" in t) and "transaction" in t and _extract_address_from_message(message):
        return True
    # "le bien est au X" / "est au X" sans le mot "adresse"
    if "est au" in t or "c'est au" in t or "bien est" in t or "biais est" in t:
        if _extract_address_from_message(message):
            return True
    # "56 26 de Lorimier toi trouve en ligne le reste" — adresse + demande de compléter en ligne
    if ("trouve" in t or "en ligne" in t or "reste" in t) and _extract_address_from_message(message):
        return True
    # "les 7 2 3 6 rue Waverly" (vocal : adresse sans mot "adresse")
    if re.search(r"\bles\s+\d(?:\s*\d)*\s+(?:rue|avenue|av\.?|boulevard)\s+", t, re.I) and _extract_address_from_message(message):
        return True
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


def _format_canadian_postal_code(raw: str) -> str:
    """Normalise un code postal canadien au format A1A 1A1 (espace au milieu)."""
    if not raw:
        return ""
    s = re.sub(r"\s+", "", str(raw).strip().upper())
    if len(s) == 6 and s[0].isalpha() and s[1].isdigit() and s[2].isalpha() and s[3].isdigit() and s[4].isalpha() and s[5].isdigit():
        return f"{s[0]}{s[1]}{s[2]} {s[3]}{s[4]}{s[5]}"
    return str(raw).strip()


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


def _extract_postal_code_from_message(message: str) -> Optional[str]:
    """Extrait un code postal canadien (A1A 1A1) du message, s'il y en a un."""
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()
    # Format A1A 1A1 ou A1A1A1 (avec ou sans espaces)
    m = re.search(r"[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d", t)
    if m:
        raw = re.sub(r"\s+", "", m.group(0).upper())
        if len(raw) == 6 and raw[0].isalpha() and raw[1].isdigit() and raw[2].isalpha() and raw[3].isdigit() and raw[4].isalpha() and raw[5].isdigit():
            return _format_canadian_postal_code(raw)
    return None


def _extract_city_correction_from_message(message: str) -> Optional[str]:
    """Extrait une ville indiquée en correction (ex. « la ville c'est Montréal », « corrige la ville en Laval »)."""
    if not message or len(message.strip()) < 2:
        return None
    t = (message or "").strip()
    t_lower = t.lower()
    # "la ville c'est X" / "c'est X" (contexte ville) / "corrige la ville en X" / "la bonne ville c'est X"
    for pattern in (
        r"(?:la\s+ville\s+(?:c'est|est)\s+|ville\s*:\s*)([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,|\s+et\s+)",
        r"(?:corrige(?:r?)\s+la\s+ville\s+(?:en\s+|à\s+)?|remplace\s+la\s+ville\s+par\s+)([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
        r"(?:le\s+bon\s+code\s+postal|la\s+bonne\s+ville)\s+(?:c'est|est)\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)",
    ):
        m = re.search(pattern, t, re.I)
        if m:
            city = m.group(1).strip()
            if 2 <= len(city) <= 50 and not any(c.isdigit() for c in city):
                return city
    # Message court type « Montréal » ou « Laval » après une question sur la ville
    if len(t.split()) <= 3 and not any(c.isdigit() for c in t) and t[0].isupper():
        return t.strip()
    return None


def _last_message_mentioned_address_or_postal(last_assistant_message: Optional[str]) -> bool:
    """True si le dernier message de Léa mentionnait une adresse ou un code postal (contexte de correction)."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 10:
        return False
    lower = last_assistant_message.strip().lower()
    return (
        "adresse" in lower
        or "code postal" in lower
        or "montréal" in lower
        or "québec" in lower
        or re.search(r"[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d", last_assistant_message) is not None
    )


def _is_correcting_postal_or_city(message: str, last_assistant_message: Optional[str]) -> bool:
    """True si l'utilisateur corrige le code postal ou la ville (après que Léa ait indiqué une adresse)."""
    if not message or len(message.strip()) < 2:
        return False
    t = (message or "").strip().lower()
    if not _last_message_mentioned_address_or_postal(last_assistant_message):
        return False
    correction_phrases = (
        "non ",
        "non,",
        "corrige",
        "correction",
        "c'est ",
        "c’est ",
        "le code postal",
        "code postal c'est",
        "code postal est",
        "le bon code postal",
        "la ville c'est",
        "la ville est",
        "corrige la ville",
        "changer le code postal",
        "modifier le code postal",
        "pas ça",
        "pas le bon",
        "erreur",
    )
    return any(p in t for p in correction_phrases)


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


def _wants_to_geocode_existing_address(message: str) -> bool:
    """True si l'utilisateur demande de chercher l'adresse / code postal / ville sur Internet (géocodage sur la transaction déjà enregistrée)."""
    t = (message or "").strip().lower()
    if not t:
        return False
    has_verb = (
        "chercher" in t or "cherche" in t or "trouve" in t or "trouver" in t
        or "recherche" in t or "rechercher" in t
        or "écris" in t or "écrire" in t
        or "ajout" in t  # "ajouter le code postal", "ajoutons le code postal"
        or "fais" in t or "faire" in t  # "toi fais la recherche en ligne", "fais la recherche"
    )
    # Adresse complète, code postal ou ville (recherche en ligne)
    has_address = (
        "adresse" in t or "l'adresse" in t
        or "code postal" in t or "ville" in t
        or "complète" in t or "compléter" in t or "complétons" in t  # "compléter l'adresse"
    )
    has_trigger = (
        "internet" in t or "en ligne" in t or "ligne" in t
        or "complète" in t or "code postal" in t or "ville" in t
    )
    return has_verb and has_address and (has_trigger or "recherche" in t or "écris" in t or "écrire" in t)


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


def _extract_seller_buyer_names_list(
    message: str, last_assistant_message: Optional[str] = None
) -> Optional[tuple[str, List[tuple[str, str]]]]:
    """
    Extrait une liste de noms pour "les vendeurs sont A et B" / "ce sont A" / "c'est A" (avec contexte).
    Retourne (role, [(first_name, last_name), ...]) ou None.
    """
    if not message or len(message.strip()) < 3:
        return None
    t = message.strip()
    role: Optional[str] = None
    raw: Optional[str] = None
    last_lower = (last_assistant_message or "").strip().lower()

    # "ce sont X" / "c'est X" (réponse courte après "Qui sont les vendeurs ?")
    if last_assistant_message and len(t) <= 80:
        if re.search(r"ce\s+sont\s+", t, re.I):
            if "vendeur" in last_lower:
                role = "Vendeur"
            elif "acheteur" in last_lower:
                role = "Acheteur"
            if role:
                m_ce = re.search(r"ce\s+sont\s+(.+?)(?:\.|$|\s+local\s+terminé|\s+terminé)", t, re.I | re.DOTALL)
                if m_ce:
                    raw = m_ce.group(1).strip()
        elif re.search(r"c'est\s+", t, re.I) and ("vendeur" in last_lower or "acheteur" in last_lower):
            role = "Vendeur" if "vendeur" in last_lower else "Acheteur"
            m_cest = re.search(r"c'est\s+(.+?)(?:\.|$|\s+local\s+terminé|\s+terminé)", t, re.I | re.DOTALL)
            if m_cest:
                raw = m_cest.group(1).strip()

    # Réponse avec uniquement le(s) nom(s) après « Qui sont les vendeurs ? » / « Qui sont les acheteurs ? »
    if raw is None and last_assistant_message and len(t) <= 120:
        asking_vendeurs = "vendeur" in last_lower and (
            "qui sont" in last_lower or "vendeurs pour" in last_lower or "vendeurs ?" in last_lower or "vendeurs pour ce" in last_lower or "noms des vendeurs" in last_lower
        )
        asking_acheteurs = "acheteur" in last_lower and (
            "qui sont" in last_lower or "acheteurs pour" in last_lower or "acheteurs ?" in last_lower or "acheteurs pour ce" in last_lower or "noms des acheteurs" in last_lower
        )
        # Exclure réponses négatives ou non-noms
        if not re.search(r"\b(pas|aucun|rien|je ne sais|à compléter)\b", t, re.I):
            name_like = re.match(
                r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]*(?:\s+et\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]+)*\s*\.?$",
                t,
                re.I,
            ) or re.match(
                r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]*(?:\s*,\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]+)+\s*\.?$",
                t,
                re.I,
            )
            if name_like and len(t.strip()) >= 2:
                if asking_vendeurs:
                    role = "Vendeur"
                    raw = t.strip().rstrip(".")
                elif asking_acheteurs:
                    role = "Acheteur"
                    raw = t.strip().rstrip(".")

    # Fallback : message court type "Prénom Nom" (ex. "sarah lopez", "Eric smith") après une question vendeurs/acheteurs
    if raw is None and last_assistant_message and len(t) <= 80:
        if not re.search(r"\b(pas|aucun|rien|je ne sais)\b", t, re.I) and re.match(r"^[A-Za-zÀ-ÿ\s\-]+$", t, re.I) and len(t.strip()) >= 3:
            if "vendeur" in last_lower and ("qui sont" in last_lower or "vendeurs" in last_lower):
                role = "Vendeur"
                raw = t.strip()
            elif "acheteur" in last_lower and ("qui sont" in last_lower or "acheteurs" in last_lower):
                role = "Acheteur"
                raw = t.strip()

    if raw is None:
        # "enregistre les vendeurs suivants Lily et Lilou" / "enregistre les vendeurs X et Y"
        if re.search(r"enregistre(?:r?|s?)\s+(?:les?\s+)?vendeurs?\s+", t, re.I):
            role = "Vendeur"
            m_env = re.search(
                r"enregistre(?:r?|s?)\s+(?:les?\s+)?vendeurs?\s+(?:suivants?)?\s*(.+?)(?:\s*\.|$|\s+pour\s+)",
                t,
                re.I | re.DOTALL,
            )
            if m_env and m_env.group(1).strip():
                raw = m_env.group(1).strip()
        elif re.search(r"enregistre(?:r?|s?)\s+(?:les?\s+)?acheteurs?\s+", t, re.I):
            role = "Acheteur"
            m_env = re.search(
                r"enregistre(?:r?|s?)\s+(?:les?\s+)?acheteurs?\s+(?:suivants?)?\s*(.+?)(?:\s*\.|$|\s+pour\s+)",
                t,
                re.I | re.DOTALL,
            )
            if m_env and m_env.group(1).strip():
                raw = m_env.group(1).strip()
        if raw is not None:
            pass  # use raw as-is, will be parsed below (et, comma, etc.)
        else:
            if re.search(r"les\s+vendeurs\s+sont\s+", t, re.I):
                role = "Vendeur"
            elif re.search(r"les\s+acheteurs\s+sont\s+", t, re.I):
                role = "Acheteur"
            elif re.search(r"ajoute\s+(?:le\s+)?(?:l['']?)?vendeur\s+", t, re.I) or re.search(r"ajoute\s+([A-Za-zÀ-ÿ\s\-]+)\s+comme\s+vendeur", t, re.I):
                role = "Vendeur"
                m_add = re.search(r"ajoute\s+(?:le\s+)?(?:l['']?)?vendeur\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)", t, re.I) or re.search(r"ajoute\s+([A-Za-zÀ-ÿ\s\-]+)\s+comme\s+vendeur", t, re.I)
                if m_add:
                    raw = m_add.group(1).strip()
            elif re.search(r"ajoute\s+(?:le\s+)?(?:l['']?)?acheteur\s+", t, re.I) or re.search(r"ajoute\s+([A-Za-zÀ-ÿ\s\-]+)\s+comme\s+acheteur", t, re.I):
                role = "Acheteur"
                m_add = re.search(r"ajoute\s+(?:le\s+)?(?:l['']?)?acheteur\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)", t, re.I) or re.search(r"ajoute\s+([A-Za-zÀ-ÿ\s\-]+)\s+comme\s+acheteur", t, re.I)
                if m_add:
                    raw = m_add.group(1).strip()
            if not role:
                return None
            m = re.search(r"les\s+vendeurs\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
            if not m and role == "Acheteur":
                m = re.search(r"les\s+acheteurs\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
            if not m:
                # "ils sont X et Y" (vocal) après une question sur les vendeurs/acheteurs
                if "vendeur" in last_lower and re.search(r"ils\s+sont\s+", t, re.I):
                    role = "Vendeur"
                    m = re.search(r"ils\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
                elif "acheteur" in last_lower and re.search(r"ils\s+sont\s+", t, re.I):
                    role = "Acheteur"
                    m = re.search(r"ils\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
            if not m:
                # "le vendeur s'appelle X" / "enregistre les vendeurs le vendeur s'appelle X"
                if re.search(r"(?:le\s+)?vendeur\s+s['']appelle\s+", t, re.I) or re.search(r"enregistre(?:r?|s?)\s+(?:les?\s+)?vendeurs?\s+.*s['']appelle\s+", t, re.I):
                    role = "Vendeur"
                    m = re.search(r"(?:le\s+)?vendeur\s+s['']appelle\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour|\s+téléphone|\s+courriel|vocales?\s+terminé)", t, re.I)
                    if not m:
                        m = re.search(r"enregistre(?:r?|s?)\s+(?:les?\s+)?vendeurs?\s+(?:le\s+vendeur\s+)?s['']appelle\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour|vocales?)", t, re.I)
                elif re.search(r"l['']?acheteur\s+s['']appelle\s+", t, re.I) or re.search(r"enregistre(?:r?|s?)\s+(?:les?\s+)?acheteurs?\s+.*s['']appelle\s+", t, re.I):
                    role = "Acheteur"
                    m = re.search(r"l['']?acheteur\s+s['']appelle\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour|\s+téléphone|\s+courriel|vocales?\s+terminé)", t, re.I)
                    if not m:
                        m = re.search(r"enregistre(?:r?|s?)\s+(?:les?\s+)?acheteurs?\s+(?:l['']?acheteur\s+)?s['']appelle\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour|vocales?)", t, re.I)
            if raw is None:
                if not m:
                    return None
                raw = m.group(1).strip()
    # Transcription vocale : "est" pour "et" dans les listes de noms ("Christian est abatti" -> "Christian et abatti")
    raw = re.sub(r"\s+est\s+", " et ", raw, flags=re.I)
    # Artefact vocal en fin de phrase : "vocal terminé", "local terminé", "elle terminé", "e" (coupure)
    raw = re.sub(r"\s+(?:vocal|vacal|cale|local|locales|elle)\s+terminé.*$", "", raw, flags=re.I).strip()
    raw = re.sub(r"\s+local(?:es)?\s*$", "", raw, flags=re.I).strip()
    raw = re.sub(r"\s+e\s*$", "", raw, flags=re.I).strip()
    if not raw:
        return None
    # Séparateurs : " et ", virgule, " les " ou " à " (vocal "A à B" = deux noms ou prénom à nom)
    parts = re.split(r"\s+et\s+|\s*,\s*|\s+les\s+", raw)
    names: List[tuple[str, str]] = []
    for part in parts:
        part = part.strip()
        if not part or len(part) < 2:
            continue
        # "Abatti à Titi" (vocal) = prénom Abatti, nom Titi
        if " à " in part:
            sub = part.split(" à ", 1)
            first_name = sub[0].strip()
            last_name = sub[1].strip() if len(sub) > 1 else first_name
            if first_name and last_name:
                names.append((first_name, last_name))
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


def _extract_seller_buyer_contact_from_message(message: str, last_assistant_message: Optional[str] = None) -> Optional[tuple[str, str, Optional[str], Optional[str], str]]:
    """
    Détecte si l'utilisateur donne les coordonnées d'un vendeur ou d'un acheteur.
    Retourne (first_name, last_name, phone, email, role). Avec last_assistant_message, on peut inférer le rôle pour une réponse de suivi (« Johnny a … gmail.com et 438… »).
    """
    if not message or len(message.strip()) < 10:
        return None
    t = message.strip()
    role: Optional[str] = None
    if re.search(r"\bvendeur(s?)\b", t, re.I) or "coordonnée du vendeur" in t.lower() or "coordonnées du vendeur" in t.lower():
        role = "Vendeur"
    elif re.search(r"\bacheteur(s?)\b", t, re.I) or "coordonnée de l'acheteur" in t.lower() or "coordonnées de l'acheteur" in t.lower():
        role = "Acheteur"
    if not role and last_assistant_message:
        last_lower = last_assistant_message.strip().lower()
        if "vendeur" in last_lower and ("téléphone" in last_lower or "courriel" in last_lower or "coordonnées" in last_lower):
            role = "Vendeur"
        elif "acheteur" in last_lower and ("téléphone" in last_lower or "courriel" in last_lower or "coordonnées" in last_lower):
            role = "Acheteur"
    if not role:
        return None
    name_from_followup: Optional[str] = None

    # "les vendeurs sont A et B" / "les vendeurs sont A, B et C" → géré par _extract_seller_buyer_names_list
    if re.search(r"les\s+vendeurs\s+sont\s+.+\s+et\s+", t, re.I) or re.search(r"les\s+acheteurs\s+sont\s+.+\s+et\s+", t, re.I):
        return None

    # Nom : "il s'appelle X" / "s'appelle X" / "c'est X" / en suivi "Johnny a ... gmail.com et ..."
    name_match = re.search(
        r"(?:il\s+)?s['']appelle\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s+son\s+numéro|\s+numéro|\s+téléphone|\s+phone|\s+courriel|\s+email|$|,)",
        t,
        re.I,
    )
    if not name_match:
        name_match = re.search(r"c'est\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s+son\s+numéro|\s+numéro|\s+téléphone|$|,)", t, re.I)
    name_from_followup = None
    if not name_match and ("@" in t or "gmail.com" in t) and last_assistant_message:
        # Réponse de suivi : "Johnny a commercial gmail.com et 4 3 8..." -> nom au début ou dans le message assistant
        m_start = re.match(r"^([A-Za-zÀ-ÿ]+)(?:\s+([A-Za-zÀ-ÿ\-]+))?\s+(?:a|à)\s+", t, re.I)
        if m_start:
            name_from_followup = (m_start.group(1) + " " + (m_start.group(2) or "")).strip()
        else:
            m_last = re.search(r"(?:de|du|pour)\s+([A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ\-]+)(?:\s|,|\.|$)", last_assistant_message.strip(), re.I)
            if m_last:
                name_from_followup = m_last.group(1).strip()
    name = (name_match.group(1).strip() if name_match else name_from_followup) or None
    if not name or len(name) < 2:
        return None
    parts = name.split()
    if len(parts) >= 2:
        first_name, last_name = parts[0], " ".join(parts[1:])
    else:
        first_name = last_name = parts[0]
    # Téléphone : 514-266-5543, 514 266 5543, ou chiffres espacés "4 3 8 4 9 2 5 3 0 7"
    phone_match = re.search(
        r"(?:numéro|téléphone|phone)(?:\s+de\s+(?:téléphone|phone))?\s*(?:est\s*)?(?:le\s*)?[:\s]*(\d{3}[\s.\-]*\d{3}[\s.\-]*\d{4})",
        t,
        re.I,
    )
    if not phone_match:
        phone_match = re.search(r"\b(\d{3}[\s.\-]\d{3}[\s.\-]\d{4})\b", t)
    if not phone_match:
        phone_match = re.search(r"(\d(?:\s*\d){9})", t)
    phone = None
    if phone_match:
        raw_phone = phone_match.group(1).replace(" ", "").replace(".", "").replace("-", "")
        if len(raw_phone) == 10 and raw_phone.isdigit():
            phone = f"{raw_phone[0:3]}-{raw_phone[3:6]}-{raw_phone[6:10]}"
    # Email optionnel
    email_match = re.search(r"(?:courriel|email)\s*(?:est\s*)?[:\s]*([^\s,\.]+@[^\s,\.]+)", t, re.I)
    email = email_match.group(1).strip() if email_match else None
    if not email and "gmail.com" in t:
        local = re.search(r"(\w+)\s+(?:a|à|@)?\s*(?:commercial\s+)?gmail\.com", t, re.I)
        if local:
            email = f"{local.group(1).strip()}@gmail.com"
    # En suivi (nom depuis contexte), exiger au moins téléphone ou courriel pour éviter doublon
    if name_from_followup is not None and not phone and not email:
        return None
    return (first_name.strip(), last_name.strip(), phone, email, role)


def _extract_seller_buyer_names_from_assistant_question(assistant_message: str) -> Optional[tuple[str, List[tuple[str, str]]]]:
    """
    Quand l'assistant a demandé « Souhaitez-vous enregistrer X et Y comme vendeurs ? »
    et l'utilisateur répond « oui enregistrez les », extrait X et Y du message assistant.
    Retourne (role, [(first_name, last_name), ...]) ou None.
    """
    if not assistant_message or len(assistant_message.strip()) < 10:
        return None
    t = assistant_message.strip()
    role: Optional[str] = None
    if "comme vendeurs" in t.lower() or "comme vendeur" in t.lower():
        role = "Vendeur"
    elif "comme acheteurs" in t.lower() or "comme acheteur" in t.lower():
        role = "Acheteur"
    if not role:
        return None
    # "enregistrer Michel et Lucie Zapata comme vendeurs" / "X et Y comme vendeurs"
    m = re.search(r"(?:enregistrer\s+)?(.+?)\s+comme\s+" + ("vendeurs?" if role == "Vendeur" else "acheteurs?"), t, re.I | re.DOTALL)
    if not m:
        return None
    raw = m.group(1).strip()
    raw = re.sub(r"\s+vocales?\s+terminées?.*$", "", raw, flags=re.I).strip()
    if not raw or len(raw) < 3:
        return None
    parts = re.split(r"\s+et\s+|\s*,\s*", raw)
    names: List[tuple[str, str]] = []
    for part in parts:
        part = part.strip()
        if not part or len(part) < 2:
            continue
        words = part.split()
        if len(words) >= 2:
            first_name, last_name = words[0], " ".join(words[1:])
        else:
            first_name = last_name = part
        if len(first_name) >= 1 and len(last_name) >= 1:
            names.append((first_name.strip(), last_name.strip()))
    if not names:
        return None
    return (role, names)


def _extract_rename_seller_buyer_from_message(
    message: str, last_assistant_message: Optional[str] = None
) -> Optional[Tuple[str, str, str]]:
    """
    Détecte une demande de changement de nom d'un vendeur ou acheteur.
    Retourne (ancien_nom_ou_recherche, nouveau_nom, "Acheteur"|"Vendeur") ou None.
    """
    if not message or len(message.strip()) < 5:
        return None
    t = (message or "").strip()
    t_lower = t.lower()
    role: Optional[str] = None
    if re.search(r"\bacheteur(s?)\b", t_lower):
        role = "Acheteur"
    if re.search(r"\bvendeur(s?)\b", t_lower):
        role = role or "Vendeur"
    if not role and last_assistant_message:
        last_lower = (last_assistant_message or "").strip().lower()
        if "acheteur" in last_lower:
            role = "Acheteur"
        elif "vendeur" in last_lower:
            role = "Vendeur"
    if not role:
        return None

    # "changer le nom de l'acheteur X en Y" / "remplacer l'acheteur X par Y"
    m = re.search(
        r"(?:changer|modifier|corriger)\s+(?:le\s+)?nom\s+(?:de\s+l['']?)?(?:acheteur|vendeur)\s+(?:c['']est\s+)?([A-Za-zÀ-ÿ\s\-]+?)\s+en\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t,
        re.I,
    )
    if m:
        old_name = m.group(1).strip()
        new_name = m.group(2).strip()
        if len(old_name) >= 2 and len(new_name) >= 2:
            return (old_name, new_name, role)

    m = re.search(
        r"remplacer\s+(?:l['']?)?(?:acheteur|vendeur)\s+([A-Za-zÀ-ÿ\s\-]+?)\s+par\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t,
        re.I,
    )
    if m:
        old_name = m.group(1).strip()
        new_name = m.group(2).strip()
        if len(old_name) >= 2 and len(new_name) >= 2:
            return (old_name, new_name, role)

    # "l'acheteur c'est pas X, c'est Y" / "non l'acheteur c'est Y" / "c'est Y pas X"
    m = re.search(
        r"(?:l['']?|le\s+)(?:acheteur|vendeur)\s+(?:c['']est\s+)?(?:pas\s+)?([A-Za-zÀ-ÿ\s\-]+?)\s*,\s*(?:c['']est\s+)?([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)",
        t,
        re.I,
    )
    if m:
        old_name = m.group(1).strip()
        new_name = m.group(2).strip()
        if len(old_name) >= 2 and len(new_name) >= 2:
            return (old_name, new_name, role)

    m = re.search(
        r"non\s+(?:l['']?|le\s+)(?:acheteur|vendeur)\s+(?:c['']est\s+)?([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)",
        t,
        re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            # Ancien nom peut être dans le message assistant (ex. "L'acheteur est Paul Dupont")
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last,
                re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)

    # "corriger le nom (de l'acheteur), c'est Y"
    m = re.search(
        r"(?:corriger|changer|modifier)\s+(?:le\s+)?nom\s+(?:de\s+l['']?)?(?:acheteur|vendeur)?\s*[,:]?\s*c['']est\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)",
        t,
        re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last,
                re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)

    # "change le vendeur pour X" / "remplace l'acheteur par X" / "change l'acheteur pour X"
    m = re.search(
        r"(?:change|remplace|mets?|définir?)\s+(?:le\s+)?(?:l['']?)?(?:acheteur|vendeur)\s+(?:pour|par|c['']est)\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t,
        re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last,
                re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)
        return ("*", new_name, role)

    # "le vendeur c'est maintenant X" / "l'acheteur c'est X"
    m = re.search(
        r"(?:l['']?|le\s+)(?:acheteur|vendeur)\s+c['']est\s+(?:maintenant\s+)?([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t,
        re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last,
                re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)
        return ("*", new_name, role)

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


def _extract_remove_person_from_message(message: str) -> Optional[Tuple[str, Optional[str]]]:
    """
    Détecte une demande de suppression/retrait d'un vendeur ou acheteur.
    Ex: « supprimer Hind », « retirer le vendeur Pierre », « enlever Marie des acheteurs ».
    Retourne (nom_à_supprimer, role_hint) où role_hint est "Vendeur", "Acheteur" ou None.
    """
    if not message or len(message.strip()) < 5:
        return None
    t = (message or "").strip().lower()
    # Mots déclencheurs
    remove_verbs = ("supprimer", "supprime", "retirer", "retire", "enlever", "enlève", "remove")
    if not any(v in t for v in remove_verbs):
        return None
    # Indice de rôle
    role_hint: Optional[str] = None
    if "vendeur" in t or "vendeuse" in t:
        role_hint = "Vendeur"
    elif "acheteur" in t or "acheteuse" in t:
        role_hint = "Acheteur"
    # Extraire le nom après le verbe
    for verb in remove_verbs:
        pat = re.compile(
            r"(?:" + verb + r")\s+(?:le\s+|la\s+|l[''])?\s*(?:vendeur\s+|acheteur\s+|vendeuse\s+|acheteuse\s+)?\s*([a-zàâäéèêëïîôùûüç\s\-]+?)(?:\s+des?\s+vendeurs?|\s+des?\s+acheteurs?|\s+du\s+rôle\s+(?:vendeur|acheteur)|$)",
            re.I,
        )
        m = pat.search(t)
        if m:
            name = m.group(1).strip()
            if len(name) >= 2:
                return (name, role_hint)
        # Pattern simple : "supprimer Hind", "retirer Hind."
        simple = re.search(r"(?:" + verb + r")\s+(?:le\s+|la\s+|l[''])?\s*(?:vendeur\s+|acheteur\s+|vendeuse\s+|acheteuse\s+)?\s*([a-zàâäéèêëïîôùûüç\s\-]+?)(?:\s+des?\s+|\s*$|\.|,|!|\?)", t, re.I)
        if not simple:
            simple = re.search(r"(?:" + verb + r")\s+([a-zàâäéèêëïîôùûüç\-]+)(?:\s|$|\.|,)", t, re.I)
        if simple:
            name = simple.group(1).strip()
            if len(name) >= 2 and name.lower() not in ("le", "la", "des", "du", "les"):
                return (name, role_hint)
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
            "Indique-lui qu'il peut aller dans Transactions → ouvrir la transaction → onglet Formulaires OACIQ ; "
            "s'il a déjà un formulaire en brouillon, il peut te dire « toi complète le » ou « remplis le formulaire » et tu le préremplira avec les données du dossier (adresse, vendeurs, acheteurs, prix, date). Ne dis pas que tu ne peux pas."
        )

    return lines


# Tournures françaises où "as" = verbe avoir (ne pas interpréter comme code OACIQ AS)
_AS_FALSE_POSITIVE_PREFIXES = ("as-t-on", "as-tu", "as-t-il", "as-t-elle", "as-t-ils", "as-t-elles")


def _extract_oaciq_form_code_from_message(message: str) -> Optional[str]:
    """
    Extrait le code du formulaire OACIQ demandé dans le message.
    Cherche d'abord un code explicite (ex. « crée un CP », « formulaire CCVE »),
    puis les mots-clés (contre-proposition → CP, etc.). Retourne None si rien trouvé.
    Exclut le code AS quand "as" fait partie de « as-t-on », « as-tu », etc. (verbe avoir).
    """
    if not message or not message.strip():
        return None
    t = (message or "").strip().lower()
    # 1) Code explicite : chercher le plus long d'abord pour éviter que PA matche dans PAD
    for code in sorted(LEA_KNOWN_OACIQ_CODES, key=lambda c: -len(c)):
        code_lower = code.lower()
        # Mot entier ou précédé/suivi par espace, ponctuation, fin/début
        if code_lower in t:
            idx = t.find(code_lower)
            before_ok = idx == 0 or t[idx - 1] in " \t\n\r,;.?!»\"'(-"
            after_ok = idx + len(code_lower) >= len(t) or t[idx + len(code_lower)] in " \t\n\r,;.?!«\"')-"
            if not (before_ok and after_ok):
                continue
            # Ne pas interpréter "as" comme code OACIQ AS dans « as-t-on », « as-tu », etc.
            if code == "AS" and idx == 0:
                rest = t[idx:]
                if any(rest.startswith(prefix) for prefix in _AS_FALSE_POSITIVE_PREFIXES):
                    continue
            if code == "AS" and idx > 0:
                rest = t[idx:]
                if any(rest.startswith(prefix) for prefix in _AS_FALSE_POSITIVE_PREFIXES):
                    continue
            return code
    # 2) Mots-clés
    for keywords, code in LEA_OACIQ_KEYWORD_TO_CODE:
        if any(kw in t for kw in keywords):
            return code
    return None


def _is_information_request_only(message: str) -> bool:
    """
    True si le message est une demande d'information / explication (ce qu'on peut faire,
    quelles infos ajouter, etc.) et non une demande d'action à exécuter.
    """
    if not message or len(message.strip()) < 10:
        return False
    t = (message or "").strip().lower()
    info_phrases = (
        "as-t-on ",
        "as-t-on d'",
        "as-t-on des ",
        "as-t-on d'autres ",
        "est-ce qu'on peut ",
        "qu'est-ce qu'on peut ",
        "quelles autres informations",
        "quelles autres infos",
        "quelles informations ",
        "quelles infos ",
        "d'autres informations qu'on peut",
        "d'autres infos qu'on peut",
        "qu'on peut ajouter",
        "qu'on peut faire",
        "quelles données ",
        "quoi d'autre ",
    )
    if any(p in t for p in info_phrases):
        return True
    if "?" in message and ("informations" in t or "infos" in t) and ("qu'on peut" in t or "peut-on" in t or "peut on" in t):
        return True
    return False


def _wants_to_create_oaciq_form_for_transaction(message: str) -> bool:
    """True si l'utilisateur demande de créer un formulaire OACIQ pour une transaction."""
    if not message or len(message.strip()) < 5:
        return False
    if _is_information_request_only(message):
        return False
    t = (message or "").strip().lower()
    create_verbs = ("créons", "créer", "crée", "créez", "crééz", "faire", "ouvrir", "ajouter", "lancer", "préparer", "préparons", "générer", "génère")
    if not any(v in t for v in create_verbs):
        return False
    # Demande de création d'un formulaire : code explicite OU mots OACIQ/formulaire/promesse OU mot-clé métier
    if _extract_oaciq_form_code_from_message(message):
        return True
    if "formulaire" in t or "form " in t or "form." in t:
        if "oaciq" in t or "oacq" in t or "promesse" in t or "contre-proposition" in t or "modifications" in t or "modification" in t or "déclaration" in t or "contrat" in t or "annexe" in t or "avis" in t:
            return True
    if "promesse" in t and "achat" in t:
        return True
    if "contre-proposition" in t or "contre proposition" in t:
        return True
    if "modifications" in t or "modification" in t and "formulaire" in t:
        return True
    return False


def _get_oaciq_form_code_for_lea_message(message: str) -> str:
    """Retourne le code du formulaire OACIQ à créer selon le message (PA par défaut)."""
    code = _extract_oaciq_form_code_from_message(message)
    return code if code else "PA"


OACIQ_FORM_CREATION_PREFIX = "Tu viens de créer le formulaire OACIQ "
OACIQ_FORM_CREATION_MARKER = "créé le formulaire OACIQ"


def _action_lines_contain_oaciq_form_creation(action_lines: list) -> bool:
    """True si une des lignes d'action indique la création d'un formulaire OACIQ."""
    if not action_lines:
        return False
    for line in action_lines:
        s = (line or "").strip()
        if s.startswith(OACIQ_FORM_CREATION_PREFIX) or OACIQ_FORM_CREATION_MARKER in s:
            return True
    return False


def _build_oaciq_form_creation_confirmation(action_lines: list) -> str:
    """Construit le message de confirmation utilisateur quand un formulaire OACIQ a été créé."""
    # Extraire le nom du formulaire et la transaction depuis la ligne d'action si possible
    for line in (action_lines or []):
        line = (line or "").strip()
        if not line.startswith(OACIQ_FORM_CREATION_PREFIX) and OACIQ_FORM_CREATION_MARKER not in line:
            continue
        # "Tu viens de créer le formulaire OACIQ « ... » (code PA) pour la transaction ..."
        m = re.search(r"formulaire OACIQ « ([^»]+) » \(code (\w+)\) pour la transaction ([^.]+)\.", line)
        if m:
            form_name, code, tx_label = m.group(1).strip(), m.group(2), m.group(3).strip()
            return (
                f"C'est fait ! J'ai créé le formulaire OACIQ « {form_name} » (code {code}) pour la transaction {tx_label}. "
                "La soumission est en brouillon. Allez dans Transactions → ouvrir cette transaction → onglet Formulaires OACIQ pour compléter le formulaire."
            )
    return (
        "C'est fait ! J'ai créé le formulaire OACIQ (Promesse d'achat) pour cette transaction. "
        "Allez dans Transactions → ouvrir cette transaction → onglet Formulaires OACIQ pour le compléter."
    )


async def maybe_create_oaciq_form_submission_from_lea(
    db: AsyncSession, user_id: int, message: str, last_assistant_message: Optional[str] = None
) -> Optional[str]:
    """
    Si l'utilisateur demande de créer une promesse d'achat / un formulaire OACIQ pour une transaction,
    crée la soumission (brouillon) liée à la transaction et retourne une ligne pour « Action effectuée ».
    Utilise last_assistant_message pour déduire la transaction cible (ex. « La transaction sur la rue de Bordeaux… »).
    """
    if not _wants_to_create_oaciq_form_for_transaction(message):
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
        # Ne pas utiliser la dernière transaction si l'utilisateur n'a pas précisé laquelle (éviter une adresse d'une ancienne conversation)
        if not transaction:
            return None
    if not transaction:
        return None
    try:
        result = await db.execute(select(Form).where(Form.code == form_code).limit(1))
        form = result.scalar_one_or_none()
        if not form:
            logger.warning(f"Lea OACIQ form not found: code={form_code}")
            return None
        submission = FormSubmission(
            form_id=form.id,
            data={},
            user_id=user_id,
            status="draft",
            transaction_id=transaction.id,
            ip_address=None,
            user_agent=None,
        )
        db.add(submission)
        await db.flush()
        await db.refresh(submission)
        version = FormSubmissionVersion(submission_id=submission.id, data={})
        db.add(version)
        await db.commit()
        await db.refresh(submission)
        ref_label = transaction.dossier_number or f"#{transaction.id}"
        addr_short = (transaction.property_address or transaction.property_city or "").strip()
        if addr_short:
            tx_label = f"{addr_short} ({ref_label})"
        else:
            tx_label = ref_label
        form_name = form.name or f"Formulaire {form_code}"
        logger.info(f"Lea created OACIQ form submission id={submission.id} form_code={form_code} for transaction id={transaction.id}")
        return (
            f"Tu viens de créer le formulaire OACIQ « {form_name} » (code {form_code}) pour la transaction {tx_label}. "
            "La soumission est en brouillon. Confirme à l'utilisateur que c'est fait. "
            "Prochaine étape : indique-lui d'aller dans Transactions → ouvrir cette transaction → onglet Formulaire (Formulaires OACIQ) → compléter le formulaire {code}."
        ).format(code=form_code)
    except Exception as e:
        logger.warning(f"Lea create OACIQ form submission failed: {e}", exc_info=True)
        await db.rollback()
        return None


def _wants_lea_to_complete_form(message: str) -> bool:
    """True si l'utilisateur demande à Léa de compléter / remplir le formulaire (ex. « toi complète le », « remplis le »)."""
    if not message or len(message.strip()) < 4:
        return False
    t = (message or "").strip().lower()
    complete_phrases = (
        "toi complète", "toi complete", "complète le", "complete le", "complète-le", "complete-le",
        "remplis le", "remplis-le", "remplis le formulaire", "remplir le formulaire",
        "tu peux le compléter", "tu peux le remplir", "complète le formulaire", "complete le formulaire",
        "remplis-moi", "remplis moi", "complète-moi", "complète moi",
        "aide-moi à compléter", "aide moi a completer", "préremplis", "preremplis",
    )
    return any(p in t for p in complete_phrases)


def _build_oaciq_prefill_from_transaction(tx: RealEstateTransaction) -> dict:
    """Construit un dictionnaire de préremplissage à partir des données de la transaction."""
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
    if tx.listing_price is not None:
        prefill["listing_price"] = float(tx.listing_price)
        prefill["prix_demandé"] = float(tx.listing_price)
    if tx.offered_price is not None:
        prefill["offered_price"] = float(tx.offered_price)
        prefill["prix_offert"] = float(tx.offered_price)
    if getattr(tx, "expected_closing_date", None):
        d = tx.expected_closing_date
        prefill["expected_closing_date"] = d.isoformat() if hasattr(d, "isoformat") else str(d)
        prefill["date_cloture"] = prefill["expected_closing_date"]
        prefill["date_acte_vente"] = prefill["expected_closing_date"]
        prefill["date_signature_acte"] = prefill["expected_closing_date"]
    # Alias supplémentaires pour compatibilité PA et formulaires OACIQ
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
            select(FormSubmission, Form.code, Form.name)
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
        submission, form_code, form_name = row[0], row[1], row[2]
        prefill = _build_oaciq_prefill_from_transaction(transaction)
        current = dict(submission.data) if isinstance(submission.data, dict) else {}
        for k, v in prefill.items():
            if v is not None and (k not in current or current[k] in (None, "", [])):
                current[k] = v
        submission.data = current
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
        return (
            f"Tu viens de préremplir le formulaire OACIQ « {name} » (code {form_code}) pour la transaction {tx_label} avec les données du dossier : adresse, vendeurs, acheteurs, prix, date de clôture. "
            "Confirme à l'utilisateur que c'est fait. Indique-lui qu'il peut aller dans Transactions → cette transaction → onglet Formulaires OACIQ pour vérifier et compléter les champs restants si besoin."
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
) -> tuple[list, Optional[RealEstateTransaction]]:
    """
    Exécute les actions Léa (création transaction, mise à jour adresse, promesse d'achat).
    Retourne (liste de lignes pour « Action effectuée », transaction créée si création).
    last_assistant_message : dernier message de Léa (pour confirmer « oui enregistrez » avec les noms).
    session_id : si fourni, la transaction liée à la session est utilisée en priorité pour les mises à jour contacts.
    """
    lines = []
    transaction_preferred: Optional[RealEstateTransaction] = None
    if session_id:
        transaction_preferred = await get_transaction_for_session(db, user_id, session_id)
    has_transaction = (
        transaction_preferred is not None or (await get_user_latest_transaction(db, user_id)) is not None
    )
    conv = None
    pending: dict = {}
    if session_id:
        conv, _ = await get_or_create_lea_conversation(db, user_id, session_id)
        ctx = conv.context or {}
        pending = dict(ctx.get("pending_transaction_creation") or {})

    created: Optional[RealEstateTransaction] = None
    created, duplicate_line = await maybe_create_transaction_from_lea(
        db, user_id, message, last_assistant_message=last_assistant_message
    )
    ok_create, tx_type = _wants_to_create_transaction(message)
    if duplicate_line:
        lines.append(duplicate_line)
        if ok_create and tx_type and conv is not None:
            pending["type"] = tx_type
    elif created:
        lines.append(
            f"Tu viens de créer une nouvelle transaction pour l'utilisateur : « {created.name} » (id {created.id}). "
            "Confirme-lui que c'est fait et qu'il peut la compléter dans la section Transactions."
        )
    else:
        if ok_create and not tx_type:
            lines.append(
                "L'utilisateur souhaite créer une transaction mais n'a pas précisé si c'est une vente ou un achat. "
                "Ta réponse doit contenir **uniquement** la question : « Est-ce une vente ou un achat ? » — NE PAS demander l'adresse ni aucune autre info tant qu'il n'a pas répondu (vente ou achat)."
            )
        elif ok_create and tx_type and conv is not None:
            pending["type"] = tx_type

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

    addr_result = None
    if not building_new_only:
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
    # Enregistrer l'adresse dans le brouillon de création (pending) si on collecte pour un nouveau dossier
    # (pas de transaction existante, ou on est en mode « nouveau dossier » depuis une session liée à une autre tx)
    if not addr_result and pending.get("type") and session_id and (not has_transaction or building_new_only):
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
                    lines.append(
                        "Recherche en ligne (géocodage) effectuée pour le dossier en cours de création. "
                        f"Adresse complète au format officiel à indiquer à l'utilisateur : « {full_formatted} ». "
                        "Tu DOIS écrire cette adresse complète dans ta réponse (rue, ville (province) code postal), puis confirmer que c'est enregistré, puis poser la question suivante (ex. Qui sont les vendeurs ?). "
                        "Ne dis pas seulement « adresse notée » sans afficher l'adresse complète."
                    )
                else:
                    lines.append(
                        f"Géocodage partiel : « {full_formatted} ». "
                        "Indique cette adresse à l'utilisateur et confirme que c'est noté."
                    )
            missing = []
            if not pending.get("price"):
                missing.append("le prix")
            if not pending.get("sellers"):
                missing.append("les vendeurs")
            if not pending.get("buyers"):
                missing.append("les acheteurs")
            if missing:
                if not validation:
                    lines.append(
                        f"Adresse notée pour le dossier en cours de création : « {addr_from_msg} ». "
                        f"Il manque encore : {', '.join(missing)}. Demande-les à l'utilisateur."
                    )
                else:
                    lines.append(
                        f"Il manque encore pour ce dossier : {', '.join(missing)}. Demande la prochaine info (ex. Qui sont les vendeurs ?)."
                    )
    # Correction par l'utilisateur du code postal ou de la ville (sans refournir toute l'adresse) — appliquer en base
    if not addr_result and not building_new_only:
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
    if not addr_result and not building_new_only:
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
                    parts.append(f"code postal {validation['postcode']}")
                if validation.get("city"):
                    parts.append(validation["city"])
                if validation.get("state"):
                    parts.append(validation["state"])
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
                    parts.append(f"code postal {validation['postcode']}")
                if validation.get("city"):
                    parts.append(validation["city"])
                if validation.get("state"):
                    parts.append(validation["state"])
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
    oaciq_line = await maybe_create_oaciq_form_submission_from_lea(db, user_id, message, last_assistant_message) if not building_new_only else None
    if oaciq_line:
        lines.append(oaciq_line)
    prefill_line = await maybe_prefill_oaciq_form_from_lea(db, user_id, message, last_assistant_message) if not building_new_only else None
    if prefill_line:
        lines.append(prefill_line)
    # Si l'utilisateur demande une promesse d'achat / formulaire sans préciser la transaction ni l'adresse, ne pas assumer la dernière
    if not promise_tx and not oaciq_line and (
        _wants_to_set_promise(message) or _wants_to_create_oaciq_form_for_transaction(message)
    ):
        lines.append(
            "L'utilisateur n'a pas précisé pour quelle propriété ni quelle transaction. "
            "Ne prends PAS la dernière transaction par défaut. Demande-lui : « Pour quelle propriété (adresse ou numéro de transaction) souhaitez-vous préparer ce formulaire ? »"
        )
    rename_line = (
        await maybe_update_seller_buyer_name_from_lea(
            db, user_id, message, last_assistant_message, transaction_preferred
        )
        if not building_new_only
        else None
    )
    if rename_line:
        lines.append(rename_line)
    remove_line = (
        await maybe_remove_seller_buyer_from_lea(
            db, user_id, message, last_assistant_message, transaction_preferred
        )
        if not building_new_only
        else None
    )
    if remove_line:
        lines.append(remove_line)
    contact_line = (
        await maybe_add_seller_buyer_contact_from_lea(
            db, user_id, message, last_assistant_message, transaction_preferred
        )
        if not building_new_only
        else None
    )
    if contact_line:
        lines.append(contact_line)
    if (not has_transaction or building_new_only) and pending.get("type") and pending.get("address") and pending.get("price") and session_id:
        sellers_list, buyers_list = _extract_sellers_and_buyers_from_creation_message(message, last_assistant_message)
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
    price_result = (
        await maybe_update_transaction_price_from_lea(
            db, user_id, message, transaction_preferred=transaction_preferred
        )
        if not building_new_only
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
    if not price_result and (not has_transaction or building_new_only) and pending.get("type") and pending.get("address") and session_id:
        price_tup = _extract_price_from_message(message)
        if price_tup:
            amount, kind = price_tup
            pending["price"] = float(amount)
            pending["price_kind"] = kind
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
        if not building_new_only
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

    # Créer la transaction à partir du brouillon (pending) une fois tout collecté : type, adresse, prix, vendeurs, acheteurs (date de clôture facultative)
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
            name = f"Transaction {tx_type.capitalize()}"
            amount = Decimal(str(pending["price"]))
            price_kind = pending.get("price_kind") or "listing"
            sellers_json = [
                {"name": f"{s.get('first_name', '')} {s.get('last_name', '')}".strip(), "phone": None, "email": None}
                for s in (pending.get("sellers") or [])
            ]
            buyers_json = [
                {"name": f"{b.get('first_name', '')} {b.get('last_name', '')}".strip(), "phone": None, "email": None}
                for b in (pending.get("buyers") or [])
            ]
            transaction = RealEstateTransaction(
                user_id=user_id,
                name=name,
                dossier_number=None,
                status="En cours",
                sellers=sellers_json,
                buyers=buyers_json,
                property_province="QC",
                property_address=pending["address"],
                property_city=pending.get("city"),
                property_postal_code=pending.get("postal_code"),
                transaction_kind=tx_type,
                pipeline_stage="creation_dossier",
                listing_price=amount if price_kind == "listing" else None,
                offered_price=amount if price_kind == "offered" else None,
            )
            db.add(transaction)
            await db.flush()
            for s in (pending.get("sellers") or []):
                contact = RealEstateContact(
                    first_name=s.get("first_name", ""),
                    last_name=s.get("last_name", ""),
                    phone=None,
                    email=None,
                    type=ContactType.CLIENT,
                    user_id=user_id,
                )
                db.add(contact)
                await db.flush()
                db.add(TransactionContact(transaction_id=transaction.id, contact_id=contact.id, role="Vendeur"))
            for b in (pending.get("buyers") or []):
                contact = RealEstateContact(
                    first_name=b.get("first_name", ""),
                    last_name=b.get("last_name", ""),
                    phone=None,
                    email=None,
                    type=ContactType.CLIENT,
                    user_id=user_id,
                )
                db.add(contact)
                await db.flush()
                db.add(TransactionContact(transaction_id=transaction.id, contact_id=contact.id, role="Acheteur"))
            await db.commit()
            await db.refresh(transaction)
            created = transaction
            logger.info(
                f"Lea created transaction id={transaction.id} from pending (type={tx_type}, address={pending['address'][:50]}...)"
            )
            lines.append(
                f"Tu viens de créer une nouvelle transaction pour l'utilisateur : « {created.name} » (id {created.id}) avec l'adresse, le prix, les vendeurs et les acheteurs (date de clôture facultative). "
                "Confirme-lui que le dossier est créé et qu'il peut le consulter dans la section Transactions."
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

    if conv is not None and pending and session_id:
        conv.context = conv.context or {}
        conv.context["pending_transaction_creation"] = pending
        flag_modified(conv, "context")
        try:
            await db.commit()
        except Exception as e:
            logger.warning(f"Lea save pending context failed: {e}", exc_info=True)
            await db.rollback()

    if not lines:
        lines.extend(_get_lea_guidance_lines(message))
    return (lines, created)


async def get_transaction_for_session(
    db: AsyncSession, user_id: int, session_id: str
) -> Optional[RealEstateTransaction]:
    """Retourne la transaction liée à la session Léa, ou None."""
    if not session_id:
        return None
    try:
        r = await db.execute(
            select(LeaSessionTransactionLink)
            .where(LeaSessionTransactionLink.session_id == session_id)
            .where(LeaSessionTransactionLink.user_id == user_id)
            .order_by(LeaSessionTransactionLink.created_at.desc())
            .limit(1)
        )
        link = r.scalar_one_or_none()
        if not link:
            return None
        tx_r = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == link.transaction_id,
                    RealEstateTransaction.user_id == user_id,
                )
            )
        )
        return tx_r.scalar_one_or_none()
    except Exception as e:
        logger.warning(f"get_transaction_for_session failed: {e}", exc_info=True)
        return None


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


async def get_or_create_lea_conversation(
    db: AsyncSession, user_id: int, session_id: str | None
) -> Tuple[LeaConversation, str]:
    """Retourne (conversation, session_id). Crée la conversation si besoin."""
    if session_id:
        r = await db.execute(
            select(LeaConversation)
            .where(LeaConversation.session_id == session_id)
            .where(LeaConversation.user_id == user_id)
        )
        conv = r.scalar_one_or_none()
        if conv:
            return conv, session_id
    sid = session_id or str(uuid.uuid4())
    conv = LeaConversation(user_id=user_id, session_id=sid, messages=[], context={})
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv, sid


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
        action_lines, created_tx = await run_lea_actions(
            db, user_id, message, last_assistant_message, session_id=sid
        )
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
            if not tx_to_link:
                tx_to_link = await get_user_latest_transaction(db, user_id)
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
            ref = created_tx.dossier_number or f"#{created_tx.id}"
            confirmation_text = (
                f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                "Vous pouvez la voir et la compléter dans la section Transactions. "
                "Quelle est l'adresse du bien ?"
            )
        if not confirmation_text and _action_lines_contain_oaciq_form_creation(action_lines):
            confirmation_text = _build_oaciq_form_creation_confirmation(action_lines)
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
        system = LEA_SYSTEM_PROMPT
        if lea_knowledge:
            system += "\n\n--- Base de connaissance Léa (formulaires OACIQ + documents) ---\n" + lea_knowledge
        if user_context:
            system += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context
        service = AIService(provider=AIProvider.AUTO)
        messages = messages_for_llm
        accumulated = []
        async for delta in service.stream_chat_completion(
            messages=messages,
            system_prompt=system,
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
            action_lines, created_tx = await run_lea_actions(
                db, current_user.id, body.message, body.last_assistant_message, session_id=sid
            )
            if sid and action_lines:
                tx_to_link = created_tx or (
                    (await db.execute(
                        select(RealEstateTransaction).where(
                            and_(
                                RealEstateTransaction.id == body.transaction_id,
                                RealEstateTransaction.user_id == current_user.id,
                            )
                        )
                    )).scalar_one_or_none() if body.transaction_id else None
                ) or await get_user_latest_transaction(db, current_user.id)
                if tx_to_link:
                    await link_lea_session_to_transaction(db, current_user.id, sid, tx_to_link.id)
            user_context = await get_lea_user_context(db, current_user.id)
            if action_lines:
                user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
            # Quand une transaction vient d'être créée, renvoyer une confirmation directe (sans appeler l'IA)
            if created_tx and action_lines:
                ref = created_tx.dossier_number or f"#{created_tx.id}"
                confirmation_content = (
                    f"C'est fait ! J'ai créé la transaction {ref} pour vous. "
                    "Vous pouvez la voir et la compléter dans la section Transactions. "
                    "Quelle est l'adresse du bien ?"
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
            # Quand un formulaire OACIQ vient d'être créé, renvoyer une confirmation directe (sans appeler l'IA)
            if _action_lines_contain_oaciq_form_creation(action_lines):
                confirmation_content = _build_oaciq_form_creation_confirmation(action_lines)
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
            # Charger l'historique pour le LLM
            conv, sid = await get_or_create_lea_conversation(db, current_user.id, body.session_id)
            messages_for_llm = build_llm_messages_from_history(conv.messages or [], body.message)
            system_prompt = LEA_SYSTEM_PROMPT
            oaciq_knowledge = _get_oaciq_knowledge_for_lea()
            if oaciq_knowledge:
                system_prompt += "\n\n--- Base de connaissance formulaires OACIQ ---\n" + oaciq_knowledge
            if user_context:
                system_prompt += "\n\n--- Informations actuelles de l'utilisateur (plateforme) ---\n" + user_context
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
        action_lines, created_tx = await run_lea_actions(db, current_user.id, body.message, body.last_assistant_message)
        if body.session_id and action_lines:
            tx_to_link = created_tx if created_tx else await get_user_latest_transaction(db, current_user.id)
            if tx_to_link:
                await link_lea_session_to_transaction(db, current_user.id, body.session_id, tx_to_link.id)
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
            if _action_lines_contain_oaciq_form_creation(action_lines):
                confirmation = _build_oaciq_form_creation_confirmation(action_lines)
            else:
                confirmation = (
                    "C'est fait ! Les informations ont été mises à jour. "
                    "Vous pouvez voir la transaction dans la section Transactions."
                )
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

            action_lines, _ = await run_lea_actions(db, current_user.id, transcription)
            if sid and action_lines:
                tx_to_link = await get_user_latest_transaction(db, current_user.id)
                if tx_to_link:
                    await link_lea_session_to_transaction(db, current_user.id, sid, tx_to_link.id)
            user_context = await get_lea_user_context(db, current_user.id)
            if action_lines:
                user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)
            system_prompt = LEA_SYSTEM_PROMPT
            lea_knowledge = await _get_lea_knowledge_for_prompt(db)
            if lea_knowledge:
                system_prompt += "\n\n--- Base de connaissance Léa (formulaires OACIQ + documents) ---\n" + lea_knowledge
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
    if not content and _LEA_OACIQ_KNOWLEDGE_PATH.exists():
        try:
            content = _LEA_OACIQ_KNOWLEDGE_PATH.read_text(encoding="utf-8").strip()
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
