"""
Réseau Companies Endpoints
API endpoints for managing network module companies/enterprises
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Request, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload
from io import BytesIO
from datetime import datetime
import zipfile
import os
import uuid

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate, Company as CompanySchema
from app.services.export_service import ExportService
from app.services.import_service import ImportService
from app.services.s3_service import S3Service
from app.core.logging import logger

# Create router with réseau companies prefix
router = APIRouter(prefix="/reseau/companies", tags=["reseau-companies"])


def _company_to_schema(company: Company) -> CompanySchema:
    """Convert Company model to schema"""
    return CompanySchema(
        id=company.id,
        name=company.name,
        description=company.description,
        website=company.website,
        logo_url=company.logo_url,
        logo_filename=company.logo_url.split('/')[-1] if company.logo_url else None,
        email=company.email,
        phone=company.phone,
        industry=None,  # Not in model yet
        size=None,  # Not in model yet
        city=company.city,
        country=company.country,
        is_client=company.is_client,
        parent_company_id=company.parent_company_id,
        parent_company_name=company.parent_company.name if company.parent_company else None,
        created_at=company.created_at,
        updated_at=company.updated_at,
    )


@router.get("/", response_model=List[CompanySchema])
async def list_companies(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> List[CompanySchema]:
    """
    Get list of companies
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of companies
    """
    try:
        query = select(Company).options(
            selectinload(Company.parent_company)
        ).order_by(Company.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        companies = result.scalars().all()
        
        return [_company_to_schema(company) for company in companies]
    except Exception as e:
        logger.error(f"Database error in list_companies: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )


@router.get("/{company_id}", response_model=CompanySchema)
async def get_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanySchema:
    """
    Get a specific company by ID
    
    Args:
        company_id: Company ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Company details
        
    Raises:
        HTTPException: If company not found
    """
    try:
        result = await db.execute(
            select(Company)
            .options(selectinload(Company.parent_company))
            .where(Company.id == company_id)
        )
        company = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Database error in get_company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return _company_to_schema(company)


@router.post("/", response_model=CompanySchema, status_code=status.HTTP_201_CREATED)
async def create_company(
    request: Request,
    company_data: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanySchema:
    """
    Create a new company
    
    Args:
        company_data: Company creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created company
    """
    # Validate parent company exists if provided
    if company_data.parent_company_id:
        parent_result = await db.execute(
            select(Company).where(Company.id == company_data.parent_company_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent company not found"
            )
    
    # Build company
    company = Company(
        name=company_data.name,
        description=company_data.description,
        website=company_data.website,
        logo_url=company_data.logo_url,
        email=company_data.email,
        phone=company_data.phone,
        city=company_data.city,
        country=company_data.country,
        is_client=company_data.is_client or False,
        parent_company_id=company_data.parent_company_id,
    )
    
    try:
        db.add(company)
        await db.commit()
        await db.refresh(company, ["parent_company"])
        
        logger.info(f"Company created: {company.id} - {company.name} by user {current_user.id}")
        return _company_to_schema(company)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating company: {str(e)}"
        )


@router.put("/{company_id}", response_model=CompanySchema)
async def update_company(
    request: Request,
    company_id: int,
    company_data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanySchema:
    """
    Update a company
    
    Args:
        company_id: Company ID
        company_data: Company update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated company
        
    Raises:
        HTTPException: If company not found
    """
    try:
        result = await db.execute(
            select(Company)
            .options(selectinload(Company.parent_company))
            .where(Company.id == company_id)
        )
        company = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Database error in update_company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Validate parent company exists if provided
    if company_data.parent_company_id is not None:
        if company_data.parent_company_id == company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company cannot be its own parent"
            )
        parent_result = await db.execute(
            select(Company).where(Company.id == company_data.parent_company_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent company not found"
            )
    
    # Update fields
    update_data = company_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    try:
        await db.commit()
        await db.refresh(company, ["parent_company"])
        
        logger.info(f"Company updated: {company.id} - {company.name} by user {current_user.id}")
        return _company_to_schema(company)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating company: {str(e)}"
        )


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    request: Request,
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a company
    
    Args:
        company_id: Company ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If company not found
    """
    try:
        result = await db.execute(
            select(Company).where(Company.id == company_id)
        )
        company = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Database error in delete_company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    try:
        await db.delete(company)
        await db.commit()
        
        logger.info(f"Company deleted: {company_id} - {company.name} by user {current_user.id}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting company: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting company: {str(e)}"
        )


@router.delete("/bulk", status_code=status.HTTP_200_OK)
async def delete_all_companies(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Delete all companies
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Result with deleted count
    """
    try:
        result = await db.execute(select(func.count(Company.id)))
        count = result.scalar() or 0
        
        await db.execute(delete(Company))
        await db.commit()
        
        logger.info(f"All companies deleted ({count} companies) by user {current_user.id}")
        
        return {
            "message": f"{count} company(ies) deleted successfully",
            "deleted_count": count
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting all companies: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting companies: {str(e)}"
        )


@router.post("/import")
async def import_companies(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Optional import ID for tracking logs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Import companies from Excel file or ZIP file (Excel + logos)
    
    Args:
        file: Excel file or ZIP file with companies data and logos
        import_id: Optional import ID for tracking logs
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Import results with data, errors, warnings, and import_id
    """
    # This is a simplified version - full implementation would be similar to contacts import
    try:
        file_content = await file.read()
        filename = file.filename or ""
        file_ext = os.path.splitext(filename.lower())[1]
        
        photos_dict = {}
        excel_content = None
        
        # Handle ZIP files
        if file_ext == '.zip':
            with zipfile.ZipFile(BytesIO(file_content), 'r') as zip_ref:
                for file_info in zip_ref.namelist():
                    file_name_lower = file_info.lower()
                    if file_name_lower.endswith(('.xlsx', '.xls')):
                        if excel_content is None:
                            excel_content = zip_ref.read(file_info)
                    elif file_name_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        photo_content = zip_ref.read(file_info)
                        photo_filename = os.path.basename(file_info)
                        photos_dict[photo_filename.lower()] = photo_content
                
                if excel_content is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No Excel file found in ZIP"
                    )
                file_content = excel_content
        
        # Import from Excel
        result = ImportService.import_from_excel(
            file_content=file_content,
            has_headers=True
        )
        
        if not result or 'data' not in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Excel file format"
            )
        
        valid_rows = 0
        invalid_rows = 0
        warnings = []
        logos_uploaded = 0
        
        # Process each row
        for row_num, row_data in enumerate(result['data'], start=1):
            try:
                # Map Excel columns to company fields (simplified)
                name = row_data.get('Nom') or row_data.get('nom') or row_data.get('name')
                if not name:
                    invalid_rows += 1
                    warnings.append({"row": row_num, "message": "Nom manquant"})
                    continue
                
                # Create company
                company = Company(
                    name=str(name).strip(),
                    description=row_data.get('Description') or row_data.get('description'),
                    website=row_data.get('Site web') or row_data.get('website') or row_data.get('site_web'),
                    email=row_data.get('Courriel') or row_data.get('email') or row_data.get('courriel'),
                    phone=row_data.get('Téléphone') or row_data.get('phone') or row_data.get('telephone'),
                    city=row_data.get('Ville') or row_data.get('city') or row_data.get('ville'),
                    country=row_data.get('Pays') or row_data.get('country') or row_data.get('pays'),
                    is_client=str(row_data.get('Client') or row_data.get('client') or '').lower() in ('oui', 'yes', 'true', '1'),
                )
                
                # Handle logo upload if ZIP
                logo_filename = row_data.get('Logo Filename') or row_data.get('logo_filename')
                if logo_filename and photos_dict:
                    logo_key = logo_filename.lower()
                    if logo_key in photos_dict:
                        try:
                            s3_service = S3Service()
                            logo_url = await s3_service.upload_file(
                                file_content=photos_dict[logo_key],
                                filename=os.path.basename(logo_filename),
                                folder='companies/logos'
                            )
                            company.logo_url = logo_url
                            logos_uploaded += 1
                        except Exception as e:
                            logger.warning(f"Failed to upload logo for row {row_num}: {e}")
                            warnings.append({"row": row_num, "message": f"Échec upload logo: {str(e)}"})
                
                db.add(company)
                valid_rows += 1
            except Exception as e:
                invalid_rows += 1
                warnings.append({"row": row_num, "message": str(e)})
        
        await db.commit()
        
        return {
            "valid_rows": valid_rows,
            "invalid_rows": invalid_rows,
            "warnings": warnings if warnings else None,
            "logos_uploaded": logos_uploaded if logos_uploaded > 0 else None,
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error importing companies: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing companies: {str(e)}"
        )


@router.get("/export")
async def export_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Export companies to Excel
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Excel file with companies data
    """
    try:
        # Get all companies
        result = await db.execute(
            select(Company)
            .options(selectinload(Company.parent_company))
            .order_by(Company.created_at.desc())
        )
        companies = result.scalars().all()
        
        # Convert to dict format for export
        export_data = []
        for company in companies:
            export_data.append({
                'Nom': company.name,
                'Description': company.description or '',
                'Site web': company.website or '',
                'Logo URL': company.logo_url or '',
                'Courriel': company.email or '',
                'Téléphone': company.phone or '',
                'Ville': company.city or '',
                'Pays': company.country or '',
                'Client': 'Oui' if company.is_client else 'Non',
                'Entreprise parente': company.parent_company.name if company.parent_company else '',
            })
        
        # Handle empty data case
        if not export_data:
            export_data = [{
                'Nom': '',
                'Description': '',
                'Site web': '',
                'Logo URL': '',
                'Courriel': '',
                'Téléphone': '',
                'Ville': '',
                'Pays': '',
                'Client': '',
                'Entreprise parente': '',
            }]
        
        # Export to Excel
        buffer, filename = ExportService.export_to_excel(
            data=export_data,
            filename=f"entreprises_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        )
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Error exporting companies: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting companies: {str(e)}"
        )


@router.get("/template")
async def download_template(
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Download Excel template for importing companies
    
    Returns:
        Excel file with template structure for company import
    """
    try:
        # Create template data with headers and example row
        template_data = [
            {
                'Nom': 'Exemple Entreprise',
                'Description': 'Description de l\'entreprise',
                'Site web': 'https://www.exemple.com',
                'Logo URL': 'https://www.exemple.com/logo.png',
                'Logo Filename': 'logo.png',
                'Courriel': 'contact@exemple.com',
                'Téléphone': '+1-234-567-8900',
                'Industrie': 'Technologie',
                'Taille': '50-100',
                'Ville': 'Montréal',
                'Pays': 'Canada',
                'Client': 'Oui',
                'Entreprise parente': '',
            }
        ]
        
        # Headers in desired order
        headers = [
            'Nom',
            'Description',
            'Site web',
            'Logo URL',
            'Logo Filename',
            'Courriel',
            'Téléphone',
            'Industrie',
            'Taille',
            'Ville',
            'Pays',
            'Client',
            'Entreprise parente',
        ]
        
        # Generate Excel file
        buffer, filename = ExportService.export_to_excel(
            data=template_data,
            headers=headers,
            filename='companies-template.xlsx',
            sheet_name='Entreprises'
        )
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ImportError as e:
        logger.error(f"Export dependency error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Le service d'export Excel n'est pas disponible. Veuillez contacter l'administrateur."
        )
    except Exception as e:
        logger.error(f"Unexpected template download error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du téléchargement du modèle: {str(e)}"
        )


@router.get("/template-zip")
async def download_zip_template(
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Download ZIP template with Excel file and instructions for importing companies with logos
    
    Returns:
        ZIP file containing Excel template and README instructions
    """
    try:
        import zipfile
        
        # Create template data
        template_data = [
            {
                'Nom': 'Exemple Entreprise',
                'Description': 'Description de l\'entreprise',
                'Site web': 'https://www.exemple.com',
                'Logo Filename': 'logos/logo.png',  # Relative path in ZIP
                'Courriel': 'contact@exemple.com',
                'Téléphone': '+1-234-567-8900',
                'Industrie': 'Technologie',
                'Taille': '50-100',
                'Ville': 'Montréal',
                'Pays': 'Canada',
                'Client': 'Oui',
                'Entreprise parente': '',
            }
        ]
        
        headers = [
            'Nom',
            'Description',
            'Site web',
            'Logo Filename',
            'Courriel',
            'Téléphone',
            'Industrie',
            'Taille',
            'Ville',
            'Pays',
            'Client',
            'Entreprise parente',
        ]
        
        # Generate Excel file
        excel_buffer, excel_filename = ExportService.export_to_excel(
            data=template_data,
            headers=headers,
            filename='companies-template.xlsx',
            sheet_name='Entreprises'
        )
        
        # Create README instructions
        readme_content = """# Instructions d'import des entreprises avec logos

## Structure du ZIP

Le fichier ZIP doit contenir :
- `companies-template.xlsx` : Fichier Excel avec les données des entreprises
- `logos/` : Dossier contenant les logos des entreprises

## Format du fichier Excel

### Colonnes requises :
- **Nom** : Nom de l'entreprise (obligatoire)
- **Description** : Description de l'entreprise (optionnel)
- **Site web** : URL du site web (optionnel)
- **Logo Filename** : Chemin relatif vers le logo dans le dossier logos/ (ex: logos/logo.png)
- **Courriel** : Adresse email (optionnel)
- **Téléphone** : Numéro de téléphone (optionnel)
- **Industrie** : Secteur d'activité (optionnel)
- **Taille** : Taille de l'entreprise (optionnel)
- **Ville** : Ville (optionnel)
- **Pays** : Pays (optionnel)
- **Client** : Oui/Non (optionnel)
- **Entreprise parente** : Nom de l'entreprise parente si filiale (optionnel)

## Exemple de structure ZIP

```
import-companies.zip
├── companies-template.xlsx
└── logos/
    ├── logo1.png
    ├── logo2.jpg
    └── logo3.png
```

## Notes importantes

1. Les logos doivent être dans le dossier `logos/` à la racine du ZIP
2. Le chemin dans la colonne "Logo Filename" doit être relatif (ex: `logos/logo.png`)
3. Formats de logo supportés : PNG, JPG, JPEG
4. Taille recommandée des logos : 200x200px minimum
"""
        
        # Create ZIP file
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add Excel file
            excel_buffer.seek(0)
            zip_file.writestr(excel_filename, excel_buffer.read())
            
            # Add README
            zip_file.writestr('README.txt', readme_content.encode('utf-8'))
        
        zip_buffer.seek(0)
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=companies-template-{datetime.now().strftime('%Y%m%d')}.zip"}
        )
    except ImportError as e:
        logger.error(f"Export dependency error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Le service d'export Excel n'est pas disponible. Veuillez contacter l'administrateur."
        )
    except Exception as e:
        logger.error(f"Unexpected ZIP template download error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du téléchargement du modèle ZIP: {str(e)}"
        )
