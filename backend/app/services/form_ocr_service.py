"""
Form OCR Service
Classification and structured extraction for OACIQ forms using OCR + LLM.
"""

import asyncio
import io
import json
import re
from typing import Any, Dict, List, Optional, Tuple

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

from app.core.logging import logger
from app.services.ai_service import AIService, AIProvider


def _run_async(coro):
    """Run async coroutine from sync context (e.g. Celery task)."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    if loop.is_running():
        raise RuntimeError("Cannot use _run_async from async context")
    return loop.run_until_complete(coro)


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text from PDF (sync, for use in Celery).
    """
    if not PYPDF2_AVAILABLE:
        raise ImportError("PyPDF2 is required. Install with: pip install PyPDF2")
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        parts = []
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text:
                    parts.append(f"--- Page {i + 1} ---\n{text}\n")
            except Exception as e:
                logger.warning("Error extracting page %s: %s", i + 1, e)
        return "\n".join(parts)
    except Exception as e:
        logger.error("extract_text_from_pdf failed: %s", e)
        raise ValueError(f"Failed to extract text from PDF: {e}") from e


def extract_first_page_text(pdf_content: bytes, max_chars: int = 4000) -> str:
    """Extract text from first page only (for classification)."""
    full = extract_text_from_pdf(pdf_content)
    first_page = full.split("--- Page 2 ---")[0] if "--- Page 2 ---" in full else full
    return first_page.strip()[:max_chars]


async def _classify_form_async(first_page_text: str, known_codes: List[str]) -> str:
    """Use LLM to classify which OACIQ form this is. Returns form code."""
    if not first_page_text.strip():
        return known_codes[0] if known_codes else "PA"
    codes_str = ", ".join(known_codes) if known_codes else "PA, CCVE, ACD, DIA, AOS, PAI"
    prompt = f"""Tu es un expert en formulaires OACIQ du Québec.
Voici le texte extrait de la première page d'un formulaire (peut être partiel ou bruité).

Liste des codes de formulaires possibles: {codes_str}.

Identifie de quel formulaire il s'agit. Réponds UNIQUEMENT par le code (ex: PA, ACD), sans point ni explication."""
    ai = AIService(provider=AIProvider.AUTO)
    resp = await ai.chat_completion(
        messages=[{"role": "user", "content": f"Texte du formulaire:\n\n{first_page_text[:6000]}"}],
        system_prompt=prompt,
        temperature=0.1,
        max_tokens=50,
    )
    content = (resp.get("content") or "").strip().upper()
    # Extract code: allow "PA" or "Le formulaire est PA" -> PA
    match = re.search(r"\b([A-Z]{2,5})\b", content)
    if match:
        code = match.group(1)
        if code in known_codes:
            return code
        if known_codes and code not in known_codes:
            return known_codes[0]
        return code
    return known_codes[0] if known_codes else "PA"


def classify_form(first_page_text: str, known_codes: List[str]) -> str:
    """Sync wrapper for form classification."""
    return _run_async(_classify_form_async(first_page_text, known_codes))


async def _extract_structured_async(ocr_text: str, extraction_schema: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, float]]:
    """
    Use LLM to extract structured data from OCR text according to schema.
    Returns (data, confidence) where data is field name -> value, confidence is field name -> 0-1.
    """
    fields = extraction_schema.get("fields") or []
    if not fields:
        return {}, {}

    field_descs = "\n".join(
        f"- {f.get('name', '')}: {f.get('description', '')}" for f in fields
    )
    prompt = f"""Tu es un expert en extraction de données à partir de formulaires OACIQ.
Extrais les informations demandées à partir du texte OCR ci-dessous.
Pour chaque champ, fournis la valeur extraite et un score de confiance entre 0 et 1 (1 = certain).

Champs à extraire:
{field_descs}

Réponds UNIQUEMENT avec un JSON valide de la forme:
{{"data": {{"nom_du_champ": "valeur"}}, "confidence": {{"nom_du_champ": 0.95}}}}
Utilise exactement les noms de champs donnés (name). Si une info est absente, mets null et confiance 0."""
    ai = AIService(provider=AIProvider.AUTO)
    resp = await ai.chat_completion(
        messages=[{"role": "user", "content": f"Texte OCR:\n\n{ocr_text[:12000]}"}],
        system_prompt=prompt,
        temperature=0.2,
        max_tokens=2000,
    )
    content = (resp.get("content") or "").strip()
    # Parse JSON from response (allow markdown code block)
    for start in ("```json", "```"):
        if start in content:
            idx = content.find(start) + len(start)
            end = content.find("```", idx)
            content = content[idx:end if end != -1 else None].strip()
            break
    try:
        out = json.loads(content)
        data = out.get("data") or out
        confidence = out.get("confidence") or {}
        if isinstance(data, dict) and not isinstance(confidence, dict):
            confidence = {k: 0.8 for k in data}
        return data, confidence
    except json.JSONDecodeError as e:
        logger.warning("LLM extraction JSON parse error: %s", e)
        return {}, {}


def extract_structured_data(ocr_text: str, extraction_schema: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, float]]:
    """Sync wrapper for structured extraction."""
    return _run_async(_extract_structured_async(ocr_text, extraction_schema))
