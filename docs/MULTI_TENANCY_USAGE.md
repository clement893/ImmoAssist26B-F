# Multi-Tenancy Usage Guide

**Date**: 2025-01-25  
**Feature**: Multi-Tenancy Usage and Query Scoping

---

## 📋 Overview

This guide explains how to use the multi-tenancy features in your endpoints and queries.

---

## 🔧 Using Query Scoping in Endpoints

### Basic Usage

Apply tenant scoping to queries using `apply_tenant_scope()`:

```python
from app.core.tenancy_helpers import apply_tenant_scope
from app.models.project import Project
from sqlalchemy import select

@router.get("/projects")
async def get_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Project).where(Project.user_id == current_user.id)

    # Apply tenant scoping (only if tenancy enabled and tenant set)
    query = apply_tenant_scope(query, Project)

    result = await db.execute(query)
    projects = result.scalars().all()
    return projects
```

### Ensuring Tenant Scope

If tenant scoping is required, use `ensure_tenant_scope()`:

```python
from app.core.tenancy_helpers import ensure_tenant_scope

@router.get("/projects")
async def get_projects(
    db: AsyncSession = Depends(get_db),
    tenant_id: int = Depends(require_tenant)  # Requires tenant
):
    query = select(Project)

    # Will raise ValueError if no tenant available
    query = ensure_tenant_scope(query, Project)

    result = await db.execute(query)
    return result.scalars().all()
```

### Using Dependencies

The easiest way is to use the `get_tenant_scope()` dependency:

```python
from app.dependencies import get_tenant_scope

@router.get("/projects")
async def get_projects(
    db: AsyncSession = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_tenant_scope)
):
    query = select(Project)

    # Tenant is automatically set in context by dependency
    query = apply_tenant_scope(query, Project)

    result = await db.execute(query)
    return result.scalars().all()
```

---

## 🎯 Tenant Context

### Setting Tenant Context

Tenant context is automatically set by:

1. `TenancyMiddleware` - extracts from `X-Tenant-ID` header or `?tenant_id=` query param
2. `get_tenant_scope()` dependency - gets from authenticated user's primary team

### Manual Context Setting

You can manually set tenant context:

```python
from app.core.tenancy import set_current_tenant, clear_current_tenant

# Set tenant
set_current_tenant(tenant_id=123)

try:
    # Your code here
    query = apply_tenant_scope(query, Project)
finally:
    # Always clear context
    clear_current_tenant()
```

### Using Decorator

Use the `@with_tenant_context` decorator:

```python
from app.core.tenancy_helpers import with_tenant_context

@with_tenant_context()
async def process_tenant_data(tenant_id: int, db: AsyncSession):
    # tenant_id is automatically set in context
    query = apply_tenant_scope(select(Project), Project)
    # ...
```

---

## 📝 Examples

### Example 1: List Endpoint with Tenant Scoping

```python
@router.get("/items", response_model=List[ItemSchema])
async def list_items(
    db: AsyncSession = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_tenant_scope)
):
    query = select(Item)

    # Apply tenant scoping
    query = apply_tenant_scope(query, Item)

    # Add other filters
    query = query.where(Item.is_active == True)
    query = query.order_by(Item.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()
```

### Example 2: Create Endpoint with Tenant Assignment

```python
@router.post("/items", response_model=ItemSchema)
async def create_item(
    item_data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: int = Depends(require_tenant)
):
    # Create item
    item = Item(**item_data.dict())

    # Assign tenant if model has team_id
    if hasattr(Item, 'team_id') and TenancyConfig.is_enabled():
        item.team_id = tenant_id

    db.add(item)
    await db.commit()
    await db.refresh(item)

    return item
```

### Example 3: Update Endpoint with Tenant Validation

```python
@router.put("/items/{item_id}", response_model=ItemSchema)
async def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: int = Depends(require_tenant)
):
    # Get item with tenant scoping
    query = select(Item).where(Item.id == item_id)
    query = ensure_tenant_scope(query, Item)

    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update item
    for field, value in item_data.dict(exclude_unset=True).items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)

    return item
```

---

## 🔒 Security Best Practices

### Always Validate Tenant Access

```python
@router.get("/items/{item_id}")
async def get_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    tenant_id: int = Depends(require_tenant)
):
    # Query with tenant scoping ensures user can only access their tenant's data
    query = select(Item).where(Item.id == item_id)
    query = ensure_tenant_scope(query, Item)

    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item
```

### Admin Endpoints

For admin endpoints that need to access all tenants:

```python
@router.get("/admin/items")
async def admin_list_items(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_superadmin)
):
    # Don't apply tenant scoping for admin queries
    query = select(Item)

    # Admin can see all items
    result = await db.execute(query)
    return result.scalars().all()
```

---

## 🗄️ Separate Database Mode

When `TENANCY_MODE=separate_db`, each tenant has its own database.

### Getting Tenant Database Session

```python
from app.core.tenant_database_manager import TenantDatabaseManager

@router.get("/items")
async def get_items(
    tenant_id: int = Depends(require_tenant)
):
    # Get tenant-specific database session
    async for db in TenantDatabaseManager.get_tenant_db(tenant_id):
        query = select(Item)
        result = await db.execute(query)
        return result.scalars().all()
```

### Creating Tenant Database

```python
from app.core.tenant_database_manager import TenantDatabaseManager

# Create database for tenant
await TenantDatabaseManager.create_tenant_database(tenant_id=123)

# Run migrations
await TenantDatabaseManager.run_migrations(tenant_id=123)
```

---

## 📚 Helper Functions Reference

### `apply_tenant_scope(query, model_class, tenant_id=None)`

Apply tenant scoping to a query. Returns query unchanged if:

- Tenancy is disabled
- No tenant is set
- Model doesn't have `team_id` attribute

### `ensure_tenant_scope(query, model_class, tenant_id=None)`

Apply tenant scoping and raise error if no tenant available.

### `get_tenant_id_for_user(user_id, db, fallback_to_context=True)`

Get tenant ID for a user, with optional fallback to context.

### `tenant_aware_query(model_class, tenant_id=None)`

Create a function that applies tenant scoping to queries.

### `@with_tenant_context(tenant_id=None)`

Decorator to set tenant context for a function.

---

## ❓ Troubleshooting

### Query returns all data (no filtering)

**Problem**: Tenant scoping not applied

**Solution**:

1. Check that `TENANCY_MODE` is not `single`
2. Verify tenant is set in context (use `get_current_tenant()`)
3. Ensure model uses `TenantMixin`
4. Call `apply_tenant_scope()` on query

### ValueError: Tenant context required

**Problem**: `ensure_tenant_scope()` called but no tenant available

**Solution**:

1. Use `get_tenant_scope()` dependency
2. Set `X-Tenant-ID` header
3. Ensure user has a team membership

### Model doesn't have team_id

**Problem**: Model not using `TenantMixin`

**Solution**:

```python
from app.core.mixins import TenantMixin

class MyModel(TenantMixin, Base):
    __tablename__ = "my_model"
    # team_id is automatically added if tenancy enabled
```

---

**Last Updated**: 2025-01-25
