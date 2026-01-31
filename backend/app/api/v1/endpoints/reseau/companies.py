"""
Réseau Companies Endpoints
API endpoints for managing network module companies/enterprises
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from io import BytesIO
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.company import Company
from app.services.export_service import ExportService
from app.core.logging import logger

# Create router with réseau companies prefix
router = APIRouter(prefix="/reseau/companies", tags=["reseau-companies"])


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
