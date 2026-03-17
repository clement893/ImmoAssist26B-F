"""
Actions transaction : création de transaction, extraction type/adresse/prix/vendeurs/acheteurs.
Fonctions selon le plan Domain-Intent-Entities (T1-T10).
"""

import re
import unicodedata
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models import RealEstateTransaction, RealEstateContact, TransactionContact, ContactType

# Ordre de collecte pour compute_missing_transaction_fields
TRANSACTION_FIELDS_ORDER: List[tuple[str, str]] = [
    ("type", "type (vente ou achat)"),
    ("address", "adresse du bien"),
    ("sellers", "vendeurs"),
    ("buyers", "acheteurs"),
    ("price", "prix"),
]


def _wants_to_create_transaction(message: str) -> tuple[bool, str]:
    """
    Détecte si l'utilisateur demande de créer une transaction (achat ou vente).
    Retourne (True, "achat"|"vente") si type explicite, (True, "") si création demandée mais type non précisé, (False, "") sinon.
    """
    t = (message or "").strip().lower()
    if not t:
        return False, ""

    if "promesse" in t and "achat" in t and "créer" in t:
        if "promesse d'achat" in t or "une promesse" in t or "la promesse" in t:
            return False, ""

    def default_type() -> str:
        if "vente" in t or "de vente" in t:
            return "vente"
        if "achat" in t or "d'achat" in t:
            return "achat"
        return ""

    def n(s: str) -> str:
        return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    nt = n(t)

    if len(t) <= 40:
        if t.strip() == "vent":
            return True, "vente"
        if t.strip() in ("achat", "vente"):
            return True, t.strip()
        if "c'est un achat" in t or "c'est une vente" in t or "ce sera un achat" in t or "ce sera une vente" in t:
            return True, "achat" if "achat" in t else "vente"
        if ("un achat" in t or "une vente" in t) and len(t) <= 25:
            return True, "achat" if "achat" in t else "vente"
        if t.strip() in ("c'est un", "c'est une"):
            return True, "vente" if "une" in t else "achat"
        if re.match(r"^c'est\s+un\s*$", t, re.I):
            return True, "achat"
        if re.match(r"^c'est\s+une\s*$", t, re.I):
            return True, "vente"

    if "créer en une" in t or "creer en une" in nt or "crée en une" in t or "cree en une" in nt:
        return True, default_type()
    if "en créer une" in t or "en creer une" in nt or "en crée une" in t or "en cree une" in nt:
        return True, default_type()
    if "créer en un" in t or "creer en un" in nt:
        return True, default_type()
    if len(t) <= 30 and ("en une" in t or "en un" in t) and ("alors" in t or "créer" in t or "creer" in nt or "crée" in t or "cree" in nt):
        return True, default_type()

    if len(t) <= 35:
        if "et une transaction" in t or "et un dossier" in t:
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()
        if ("une transaction" in t or "un dossier" in t) and ("veux" in t or "donne" in t or "crée" in t or "cree" in nt or "ajoute" in t):
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()

    if len(t) <= 60 and ("créer une transaction" in t or "creer une transaction" in nt):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    if len(t) <= 60 and ("créer un dossier" in t or "creer un dossier" in nt):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()

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

    if ("crée-moi" in t or "cree-moi" in nt or "crée moi" in t or "cree moi" in nt) and ("transaction" in t or "dossier" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()

    if "créer la transaction" in t and ("montant" in t or "prix" in t or "mettre" in t):
        return False, ""
    if "créer une transaction de vente" in t or "créer une transaction d'achat" in t:
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
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
    if "créer une transaction" in t and ("avec toi" in t or "avec léa" in t or "avec lea" in t):
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
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
    if "aide-moi" in t or "aide-moi " in t or "aidez-moi" in t or "m'aider" in t or "m\u2019aider" in t:
        if "créer" in t and ("transaction" in t or "dossier" in t):
            if "achat" in t or "d'achat" in t:
                return True, default_type()
            if "vente" in t or "de vente" in t:
                return True, "vente"
            return True, default_type()
        if "créer une transaction" in t or "créer un dossier" in t:
            return True, default_type()
    if ("peux-tu" in t or "tu peux" in t or "pourrais-tu" in t or "pourrais tu" in t) and "créer" in t and (
        "transaction" in t or "dossier" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
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
        return True, default_type()
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
    if "nouvelle transaction" in t and (
        "créer" in t or "aimerais" in t or "voudrais" in t or "veux" in t or "souhaite" in t or "souhaites" in t or "voulons" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    if ("aimerais créer" in t or "voudrais créer" in t or "veux créer" in t or "souhaite créer" in t) and (
        "transaction" in t or "dossier" in t
    ):
        if "achat" in t or "d'achat" in t:
            return True, default_type()
        if "vente" in t or "de vente" in t:
            return True, "vente"
        return True, default_type()
    if (
        "que tu crées" in t or "que tu crée" in t or "que tu crees" in nt or "que tu cree " in nt
        or "que tu creer" in nt or "que léa crées" in t or "que lea crées" in t or "que lea crees" in nt
        or "crée une transaction" in t or "crees une transaction" in nt or "cree une transaction" in nt
        or "que tu create" in t
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
    if "réer une transaction" in t or "réer la transaction" in t:
        if "achat" in t:
            return True, default_type()
        if "vente" in t:
            return True, "vente"
        return True, default_type()
    return False, ""


def parse_names_for_pending(raw: str) -> list[dict[str, str]]:
    """Parse une chaîne de noms (ex. 'William Ford et Kate Volkswagen') en liste de {first_name, last_name} pour pending."""
    parsed = _parse_names_from_raw(raw)
    return [{"first_name": f, "last_name": l} for f, l in parsed]


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
    nt = "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn")
    if re.search(
        r"\b(?:il y a|ya|y a)?\s*(?:juste|seulement)?\s*(?:un|une|1)\s+seul(?:e)?\s+(?:vendeur|acheteur)s?\b",
        nt,
        re.I,
    ) or re.search(
        r"\b(?:pas|aucun)\s+d[' ]?autres?\s+(?:vendeur|acheteur)s?\b",
        nt,
        re.I,
    ) or re.search(
        r"\b(?:un|une|1)\s+(?:vendeur|acheteur)\s+(?:seulement|uniquement)\b",
        nt,
        re.I,
    ):
        return None

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

    if raw is None and last_assistant_message and len(t) <= 120:
        asking_vendeurs = "vendeur" in last_lower and (
            "qui sont" in last_lower or "vendeurs pour" in last_lower or "vendeurs ?" in last_lower or "vendeurs pour ce" in last_lower or "noms des vendeurs" in last_lower
        )
        asking_acheteurs = "acheteur" in last_lower and (
            "qui sont" in last_lower or "acheteurs pour" in last_lower or "acheteurs ?" in last_lower or "acheteurs pour ce" in last_lower or "noms des acheteurs" in last_lower
        )
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

    if raw is None and last_assistant_message and len(t) <= 80:
        if not re.search(r"\b(pas|aucun|rien|je ne sais)\b", t, re.I) and re.match(r"^[A-Za-zÀ-ÿ\s\-]+$", t, re.I) and len(t.strip()) >= 3:
            if "vendeur" in last_lower and ("qui sont" in last_lower or "vendeurs" in last_lower):
                role = "Vendeur"
                raw = t.strip()
            elif "acheteur" in last_lower and ("qui sont" in last_lower or "acheteurs" in last_lower):
                role = "Acheteur"
                raw = t.strip()

    if raw is None:
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
                if "vendeur" in last_lower and re.search(r"ils\s+sont\s+", t, re.I):
                    role = "Vendeur"
                    m = re.search(r"ils\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
                elif "acheteur" in last_lower and re.search(r"ils\s+sont\s+", t, re.I):
                    role = "Acheteur"
                    m = re.search(r"ils\s+sont\s+(.+?)(?:\.|$|\s+pour\s+)", t, re.I | re.DOTALL)
            if not m:
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
    raw = re.sub(r"\s+est\s+", " et ", raw, flags=re.I)
    raw = re.sub(r"\s+(?:vocal|vacal|cale|local|locales|elle)\s+terminé.*$", "", raw, flags=re.I).strip()
    raw = re.sub(r"\s+local(?:es)?\s*$", "", raw, flags=re.I).strip()
    raw = re.sub(r"\s+e\s*$", "", raw, flags=re.I).strip()
    if not raw:
        return None
    parts = re.split(r"\s+et\s+|\s*,\s*|\s+les\s+", raw)
    names: List[tuple[str, str]] = []
    for part in parts:
        part = part.strip()
        if not part or len(part) < 2:
            continue
        part_nt = "".join(
            c for c in unicodedata.normalize("NFD", part.lower()) if unicodedata.category(c) != "Mn"
        )
        if re.search(
            r"\b(?:vendeur|acheteur)s?\b", part_nt, re.I
        ) and re.search(
            r"\b(?:seul|seule|seulement|uniquement|juste|aucun|pas)\b", part_nt, re.I
        ):
            continue
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


def _extract_sellers_and_buyers_from_creation_message(
    message: str, last_assistant_message: Optional[str] = None
) -> Tuple[List[tuple[str, str]], List[tuple[str, str]]]:
    """
    Extrait vendeurs et acheteurs d'un message de création.
    Retourne (sellers, buyers) où chaque liste est [(first_name, last_name), ...].
    """
    sellers: List[tuple[str, str]] = []
    buyers: List[tuple[str, str]] = []
    if not message or len(message.strip()) < 5:
        return sellers, buyers
    t = message.strip()

    m_v = re.search(
        r"(?:les\s+)?vendeurs?\s+(?:sont\s+)?:?\s*([^.]+?)(?=\s*[,.]?\s*acheteur|\s*\.|$)",
        t,
        re.I | re.DOTALL,
    )
    if m_v and m_v.group(1).strip():
        sellers = _parse_names_from_raw(m_v.group(1).strip())

    m_a = re.search(
        r"(?:les\s+)?acheteurs?\s+(?:sont\s+)?:?\s*([^.]+?)(?=\s*\.|$)",
        t,
        re.I | re.DOTALL,
    )
    if m_a and m_a.group(1).strip():
        buyers = _parse_names_from_raw(m_a.group(1).strip())

    if not sellers and not buyers and last_assistant_message:
        names_list = _extract_seller_buyer_names_list(message, last_assistant_message)
        if names_list:
            role, names = names_list
            if role == "Vendeur":
                sellers = names
            else:
                buyers = names

    return sellers, buyers


def _extract_address_from_message(message: str) -> Optional[str]:
    """Extrait une adresse du message."""
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()

    def normalize_address(raw: str) -> str:
        s = raw.strip()
        s = re.sub(r"^de\s+", "", s, flags=re.I).strip()
        s = re.sub(r"\s+(?:donc\s+)?à\s+terminer\s*$", "", s, flags=re.I).strip()
        s = re.sub(r"\s+terminé\s*$", "", s, flags=re.I).strip()
        s = re.sub(r"\s+(?:local|locales|elle|vocal|vacal)\s+terminé\s*$", "", s, flags=re.I).strip()
        s = re.sub(r"\s+local(?:es)?\s*$", "", s, flags=re.I).strip()
        s = re.sub(r'\b(\d)\s+(\d)\s+(\d)\s+(\d)\b', r'\1\2\3\4', s)
        s = re.sub(r'\b(\d)\s+(\d)\s+(\d)\b', r'\1\2\3', s)
        s = re.sub(r'\b(\d)\s+(\d)\b', r'\1\2', s)
        cp = re.search(r'(?:code\s+postal|cp)\s*[:\s]*([a-zA-Z]\d[A-Za-z]\d[A-Za-z]\d)', s, re.I)
        if cp:
            c = cp.group(1).upper()
            if len(c) == 6:
                s = re.sub(r'(?:code\s+postal|cp)\s*[:\s]*[a-zA-Z]\d[A-Za-z]\d[A-Za-z]\d', f'code postal {c[0:3]} {c[3:6]}', s, flags=re.I)
        return s

    m = re.search(r"(?:l'adresse\s+n'est\s+pas\s+la\s+bonne|pas\s+la\s+bonne\s+adresse|non,?\s*l'adresse)\s*,?\s*(?:l'adresse\s+(?:est|et)\s+(?:le\s+)?|c'est\s+(?:le\s+)?|est\s+(?:le\s+)?)(.+?)(?:\s+(?:vocal|vacal)\s+terminé|\.|$)", t, re.I | re.DOTALL)
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5 and any(c.isdigit() for c in addr):
            return addr

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
    m = re.search(
        r"ajout(?:er?|es?)\s+(?:l')?adresse\s+([^\n.]+?)(?:\.|$|\s+pour\s+|\s+vocal)",
        t,
        re.I | re.DOTALL,
    )
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5 and any(c.isdigit() for c in addr):
            return addr
    m = re.search(
        r"(?:corriger|changer|modifier)\s+(?:l')?adresse\s+(?:c'est\s+)?(?:le\s+)?(.+?)(?:\s+vocal\s+terminé|\.|$)",
        t,
        re.I | re.DOTALL,
    )
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5 and any(c.isdigit() for c in addr):
            return addr
    m = re.search(
        r"(?:l')?adresse\s+(?:est\s+)?(?:le\s+)?(\d(?:\s*\d)*\s+(?:avenue|av\.?|rue|boulevard|blvd\.?|boul\.?)\s+[\w\s-]+(?:\s+à\s+[\w\s-]+)?(?:\s+code\s+postal\s+[A-Za-z0-9\s]+)?)",
        t,
        re.I,
    )
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5:
            return addr
    m = re.search(r"\bles\s+(\d(?:\s*\d)*\s+(?:avenue|av\.?|rue|boulevard|blvd\.?|boul\.?)\s+[\w\s-]+)", t, re.I)
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5:
            return addr
    m = re.search(r"(\d(?:\s*\d)*\s+(?:avenue|av\.?|rue|boulevard|blvd\.?|boul\.?)\s+[\w\s-]+(?:\s+à\s+[\w\s-]+)?(?:\s+code\s+postal\s+[A-Za-z0-9\s]+)?)", t, re.I)
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 5:
            return addr
    m = re.search(r"(\d(?:\s*\d)*\s+de\s+[A-Za-zÀ-ÿ\s\-]+?)(?:\s+(?:poker|vocal|vacal)\s+terminé|\.|$|\s+toi\s+|\s+trouve)", t, re.I)
    if m:
        addr = normalize_address(m.group(1).strip())
        if len(addr) >= 8:
            return addr
    return None


def _extract_price_from_message(message: str) -> Optional[Tuple[Decimal, str]]:
    """
    Extrait un prix du message.
    Retourne (montant, "listing"|"offered") ou None.
    """
    if not message or len(message.strip()) < 3:
        return None
    t = (message or "").strip().lower()
    t = re.sub(r"\bpiles\b", "mille", t, flags=re.I)
    is_offered = bool(
        re.search(r"\bprix\s+offert\b", t)
        or re.search(r"\boffert\s*[:\s]*\d", t)
        or "offre" in t and re.search(r"\d", t)
    )
    kind = "offered" if is_offered else "listing"
    m = re.search(r"(?:prix\s+)?(?:c'est\s+)?(?:est\s+)?(\d[\d\s]*)\s*(?:mille|k\b|k\s|000\b|millions?)?", t, re.I)
    if not m:
        m = re.search(r"(\d[\d\s]{2,})\s*(?:\$|dollars?|cad)?", t, re.I)
    if not m:
        return None
    raw = m.group(1).replace(" ", "").strip()
    if not raw.isdigit():
        return None
    value = int(raw)
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
    """
    ok, tx_type = _wants_to_create_transaction(message)
    if not ok or not tx_type:
        return (None, None)

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


# --- Fonctions du plan Domain-Intent-Entities (T7, T8, T9, T10) ---


def compute_missing_transaction_fields(pending: Dict[str, Any]) -> List[Tuple[str, str]]:
    """
    Détermine les champs manquants pour créer une transaction (T7).
    Retourne [(field_key, label), ...] dans l'ordre de collecte.
    """
    if not pending:
        return [(k, v) for k, v in TRANSACTION_FIELDS_ORDER]
    missing: List[Tuple[str, str]] = []
    for field_key, label in TRANSACTION_FIELDS_ORDER:
        if field_key == "type":
            if not pending.get("type"):
                missing.append((field_key, label))
        elif field_key == "address":
            addr = pending.get("address") or ""
            city = pending.get("city") or ""
            postal = pending.get("postal_code") or ""
            if not addr.strip() or not (city.strip() and len(str(postal).strip()) >= 6):
                missing.append((field_key, label))
        elif field_key == "sellers":
            if not pending.get("sellers"):
                missing.append((field_key, label))
        elif field_key == "buyers":
            if not pending.get("buyers"):
                missing.append((field_key, label))
        elif field_key == "price":
            if pending.get("price") is None:
                missing.append((field_key, label))
    return missing


def build_transaction_creation_confirmation(
    transaction: RealEstateTransaction,
    has_more_info_to_add: bool = False,
) -> str:
    """
    Produit la confirmation métier après création (T9).
    """
    ref = getattr(transaction, "dossier_number", None) or f"#{transaction.id}"
    if has_more_info_to_add:
        return (
            f"Transaction {ref} créée. "
            "Tu peux compléter les informations (date de clôture, notaire, etc.) dans la section Transactions."
        )
    return (
        f"Transaction {ref} créée. "
        "Tu peux la consulter et la compléter dans la section Transactions."
    )


async def create_transaction_record(
    db: AsyncSession,
    user_id: int,
    tx_type: str,
    address: str,
    sellers: List[Tuple[str, str]],
    buyers: List[Tuple[str, str]],
    price: Decimal,
    price_kind: str = "listing",
    entities: Optional[List[Dict[str, Any]]] = None,
    city: Optional[str] = None,
    postal_code: Optional[str] = None,
) -> Optional[RealEstateTransaction]:
    """
    Crée la transaction en base (T8).
    Accepte des entities optionnelles du router pour préremplissage.
    """
    if not tx_type or not address or not sellers or not buyers or price is None:
        return None
    try:
        name = f"Transaction {tx_type.capitalize()}"
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
            property_city=city,
            property_postal_code=postal_code,
            transaction_kind=tx_type,
            pipeline_stage="creation_dossier",
            listing_price=price if price_kind == "listing" else None,
            offered_price=price if price_kind == "offered" else None,
        )
        db.add(transaction)
        await db.flush()
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
        logger.info(f"Lea create_transaction_record: id={transaction.id} type={tx_type}")
        return transaction
    except Exception as e:
        logger.warning(f"create_transaction_record failed: {e}", exc_info=True)
        await db.rollback()
        return None


def _entity_value(entities: Optional[List[Dict[str, Any]]], name: str) -> Optional[Any]:
    """Retourne la valeur de la première entity portant le nom donné."""
    if not entities:
        return None
    for e in entities:
        if isinstance(e, dict) and e.get("name") == name:
            return e.get("value")
    return None


async def update_transaction_record(
    db: AsyncSession,
    transaction: RealEstateTransaction,
    entities: List[Dict[str, Any]],
) -> Optional[RealEstateTransaction]:
    """
    Met à jour une transaction selon les entities du router (T10).
    Prend en charge : property_reference (adresse), listing_price, offer_price,
    seller_names, buyer_names.
    Appelé par run_lea_actions quand domain=transaction, intent=update.
    """
    if not entities:
        return transaction
    updated = False
    try:
        addr = _entity_value(entities, "property_reference") or _entity_value(entities, "address")
        if addr and isinstance(addr, str) and len(addr.strip()) >= 5:
            transaction.property_address = addr.strip()
            updated = True

        listing_val = _entity_value(entities, "listing_price")
        if listing_val is not None:
            try:
                amount = Decimal(str(listing_val))
                if amount > 0 and amount <= Decimal("999999999"):
                    transaction.listing_price = amount
                    updated = True
            except (ValueError, TypeError):
                pass

        offer_val = _entity_value(entities, "offer_price") or _entity_value(entities, "offered_price")
        if offer_val is not None:
            try:
                amount = Decimal(str(offer_val))
                if amount > 0 and amount <= Decimal("999999999"):
                    transaction.offered_price = amount
                    updated = True
            except (ValueError, TypeError):
                pass

        seller_names = _entity_value(entities, "seller_names")
        if seller_names:
            if isinstance(seller_names, str):
                names = _parse_names_from_raw(seller_names)
            elif isinstance(seller_names, list):
                names = []
                for item in seller_names:
                    if isinstance(item, str):
                        names.extend(_parse_names_from_raw(item))
                    elif isinstance(item, dict):
                        fn = item.get("first_name", item.get("name", ""))
                        ln = item.get("last_name", "")
                        if fn or ln:
                            names.append((str(fn), str(ln)))
            else:
                names = _parse_names_from_raw(str(seller_names))
            if names:
                transaction.sellers = [{"name": f"{f} {l}".strip(), "phone": None, "email": None} for f, l in names]
                updated = True

        buyer_names = _entity_value(entities, "buyer_names")
        if buyer_names:
            if isinstance(buyer_names, str):
                names = _parse_names_from_raw(buyer_names)
            elif isinstance(buyer_names, list):
                names = []
                for item in buyer_names:
                    if isinstance(item, str):
                        names.extend(_parse_names_from_raw(item))
                    elif isinstance(item, dict):
                        fn = item.get("first_name", item.get("name", ""))
                        ln = item.get("last_name", "")
                        if fn or ln:
                            names.append((str(fn), str(ln)))
            else:
                names = _parse_names_from_raw(str(buyer_names))
            if names:
                transaction.buyers = [{"name": f"{f} {l}".strip(), "phone": None, "email": None} for f, l in names]
                updated = True

        if updated:
            await db.commit()
            await db.refresh(transaction)
            logger.info(f"Lea update_transaction_record: id={transaction.id}")
            return transaction
        return transaction
    except Exception as e:
        logger.warning(f"update_transaction_record failed: {e}", exc_info=True)
        await db.rollback()
        return None
