# 🗄️ Quick Database Guide

**TL;DR: How database tables are created and updated in this template**

---

## 🎯 The Simple Answer

**Database tables are created/updated using migrations that run automatically on deployment.**

### Workflow:

```
1. Edit Model      → backend/app/models/your_model.py
2. Create Migration → cd backend && pnpm migrate:create MigrationName
3. Test Locally    → cd backend && pnpm migrate:upgrade
4. Push to Git     → git push
5. Auto-Deploy     → Railway runs migrations automatically
```

---

## 📝 Step-by-Step Example

### Adding a New Table

**1. Create Model File:**

```python
# backend/app/models/product.py
from sqlalchemy import Column, Integer, String, DateTime, func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    price = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**2. Register Model:**

```python
# backend/app/models/__init__.py
from app.models.product import Product
```

**3. Import in Alembic:**

```python
# backend/alembic/env.py
from app.models import product  # noqa: F401
```

**4. Create Migration:**

```bash
cd backend
pnpm migrate:create AddProductsTable
```

**5. Review & Test:**

```bash
# Check generated file
cat backend/alembic/versions/xxx_add_products_table.py

# Test locally
pnpm migrate:upgrade
```

**6. Deploy:**

```bash
git add .
git commit -m "feat: add products table"
git push
```

**✅ Done!** Railway automatically runs migrations on deployment.

---

## 🔄 Updating Existing Tables

**1. Edit Model:**

```python
# backend/app/models/user.py
class User(Base):
    # ... existing columns ...
    bio = Column(Text, nullable=True)  # ← Add this
```

**2. Create Migration:**

```bash
cd backend && pnpm migrate:create AddBioToUsers
```

**3. Deploy:**

```bash
git push
```

---

## 📋 Common Commands

```bash
# Create migration (auto-detect changes)
cd backend && pnpm migrate:create MigrationName

# Apply migrations
cd backend && pnpm migrate:upgrade

# Rollback one migration
cd backend && pnpm migrate:downgrade

# Check current status
cd backend && pnpm migrate:current

# View migration history
cd backend && pnpm migrate:history
```

---

## ✅ Key Points for Template Users

1. **Migrations run automatically** on Railway deployment (via `entrypoint.sh`)
2. **Always test locally** before deploying
3. **Review generated migrations** - Alembic is smart but not perfect
4. **Never edit applied migrations** - Create new ones instead
5. **Use descriptive names** - `AddProductsTable` not `migration1`

---

## 🔍 Verify Database Health

Visit `/db/test` page to check:

- ✅ All tables exist
- ✅ Table structures are correct
- ✅ Data integrity
- ✅ Statistics

---

## 📚 Full Documentation

For detailed information, see:

- **[Complete Template Guide](./docs/DATABASE_TEMPLATE_GUIDE.md)** - Step-by-step with examples
- **[Migration Guide](./docs/DATABASE_MIGRATIONS.md)** - Advanced migration patterns
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - All table structures

---

**That's it!** The template handles migrations automatically. Just edit models, create migrations, and push! 🚀
