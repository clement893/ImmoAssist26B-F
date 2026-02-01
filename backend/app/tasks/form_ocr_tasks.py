"""
Form OCR Celery task.
Upload-and-process: download document from S3, classify form, OCR, LLM extraction, create FormSubmission.
"""

from typing import Any, Dict, Optional

from app.celery_app import celery_app
from app.core.logging import logger
from app.models.form import Form, FormSubmission
from app.services.form_ocr_service import (
    classify_form,
    extract_first_page_text,
    extract_structured_data,
    extract_text_from_pdf,
)
from app.services.s3_service import S3Service


def _get_sync_db():
    """Create sync DB session for Celery (same pattern as notification_tasks)."""
    from app.core.config import settings
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    sync_url = str(settings.DATABASE_URL).replace("+asyncpg", "").replace("postgresql+asyncpg", "postgresql+psycopg2")
    engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2, max_overflow=5)
    Session = sessionmaker(bind=engine)
    return Session()


@celery_app.task(bind=True, max_retries=2)
def process_form_ocr_task(
    self,
    file_key: str,
    document_url: str,
    user_id: int,
    content_type: str,
):
    """
    Process uploaded form document: classify, OCR, extract with LLM, create FormSubmission.
    Returns dict with submission_id on success, or error message on failure.
    """
    result: Dict[str, Any] = {"submission_id": None, "error": None, "form_code": None}
    db = None
    try:
        # Download file from S3
        if not S3Service.is_configured():
            result["error"] = "S3 is not configured"
            return result
        s3 = S3Service()
        try:
            content = s3.get_file_content(file_key)
        except Exception as e:
            logger.exception("S3 get_file_content failed: %s", e)
            result["error"] = str(e)
            return result

        if not content:
            result["error"] = "Empty file"
            return result

        # OCR: extract text (PDF only for now; images could use pytesseract)
        if content_type and "pdf" in content_type.lower():
            try:
                full_text = extract_text_from_pdf(content)
                first_page_text = extract_first_page_text(content)
            except Exception as e:
                logger.exception("PDF text extraction failed: %s", e)
                result["error"] = f"PDF extraction failed: {e}"
                return result
        else:
            # Non-PDF: try PyPDF2 anyway for some uploads, else minimal text
            try:
                full_text = extract_text_from_pdf(content)
                first_page_text = extract_first_page_text(content)
            except Exception:
                full_text = ""
                first_page_text = ""

        if not full_text.strip():
            full_text = "(Aucun texte extrait - document image ou vide)"
        if not first_page_text.strip():
            first_page_text = full_text[:4000]

        # DB session
        db = _get_sync_db()
        try:
            # Known form codes from DB
            forms_with_code = db.query(Form).filter(Form.code.isnot(None)).all()
            known_codes = [f.code for f in forms_with_code if f.code]
            if not known_codes:
                known_codes = ["PA", "ACD", "DIA", "AOS", "PAI"]

            # Classify
            form_code = classify_form(first_page_text, known_codes)
            result["form_code"] = form_code

            # Get Form by code
            form = db.query(Form).filter(Form.code == form_code).first()
            if not form:
                # Fallback: first form with code, or create minimal in-memory schema
                form = db.query(Form).filter(Form.code.isnot(None)).first()
            if not form:
                result["error"] = f"No form found for code {form_code}"
                return result

            extraction_schema = getattr(form, "extraction_schema", None) or {
                "fields": [
                    {"name": "buyer_name", "description": "Nom complet de l'acheteur"},
                    {"name": "property_address", "description": "Adresse complète du bien"},
                    {"name": "purchase_price", "description": "Prix d'achat offert"},
                ]
            }

            # Structured extraction
            try:
                data, confidence = extract_structured_data(full_text, extraction_schema)
            except Exception as e:
                logger.exception("LLM extraction failed: %s", e)
                data = {}
                confidence = {}

            # Build submission data to match form.fields if possible (field names)
            submission_data = dict(data)
            # Ensure all expected keys exist for form.fields
            if isinstance(form.fields, list):
                for f in form.fields:
                    if isinstance(f, dict) and f.get("name") and f["name"] not in submission_data:
                        submission_data[f["name"]] = None

            submission = FormSubmission(
                form_id=form.id,
                data=submission_data,
                user_id=user_id,
                status="draft",
                source_document_url=document_url,
                extraction_confidence=confidence,
                needs_review=True,
            )
            db.add(submission)
            db.commit()
            db.refresh(submission)
            result["submission_id"] = submission.id
            logger.info("FormSubmission %s created from OCR (form_code=%s)", submission.id, form_code)
        finally:
            if db:
                db.close()
        return result
    except Exception as e:
        logger.exception("process_form_ocr_task failed: %s", e)
        if db:
            try:
                db.rollback()
                db.close()
            except Exception:
                pass
        result["error"] = str(e)
        return result
