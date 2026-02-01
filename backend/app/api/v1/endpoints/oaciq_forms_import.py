"""
OACIQ Forms Import Endpoint
Endpoint pour l'import en masse de formulaires OACIQ depuis Manus
+ schéma d'extraction et extraction PDF
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError, OperationalError, ProgrammingError
from pydantic import BaseModel

from app.models.form import Form
from app.models.user import User
from app.dependencies import get_db, get_current_user
from app.core.api_key import get_user_from_api_key
from app.api.v1.endpoints.auth import get_current_user as get_current_user_jwt
from app.schemas.oaciq_form import (
    OACIQFormImportRequest,
    OACIQFormImportResponse,
    OACIQFormImportResult,
)
from app.core.logging import logger
from app.api.v1.endpoints.oaciq_forms import handle_database_error

router = APIRouter()


@router.get(
    "/oaciq/forms/import/schema/{code}",
    response_model=ExtractionSchemaResponse,
    tags=["oaciq-forms"],
    summary="Schéma d'extraction d'un formulaire OACIQ",
)
async def get_oaciq_form_schema(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne le extraction_schema du formulaire OACIQ pour le code donné.
    Utilisé par le frontend pour afficher la structure attendue ou pour l'extraction PDF.
    """
    result = await db.execute(select(Form).where(Form.code == code))
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulaire OACIQ introuvable",
        )
    extraction_schema = getattr(form, "extraction_schema", None)
    return ExtractionSchemaResponse(
        code=code,
        extraction_schema=extraction_schema,
        form_id=form.id,
    )


class ExtractionSchemaResponse(BaseModel):
    """Réponse contenant le schéma d'extraction d'un formulaire OACIQ."""
    code: str
    extraction_schema: Dict[str, Any] | None
    form_id: int


class ExtractPdfResponse(BaseModel):
    """Réponse après extraction des champs depuis un PDF."""
    success: bool
    form_code: str
    data: Dict[str, Any]
    confidence: Dict[str, float]
    raw_text_preview: str | None = None


@router.post(
    "/oaciq/forms/import",
    response_model=OACIQFormImportResponse,
    status_code=status.HTTP_200_OK,
    tags=["oaciq-forms"],
    summary="Import en masse de formulaires OACIQ",
    description="Endpoint pour que Manus importe des formulaires OACIQ en masse. "
                "Accepte l'authentification par API key ou JWT token."
)
async def import_oaciq_forms(
    request: Request,
    import_data: OACIQFormImportRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Import en masse de formulaires OACIQ depuis Manus.
    
    Cet endpoint permet d'importer plusieurs formulaires OACIQ en une seule requête.
    Il accepte l'authentification par API key (pour Manus) ou JWT token.
    
    - **overwrite_existing**: Si True, met à jour les formulaires existants. Si False, ignore les doublons.
    - **forms**: Liste des formulaires à importer (max 100 par requête)
    
    Retourne un résumé détaillé de l'import avec le statut de chaque formulaire.
    """
    # Essayer d'abord l'authentification par API key
    api_key_header = request.headers.get("X-API-Key")
    api_key_query = request.query_params.get("api_key")
    api_key = api_key_header or api_key_query
    
    api_key_user = None
    if api_key:
        api_key_user = await get_user_from_api_key(api_key=api_key, db=db)
    
    # Si pas d'API key, essayer avec JWT
    if not api_key_user:
        try:
            current_user = await get_current_user_jwt(request, db)
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentification requise (API key ou JWT token). "
                       "Fournissez X-API-Key dans les headers ou un token JWT valide."
            )
    else:
        current_user = api_key_user
    
    results: List[OACIQFormImportResult] = []
    created_count = 0
    updated_count = 0
    skipped_count = 0
    failed_count = 0
    
    try:
        for form_item in import_data.forms:
            try:
                # Vérifier si le formulaire existe déjà
                existing_query = select(Form).where(Form.code == form_item.code)
                existing_result = await db.execute(existing_query)
                existing_form = existing_result.scalar_one_or_none()
                
                if existing_form:
                    if import_data.overwrite_existing:
                        # Mettre à jour le formulaire existant
                        existing_form.name = form_item.name
                        existing_form.category = form_item.category.value
                        if form_item.pdf_url:
                            existing_form.pdf_url = form_item.pdf_url
                        if form_item.fields:
                            existing_form.fields = form_item.fields
                        existing_form.user_id = current_user.id
                        
                        await db.commit()
                        await db.refresh(existing_form)
                        
                        results.append(OACIQFormImportResult(
                            code=form_item.code,
                            success=True,
                            action="updated",
                            form_id=existing_form.id
                        ))
                        updated_count += 1
                    else:
                        # Ignorer le formulaire existant
                        results.append(OACIQFormImportResult(
                            code=form_item.code,
                            success=True,
                            action="skipped",
                            form_id=existing_form.id,
                            error="Formulaire déjà existant (overwrite_existing=False)"
                        ))
                        skipped_count += 1
                else:
                    # Créer un nouveau formulaire
                    new_form = Form(
                        code=form_item.code,
                        name=form_item.name,
                        category=form_item.category.value,
                        pdf_url=form_item.pdf_url,
                        fields=form_item.fields or {},
                        user_id=current_user.id,
                    )
                    
                    db.add(new_form)
                    await db.commit()
                    await db.refresh(new_form)
                    
                    results.append(OACIQFormImportResult(
                        code=form_item.code,
                        success=True,
                        action="created",
                        form_id=new_form.id
                    ))
                    created_count += 1
                    
            except Exception as e:
                # En cas d'erreur pour un formulaire spécifique
                logger.error(f"Erreur lors de l'import du formulaire {form_item.code}: {e}", exc_info=True)
                results.append(OACIQFormImportResult(
                    code=form_item.code,
                    success=False,
                    action="failed",
                    error=str(e)
                ))
                failed_count += 1
                # Continuer avec les autres formulaires
                await db.rollback()
                continue
        
        # Log de l'import réussi
        logger.info(
            f"Import OACIQ forms completed by user {current_user.id}: "
            f"{created_count} created, {updated_count} updated, {skipped_count} skipped, {failed_count} failed"
        )
        
        return OACIQFormImportResponse(
            success=failed_count == 0,
            total=len(import_data.forms),
            created=created_count,
            updated=updated_count,
            skipped=skipped_count,
            failed=failed_count,
            results=results
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de l'import en masse: {e}", exc_info=True)
        handle_database_error(e, "importing OACIQ forms")
