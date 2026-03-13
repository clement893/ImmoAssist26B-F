"""
Heuristiques Léa : détection et extraction à partir des messages (sans logique métier ni DB).
Fallback quand le router LLM échoue ou confidence < seuil.
"""

import re
from typing import List, Optional, Tuple

from app.services.lea_chat.actions.transaction import (
    _extract_address_from_message,
    _extract_price_from_message,
)

# Codes OACIQ connus (alignés sur le guide expert et la table forms)
LEA_KNOWN_OACIQ_CODES = frozenset({
    "CCVE", "CCDE", "CCIE", "CCM", "CCVNE", "CCDNE", "CCINE", "CCA", "CCADI", "CCL",
    "DV", "DVD", "PA", "PAD", "PAI", "PAM", "PAG", "CP", "CPCP", "MO",
    "AVIS-CCA", "AVIS-CVAN", "AVIS-DAVP", "DR", "DRCOP", "PAC", "ACD", "ACI", "BOCP", "MOCP",
    "AG", "AF", "AR", "EAU", "EXP", "D", "PL", "PLC", "PSL", "ML", "CVHP", "LD", "VI", "AS", "CM",
    "DIA", "DIV-ENT", "DIV-PAR", "DESC-LOC", "DESC-RES",
})

LEA_OACIQ_KEYWORD_TO_CODE: list = [
    (["promesse", "d'achat", "promesse d'achat", "d'achar", "promesse d'achar"], "PA"),
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

_AS_FALSE_POSITIVE_PREFIXES = ("as-t-on", "as-tu", "as-t-il", "as-t-elle", "as-t-ils", "as-t-elles")


def _format_canadian_postal_code(raw: str) -> str:
    """Normalise un code postal canadien au format A1A 1A1 (espace au milieu)."""
    if not raw:
        return ""
    s = re.sub(r"\s+", "", str(raw).strip().upper())
    if len(s) == 6 and s[0].isalpha() and s[1].isdigit() and s[2].isalpha() and s[3].isdigit() and s[4].isalpha() and s[5].isdigit():
        return f"{s[0]}{s[1]}{s[2]} {s[3]}{s[4]}{s[5]}"
    return str(raw).strip()


def _extract_transaction_ref_from_message(message: str) -> Optional[str]:
    """
    Extrait une référence à une transaction (numéro de dossier ou id) du message.
    Ex: "transaction 4", "transaction #4", "#4", "dossier 4", "la transaction 4".
    Retourne "4" ou None.
    """
    if not message or len(message.strip()) < 2:
        return None
    t = message.strip()
    m = re.search(r"#\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    m = re.search(r"(?:pour\s+|de\s+)?(?:la\s+)?transaction\s+#?\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    m = re.search(r"dossier\s+#?\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    m = re.search(r"(?:la\s+)?transaction\s+numéro\s+#?\s*(\d+)", t, re.I)
    if m:
        return m.group(1)
    if re.match(r"^\s*#?\s*\d+\s*$", t):
        m = re.search(r"\d+", t)
        if m:
            return m.group(0)
    return None


def _extract_address_hint_from_message(message: str) -> Optional[str]:
    """Extrait un indice d'adresse du message pour cibler une transaction (ex: 'Bordeaux' dans 'transaction sur de Bordeaux')."""
    if not message or len(message.strip()) < 3:
        return None
    t = message.strip()
    m = re.search(r"(?:sur|pour)\s+(?:la\s+)?transaction\s+(?:de\s+|sur\s+)([A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r"(?:rue\s+de|sur\s+(?:la\s+)?(?:rue\s+)?(?:de\s+)?)([A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r"transaction\s+(?:sur\s+)?(?:de\s+)?([A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    return None


def _extract_address_hint_from_assistant_message(message: str) -> Optional[str]:
    """
    Extrait un indice d'adresse du message assistant quand Léa vient de donner l'adresse.
    Permet de cibler la bonne transaction quand l'utilisateur répond sans répéter l'adresse.
    """
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()
    m = re.search(r"propriété\s+au\s+(\d+\s+(?:de\s+)?[A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r"au\s+(\d+\s+de\s+[A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r"(?:adresse\s+(?:suivante\s+)?(?:est\s*:\s*)|est\s*:\s*)\s*(\d+\s+[A-Za-zÀ-ÿ\-]+)", t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r"\bde\s+([A-Za-zÀ-ÿ]{4,})\s*[,)]", t)
    if m:
        return m.group(1).strip()
    m = re.search(r"(?:transaction|dossier|propriété).*?\b([A-Za-zÀ-ÿ]{4,})\b", t, re.I)
    if m:
        return m.group(1).strip()
    return None


def _last_message_asked_for_address(last_assistant_message: Optional[str] = None) -> bool:
    """True si le dernier message de Léa demandait l'adresse du bien."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 10:
        return False
    t = last_assistant_message.strip().lower()
    return (
        "adresse" in t
        and ("quelle" in t or "du bien" in t or "propriété" in t or "l'adresse" in t or "me dire" in t)
    )


def _last_message_asked_for_property_for_form(last_assistant_message: Optional[str] = None) -> bool:
    """True si Léa demandait pour quelle propriété/transaction préparer un formulaire (ex. promesse d'achat)."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 15:
        return False
    t = last_assistant_message.strip().lower()
    return (
        ("quelle propriété" in t or "quelle transaction" in t)
        and ("formulaire" in t or "promesse" in t or "préparer" in t or "préparer ce formulaire" in t)
    )


def _last_message_asked_to_confirm_pa_creation(last_assistant_message: Optional[str] = None) -> bool:
    """True si Léa demandait de confirmer la création d'une promesse d'achat pour une propriété."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 20:
        return False
    t = last_assistant_message.strip().lower()
    return (
        ("promesse" in t and ("achat" in t or "d'achat" in t))
        and ("confirmer" in t or "souhaitez-vous" in t or "voulez-vous" in t or "créer" in t)
        and ("transaction" in t or "propriété" in t or "au " in t)
    )


def _is_short_confirmation_message(message: str) -> bool:
    """True si le message est une confirmation courte (oui, exact, ok, c'est ça, etc.)."""
    if not message or len(message.strip()) > 25:
        return False
    t = message.strip().lower()
    return t in (
        "oui", "ouais", "ouaip", "ok", "exact", "exactement", "c'est ça", "cest ca",
        "oui merci", "ok merci", "d'accord", "daccord", "confirmé", "confirme",
        "vas-y", "vas y", "go", "yep", "yeah",
    ) or t.startswith(("oui ", "ok "))


def _last_message_asked_for_sellers(last_assistant_message: Optional[str] = None) -> bool:
    """True si le dernier message de Léa demandait les vendeurs."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 5:
        return False
    t = last_assistant_message.strip().lower()
    return "vendeur" in t and ("qui" in t or "quels" in t or "noms" in t or "nom" in t or "?" in t)


def _last_message_asked_for_buyers(last_assistant_message: Optional[str] = None) -> bool:
    """True si le dernier message de Léa demandait les acheteurs."""
    if not last_assistant_message or len(last_assistant_message.strip()) < 5:
        return False
    t = last_assistant_message.strip().lower()
    return "acheteur" in t and ("qui" in t or "quels" in t or "noms" in t or "nom" in t or "?" in t)


def _wants_to_update_address(message: str) -> bool:
    t = (message or "").strip().lower()
    if not t:
        return False
    if ("créer" in t or "creer" in t) and "transaction" in t and _extract_address_from_message(message):
        return True
    if "est au" in t or "c'est au" in t or "bien est" in t or "biais est" in t:
        if _extract_address_from_message(message):
            return True
    if ("trouve" in t or "en ligne" in t or "reste" in t) and _extract_address_from_message(message):
        return True
    if re.search(r"\bles\s+\d(?:\s*\d)*\s+(?:rue|avenue|av\.?|boulevard)\s+", t, re.I) and _extract_address_from_message(message):
        return True
    if "adresse" not in t:
        return False
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


def _extract_postal_code_from_message(message: str) -> Optional[str]:
    """Extrait un code postal canadien (A1A 1A1) du message, s'il y en a un."""
    if not message or len(message.strip()) < 5:
        return None
    t = message.strip()
    m = re.search(r"[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d", t)
    if m:
        raw = re.sub(r"\s+", "", m.group(0).upper())
        if len(raw) == 6 and raw[0].isalpha() and raw[1].isdigit() and raw[2].isalpha() and raw[3].isdigit() and raw[4].isalpha() and raw[5].isdigit():
            return _format_canadian_postal_code(raw)
    return None


def _extract_city_correction_from_message(message: str) -> Optional[str]:
    """Extrait une ville indiquée en correction (ex. « la ville c'est Montréal »)."""
    if not message or len(message.strip()) < 2:
        return None
    t = (message or "").strip()
    t_lower = t.lower()
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
    if len(t.split()) <= 3 and not any(c.isdigit() for c in t) and t[0].isupper():
        return t.strip()
    return None


def _last_message_mentioned_address_or_postal(last_assistant_message: Optional[str]) -> bool:
    """True si le dernier message de Léa mentionnait une adresse ou un code postal."""
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
        "non ", "non,", "corrige", "correction", "c'est ", "c'est ",
        "le code postal", "code postal c'est", "code postal est", "le bon code postal",
        "la ville c'est", "la ville est", "corrige la ville", "changer le code postal",
        "modifier le code postal", "pas ça", "pas le bon", "erreur",
    )
    return any(p in t for p in correction_phrases)


def _wants_to_geocode_existing_address(message: str) -> bool:
    """True si l'utilisateur demande de chercher l'adresse / code postal / ville sur Internet."""
    t = (message or "").strip().lower()
    if not t:
        return False
    has_verb = (
        "chercher" in t or "cherche" in t or "trouve" in t or "trouver" in t
        or "recherche" in t or "rechercher" in t
        or "écris" in t or "écrire" in t
        or "ajout" in t or "fais" in t or "faire" in t
    )
    has_address = (
        "adresse" in t or "l'adresse" in t
        or "code postal" in t or "ville" in t
        or "complète" in t or "compléter" in t or "complétons" in t
    )
    has_trigger = (
        "internet" in t or "en ligne" in t or "ligne" in t
        or "complète" in t or "code postal" in t or "ville" in t
    )
    return has_verb and has_address and (has_trigger or "recherche" in t or "écris" in t or "écrire" in t)


def _extract_seller_buyer_contact_from_message(
    message: str, last_assistant_message: Optional[str] = None
) -> Optional[tuple[str, str, Optional[str], Optional[str], str]]:
    """
    Détecte si l'utilisateur donne les coordonnées d'un vendeur ou d'un acheteur.
    Retourne (first_name, last_name, phone, email, role).
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
    if re.search(r"les\s+vendeurs\s+sont\s+.+\s+et\s+", t, re.I) or re.search(r"les\s+acheteurs\s+sont\s+.+\s+et\s+", t, re.I):
        return None
    name_match = re.search(
        r"(?:il\s+)?s['']appelle\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s+son\s+numéro|\s+numéro|\s+téléphone|\s+phone|\s+courriel|\s+email|$|,)",
        t, re.I,
    )
    if not name_match:
        name_match = re.search(r"c'est\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s+son\s+numéro|\s+numéro|\s+téléphone|$|,)", t, re.I)
    name_from_followup = None
    if not name_match and ("@" in t or "gmail.com" in t) and last_assistant_message:
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
    phone_match = re.search(
        r"(?:numéro|téléphone|phone)(?:\s+de\s+(?:téléphone|phone))?\s*(?:est\s*)?(?:le\s*)?[:\s]*(\d{3}[\s.\-]*\d{3}[\s.\-]*\d{4})",
        t, re.I,
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
    email_match = re.search(r"(?:courriel|email)\s*(?:est\s*)?[:\s]*([^\s,\.]+@[^\s,\.]+)", t, re.I)
    email = email_match.group(1).strip() if email_match else None
    if not email and "gmail.com" in t:
        local = re.search(r"(\w+)\s+(?:a|à|@)?\s*(?:commercial\s+)?gmail\.com", t, re.I)
        if local:
            email = f"{local.group(1).strip()}@gmail.com"
    if name_from_followup is not None and not phone and not email:
        return None
    return (first_name.strip(), last_name.strip(), phone, email, role)


def _extract_seller_buyer_names_from_assistant_question(assistant_message: str) -> Optional[tuple[str, List[tuple[str, str]]]]:
    """
    Quand l'assistant a demandé « Souhaitez-vous enregistrer X et Y comme vendeurs ? »,
    extrait X et Y du message assistant. Retourne (role, [(first_name, last_name), ...]) ou None.
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
    m = re.search(
        r"(?:changer|modifier|corriger)\s+(?:le\s+)?nom\s+(?:de\s+l['']?)?(?:acheteur|vendeur)\s+(?:c['']est\s+)?([A-Za-zÀ-ÿ\s\-]+?)\s+en\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t, re.I,
    )
    if m:
        old_name, new_name = m.group(1).strip(), m.group(2).strip()
        if len(old_name) >= 2 and len(new_name) >= 2:
            return (old_name, new_name, role)
    m = re.search(
        r"remplacer\s+(?:l['']?)?(?:acheteur|vendeur)\s+([A-Za-zÀ-ÿ\s\-]+?)\s+par\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t, re.I,
    )
    if m:
        old_name, new_name = m.group(1).strip(), m.group(2).strip()
        if len(old_name) >= 2 and len(new_name) >= 2:
            return (old_name, new_name, role)
    m = re.search(
        r"(?:l['']?|le\s+)(?:acheteur|vendeur)\s+(?:c['']est\s+)?(?:pas\s+)?([A-Za-zÀ-ÿ\s\-]+?)\s*,\s*(?:c['']est\s+)?([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)",
        t, re.I,
    )
    if m:
        old_name, new_name = m.group(1).strip(), m.group(2).strip()
        if len(old_name) >= 2 and len(new_name) >= 2:
            return (old_name, new_name, role)
    m = re.search(
        r"non\s+(?:l['']?|le\s+)(?:acheteur|vendeur)\s+(?:c['']est\s+)?([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)",
        t, re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last, re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)
    m = re.search(
        r"(?:corriger|changer|modifier)\s+(?:le\s+)?nom\s+(?:de\s+l['']?)?(?:acheteur|vendeur)?\s*[,:]?\s*c['']est\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$)",
        t, re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last, re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)
    m = re.search(
        r"(?:change|remplace|mets?|définir?)\s+(?:le\s+)?(?:l['']?)?(?:acheteur|vendeur)\s+(?:pour|par|c['']est)\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t, re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last, re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)
        return ("*", new_name, role)
    m = re.search(
        r"(?:l['']?|le\s+)(?:acheteur|vendeur)\s+c['']est\s+(?:maintenant\s+)?([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+pour)",
        t, re.I,
    )
    if m:
        new_name = m.group(1).strip()
        if len(new_name) >= 2 and last_assistant_message:
            last = last_assistant_message.strip()
            name_in_last = re.search(
                r"(?:acheteur|vendeur)\s+(?:est\s+|c['']est\s+|:)\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\s*\.|$|\s+,)",
                last, re.I,
            )
            old_name = name_in_last.group(1).strip() if name_in_last else ""
            if old_name and len(old_name) >= 2:
                return (old_name, new_name, role)
        return ("*", new_name, role)
    return None


def _extract_remove_person_from_message(message: str) -> Optional[Tuple[str, Optional[str]]]:
    """
    Détecte une demande de suppression/retrait d'un vendeur ou acheteur.
    Retourne (nom_à_supprimer, role_hint) où role_hint est "Vendeur", "Acheteur" ou None.
    """
    if not message or len(message.strip()) < 5:
        return None
    t = (message or "").strip().lower()
    remove_verbs = ("supprimer", "supprime", "retirer", "retire", "enlever", "enlève", "remove")
    if not any(v in t for v in remove_verbs):
        return None
    role_hint: Optional[str] = None
    if "vendeur" in t or "vendeuse" in t:
        role_hint = "Vendeur"
    elif "acheteur" in t or "acheteuse" in t:
        role_hint = "Acheteur"
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
        simple = re.search(r"(?:" + verb + r")\s+(?:le\s+|la\s+|l[''])?\s*(?:vendeur\s+|acheteur\s+|vendeuse\s+|acheteuse\s+)?\s*([a-zàâäéèêëïîôùûüç\s\-]+?)(?:\s+des?\s+|\s*$|\.|,|!|\?)", t, re.I)
        if not simple:
            simple = re.search(r"(?:" + verb + r")\s+([a-zàâäéèêëïîôùûüç\-]+)(?:\s|$|\.|,)", t, re.I)
        if simple:
            name = simple.group(1).strip()
            if len(name) >= 2 and name.lower() not in ("le", "la", "des", "du", "les"):
                return (name, role_hint)
    return None


def _wants_to_update_price(message: str) -> bool:
    """True si le message semble donner un prix pour la transaction."""
    if not message or len(message.strip()) < 5:
        return False
    t = (message or "").strip().lower()
    if "prix" not in t and "million" not in t and "mille" not in t and "piles" not in t:
        if re.search(r"\d{2,}[\s]*\d{3}", t) or re.search(r"\d{1,3}\s*mille", t, re.I):
            return True
    if "prix" in t or "mille" in t or "million" in t or "piles" in t:
        return _extract_price_from_message(message) is not None
    return False


def _extract_oaciq_form_code_from_message(message: str) -> Optional[str]:
    """
    Extrait le code du formulaire OACIQ demandé dans le message.
    Cherche d'abord un code explicite, puis les mots-clés. Retourne None si rien trouvé.
    """
    if not message or not message.strip():
        return None
    t = (message or "").strip().lower()
    for code in sorted(LEA_KNOWN_OACIQ_CODES, key=lambda c: -len(c)):
        code_lower = code.lower()
        if code_lower in t:
            idx = t.find(code_lower)
            before_ok = idx == 0 or t[idx - 1] in " \t\n\r,;.?!»\"'(-"
            after_ok = idx + len(code_lower) >= len(t) or t[idx + len(code_lower)] in " \t\n\r,;.?!«\"')-"
            if not (before_ok and after_ok):
                continue
            if code == "D" and idx + 1 < len(t):
                rest = t[idx:]
                if rest.startswith("d'achat") or rest.startswith("d\u2019achat") or rest.startswith("d'achar"):
                    continue
            if code == "AS" and idx == 0:
                rest = t[idx:]
                if any(rest.startswith(prefix) for prefix in _AS_FALSE_POSITIVE_PREFIXES):
                    continue
            if code == "AS" and idx > 0:
                rest = t[idx:]
                if any(rest.startswith(prefix) for prefix in _AS_FALSE_POSITIVE_PREFIXES):
                    continue
            return code
    for keywords, code in LEA_OACIQ_KEYWORD_TO_CODE:
        if any(kw in t for kw in keywords):
            return code
    return None


def _is_information_request_only(message: str) -> bool:
    """
    True si le message est une demande d'information / explication et non une demande d'action.
    """
    if not message or len(message.strip()) < 10:
        return False
    t = (message or "").strip().lower()
    info_phrases = (
        "as-t-on ", "as-t-on d'", "as-t-on des ", "as-t-on d'autres ",
        "est-ce qu'on peut ", "qu'est-ce qu'on peut ", "quelles autres informations",
        "quelles autres infos", "quelles informations ", "quelles infos ",
        "d'autres informations qu'on peut", "d'autres infos qu'on peut",
        "qu'on peut ajouter", "qu'on peut faire", "quelles données ", "quoi d'autre ",
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
    if _extract_oaciq_form_code_from_message(message):
        return True
    if "formulaire" in t or "form " in t or "form." in t:
        if "oaciq" in t or "oacq" in t or "promesse" in t or "contre-proposition" in t or "modifications" in t or "modification" in t or "déclaration" in t or "contrat" in t or "annexe" in t or "avis" in t:
            return True
    if "promesse" in t and ("achat" in t or "achar" in t):
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


def _wants_lea_to_complete_form(message: str) -> bool:
    """True si l'utilisateur demande à Léa de compléter / remplir le formulaire."""
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


def _wants_help_filling_oaciq(message: str) -> bool:
    """True si l'utilisateur demande à Léa de l'aider à remplir le formulaire champ par champ."""
    if not message or len(message.strip()) < 4:
        return False
    t = (message or "").strip().lower()
    help_phrases = (
        "guide moi", "guide-moi", "guidez moi", "guidez-moi",
        "aide moi a le remplir", "aide-moi à le remplir", "aide moi à le remplir",
        "aide-moi a le remplir", "aide moi pour le remplir", "aide-moi pour le remplir",
        "aide-moi à remplir", "aide moi a remplir", "guide-moi pour remplir", "guide moi pour remplir",
        "aide-moi à le remplir", "m'aide à le remplir", "m aide a le remplir",
        "remplir avec moi", "remplis avec moi", "on le remplit ensemble",
    )
    return any(p in t for p in help_phrases)
