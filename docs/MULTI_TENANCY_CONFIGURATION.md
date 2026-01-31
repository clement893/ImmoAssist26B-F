# Multi-Tenancy Configuration Guide

**Date**: 2025-01-25  
**Feature**: Multi-Tenancy Support (Optional)

---

## 📋 Overview

The multi-tenancy system allows you to run your application in different modes:

- **Single Tenant** (default): One database, no filtering
- **Shared Database**: One database with `team_id` filtering
- **Separate Databases**: One database per tenant

All tenancy features are **optional** and can be easily enabled/disabled via configuration.

---

## ⚙️ Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Tenancy Mode (required)
# Options: single, shared_db, separate_db
TENANCY_MODE=single

# For separate_db mode only
TENANT_DB_REGISTRY_URL=postgresql://user:pass@host:5432/registry_db
TENANT_DB_BASE_URL=postgresql://user:pass@host:5432
```

### Modes Explained

#### 1. Single Tenant (`TENANCY_MODE=single`)

**Default mode** - No multi-tenancy support.

- ✅ Single database
- ✅ No filtering by tenant
- ✅ No `team_id` columns added
- ✅ Best for single-organization deployments

**Use when**: You're building a SaaS for a single organization or don't need multi-tenancy.

#### 2. Shared Database (`TENANCY_MODE=shared_db`)

Multi-tenancy with shared database.

- ✅ One database for all tenants
- ✅ Data filtered by `team_id` column
- ✅ Automatic query scoping
- ✅ Good performance, easier management

**Use when**: You want multi-tenancy but prefer simpler database management.

**Requirements**:

- All models must use `TenantMixin`
- Migration will add `team_id` columns
- Queries automatically filtered by tenant

#### 3. Separate Databases (`TENANCY_MODE=separate_db`)

Multi-tenancy with separate databases.

- ✅ One database per tenant
- ✅ Maximum isolation
- ✅ Independent scaling
- ✅ Easier backup/restore per tenant

**Use when**: You need maximum data isolation or compliance requirements.

**Requirements**:

- `TENANT_DB_REGISTRY_URL` - Database for tenant registry
- `TENANT_DB_BASE_URL` - Base URL for tenant databases
- Automatic provisioning of new tenant databases

---

## 🚀 Quick Start

### Enable Multi-Tenancy (Shared DB)

1. **Set environment variable**:

   ```bash
   TENANCY_MODE=shared_db
   ```

2. **Run migration**:

   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Restart application**

### Enable Multi-Tenancy (Separate DB)

1. **Set environment variables**:

   ```bash
   TENANCY_MODE=separate_db
   TENANT_DB_REGISTRY_URL=postgresql://user:pass@host:5432/registry_db
   TENANT_DB_BASE_URL=postgresql://user:pass@host:5432
   ```

2. **Create registry database**:

   ```bash
   createdb registry_db
   ```

3. **Run migration**:

   ```bash
   cd backend
   alembic upgrade head
   ```

4. **Restart application**

### Disable Multi-Tenancy

1. **Set environment variable**:

   ```bash
   TENANCY_MODE=single
   ```

2. **Restart application**

   **Note**: Existing `team_id` columns remain but are not used. You can remove them with a migration if desired.

---

## 📝 Using TenantMixin

To make a model tenant-aware, use the `TenantMixin`:

```python
from app.core.mixins import TenantMixin
from app.core.database import Base
from sqlalchemy import Column, Integer, String

class Project(TenantMixin, Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    # team_id is automatically added if tenancy is enabled
```

**Important**:

- In `single` mode: `team_id` is **not** added
- In `shared_db` or `separate_db` mode: `team_id` is **automatically** added

---

## 🔧 Migration

The migration `014_add_tenancy_support.py` is **conditional**:

- If `TENANCY_MODE=single`: Migration does nothing
- If `TENANCY_MODE=shared_db` or `separate_db`: Migration adds `team_id` columns

**To run migration**:

```bash
cd backend
alembic upgrade head
```

**To rollback**:

```bash
cd backend
alembic downgrade -1
```

---

## 🧪 Testing

### Test Configuration

```python
from app.core.tenancy import TenancyConfig, TenancyMode

# Check current mode
assert TenancyConfig.get_mode() == TenancyMode.SINGLE
assert TenancyConfig.is_enabled() == False

# In shared_db mode
assert TenancyConfig.is_shared_db_mode() == True
assert TenancyConfig.is_enabled() == True
```

### Test TenantMixin

```python
from app.core.mixins import TenantMixin
from app.core.database import Base

class TestModel(TenantMixin, Base):
    __tablename__ = "test_model"
    id = Column(Integer, primary_key=True)

# In single mode
assert not hasattr(TestModel, 'team_id')

# In shared_db mode (after setting TENANCY_MODE)
assert hasattr(TestModel, 'team_id')
```

---

## 🗑️ Removing Tenancy

If you don't need multi-tenancy, you can easily remove it:

1. **Set mode to single**:

   ```bash
   TENANCY_MODE=single
   ```

2. **Remove team_id columns** (optional):

   ```bash
   cd backend
   alembic downgrade -1  # Rollback tenancy migration
   ```

3. **Remove imports** (if any):
   - Remove `TenantMixin` from models
   - Remove tenancy-related imports

4. **Restart application**

See `docs/MULTI_TENANCY_REMOVAL.md` for detailed removal guide.

---

## 📚 Additional Documentation

- `MULTI_TENANCY_GUIDE.md` - Complete user guide
- `MULTI_TENANCY_MIGRATION.md` - Migration guide
- `MULTI_TENANCY_REMOVAL.md` - Removal guide
- `MULTI_TENANCY_SECURITY.md` - Security best practices

---

## ❓ Troubleshooting

### Migration doesn't run

**Problem**: Migration doesn't add `team_id` columns

**Solution**: Check that `TENANCY_MODE` is set correctly:

```bash
echo $TENANCY_MODE  # Should be 'shared_db' or 'separate_db'
```

### TenantMixin doesn't add team_id

**Problem**: `TenantMixin` doesn't add `team_id` in code

**Solution**:

1. Check `TENANCY_MODE` environment variable
2. Restart Python process (config is cached)
3. Verify `TenancyConfig.is_enabled()` returns `True`

### Import errors

**Problem**: `ImportError: cannot import name 'TenancyConfig'`

**Solution**: Ensure `backend/app/core/tenancy.py` exists and is in Python path

---

## 🔒 Security Notes

- **Isolation**: In `separate_db` mode, tenants are completely isolated
- **Filtering**: In `shared_db` mode, always use `TenantMixin` and query scoping
- **Validation**: Always validate tenant access in endpoints
- **Permissions**: Use RBAC to control tenant access

---

**Last Updated**: 2025-01-25
