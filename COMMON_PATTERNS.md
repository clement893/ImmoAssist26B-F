# 🔄 Patterns Communs - Guide de Référence

Ce document liste les patterns récurrents utilisés dans le projet pour maintenir la cohérence.

## 📋 Table des Matières

1. [Patterns Frontend](#patterns-frontend)
2. [Patterns Backend](#patterns-backend)
3. [Patterns API](#patterns-api)
4. [Patterns Database](#patterns-database)
5. [Patterns Error Handling](#patterns-error-handling)
6. [Patterns Authentication](#patterns-authentication)

---

## 🎨 Patterns Frontend

### 1. Composant avec État et API

```typescript
'use client';

import { useState, useEffect } from 'react';
import { resourceAPI } from '@/lib/api/resource';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface ComponentProps {
  resourceId: number;
}

export function ResourceComponent({ resourceId }: ComponentProps) {
  const [data, setData] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await resourceAPI.get(resourceId);
        setData(response.data);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        logger.error('Failed to load resource', { error: err, resourceId });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resourceId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <NotFound />;

  return <div>{/* Render data */}</div>;
}
```

### 2. Formulaire avec Validation

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { resourceAPI } from '@/lib/api/resource';
import { getErrorMessage } from '@/lib/errors';

export function ResourceForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      await resourceAPI.create(formData);
      // Success handling
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Hook Personnalisé pour API

```typescript
// hooks/useResource.ts
import { useState, useEffect } from "react";
import { resourceAPI } from "@/lib/api/resource";
import { getErrorMessage } from "@/lib/errors";
import type { Resource } from "@modele/types";

export function useResource(id: number) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResource = async () => {
      try {
        setLoading(true);
        const response = await resourceAPI.get(id);
        setResource(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadResource();
  }, [id]);

  return { resource, loading, error };
}
```

---

## 🔧 Patterns Backend

### 1. Endpoint CRUD Standard

```python
# backend/app/api/v1/endpoints/resource.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.schemas.resource import ResourceResponse, ResourceCreate, ResourceUpdate
from app.services.resource_service import ResourceService

router = APIRouter(prefix="/resources", tags=["resources"])

@router.get("", response_model=list[ResourceResponse])
async def list_resources(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all resources"""
    resources = await ResourceService.list(db, skip=skip, limit=limit)
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get resource by ID"""
    resource = await ResourceService.get_by_id(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.post("", response_model=ResourceResponse, status_code=201)
async def create_resource(
    resource_data: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create new resource"""
    resource = await ResourceService.create(db, resource_data, current_user.id)
    return resource

@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    resource_data: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update resource"""
    resource = await ResourceService.update(db, resource_id, resource_data)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete resource"""
    success = await ResourceService.delete(db, resource_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
```

### 2. Service Pattern

```python
# backend/app/services/resource_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate

class ResourceService:
    @staticmethod
    async def get_by_id(db: AsyncSession, resource_id: int) -> Resource | None:
        """Get resource by ID"""
        result = await db.execute(
            select(Resource).where(Resource.id == resource_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> list[Resource]:
        """List resources with pagination"""
        result = await db.execute(
            select(Resource)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(
        db: AsyncSession,
        resource_data: ResourceCreate,
        user_id: int
    ) -> Resource:
        """Create new resource"""
        resource = Resource(**resource_data.dict(), created_by_id=user_id)
        db.add(resource)
        await db.commit()
        await db.refresh(resource)
        return resource

    @staticmethod
    async def update(
        db: AsyncSession,
        resource_id: int,
        resource_data: ResourceUpdate
    ) -> Resource | None:
        """Update resource"""
        resource = await ResourceService.get_by_id(db, resource_id)
        if not resource:
            return None

        for key, value in resource_data.dict(exclude_unset=True).items():
            setattr(resource, key, value)

        await db.commit()
        await db.refresh(resource)
        return resource

    @staticmethod
    async def delete(db: AsyncSession, resource_id: int) -> bool:
        """Delete resource"""
        resource = await ResourceService.get_by_id(db, resource_id)
        if not resource:
            return False

        await db.delete(resource)
        await db.commit()
        return True
```

### 3. Schéma Pydantic Standard

```python
# backend/app/schemas/resource.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ResourceBase(BaseModel):
    """Base schema with common fields"""
    name: str
    description: Optional[str] = None

class ResourceCreate(ResourceBase):
    """Schema for creating resource"""
    pass

class ResourceUpdate(BaseModel):
    """Schema for updating resource (all fields optional)"""
    name: Optional[str] = None
    description: Optional[str] = None

class ResourceResponse(ResourceBase):
    """Schema for resource response"""
    id: int
    created_at: datetime
    updated_at: datetime
    created_by_id: int

    class Config:
        from_attributes = True  # Pour SQLAlchemy
```

---

## 🌐 Patterns API

### 1. Client API Standardisé

```typescript
// apps/web/src/lib/api/resource.ts
import { apiClient } from "./client";
import type { Resource, ResourceCreate, ResourceUpdate } from "@modele/types";

export const resourceAPI = {
  // List
  list: (params?: { skip?: number; limit?: number; search?: string }) =>
    apiClient.get<Resource[]>("/v1/resources", { params }),

  // Get by ID
  get: (id: number) => apiClient.get<Resource>(`/v1/resources/${id}`),

  // Create
  create: (data: ResourceCreate) =>
    apiClient.post<Resource>("/v1/resources", data),

  // Update
  update: (id: number, data: ResourceUpdate) =>
    apiClient.put<Resource>(`/v1/resources/${id}`, data),

  // Delete
  delete: (id: number) => apiClient.delete(`/v1/resources/${id}`),
};
```

### 2. Gestion des Erreurs API

```typescript
// apps/web/src/lib/errors.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  // Axios error
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { detail?: string } } };
    return axiosError.response?.data?.detail || "An error occurred";
  }

  return "An unknown error occurred";
}
```

---

## 🗄️ Patterns Database

### 1. Modèle SQLAlchemy Standard

```python
# backend/app/models/resource.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    created_by = relationship("User", back_populates="resources")
```

### 2. Migration Alembic Standard

```python
# backend/alembic/versions/xxxx_create_resources.py
"""create resources table

Revision ID: xxxx
Revises: yyyy
Create Date: 2025-01-27
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'resources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id']),
    )
    op.create_index(op.f('ix_resources_id'), 'resources', ['id'], unique=False)
    op.create_index(op.f('ix_resources_name'), 'resources', ['name'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_resources_name'), table_name='resources')
    op.drop_index(op.f('ix_resources_id'), table_name='resources')
    op.drop_table('resources')
```

---

## ⚠️ Patterns Error Handling

### Frontend

```typescript
try {
  const response = await resourceAPI.get(id);
  setData(response.data);
} catch (err) {
  const errorMessage = getErrorMessage(err);
  setError(errorMessage);
  logger.error("Failed to load resource", { error: err, id });

  // Optionnel: notification utilisateur
  toast.error(errorMessage);
}
```

### Backend

```python
from fastapi import HTTPException

# Erreur 404
if not resource:
    raise HTTPException(
        status_code=404,
        detail="Resource not found"
    )

# Erreur 403 (Permission)
if resource.created_by_id != current_user.id:
    raise HTTPException(
        status_code=403,
        detail="Not authorized to access this resource"
    )

# Erreur 400 (Validation)
if not resource_data.name:
    raise HTTPException(
        status_code=400,
        detail="Name is required"
    )
```

---

## 🔐 Patterns Authentication

### Frontend: Protected Route

```typescript
// components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return <>{children}</>;
}
```

### Backend: Dependency Auth

```python
# backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.core.security import verify_token
from app.models.user import User
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

security = HTTPBearer()

async def get_current_user(
    token: str = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    payload = verify_token(token.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user = await db.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

---

## 📝 Checklist pour Nouveau Pattern

Quand vous créez un nouveau pattern:

- [ ] Documenter le pattern dans ce fichier
- [ ] Fournir un exemple complet et fonctionnel
- [ ] Expliquer quand l'utiliser
- [ ] Lister les alternatives considérées
- [ ] Mettre à jour les fichiers de référence

---

**Dernière mise à jour**: 2025-01-27
