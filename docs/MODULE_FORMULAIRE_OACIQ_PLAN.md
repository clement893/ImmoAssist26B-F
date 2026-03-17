# 📋 Guide Complet : Module Formulaires OACIQ - Plan Adapté

## 🎯 Architecture Globale

Le module formulaires OACIQ s'intègre dans la structure existante avec 4 couches :

```
┌─────────────────────────────────────────┐
│  1. BASE DE DONNÉES (PostgreSQL)        │  ← Stockage (SQLAlchemy)
├─────────────────────────────────────────┤
│  2. BACKEND (FastAPI + SQLAlchemy)      │  ← Logique métier
├─────────────────────────────────────────┤
│  3. FRONTEND (Next.js + @immoassist/ui) │  ← Interface utilisateur
├─────────────────────────────────────────┤
│  4. INTÉGRATION IA (AIService)          │  ← Extraction automatique
└─────────────────────────────────────────┘
```

## 📊 1. COUCHE BASE DE DONNÉES

### Extension du Modèle Form Existant

Le modèle `Form` existe déjà dans `backend/app/models/form.py`. Nous devons l'étendre pour supporter les formulaires OACIQ.

**Migration Alembic à créer :** `alembic/versions/XXX_add_oaciq_fields_to_forms.py`

```python
"""Add OACIQ-specific fields to forms table

Revision ID: XXX
Revises: YYY
Create Date: 2026-01-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Ajouter les colonnes OACIQ
    op.add_column('forms', sa.Column('code', sa.String(20), nullable=True, unique=True))
    op.add_column('forms', sa.Column('category', sa.String(50), nullable=True))
    op.add_column('forms', sa.Column('pdf_url', sa.Text(), nullable=True))
    op.add_column('forms', sa.Column('transaction_id', sa.Integer(), nullable=True))
    
    # Ajouter index pour code et category
    op.create_index('idx_forms_code', 'forms', ['code'])
    op.create_index('idx_forms_category', 'forms', ['category'])
    op.create_index('idx_forms_transaction_id', 'forms', ['transaction_id'])
    
    # Ajouter foreign key vers transactions
    op.create_foreign_key(
        'fk_forms_transaction_id',
        'forms', 'real_estate_transactions',
        ['transaction_id'], ['id'],
        ondelete='SET NULL'
    )

def downgrade():
    op.drop_constraint('fk_forms_transaction_id', 'forms', type_='foreignkey')
    op.drop_index('idx_forms_transaction_id', 'forms')
    op.drop_index('idx_forms_category', 'forms')
    op.drop_index('idx_forms_code', 'forms')
    op.drop_column('forms', 'transaction_id')
    op.drop_column('forms', 'pdf_url')
    op.drop_column('forms', 'category')
    op.drop_column('forms', 'code')
```

### Extension du Modèle FormSubmission

Ajouter le statut et la relation avec les transactions :

```python
# Dans backend/app/models/form.py

class FormSubmission(Base):
    """Form submission data"""
    
    __tablename__ = "form_submissions"
    
    # ... colonnes existantes ...
    
    # Nouveaux champs pour OACIQ
    status = Column(String(20), default='draft', nullable=False)  # 'draft', 'completed', 'signed'
    transaction_id = Column(Integer, ForeignKey("real_estate_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Relationships
    transaction = relationship("RealEstateTransaction", backref="form_submissions")
```

### Table pour les Versions (Historique)

Créer une nouvelle table pour l'historique des soumissions :

```python
class FormSubmissionVersion(Base):
    """Version history for form submissions"""
    
    __tablename__ = "form_submission_versions"
    __table_args__ = (
        Index("idx_form_submission_versions_submission_id", "submission_id"),
        Index("idx_form_submission_versions_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("form_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(JSON, nullable=False)  # Snapshot des données
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    submission = relationship("FormSubmission", backref="versions")
```

## 🔧 2. COUCHE BACKEND (FastAPI)

### Schéma Pydantic pour OACIQ

Créer `backend/app/schemas/oaciq_form.py` :

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class OACIQFormCategory(str, Enum):
    OBLIGATOIRE = "obligatoire"
    RECOMMANDE = "recommandé"
    CURATEUR_PUBLIC = "curateur_public"

class FormFieldConfig(BaseModel):
    id: str
    label: str
    type: str  # text, textarea, email, number, date, select, radio, checkbox, file
    required: bool = False
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    validation: Optional[Dict[str, Any]] = None
    options: Optional[List[Dict[str, str]]] = None  # Pour select/radio
    format: Optional[str] = None  # Pour number: "currency"
    currency: Optional[str] = None  # Pour currency: "CAD"

class FormSection(BaseModel):
    id: str
    title: str
    order: int
    fields: List[FormFieldConfig]

class OACIQFormFields(BaseModel):
    sections: List[FormSection]

class OACIQFormCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    category: OACIQFormCategory
    pdf_url: Optional[str] = None
    fields: Optional[OACIQFormFields] = None  # Peut être rempli par l'IA

class OACIQFormResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    pdf_url: Optional[str]
    fields: Optional[Dict[str, Any]]
    transaction_id: Optional[int]
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

class FormSubmissionStatus(str, Enum):
    DRAFT = "draft"
    COMPLETED = "completed"
    SIGNED = "signed"

class OACIQFormSubmissionCreate(BaseModel):
    form_code: str
    transaction_id: Optional[int] = None
    data: Dict[str, Any]
    status: FormSubmissionStatus = FormSubmissionStatus.DRAFT

class OACIQFormSubmissionResponse(BaseModel):
    id: int
    form_id: int
    form_code: Optional[str]
    transaction_id: Optional[int]
    data: Dict[str, Any]
    status: str
    user_id: Optional[int]
    submitted_at: str
    
    class Config:
        from_attributes = True
```

### Endpoints FastAPI pour OACIQ

Créer `backend/app/api/v1/endpoints/oaciq_forms.py` :

```python
"""
OACIQ Forms API Endpoints
Formulaires OACIQ spécifiques
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.form import Form, FormSubmission, FormSubmissionVersion
from app.models.real_estate_transaction import RealEstateTransaction
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.schemas.oaciq_form import (
    OACIQFormCreate,
    OACIQFormResponse,
    OACIQFormSubmissionCreate,
    OACIQFormSubmissionResponse,
    OACIQFormCategory,
    FormSubmissionStatus
)
from app.services.ai_service import AIService, AIProvider
from app.core.logging import logger

router = APIRouter()


@router.get("/oaciq/forms", response_model=List[OACIQFormResponse], tags=["oaciq-forms"])
async def list_oaciq_forms(
    category: Optional[OACIQFormCategory] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Liste tous les formulaires OACIQ"""
    query = select(Form).where(Form.code.isnot(None))
    
    if category:
        query = query.where(Form.category == category.value)
    
    query = query.order_by(Form.created_at.desc())
    
    result = await db.execute(query)
    forms = result.scalars().all()
    
    return [OACIQFormResponse.model_validate(form) for form in forms]


@router.get("/oaciq/forms/{code}", response_model=OACIQFormResponse, tags=["oaciq-forms"])
async def get_oaciq_form_by_code(
    code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtenir un formulaire OACIQ par code"""
    result = await db.execute(
        select(Form).where(Form.code == code)
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulaire OACIQ introuvable"
        )
    
    return OACIQFormResponse.model_validate(form)


@router.post("/oaciq/forms/extract-fields", tags=["oaciq-forms"])
async def extract_form_fields(
    form_code: str,
    pdf_url: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Extraire les champs d'un formulaire PDF avec l'IA"""
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service IA non configuré"
        )
    
    # Récupérer le formulaire
    result = await db.execute(
        select(Form).where(Form.code == form_code)
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulaire introuvable"
        )
    
    # Utiliser le service IA pour extraire les champs
    ai_service = AIService(provider=AIProvider.AUTO)
    
    system_prompt = """Tu es un expert en formulaires OACIQ (Organisme d'autorégulation du courtage immobilier du Québec).
Analyse ce formulaire PDF et extrais tous les champs avec leur type, label, validation et organisation en sections.
Retourne le résultat en JSON structuré avec sections et fields."""
    
    user_message = f"""Analyse ce formulaire OACIQ (code: {form_code}) et extrais tous les champs.
URL du PDF: {pdf_url}

Structure attendue:
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
    
    try:
        # Appel à l'IA (adapté selon le service disponible)
        response = await ai_service.simple_chat(
            user_message=user_message,
            system_prompt=system_prompt,
            model=None  # Utiliser le modèle par défaut
        )
        
        # Parser la réponse JSON
        import json
        extracted_fields = json.loads(response)
        
        # Mettre à jour le formulaire
        form.fields = extracted_fields
        await db.commit()
        await db.refresh(form)
        
        return {
            "success": True,
            "fields": extracted_fields,
            "form": OACIQFormResponse.model_validate(form)
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des champs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'extraction: {str(e)}"
        )


@router.post("/oaciq/forms/submissions", response_model=OACIQFormSubmissionResponse, status_code=status.HTTP_201_CREATED, tags=["oaciq-forms"])
async def create_oaciq_submission(
    submission_data: OACIQFormSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sauvegarder une soumission de formulaire OACIQ"""
    # Récupérer le formulaire par code
    result = await db.execute(
        select(Form).where(Form.code == submission_data.form_code)
    )
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
        transaction = transaction_result.scalar_one_or_none()
        if not transaction:
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
        transaction_id=submission_data.transaction_id
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
        query = query.join(Form).where(Form.code == form_code)
    
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
```

### Enregistrer le Router

Dans `backend/app/api/v1/router.py` :

```python
from app.api.v1.endpoints import oaciq_forms

# ...

api_router.include_router(
    oaciq_forms.router,
    tags=["oaciq-forms"]
)
```

## 🎨 3. COUCHE FRONTEND (Next.js + @immoassist/formulaire)

### Types TypeScript

Créer `packages/formulaire/src/types/index.ts` :

```typescript
export enum OACIQFormCategory {
  OBLIGATOIRE = 'obligatoire',
  RECOMMANDE = 'recommandé',
  CURATEUR_PUBLIC = 'curateur_public',
}

export enum FormSubmissionStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  SIGNED = 'signed',
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'file';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: Record<string, any>;
  options?: Array<{ value: string; label: string }>;
  format?: string;
  currency?: string;
}

export interface FormSection {
  id: string;
  title: string;
  order: number;
  fields: FormFieldConfig[];
}

export interface OACIQFormFields {
  sections: FormSection[];
}

export interface OACIQForm {
  id: number;
  code: string;
  name: string;
  category: OACIQFormCategory;
  pdfUrl?: string;
  fields?: OACIQFormFields;
  transactionId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OACIQFormSubmission {
  id: number;
  formId: number;
  formCode?: string;
  transactionId?: number;
  data: Record<string, any>;
  status: FormSubmissionStatus;
  userId?: number;
  submittedAt: string;
}
```

### API Client

Créer `packages/formulaire/src/api/index.ts` :

```typescript
import { AxiosInstance } from 'axios';
import { OACIQForm, OACIQFormSubmission, OACIQFormCategory, FormSubmissionStatus } from '../types';

export interface CreateOACIQFormSubmission {
  formCode: string;
  transactionId?: number;
  data: Record<string, any>;
  status?: FormSubmissionStatus;
}

export function createOACIQFormsAPI(
  apiClient: AxiosInstance,
  extractApiData: <T>(response: any) => T
) {
  return {
    // Liste des formulaires OACIQ
    list: async (category?: OACIQFormCategory): Promise<OACIQForm[]> => {
      const params = category ? { category } : {};
      const response = await apiClient.get('/v1/oaciq/forms', { params });
      return extractApiData<OACIQForm[]>(response);
    },

    // Obtenir un formulaire par code
    getByCode: async (code: string): Promise<OACIQForm> => {
      const response = await apiClient.get(`/v1/oaciq/forms/${code}`);
      return extractApiData<OACIQForm>(response);
    },

    // Extraire les champs avec l'IA
    extractFields: async (formCode: string, pdfUrl: string): Promise<any> => {
      const response = await apiClient.post('/v1/oaciq/forms/extract-fields', null, {
        params: { form_code: formCode, pdf_url: pdfUrl },
      });
      return extractApiData(response);
    },

    // Créer une soumission
    createSubmission: async (data: CreateOACIQFormSubmission): Promise<OACIQFormSubmission> => {
      const response = await apiClient.post('/v1/oaciq/forms/submissions', data);
      return extractApiData<OACIQFormSubmission>(response);
    },

    // Liste des soumissions
    listSubmissions: async (params?: {
      transactionId?: number;
      formCode?: string;
    }): Promise<OACIQFormSubmission[]> => {
      const response = await apiClient.get('/v1/oaciq/forms/submissions', { params });
      return extractApiData<OACIQFormSubmission[]>(response);
    },
  };
}
```

### Adapter dans apps/web

Créer `apps/web/src/lib/api/oaciq-adapters.ts` :

```typescript
import { createOACIQFormsAPI } from '@immoassist/formulaire/api';
import { apiClient, extractApiData } from './api';

export const oaciqFormsAPI = createOACIQFormsAPI(apiClient, extractApiData);

// Ré-exporter les types
export type {
  OACIQForm,
  OACIQFormSubmission,
  OACIQFormCategory,
  FormSubmissionStatus,
} from '@immoassist/formulaire/types';
```

### Pages Next.js

#### Page Liste des Formulaires

`apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/page.tsx` :

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Container, Card, Button, Loading } from '@immoassist/ui';
import { oaciqFormsAPI, OACIQForm, OACIQFormCategory } from '@/lib/api/oaciq-adapters';
import { FileText, Download } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function OACIQFormsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  const [forms, setForms] = useState<OACIQForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<OACIQFormCategory | undefined>();

  useEffect(() => {
    loadForms();
  }, [selectedCategory]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await oaciqFormsAPI.list(selectedCategory);
      setForms(data);
    } catch (error) {
      console.error('Erreur lors du chargement des formulaires:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Formulaires OACIQ</h1>
          <p className="text-muted-foreground mt-1">
            Accédez aux formulaires officiels de l&apos;OACIQ
          </p>
        </div>

        {/* Filtres */}
        <Card>
          <div className="p-4 flex gap-2">
            <Button
              variant={selectedCategory === undefined ? 'primary' : 'outline'}
              onClick={() => setSelectedCategory(undefined)}
            >
              Tous
            </Button>
            <Button
              variant={selectedCategory === OACIQFormCategory.OBLIGATOIRE ? 'primary' : 'outline'}
              onClick={() => setSelectedCategory(OACIQFormCategory.OBLIGATOIRE)}
            >
              Obligatoires
            </Button>
            <Button
              variant={selectedCategory === OACIQFormCategory.RECOMMANDE ? 'primary' : 'outline'}
              onClick={() => setSelectedCategory(OACIQFormCategory.RECOMMANDE)}
            >
              Recommandés
            </Button>
          </div>
        </Card>

        {/* Liste des formulaires */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id} hover>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">[{form.code}] {form.name}</h3>
                      <p className="text-sm text-muted-foreground">{form.category}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/${locale}/dashboard/modules/formulaire/oaciq/${form.code}/fill`)}
                    className="flex-1"
                  >
                    Remplir
                  </Button>
                  {form.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(form.pdfUrl, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
}
```

#### Page Remplissage de Formulaire

`apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill/page.tsx` :

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Card, Button, Input, Loading } from '@immoassist/ui';
import { oaciqFormsAPI, OACIQForm, FormSubmissionStatus } from '@/lib/api/oaciq-adapters';
import { FormSection, FormFieldConfig } from '@immoassist/formulaire/types';

export default function FillOACIQFormPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [form, setForm] = useState<OACIQForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadForm();
  }, [code]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await oaciqFormsAPI.getByCode(code);
      setForm(data);
    } catch (error) {
      console.error('Erreur lors du chargement du formulaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (status: FormSubmissionStatus) => {
    if (!form) return;
    
    try {
      setSaving(true);
      await oaciqFormsAPI.createSubmission({
        formCode: form.code,
        data: formData,
        status,
      });
      
      router.push(`/${params.locale}/dashboard/modules/formulaire/oaciq`);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            key={field.id}
            type={field.type}
            label={field.label}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      
      case 'textarea':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              required={field.required}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
              rows={4}
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              required={field.required}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">Sélectionner...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  if (!form || !form.fields) {
    return (
      <Container>
        <Card>
          <p>Formulaire introuvable ou champs non définis</p>
        </Card>
      </Container>
    );
  }

  const fields = form.fields as { sections: FormSection[] };

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">[{form.code}] {form.name}</h1>
        </div>

        <form className="space-y-8">
          {fields.sections.map((section) => (
            <Card key={section.id}>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                <div className="space-y-4">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </div>
            </Card>
          ))}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(FormSubmissionStatus.DRAFT)}
              disabled={saving}
            >
              Sauvegarder brouillon
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit(FormSubmissionStatus.COMPLETED)}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Soumettre'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
```

## 📝 Résumé des Étapes d'Implémentation

### Phase 1 : Backend
1. ✅ Créer migration Alembic pour étendre `forms` et `form_submissions`
2. ✅ Créer modèle `FormSubmissionVersion`
3. ✅ Créer schémas Pydantic dans `backend/app/schemas/oaciq_form.py`
4. ✅ Créer endpoints dans `backend/app/api/v1/endpoints/oaciq_forms.py`
5. ✅ Enregistrer le router dans `backend/app/api/v1/router.py`
6. ✅ Tester les endpoints avec Postman/Thunder Client

### Phase 2 : Frontend - Package
1. ✅ Créer types TypeScript dans `packages/formulaire/src/types/index.ts`
2. ✅ Créer API client dans `packages/formulaire/src/api/index.ts`
3. ✅ Exporter depuis `packages/formulaire/src/index.ts`

### Phase 3 : Frontend - Application
1. ✅ Créer adapter dans `apps/web/src/lib/api/oaciq-adapters.ts`
2. ✅ Créer page liste dans `apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/page.tsx`
3. ✅ Créer page remplissage dans `apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill/page.tsx`
4. ✅ Ajouter composants de formulaire dans `packages/formulaire/src/components/` si nécessaire

### Phase 4 : Intégration IA
1. ✅ Tester l'extraction avec un formulaire PDF réel
2. ✅ Valider et corriger les champs extraits
3. ✅ Améliorer le prompt système si nécessaire

### Phase 5 : Tests et Déploiement
1. ✅ Tests unitaires backend
2. ✅ Tests d'intégration frontend
3. ✅ Déploiement sur Railway

## 🔗 Intégration avec les Transactions

Les formulaires OACIQ peuvent être liés aux transactions immobilières via `transaction_id`. Cela permet de :
- Voir tous les formulaires d'une transaction
- Pré-remplir les formulaires avec les données de la transaction
- Suivre l'état des formulaires pour chaque transaction

## 📚 Notes Importantes

1. **Service IA** : Utiliser `AIService` existant qui supporte OpenAI et Anthropic
2. **Composants UI** : Utiliser les composants de `@immoassist/ui` (Button, Card, Input, etc.)
3. **Structure Modulaire** : Respecter la structure TurboRepo avec packages séparés
4. **Types Partagés** : Les types sont définis dans `@immoassist/formulaire` et réutilisés dans `apps/web`
5. **Authentification** : Tous les endpoints nécessitent une authentification via `get_current_user`
