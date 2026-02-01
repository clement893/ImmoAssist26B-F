"""
OACIQ Form Schemas
Pydantic schemas for OACIQ forms
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class OACIQFormCategory(str, Enum):
    """OACIQ form categories"""
    OBLIGATOIRE = "obligatoire"
    RECOMMANDE = "recommandé"
    CURATEUR_PUBLIC = "curateur_public"


class FormSubmissionStatus(str, Enum):
    """Form submission status"""
    DRAFT = "draft"
    COMPLETED = "completed"
    SIGNED = "signed"


class FormFieldConfig(BaseModel):
    """Form field configuration"""
    id: str
    label: str
    type: str  # text, textarea, email, number, date, select, radio, checkbox, file
    required: bool = False
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    validation: Optional[Dict[str, Any]] = None
    options: Optional[List[Dict[str, str]]] = None  # For select/radio
    format: Optional[str] = None  # For number: "currency"
    currency: Optional[str] = None  # For currency: "CAD"


class FormSection(BaseModel):
    """Form section with fields"""
    id: str
    title: str
    order: int
    fields: List[FormFieldConfig]


class OACIQFormFields(BaseModel):
    """OACIQ form fields structure"""
    sections: List[FormSection]


class OACIQFormCreate(BaseModel):
    """Create OACIQ form request"""
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    category: OACIQFormCategory
    pdf_url: Optional[str] = None
    fields: Optional[Dict[str, Any]] = None  # Can be filled by AI
    transaction_id: Optional[int] = None


class OACIQFormUpdate(BaseModel):
    """Update OACIQ form request"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[OACIQFormCategory] = None
    pdf_url: Optional[str] = None
    fields: Optional[Dict[str, Any]] = None
    transaction_id: Optional[int] = None


class OACIQFormResponse(BaseModel):
    """OACIQ form response"""
    id: int
    code: Optional[str]
    name: str
    category: Optional[str]
    pdf_url: Optional[str]
    fields: Dict[str, Any]
    transaction_id: Optional[int]
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OACIQFormSubmissionCreate(BaseModel):
    """Create OACIQ form submission request"""
    form_code: str
    transaction_id: Optional[int] = None
    data: Dict[str, Any] = Field(..., description="Form submission data")
    status: FormSubmissionStatus = FormSubmissionStatus.DRAFT


class OACIQFormSubmissionResponse(BaseModel):
    """OACIQ form submission response"""
    id: int
    form_id: int
    form_code: Optional[str] = None
    transaction_id: Optional[int]
    data: Dict[str, Any]
    status: str
    user_id: Optional[int]
    submitted_at: datetime
    
    class Config:
        from_attributes = True


class ExtractFieldsRequest(BaseModel):
    """Request to extract fields from PDF"""
    form_code: str
    pdf_url: str


class ExtractFieldsResponse(BaseModel):
    """Response from field extraction"""
    success: bool
    fields: Dict[str, Any]
    form: OACIQFormResponse


class OACIQFormImportItem(BaseModel):
    """Single form item for bulk import"""
    code: str = Field(..., min_length=1, max_length=20, description="Code unique du formulaire OACIQ")
    name: str = Field(..., min_length=1, max_length=200, description="Nom du formulaire")
    category: OACIQFormCategory = Field(..., description="Catégorie du formulaire")
    pdf_url: Optional[str] = Field(None, description="URL du PDF officiel OACIQ")
    fields: Optional[Dict[str, Any]] = Field(None, description="Structure des champs du formulaire (sections et fields)")


class OACIQFormImportRequest(BaseModel):
    """Bulk import request for OACIQ forms from Manus"""
    forms: List[OACIQFormImportItem] = Field(..., min_length=1, max_length=100, description="Liste des formulaires à importer (max 100)")
    overwrite_existing: bool = Field(False, description="Si True, met à jour les formulaires existants. Si False, ignore les doublons.")


class OACIQFormImportResult(BaseModel):
    """Result for a single imported form"""
    code: str
    success: bool
    action: str = Field(..., description="'created' ou 'updated' ou 'skipped'")
    form_id: Optional[int] = None
    error: Optional[str] = None


class OACIQFormImportResponse(BaseModel):
    """Response from bulk import"""
    success: bool
    total: int = Field(..., description="Nombre total de formulaires dans la requête")
    created: int = Field(..., description="Nombre de formulaires créés")
    updated: int = Field(..., description="Nombre de formulaires mis à jour")
    skipped: int = Field(..., description="Nombre de formulaires ignorés")
    failed: int = Field(..., description="Nombre de formulaires ayant échoué")
    results: List[OACIQFormImportResult] = Field(..., description="Détails pour chaque formulaire")
