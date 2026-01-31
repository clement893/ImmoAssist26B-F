# 🗄️ Database Tables: Creation & Updates Guide

**Complete guide for template users on how database tables are created and updated.**

---

## 🎯 Quick Answer

**Database tables are created and updated using Alembic migrations:**

1. **Modify Models** → Edit SQLAlchemy models in `backend/app/models/`
2. **Create Migration** → Run `pnpm migrate create MigrationName`
3. **Review & Test** → Check migration file, test locally
4. **Deploy** → Migrations run **automatically** on Railway deployment
5. **Verify** → Check `/db/test` page to verify database health

---

## 📋 How It Works

### The Migration System

This template uses **Alembic** (SQLAlchemy's migration tool) to manage database schema changes:

```
┌─────────────────┐
│  SQLAlchemy     │
│  Models         │  ← You edit these
│  (Python)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Alembic        │  ← Auto-generates migrations
│  Migrations     │
│  (SQL scripts)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  ← Applied automatically
│  Database       │
└─────────────────┘
```

### Automatic Migration Execution

**Migrations run automatically on every Railway deployment** via `backend/entrypoint.sh`:

```bash
# This runs before the server starts
alembic upgrade head
```

---

## 🚀 Step-by-Step: Creating a New Table

### Example: Adding a "Blog Posts" Feature

#### Step 1: Create the Model

Create `backend/app/models/blog_post.py`:

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class BlogPost(Base):
    """Blog post model"""
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    author = relationship("User", backref="blog_posts")
```

#### Step 2: Register the Model

Add to `backend/app/models/__init__.py`:

```python
from app.models.blog_post import BlogPost

__all__ = [
    # ... existing models ...
    "BlogPost",
]
```

#### Step 3: Import in Alembic (for autogenerate)

Add to `backend/alembic/env.py`:

```python
# Import all models here for autogenerate
from app.models import user  # noqa: F401
from app.models import blog_post  # noqa: F401  # ← Add this
```

#### Step 4: Create Migration

```bash
# From project root
pnpm migrate create AddBlogPostsTable

# Or from backend directory
cd backend
alembic revision --autogenerate -m "AddBlogPostsTable"
```

This creates a file like: `backend/alembic/versions/012_add_blog_posts_table.py`

#### Step 5: Review Migration File

Check the generated migration:

```python
"""AddBlogPostsTable

Revision ID: 012
Revises: 011
Create Date: 2025-01-27 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'blog_posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('published', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
    )
    op.create_index('ix_blog_posts_author_id', 'blog_posts', ['author_id'])

def downgrade():
    op.drop_index('ix_blog_posts_author_id', table_name='blog_posts')
    op.drop_table('blog_posts')
```

**Review and adjust if needed!**

#### Step 6: Test Locally

```bash
# Apply migration to local database
pnpm migrate upgrade

# Verify table was created
psql $DATABASE_URL -c "\d blog_posts"

# Test rollback (optional)
pnpm migrate downgrade -1
pnpm migrate upgrade  # Re-apply
```

#### Step 7: Commit and Deploy

```bash
git add backend/app/models/blog_post.py
git add backend/alembic/versions/012_add_blog_posts_table.py
git commit -m "feat: add blog posts table"
git push
```

**Railway will automatically:**

1. Deploy your code
2. Run `alembic upgrade head` (via entrypoint.sh)
3. Create the table in production
4. Start the server

#### Step 8: Verify

Visit `/db/test` page to verify the table was created successfully!

---

## 🔄 Updating Existing Tables

### Example: Adding a Column to Users Table

#### Step 1: Modify the Model

Edit `backend/app/models/user.py`:

```python
class User(Base):
    # ... existing columns ...

    # Add new column
    bio = Column(Text, nullable=True)  # ← New column
```

#### Step 2: Create Migration

```bash
pnpm migrate create AddBioToUsers
```

#### Step 3: Review Migration

```python
def upgrade():
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('users', 'bio')
```

#### Step 4: Test & Deploy

Same as creating a table - test locally, commit, push!

---

## 📝 Migration Commands Reference

### From Project Root (Recommended)

```bash
# Create migration (auto-detect changes)
pnpm migrate create MigrationName

# Create empty migration (manual)
pnpm migrate create MigrationName --no-autogenerate

# Apply all migrations
pnpm migrate upgrade

# Apply one migration
pnpm migrate upgrade +1

# Rollback one migration
pnpm migrate downgrade

# Rollback multiple
pnpm migrate downgrade -3

# Check current revision
pnpm migrate current

# View migration history
pnpm migrate history
```

### Direct Alembic Commands

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "MigrationName"

# Apply migrations
alembic upgrade head
alembic upgrade +1

# Rollback
alembic downgrade -1

# Status
alembic current
alembic history
```

---

## 🎯 Common Scenarios

### Scenario 1: Adding a New Feature with Tables

```bash
# 1. Create model file
touch backend/app/models/feature.py
# Edit the file...

# 2. Register in __init__.py
# Add import...

# 3. Import in alembic/env.py
# Add import...

# 4. Create migration
pnpm migrate create AddFeatureTables

# 5. Test locally
pnpm migrate upgrade

# 6. Commit and push
git add .
git commit -m "feat: add feature tables"
git push
```

### Scenario 2: Modifying Existing Table

```bash
# 1. Edit model file
# Modify backend/app/models/user.py

# 2. Create migration
pnpm migrate create UpdateUserTable

# 3. Review migration file
# Check backend/alembic/versions/xxx_update_user_table.py

# 4. Test
pnpm migrate upgrade
pnpm migrate downgrade -1  # Test rollback
pnpm migrate upgrade       # Re-apply

# 5. Deploy
git add .
git commit -m "feat: update user table"
git push
```

### Scenario 3: Adding Indexes

```python
# In your model
class User(Base):
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_created_at", "created_at"),
    )
```

Then create migration:

```bash
pnpm migrate create AddUserIndexes
```

### Scenario 4: Data Migration

For transforming existing data:

```python
def upgrade():
    # Add new column
    op.add_column('users', sa.Column('full_name', sa.String(), nullable=True))

    # Migrate data
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE users SET full_name = first_name || ' ' || last_name")
    )

    # Make column required (optional)
    op.alter_column('users', 'full_name', nullable=False)
```

---

## ✅ Best Practices for Template Users

### 1. Always Use Migrations

**✅ DO:**

```python
# Modify model
class User(Base):
    new_field = Column(String(100))

# Create migration
pnpm migrate create AddNewField
```

**❌ DON'T:**

```python
# Don't manually edit database
# Don't use CREATE TABLE directly in SQL
# Don't skip migrations
```

### 2. Test Migrations Locally First

```bash
# Always test before deploying
pnpm migrate upgrade
pnpm migrate downgrade -1
pnpm migrate upgrade
```

### 3. Review Generated Migrations

Alembic auto-generates migrations, but **always review them**:

```bash
# After creating migration
cat backend/alembic/versions/xxx_migration.py
```

Check for:

- Correct column types
- Proper indexes
- Foreign keys
- Default values

### 4. Use Descriptive Migration Names

**✅ Good:**

```bash
pnpm migrate create AddBlogPostsTable
pnpm migrate create AddEmailIndexToUsers
pnpm migrate create UpdateSubscriptionStatusEnum
```

**❌ Bad:**

```bash
pnpm migrate create migration1
pnpm migrate create fix
pnpm migrate create update
```

### 5. Keep Migrations Small

**✅ DO:** One feature per migration
**❌ DON'T:** Multiple unrelated changes in one migration

### 6. Never Edit Existing Migrations

**✅ DO:** Create a new migration to fix issues
**❌ DON'T:** Edit migrations that are already applied

---

## 🔍 How Migrations Run Automatically

### Railway Deployment Flow

```
1. Git Push
   ↓
2. Railway Builds
   ↓
3. Railway Runs entrypoint.sh
   ↓
4. entrypoint.sh runs: alembic upgrade head
   ↓
5. Alembic checks current revision
   ↓
6. Applies pending migrations
   ↓
7. Server starts: uvicorn app.main:app
```

### The Entrypoint Script

`backend/entrypoint.sh` contains:

```bash
# Run database migrations before starting the server
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    alembic upgrade head || echo "Warning: Migrations failed"
fi

# Start server
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**This ensures migrations always run before the server starts!**

---

## 🛠️ Troubleshooting

### Migration Not Running

**Problem:** Migrations don't run automatically

**Solution:**

1. Check `backend/entrypoint.sh` exists
2. Verify Railway uses `entrypoint.sh` (check `railway.json`)
3. Check Railway logs for migration output

### Migration Fails

**Problem:** Migration fails in production

**Solution:**

```bash
# 1. Check logs
railway logs

# 2. Rollback if needed
railway run alembic downgrade -1

# 3. Fix migration file
# Edit backend/alembic/versions/xxx_migration.py

# 4. Test locally
pnpm migrate upgrade

# 5. Redeploy
git push
```

### Database Out of Sync

**Problem:** Database schema doesn't match models

**Solution:**

```bash
# Check current revision
pnpm migrate current

# Create migration to sync
pnpm migrate create SyncSchema

# Review and apply
pnpm migrate upgrade
```

---

## 📊 Migration File Structure

Every migration file has this structure:

```python
"""Migration description

Revision ID: 012
Revises: 011
Create Date: 2025-01-27 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '012'
down_revision = '011'  # Previous migration
branch_labels = None
depends_on = None

def upgrade():
    """Apply migration - moves database forward"""
    # Your changes here
    op.create_table(...)
    op.add_column(...)
    op.create_index(...)

def downgrade():
    """Rollback migration - moves database backward"""
    # Reverse of upgrade
    op.drop_index(...)
    op.drop_column(...)
    op.drop_table(...)
```

---

## 🎓 Learning Path for Template Users

### Beginner: Basic Table Creation

1. ✅ Read this guide
2. ✅ Create a simple model (e.g., `Product`)
3. ✅ Generate migration
4. ✅ Test locally
5. ✅ Deploy and verify

### Intermediate: Complex Features

1. ✅ Multiple related tables
2. ✅ Foreign keys and relationships
3. ✅ Indexes for performance
4. ✅ Data migrations

### Advanced: Production Patterns

1. ✅ Zero-downtime migrations
2. ✅ Large table migrations
3. ✅ Migration rollback strategies
4. ✅ Database optimization

---

## 📚 Additional Resources

- **[Complete Migration Guide](./DATABASE_MIGRATIONS.md)** - Detailed Alembic documentation
- **[Database Schema Reference](./DATABASE_SCHEMA.md)** - All table structures
- **[Health Check Page](../apps/web/src/app/db/test/page.tsx)** - Visual database monitoring

---

## ✅ Quick Checklist

When adding a new table:

- [ ] Create model file in `backend/app/models/`
- [ ] Register model in `backend/app/models/__init__.py`
- [ ] Import model in `backend/alembic/env.py`
- [ ] Create migration: `pnpm migrate create MigrationName`
- [ ] Review migration file
- [ ] Test locally: `pnpm migrate upgrade`
- [ ] Test rollback: `pnpm migrate downgrade -1`
- [ ] Commit and push
- [ ] Verify on `/db/test` page

---

## 🎯 Summary

**For Template Users:**

1. **Edit Models** → SQLAlchemy models in `backend/app/models/`
2. **Create Migration** → `pnpm migrate create MigrationName`
3. **Test Locally** → `pnpm migrate upgrade`
4. **Deploy** → Git push (migrations run automatically)
5. **Verify** → Check `/db/test` page

**That's it!** The template handles the rest automatically. 🚀

---

**Last Updated**: 2025-01-27  
**Template Version**: 1.0.0
