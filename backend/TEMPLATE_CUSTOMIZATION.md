# Template Customization Guide

**Purpose**: Guide for customizing this backend template for your specific needs

---

## 🎯 Overview

This guide helps you customize the backend template to fit your application's requirements. The backend is designed to be modular and easily customizable.

---

## 📋 Table of Contents

1. [Quick Customization Checklist](#quick-customization-checklist)
2. [Common Customizations](#common-customizations)
3. [Adding New Features](#adding-new-features)
4. [Removing Unused Features](#removing-unused-features)
5. [Configuration Examples](#configuration-examples)
6. [Database Customization](#database-customization)
7. [API Customization](#api-customization)
8. [Security Customization](#security-customization)

---

## ✅ Quick Customization Checklist

### Step 1: Basic Configuration

- [ ] Update `PROJECT_NAME` in `app/core/config.py`
- [ ] Set `SECRET_KEY` (generate new one)
- [ ] Configure `DATABASE_URL`
- [ ] Set `CORS_ORIGINS` / `FRONTEND_URL`
- [ ] Configure `ENVIRONMENT` (development/production)

### Step 2: Feature Selection

- [ ] Enable/disable features via environment variables
- [ ] Configure Stripe (if using payments)
- [ ] Configure SendGrid (if using email)
- [ ] Configure S3 (if using file storage)
- [ ] Configure OAuth providers (if using OAuth)

### Step 3: Customization

- [ ] Customize user model (add fields)
- [ ] Customize authentication flow
- [ ] Add custom endpoints
- [ ] Customize error messages
- [ ] Add custom business logic

---

## 🔧 Common Customizations

### 1. Change Project Name

**File**: `backend/app/core/config.py`

```python
PROJECT_NAME: str = Field(
    default=os.getenv("PROJECT_NAME", "Your App Name"),  # Change this
    description="Project name"
)
```

**Or use environment variable**:

```bash
PROJECT_NAME="Your App Name"
```

---

### 2. Add Custom User Fields

**File**: `backend/app/models/user.py`

```python
# Add custom fields to User model
class User(Base):
    # ... existing fields ...

    # Add your custom fields
    company_name = Column(String(200), nullable=True)
    phone_number = Column(String(20), nullable=True)
    custom_field = Column(String(100), nullable=True)
```

**Create migration**:

```bash
cd backend
alembic revision --autogenerate -m "add_custom_user_fields"
alembic upgrade head
```

**Update schemas**: `backend/app/schemas/user.py`

```python
class UserCreate(BaseModel):
    # ... existing fields ...
    company_name: Optional[str] = None
    phone_number: Optional[str] = None
```

---

### 3. Customize Authentication

**Change token expiration**:

**File**: `backend/app/core/config.py` or environment variables:

```bash
ACCESS_TOKEN_EXPIRE_MINUTES=30  # Default: 15
REFRESH_TOKEN_EXPIRE_DAYS=60    # Default: 30
```

**Add custom authentication logic**:

**File**: `backend/app/api/v1/endpoints/auth.py`

```python
# Customize login logic
async def login(...):
    # Add your custom logic here
    # e.g., check IP, device fingerprinting, etc.
    pass
```

---

### 4. Add Custom Endpoints

**Create new endpoint file**:

**File**: `backend/app/api/v1/endpoints/custom.py`

```python
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/custom-endpoint")
async def custom_endpoint(
    current_user: User = Depends(get_current_user)
):
    """Your custom endpoint"""
    return {"message": "Custom endpoint", "user_id": current_user.id}
```

**Register in router**:

**File**: `backend/app/api/v1/router.py`

```python
from app.api.v1.endpoints import custom

api_router.include_router(custom.router, prefix="/custom", tags=["custom"])
```

---

### 5. Customize Error Messages

**File**: `backend/app/core/error_handler.py`

```python
# Customize error messages
error_response = {
    "success": False,
    "error": {
        "code": "CUSTOM_ERROR",
        "message": "Your custom error message",  # Customize here
    },
}
```

**Or create custom exceptions**:

**File**: `backend/app/core/exceptions.py`

```python
class CustomException(AppException):
    """Your custom exception"""
    status_code = 400
    message = "Your custom error message"
```

---

### 6. Add Custom Business Logic

**Create new service**:

**File**: `backend/app/services/custom_service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

class CustomService:
    """Your custom service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def custom_method(self, param: str):
        """Your custom business logic"""
        logger.info(f"Custom method called with: {param}")
        # Your logic here
        return {"result": "success"}
```

**Use in endpoint**:

```python
from app.services.custom_service import CustomService

@router.get("/endpoint")
async def endpoint(
    db: AsyncSession = Depends(get_db)
):
    service = CustomService(db)
    result = await service.custom_method("param")
    return result
```

---

## 🆕 Adding New Features

### 1. Add New Model

**File**: `backend/app/models/custom_model.py`

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base

class CustomModel(Base):
    __tablename__ = "custom_table"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**Create migration**:

```bash
alembic revision --autogenerate -m "add_custom_model"
alembic upgrade head
```

---

### 2. Add New API Endpoint

See [Add Custom Endpoints](#4-add-custom-endpoints) above.

---

### 3. Add New Service

See [Add Custom Business Logic](#6-add-custom-business-logic) above.

---

## 🗑️ Removing Unused Features

### 1. Remove Unused Models

1. **Delete model file**: `backend/app/models/unused_model.py`
2. **Remove imports**: Search for imports of the model
3. **Create migration**: Remove table
   ```bash
   alembic revision -m "remove_unused_model"
   # Edit migration file to drop table
   alembic upgrade head
   ```

### 2. Remove Unused Endpoints

1. **Delete endpoint file**: `backend/app/api/v1/endpoints/unused.py`
2. **Remove from router**: `backend/app/api/v1/router.py`
3. **Remove related services**: If not used elsewhere

### 3. Disable Features via Configuration

**Environment variables**:

```bash
# Disable features
DISABLE_CSRF=true
DISABLE_RATE_LIMITING=true
DISABLE_2FA=true
```

---

## ⚙️ Configuration Examples

### Development Configuration

**File**: `.env.development`

```env
# Project
PROJECT_NAME=My App (Dev)
ENVIRONMENT=development
DEBUG=True

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mydb_dev

# Security
SECRET_KEY=dev-secret-key-min-32-characters-long
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=90

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Features
DISABLE_CSRF=true  # Easier for development
DISABLE_RATE_LIMITING=true  # Easier for development

# Optional Services (can be disabled)
# STRIPE_SECRET_KEY=
# SENDGRID_API_KEY=
# REDIS_URL=
```

---

### Production Configuration

**File**: `.env.production`

```env
# Project
PROJECT_NAME=My App
ENVIRONMENT=production
DEBUG=False

# Database
DATABASE_URL=postgresql+asyncpg://user:password@db.example.com:5432/mydb

# Security
SECRET_KEY=<generate-strong-secret-key-min-32-chars>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
ALGORITHM=HS256

# CORS
CORS_ORIGINS=https://app.example.com,https://www.example.com
FRONTEND_URL=https://app.example.com

# Features (all enabled in production)
DISABLE_CSRF=false
DISABLE_RATE_LIMITING=false

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (if using SendGrid)
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@example.com

# Redis (if using caching)
REDIS_URL=redis://redis.example.com:6379/0

# S3 (if using file storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=my-bucket

# OAuth (if using)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

### Minimal Configuration (No External Services)

**File**: `.env.minimal`

```env
# Project
PROJECT_NAME=My App
ENVIRONMENT=development

# Database (required)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mydb

# Security (required)
SECRET_KEY=your-secret-key-min-32-characters-long

# CORS (required)
FRONTEND_URL=http://localhost:3000

# Disable optional features
DISABLE_RATE_LIMITING=true  # No Redis needed
# No Stripe, SendGrid, S3, etc.
```

---

## 🗄️ Database Customization

### 1. Add Custom Tables

See [Add New Model](#1-add-new-model) above.

### 2. Modify Existing Tables

**Example**: Add column to users table

1. **Modify model**: `backend/app/models/user.py`
2. **Create migration**: `alembic revision --autogenerate -m "add_column"`
3. **Review migration**: Check generated migration file
4. **Apply**: `alembic upgrade head`

### 3. Custom Indexes

**File**: `backend/app/core/database_indexes.py`

```python
# Add custom indexes
async def create_custom_indexes(session: AsyncSession):
    # Your custom index creation logic
    pass
```

---

## 🔌 API Customization

### 1. Change API Version

**File**: `backend/app/core/config.py`

```python
API_V1_STR: str = "/api/v2"  # Change version
```

**Update router**: `backend/app/api/v1/router.py` (or rename to v2)

### 2. Customize Response Format

**File**: `backend/app/core/error_handler.py`

```python
# Customize error response format
error_response = {
    "error": True,  # Your custom format
    "message": "...",
    "code": "...",
}
```

### 3. Add Custom Middleware

**File**: `backend/app/core/custom_middleware.py`

```python
from starlette.middleware.base import BaseHTTPMiddleware

class CustomMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Your custom logic
        response = await call_next(request)
        return response
```

**Register in main**: `backend/app/main.py`

```python
app.add_middleware(CustomMiddleware)
```

---

## 🔐 Security Customization

### 1. Customize Password Requirements

**File**: `backend/app/core/security.py`

```python
def validate_password(password: str) -> bool:
    """Custom password validation"""
    # Add your custom rules
    if len(password) < 12:  # Custom minimum length
        return False
    # Add more rules...
    return True
```

### 2. Customize Rate Limiting

**File**: `backend/app/core/rate_limit.py`

```python
# Customize rate limits
rate_limits = {
    "/api/v1/auth/login": "10/minute",  # Custom limit
    "/api/v1/users": "100/hour",
}
```

### 3. Add Custom Security Headers

**File**: `backend/app/main.py`

```python
# Add custom headers in security middleware
response.headers["X-Custom-Header"] = "value"
```

---

## 📝 Best Practices

### 1. Keep It Modular

- ✅ Add features as separate modules
- ✅ Use services for business logic
- ✅ Keep endpoints thin

### 2. Follow Existing Patterns

- ✅ Use existing error handling patterns
- ✅ Follow existing logging patterns
- ✅ Use existing dependency injection

### 3. Test Your Changes

- ✅ Write tests for new features
- ✅ Test migrations
- ✅ Test API endpoints

### 4. Document Your Changes

- ✅ Update API documentation
- ✅ Add docstrings to new code
- ✅ Update README if needed

---

## 🚀 Quick Start Customization

### Minimal Customization (5 minutes)

1. **Update project name**:

   ```bash
   export PROJECT_NAME="Your App"
   ```

2. **Set secret key**:

   ```bash
   export SECRET_KEY="$(openssl rand -hex 32)"
   ```

3. **Configure database**:

   ```bash
   export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db"
   ```

4. **Set frontend URL**:

   ```bash
   export FRONTEND_URL="http://localhost:3000"
   ```

5. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

**Done!** Your backend is customized.

---

## 📚 Additional Resources

- [API Endpoints Documentation](./API_ENDPOINTS.md)
- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [Testing Guide](./README_TESTING.md)
- [Main README](./README.md)

---

## 🆘 Need Help?

1. Check existing code examples in the codebase
2. Review similar implementations
3. Check FastAPI documentation: https://fastapi.tiangolo.com/
4. Check SQLAlchemy documentation: https://docs.sqlalchemy.org/

---

**Happy Customizing! 🚀**
