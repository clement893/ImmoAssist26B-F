"""
OACIQ Forms API Endpoints
Formulaires OACIQ spécifiques
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.exc import SQLAlchemyError, OperationalError, ProgrammingError

from app.models.form import Form, FormSubmission, FormSubmissionVersion
from app.models.real_estate_transaction import RealEstateTransaction
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.core.api_key import optional_api_key, get_user_from_api_key
from app.api.v1.endpoints.auth import get_current_user as get_current_user_jwt
from app.schemas.oaciq_form import (
    OACIQFormCreate,
    OACIQFormUpdate,
    OACIQFormResponse,
    OACIQFormSubmissionCreate,
    OACIQFormSubmissionResponse,
    OACIQFormCategory,
    FormSubmissionStatus,
    ExtractFieldsRequest,
    ExtractFieldsResponse,
    OACIQFormImportRequest,
    OACIQFormImportResponse,
    OACIQFormImportResult,
)
from app.services.ai_service import AIService, AIProvider
from app.core.logging import logger
from app.core.tenancy_helpers import apply_tenant_scope

router = APIRouter()


def handle_database_error(e: Exception, operation: str = "operation"):
    """Handle database errors and provide helpful error messages"""
    error_msg = str(e).lower()
    
    # Check if it's a schema/migration error
    if isinstance(e, (OperationalError, ProgrammingError)):
        if 'column' in error_msg and ('does not exist' in error_msg or 'not found' in error_msg):
            logger.error(f"Database schema error - migration may not be applied: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database schema is not up to date. Please run database migrations (alembic upgrade head)."
            )
        if 'relation' in error_msg and ('does not exist' in error_msg or 'not found' in error_msg):
            logger.error(f"Database table error - migration may not be applied: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database schema is not up to date. Please run database migrations (alembic upgrade head)."
            )
    
    # Re-raise if it's a SQLAlchemy error that we haven't handled
    if isinstance(e, SQLAlchemyError):
        logger.error(f"Database error during {operation}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred"
        )
    
    # For other exceptions, log and raise generic error
    logger.error(f"Unexpected error during {operation}: {e}", exc_info=True)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred"
    )


@router.get("/oaciq/forms", response_model=List[OACIQFormResponse], tags=["oaciq-forms"])
async def list_oaciq_forms(
    category: Optional[OACIQFormCategory] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Liste tous les formulaires OACIQ"""
    try:
        query = select(Form).where(Form.code.isnot(None))
        
        if category:
            query = query.where(Form.category == category.value)
        
        query = apply_tenant_scope(query, Form)
        query = query.order_by(Form.created_at.desc())
        
        result = await db.execute(query)
        forms = result.scalars().all()
        
        return [OACIQFormResponse.model_validate(form) for form in forms]
    except Exception as e:
        handle_database_error(e, "listing OACIQ forms")


@router.get("/oaciq/forms/{code}", response_model=OACIQFormResponse, tags=["oaciq-forms"])
async def get_oaciq_form_by_code(
    code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtenir un formulaire OACIQ par code"""
    query = select(Form).where(Form.code == code)
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulaire OACIQ introuvable"
        )
    
    return OACIQFormResponse.model_validate(form)


@router.post("/oaciq/forms", response_model=OACIQFormResponse, status_code=status.HTTP_201_CREATED, tags=["oaciq-forms"])
async def create_oaciq_form(
    request: Request,
    form_data: OACIQFormCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Créer un nouveau formulaire OACIQ"""
    # Vérifier si le code existe déjà
    existing = await db.execute(
        select(Form).where(Form.code == form_data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un formulaire avec le code '{form_data.code}' existe déjà"
        )
    
    # Vérifier la transaction si fournie
    if form_data.transaction_id:
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                RealEstateTransaction.id == form_data.transaction_id
            )
        )
        if not transaction_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
    
    form = Form(
        code=form_data.code,
        name=form_data.name,
        category=form_data.category.value,
        pdf_url=form_data.pdf_url,
        fields=form_data.fields or {},
        transaction_id=form_data.transaction_id,
        user_id=current_user.id,
    )
    
    db.add(form)
    await db.commit()
    await db.refresh(form)
    
    return OACIQFormResponse.model_validate(form)


@router.put("/oaciq/forms/{code}", response_model=OACIQFormResponse, tags=["oaciq-forms"])
async def update_oaciq_form(
    request: Request,
    code: str,
    form_data: OACIQFormUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mettre à jour un formulaire OACIQ"""
    query = select(Form).where(Form.code == code)
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulaire OACIQ introuvable"
        )
    
    # Vérifier les permissions (owner or admin)
    from app.dependencies import is_superadmin
    if form.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non autorisé à modifier ce formulaire"
        )
    
    if form_data.name is not None:
        form.name = form_data.name
    if form_data.category is not None:
        form.category = form_data.category.value
    if form_data.pdf_url is not None:
        form.pdf_url = form_data.pdf_url
    if form_data.fields is not None:
        form.fields = form_data.fields
    if form_data.transaction_id is not None:
        form.transaction_id = form_data.transaction_id
    
    await db.commit()
    await db.refresh(form)
    
    return OACIQFormResponse.model_validate(form)


@router.post("/oaciq/forms/extract-fields", response_model=ExtractFieldsResponse, tags=["oaciq-forms"])
async def extract_form_fields(
    request_data: ExtractFieldsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Extraire les champs d'un formulaire PDF avec l'IA"""
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service IA non configuré. Veuillez configurer OPENAI_API_KEY ou ANTHROPIC_API_KEY."
        )
    
    # Récupérer le formulaire
    query = select(Form).where(Form.code == request_data.form_code)
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulaire introuvable"
        )
    
    # Utiliser le service IA pour extraire les champs
    try:
        ai_service = AIService(provider=AIProvider.AUTO)
        
        system_prompt = """Tu es un expert en formulaires OACIQ (Organisme d'autorégulation du courtage immobilier du Québec).
Analyse ce formulaire PDF et extrais tous les champs avec leur type, label, validation et organisation en sections.
Retourne le résultat en JSON structuré avec sections et fields.
Format attendu:
{
  "sections": [
    {
      "id": "section_1",
      "title": "Titre de la section",
      "order": 1,
      "fields": [
        {
          "id": "field_id",
          "label": "Label du champ",
          "type": "text|textarea|email|number|date|select|radio|checkbox|file",
          "required": true/false,
          "placeholder": "...",
          "help_text": "...",
          "validation": {...},
          "options": [...] // Pour select/radio
        }
      ]
    }
  ]
}"""
        
        user_message = f"""Analyse ce formulaire OACIQ (code: {request_data.form_code}) et extrais tous les champs.
URL du PDF: {request_data.pdf_url}

Extrais tous les champs du formulaire avec leur type, label, validation et organise-les en sections logiques."""
        
        # Appel à l'IA
        response_text = await ai_service.simple_chat(
            user_message=user_message,
            system_prompt=system_prompt,
            model=None  # Utiliser le modèle par défaut
        )
        
        # Parser la réponse JSON (peut être dans un format de réponse)
        import json
        import re
        
        # Essayer d'extraire le JSON de la réponse
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            extracted_fields = json.loads(json_match.group())
        else:
            # Si pas de JSON trouvé, essayer de parser directement
            extracted_fields = json.loads(response_text)
        
        # Mettre à jour le formulaire
        form.fields = extracted_fields
        await db.commit()
        await db.refresh(form)
        
        return ExtractFieldsResponse(
            success=True,
            fields=extracted_fields,
            form=OACIQFormResponse.model_validate(form)
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Erreur de parsing JSON lors de l'extraction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du parsing de la réponse IA: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des champs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'extraction: {str(e)}"
        )


@router.post("/oaciq/forms/submissions", response_model=OACIQFormSubmissionResponse, status_code=status.HTTP_201_CREATED, tags=["oaciq-forms"])
async def create_oaciq_submission(
    request: Request,
    submission_data: OACIQFormSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sauvegarder une soumission de formulaire OACIQ"""
    # Récupérer le formulaire par code
    query = select(Form).where(Form.code == submission_data.form_code)
    query = apply_tenant_scope(query, Form)
    result = await db.execute(query)
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulaire introuvable"
        )
    
    # Vérifier la transaction si fournie
    if submission_data.transaction_id:
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                RealEstateTransaction.id == submission_data.transaction_id
            )
        )
        if not transaction_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
    
    # Créer la soumission
    submission = FormSubmission(
        form_id=form.id,
        data=submission_data.data,
        user_id=current_user.id,
        status=submission_data.status.value,
        transaction_id=submission_data.transaction_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    
    # Créer une version pour l'historique
    version = FormSubmissionVersion(
        submission_id=submission.id,
        data=submission_data.data
    )
    db.add(version)
    await db.commit()
    
    response = OACIQFormSubmissionResponse.model_validate(submission)
    response.form_code = form.code
    return response


@router.get("/oaciq/forms/submissions", response_model=List[OACIQFormSubmissionResponse], tags=["oaciq-forms"])
async def list_oaciq_submissions(
    transaction_id: Optional[int] = Query(None),
    form_code: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Liste les soumissions de formulaires OACIQ"""
    query = select(FormSubmission).join(Form).where(Form.code.isnot(None))
    
    if transaction_id:
        query = query.where(FormSubmission.transaction_id == transaction_id)
    
    if form_code:
        query = query.where(Form.code == form_code)
    
    query = query.order_by(FormSubmission.submitted_at.desc())
    
    result = await db.execute(query)
    submissions = result.scalars().all()
    
    responses = []
    for sub in submissions:
        response = OACIQFormSubmissionResponse.model_validate(sub)
        # Récupérer le code du formulaire
        form_result = await db.execute(
            select(Form).where(Form.id == sub.form_id)
        )
        form = form_result.scalar_one()
        response.form_code = form.code
        responses.append(response)
    
    return responses


@router.get("/oaciq/forms/submissions/{submission_id}", response_model=OACIQFormSubmissionResponse, tags=["oaciq-forms"])
async def get_oaciq_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtenir une soumission de formulaire OACIQ"""
    result = await db.execute(
        select(FormSubmission).where(FormSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soumission introuvable"
        )
    
    # Vérifier que c'est un formulaire OACIQ
    form_result = await db.execute(
        select(Form).where(Form.id == submission.form_id)
    )
    form = form_result.scalar_one()
    
    if not form.code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soumission introuvable"
        )
    
    response = OACIQFormSubmissionResponse.model_validate(submission)
    response.form_code = form.code
    return response


@router.put("/oaciq/forms/submissions/{submission_id}", response_model=OACIQFormSubmissionResponse, tags=["oaciq-forms"])
async def update_oaciq_submission(
    request: Request,
    submission_id: int,
    submission_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mettre à jour une soumission de formulaire OACIQ"""
    result = await db.execute(
        select(FormSubmission).where(FormSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soumission introuvable"
        )
    
    # Vérifier que l'utilisateur est le propriétaire
    if submission.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non autorisé à modifier cette soumission"
        )
    
    # Mettre à jour les données
    if 'data' in submission_data:
        submission.data = submission_data['data']
    
    await db.commit()
    await db.refresh(submission)
    
    # Créer une version si ce n'est pas une sauvegarde automatique
    is_auto_save = submission_data.get('is_auto_save', False)
    if not is_auto_save:
        version = FormSubmissionVersion(
            submission_id=submission.id,
            data=submission.data
        )
        db.add(version)
        await db.commit()
    
    # Récupérer le code du formulaire
    form_result = await db.execute(
        select(Form).where(Form.id == submission.form_id)
    )
    form = form_result.scalar_one()
    
    response = OACIQFormSubmissionResponse.model_validate(submission)
    response.form_code = form.code
    return response


@router.patch("/oaciq/forms/submissions/{submission_id}/complete", response_model=OACIQFormSubmissionResponse, tags=["oaciq-forms"])
async def complete_oaciq_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compléter une soumission de formulaire OACIQ"""
    result = await db.execute(
        select(FormSubmission).where(FormSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soumission introuvable"
        )
    
    # Vérifier que l'utilisateur est le propriétaire
    if submission.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non autorisé à compléter cette soumission"
        )
    
    # Mettre à jour le statut
    submission.status = 'completed'
    
    await db.commit()
    await db.refresh(submission)
    
    # Récupérer le code du formulaire
    form_result = await db.execute(
        select(Form).where(Form.id == submission.form_id)
    )
    form = form_result.scalar_one()
    
    response = OACIQFormSubmissionResponse.model_validate(submission)
    response.form_code = form.code
    return response
