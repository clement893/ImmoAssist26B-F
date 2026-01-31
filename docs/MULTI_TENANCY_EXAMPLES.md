# Multi-Tenancy Examples

**Date**: 2025-01-25  
**Feature**: Complete Examples for Multi-Tenancy Implementation

---

## 📋 Overview

This document provides complete, working examples of how to implement multi-tenancy in your endpoints.

---

## 🎯 Example 1: Basic List Endpoint

### Before (Without Tenancy)

```python
@router.get("/items", response_model=List[ItemSchema])
async def list_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Item).where(Item.user_id == current_user.id)
    result = await db.execute(query)
    return result.scalars().all()
```

### After (With Tenancy)

```python
from app.core.tenancy_helpers import apply_tenant_scope

@router.get("/items", response_model=List[ItemSchema])
async def list_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(get_tenant_scope)  # Optional: gets tenant from user
):
    query = select(Item).where(Item.user_id == current_user.id)

    # Apply tenant scoping (only if tenancy enabled and tenant set)
    query = apply_tenant_scope(query, Item)

    result = await db.execute(query)
    return result.scalars().all()
```

**What changed:**

- Added `get_tenant_scope` dependency (optional)
- Added `apply_tenant_scope()` call
- Works in both single and multi-tenant modes

---

## 🎯 Example 2: Create Endpoint with Tenant Assignment

### Before (Without Tenancy)

```python
@router.post("/items", response_model=ItemSchema)
async def create_item(
    item_data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = Item(**item_data.dict(), user_id=current_user.id)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
```

### After (With Tenancy)

```python
from app.core.tenancy import TenancyConfig
from app.core.tenancy_helpers import get_tenant_id_for_user

@router.post("/items", response_model=ItemSchema)
async def create_item(
    item_data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = Item(**item_data.dict(), user_id=current_user.id)

    # Assign tenant if tenancy is enabled and model has team_id
    if TenancyConfig.is_enabled() and hasattr(Item, 'team_id'):
        tenant_id = await get_tenant_id_for_user(current_user.id, db)
        if tenant_id:
            item.team_id = tenant_id

    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
```

**What changed:**

- Check if tenancy is enabled
- Get tenant ID for user
- Assign `team_id` if available

---

## 🎯 Example 3: Update Endpoint with Tenant Validation

### Before (Without Tenancy)

```python
@router.put("/items/{item_id}", response_model=ItemSchema)
async def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Item).where(
            Item.id == item_id,
            Item.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update item...
    return item
```

### After (With Tenancy)

```python
from app.core.tenancy_helpers import ensure_tenant_scope

@router.put("/items/{item_id}", response_model=ItemSchema)
async def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(require_tenant)  # Required tenant
):
    query = select(Item).where(
        Item.id == item_id,
        Item.user_id == current_user.id
    )

    # Ensure tenant scoping (raises error if no tenant)
    query = ensure_tenant_scope(query, Item)

    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update item...
    return item
```

**What changed:**

- Use `require_tenant` dependency to ensure tenant is set
- Use `ensure_tenant_scope()` to validate tenant access
- Automatically filters by tenant, ensuring user can only update their tenant's items

---

## 🎯 Example 4: Admin Endpoint (No Tenant Scoping)

### Admin endpoints should NOT apply tenant scoping

```python
from app.dependencies import require_superadmin

@router.get("/admin/items", response_model=List[ItemSchema])
async def admin_list_items(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_superadmin)  # Admin only
):
    # Don't apply tenant scoping - admin can see all items
    query = select(Item)
    result = await db.execute(query)
    return result.scalars().all()
```

**Key point:** Admin endpoints intentionally skip tenant scoping to allow cross-tenant access.

---

## 🎯 Example 5: Complex Query with Joins

### Before (Without Tenancy)

```python
@router.get("/projects/{project_id}/tasks", response_model=List[TaskSchema])
async def get_project_tasks(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Task).join(Project).where(
        Project.id == project_id,
        Project.user_id == current_user.id
    )
    result = await db.execute(query)
    return result.scalars().all()
```

### After (With Tenancy)

```python
from app.core.tenancy_helpers import apply_tenant_scope

@router.get("/projects/{project_id}/tasks", response_model=List[TaskSchema])
async def get_project_tasks(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(get_tenant_scope)
):
    # First, scope the Project query
    project_query = select(Project).where(
        Project.id == project_id,
        Project.user_id == current_user.id
    )
    project_query = apply_tenant_scope(project_query, Project)

    # Then scope the Task query
    query = select(Task).join(Project).where(
        Project.id == project_id,
        Project.user_id == current_user.id
    )
    query = apply_tenant_scope(query, Task)

    result = await db.execute(query)
    return result.scalars().all()
```

**What changed:**

- Apply tenant scoping to both Project and Task queries
- Ensures both entities belong to the same tenant

---

## 🎯 Example 6: Separate Database Mode

### When using separate_db mode, use TenantDatabaseManager

```python
from app.core.tenant_database_manager import TenantDatabaseManager
from app.dependencies import require_tenant

@router.get("/items", response_model=List[ItemSchema])
async def list_items(
    tenant_id: int = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    # In separate_db mode, use tenant-specific database
    if TenantDatabaseManager.is_enabled():
        async for tenant_db in TenantDatabaseManager.get_tenant_db(tenant_id):
            query = select(Item)
            result = await tenant_db.execute(query)
            return result.scalars().all()
    else:
        # Fallback to shared_db mode
        query = select(Item)
        query = apply_tenant_scope(query, Item)
        result = await db.execute(query)
        return result.scalars().all()
```

**Key point:** In `separate_db` mode, each tenant has its own database connection.

---

## 🎯 Example 7: Using Decorator for Tenant Context

### Using @with_tenant_context decorator

```python
from app.core.tenancy_helpers import with_tenant_context

@with_tenant_context()
async def process_tenant_data(tenant_id: int, db: AsyncSession):
    # tenant_id is automatically set in context
    query = apply_tenant_scope(select(Item), Item)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/items")
async def get_items(
    tenant_id: int = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    return await process_tenant_data(tenant_id, db)
```

**Key point:** Decorator automatically manages tenant context for the function.

---

## 🎯 Example 8: Conditional Tenant Assignment on Create

### Smart tenant assignment based on context

```python
from app.core.tenancy import TenancyConfig, get_current_tenant
from app.core.tenancy_helpers import get_tenant_id_for_user

@router.post("/items", response_model=ItemSchema)
async def create_item(
    item_data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(get_tenant_scope)
):
    item = Item(**item_data.dict(), user_id=current_user.id)

    # Assign tenant if:
    # 1. Tenancy is enabled
    # 2. Model has team_id attribute
    # 3. Tenant is available (from context or user)
    if TenancyConfig.is_enabled() and hasattr(Item, 'team_id'):
        # Use tenant from context if available, otherwise get from user
        assigned_tenant_id = tenant_id or await get_tenant_id_for_user(current_user.id, db)
        if assigned_tenant_id:
            item.team_id = assigned_tenant_id

    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
```

**Key point:** Flexible tenant assignment that works in all scenarios.

---

## 🔒 Security Best Practices

### Always validate tenant access

```python
@router.get("/items/{item_id}")
async def get_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    tenant_id: int = Depends(require_tenant)
):
    query = select(Item).where(Item.id == item_id)

    # This ensures user can only access items from their tenant
    query = ensure_tenant_scope(query, Item)

    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item
```

### Never skip tenant scoping for user-facing endpoints

```python
# ❌ BAD - No tenant scoping
@router.get("/items")
async def list_items(db: AsyncSession = Depends(get_db)):
    query = select(Item)  # Returns ALL items from ALL tenants!
    result = await db.execute(query)
    return result.scalars().all()

# ✅ GOOD - With tenant scoping
@router.get("/items")
async def list_items(
    db: AsyncSession = Depends(get_db),
    tenant_id: Optional[int] = Depends(get_tenant_scope)
):
    query = select(Item)
    query = apply_tenant_scope(query, Item)  # Only returns tenant's items
    result = await db.execute(query)
    return result.scalars().all()
```

---

## 📚 Summary

### Quick Reference

1. **List endpoints**: Use `apply_tenant_scope()`
2. **Create endpoints**: Assign `team_id` if tenancy enabled
3. **Update/Delete endpoints**: Use `ensure_tenant_scope()`
4. **Admin endpoints**: Skip tenant scoping
5. **Separate DB mode**: Use `TenantDatabaseManager.get_tenant_db()`

### Dependencies

- `get_tenant_scope()` - Optional tenant (from user or header)
- `require_tenant()` - Required tenant (raises error if missing)

### Helper Functions

- `apply_tenant_scope()` - Apply scoping (optional)
- `ensure_tenant_scope()` - Apply scoping (required)
- `get_tenant_id_for_user()` - Get tenant for user

---

**Last Updated**: 2025-01-25
