# 🌱 Seed Data Documentation

Complete guide for seeding your database with test and development data.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Running Seed Scripts](#running-seed-scripts)
3. [Seed Data Structure](#seed-data-structure)
4. [Customizing Seed Data](#customizing-seed-data)
5. [Production Considerations](#production-considerations)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Seed data helps you:

- **Develop locally** with realistic data
- **Test features** with sample data
- **Demo the application** with populated data
- **Onboard new developers** quickly

### Seed Scripts

The project includes two seed scripts:

1. **Basic Seed** (`pnpm seed`) - Minimal data for quick setup
2. **Extended Seed** (`pnpm seed:extended`) - Comprehensive data for full testing

---

## 🚀 Running Seed Scripts

### Basic Seed (Recommended for Quick Start)

```bash
# From project root
pnpm seed
```

**What it creates**:

- 2 default users (admin and regular user)
- Basic test data
- Minimal records for quick development

**Default Users**:

- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

### Extended Seed (Full Test Data)

```bash
# From project root
pnpm seed:extended
```

**What it creates**:

- Multiple users with different roles
- Teams and team members
- Subscriptions and plans
- Sample files and data
- Complete test dataset

### Direct Python Execution

```bash
# Basic seed
cd backend
python scripts/seed.py

# Extended seed
python scripts/seed_extended.py
```

---

## 📊 Seed Data Structure

### Basic Seed Data

#### Users

```python
# Admin User
{
    "email": "admin@example.com",
    "password": "admin123",
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "is_active": True,
    "is_superuser": True,
}

# Regular User
{
    "email": "user@example.com",
    "password": "user123",
    "username": "user",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": True,
    "is_superuser": False,
}
```

### Extended Seed Data

#### Users (10+ users)

- Admin users
- Regular users
- Inactive users
- Users with different roles

#### Teams

- Multiple teams
- Team memberships
- Team invitations

#### Subscriptions

- Subscription plans
- User subscriptions
- Payment history

#### Files

- Sample file uploads
- File metadata
- File associations

---

## 🎨 Customizing Seed Data

### Modifying Seed Scripts

Edit `backend/scripts/seed.py` or `backend/scripts/seed_extended.py`:

```python
async def create_users(db: AsyncSession, count: int = 10):
    """Create test users"""
    users_data = [
        {
            "email": "your-email@example.com",
            "hashed_password": pwd_context.hash("your-password"),
            "username": "your-username",
            "first_name": "Your",
            "last_name": "Name",
            "is_active": True,
            "is_superuser": False,
        },
        # Add more users...
    ]

    for user_data in users_data:
        user = User(**user_data)
        db.add(user)

    await db.commit()
```

### Creating Custom Seed Scripts

Create `backend/scripts/seed_custom.py`:

```python
#!/usr/bin/env python3
"""
Custom Seed Script
Add your custom seed data here
"""

import asyncio
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.user import User

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as db:
        # Your custom seed logic here
        print("🌱 Seeding custom data...")

        # Example: Create custom user
        custom_user = User(
            email="custom@example.com",
            hashed_password="hashed_password_here",
            username="customuser",
            first_name="Custom",
            last_name="User",
        )
        db.add(custom_user)
        await db.commit()

        print("✅ Custom seed completed!")

if __name__ == "__main__":
    asyncio.run(main())
```

Run custom seed:

```bash
cd backend
python scripts/seed_custom.py
```

---

## 🏭 Production Considerations

### ⚠️ Never Run Seed Scripts in Production

**Important**: Seed scripts are for **development only**. Never run them in production!

### Why Not in Production?

1. **Data Overwrite** - May overwrite existing data
2. **Security Risk** - Creates test accounts with known passwords
3. **Data Integrity** - May conflict with real user data
4. **Performance** - May impact production database

### Production Data Setup

For production, use:

1. **Manual Admin Creation**

   ```bash
   # Use bootstrap endpoint or script
   python backend/scripts/make_superadmin.py
   ```

2. **Database Migrations**
   - Use migrations for schema changes
   - Don't use seed scripts for production data

3. **API Endpoints**
   - Create admin users via API
   - Use proper authentication

---

## 🔄 Resetting Seed Data

### Clear and Reseed

```bash
# Option 1: Drop and recreate database
dropdb your_database
createdb your_database
pnpm migrate upgrade head
pnpm seed

# Option 2: Clear specific tables (be careful!)
psql $DATABASE_URL -c "TRUNCATE users, teams, subscriptions CASCADE;"
pnpm seed
```

### Selective Reseed

```python
# In seed script, add cleanup function
async def clear_existing_data(db: AsyncSession):
    """Clear existing seed data"""
    await db.execute(sa.text("DELETE FROM users WHERE email LIKE '%@example.com'"))
    await db.commit()
```

---

## 📝 Seed Script Examples

### Example 1: Users with Roles

```python
async def create_users_with_roles(db: AsyncSession):
    roles = ['admin', 'manager', 'user', 'viewer']

    for i, role in enumerate(roles):
        user = User(
            email=f"{role}@example.com",
            hashed_password=pwd_context.hash("password123"),
            username=role,
            first_name=role.capitalize(),
            last_name="User",
            is_active=True,
            is_superuser=(role == 'admin'),
        )
        db.add(user)

    await db.commit()
```

### Example 2: Teams with Members

```python
async def create_teams_with_members(db: AsyncSession):
    # Get users
    users = await db.execute(select(User).limit(5))
    user_list = users.scalars().all()

    # Create team
    team = Team(
        name="Development Team",
        owner_id=user_list[0].id,
    )
    db.add(team)
    await db.flush()

    # Add members
    for user in user_list[1:]:
        member = TeamMember(
            team_id=team.id,
            user_id=user.id,
            role="member",
        )
        db.add(member)

    await db.commit()
```

### Example 3: Subscriptions

```python
async def create_subscriptions(db: AsyncSession):
    # Get users
    users = await db.execute(select(User).limit(3))
    user_list = users.scalars().all()

    plans = ['free', 'pro', 'enterprise']

    for user, plan in zip(user_list, plans):
        subscription = Subscription(
            user_id=user.id,
            plan=plan,
            status='active',
            current_period_end=datetime.utcnow() + timedelta(days=30),
        )
        db.add(subscription)

    await db.commit()
```

---

## 🐛 Troubleshooting

### Seed Script Fails

**Error**: `ModuleNotFoundError` or import errors

**Solution**:

```bash
# Ensure you're in backend directory
cd backend

# Set PYTHONPATH
export PYTHONPATH=$(pwd):$PYTHONPATH

# Run seed
python scripts/seed.py
```

### Database Connection Error

**Error**: `Could not connect to database`

**Solution**:

```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check database exists
createdb your_database  # If needed
```

### Duplicate Key Errors

**Error**: `duplicate key value violates unique constraint`

**Solution**:

```bash
# Clear existing seed data
psql $DATABASE_URL -c "DELETE FROM users WHERE email LIKE '%@example.com';"

# Or drop and recreate
dropdb your_database
createdb your_database
pnpm migrate upgrade head
pnpm seed
```

### Foreign Key Violations

**Error**: `foreign key constraint fails`

**Solution**:

- Ensure migrations are applied: `pnpm migrate upgrade head`
- Check seed order (create parent records first)
- Verify relationships in models

---

## 📋 Seed Data Checklist

Before running seed:

- [ ] **Database exists** - `createdb your_database`
- [ ] **Migrations applied** - `pnpm migrate upgrade head`
- [ ] **Environment variables set** - `DATABASE_URL` configured
- [ ] **Python dependencies installed** - `pip install -r requirements.txt`
- [ ] **Not in production** - Verify you're in development

After running seed:

- [ ] **Verify data created** - Check database records
- [ ] **Test login** - Use seed user credentials
- [ ] **Check relationships** - Verify foreign keys
- [ ] **Test functionality** - Ensure app works with seed data

---

## 🔐 Security Notes

### Development Only

- ⚠️ Seed scripts create **test accounts with known passwords**
- ⚠️ Never commit seed scripts with real credentials
- ⚠️ Use seed data only in development/staging

### Password Security

Seed scripts use simple passwords for testing:

- `admin123`
- `user123`
- `password123`

**Never use these in production!**

---

## 📚 Seed Script Reference

### Available Commands

```bash
# Basic seed
pnpm seed

# Extended seed
pnpm seed:extended

# Direct Python execution
cd backend
python scripts/seed.py
python scripts/seed_extended.py
```

### Seed Script Locations

- `backend/scripts/seed.py` - Basic seed script
- `backend/scripts/seed_extended.py` - Extended seed script
- `backend/scripts/seed_plans.py` - Subscription plans seed

### Default Credentials

**Basic Seed**:

- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`

**Extended Seed**:

- Multiple users with pattern: `user{N}@example.com` / `password123`

---

## 🎯 Best Practices

1. **Use Seed Data for Development Only**
   - Never run in production
   - Use for local development and testing

2. **Keep Seed Data Realistic**
   - Use realistic data structures
   - Match production data patterns

3. **Document Seed Data**
   - Document what each seed script creates
   - List default credentials

4. **Version Control Seed Scripts**
   - Commit seed scripts to Git
   - Keep them updated with schema changes

5. **Test Seed Scripts**
   - Test after schema changes
   - Verify seed data works with migrations

---

## 📖 Additional Resources

- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Database Seeding Best Practices](https://www.prisma.io/dataguide/types/relational/seeding-your-database)

---

**Last Updated**: 2025-01-25
