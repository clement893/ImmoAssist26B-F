# Backend - FastAPI

FastAPI backend with PostgreSQL database, async support, and comprehensive security features.

## 🚀 Features

### Core Technologies

- ✅ **FastAPI** - Modern, fast Python web framework
- ✅ **Python 3.11+** - Latest Python features
- ✅ **PostgreSQL** - Production-ready database
- ✅ **SQLAlchemy 2.0** - Modern async ORM
- ✅ **Alembic** - Database migrations
- ✅ **Pydantic 2.0** - Data validation and settings

### Security Features

- ✅ **JWT Authentication** - Access and refresh tokens
- ✅ **OAuth2** - Google OAuth integration
- ✅ **2FA Support** - TOTP-based two-factor authentication
- ✅ **API Keys** - Programmatic access
- ✅ **CSRF Protection** - Cross-site request forgery prevention
- ✅ **Rate Limiting** - Request throttling
- ✅ **CORS** - Configurable cross-origin resource sharing
- ✅ **Request Signing** - Optional request signature verification
- ✅ **IP Whitelisting** - Admin endpoint protection
- ✅ **Security Headers** - HSTS, CSP, XSS protection

### Performance Features

- ✅ **Async/Await** - High concurrency support
- ✅ **Connection Pooling** - Efficient database connections
- ✅ **Response Caching** - Redis-based caching
- ✅ **Query Optimization** - Eager loading, N+1 prevention
- ✅ **Compression** - Brotli and Gzip support
- ✅ **Database Indexes** - Optimized queries
- ✅ **Pagination** - Efficient data retrieval

### SaaS Features

- ✅ **User Management** - Complete user CRUD
- ✅ **Role-Based Access Control (RBAC)** - Permissions system
- ✅ **Team/Organization Support** - Multi-tenant ready
- ✅ **Subscriptions** - Stripe integration
- ✅ **Plans & Billing** - Subscription management
- ✅ **Webhooks** - Stripe webhook handling
- ✅ **Invoices** - Payment history

### Additional Features

- ✅ **Email Integration** - SendGrid support
- ✅ **File Management** - S3 integration ready
- ✅ **WebSocket Support** - Real-time communication
- ✅ **Notification System** - User notifications with database persistence
- ✅ **Theme Management** - Dynamic theme system
- ✅ **Project Management** - Project CRUD operations
- ✅ **Structured Logging** - JSON logging
- ✅ **Error Handling** - Standardized error responses
- ✅ **OpenAPI/Swagger** - Auto-generated API docs

## 📋 Prerequisites

- Python 3.11 or higher
- PostgreSQL 14+ (or compatible database)
- Redis (optional, for caching)
- pip or poetry

## 🛠️ Installation

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
# Using venv
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Variables

**Quick Setup**: Copy an example configuration file:

```bash
# For development
cp examples/env.development.example .env

# For minimal setup (no external services)
cp examples/env.minimal.example .env
```

**Then edit `.env`** and set at minimum:

- `PROJECT_NAME` - Your app name
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `FRONTEND_URL` - Your frontend URL

See [Configuration Examples](./examples/README.md) for all available options and [Template Quick Start](./TEMPLATE_QUICK_START.md) for detailed setup instructions.

### 5. Database Setup

```bash
# Run migrations
alembic upgrade head

# Seed database (optional)
python scripts/seed_db.py
```

## 🚀 Running the Server

### Development

```bash
# Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using the script
python -m app.main
```

### Production

```bash
# Using gunicorn with uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

The API will be available at:

- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── v1/                # API version 1
│   │   │   └── endpoints/     # Endpoint modules
│   │   │       ├── auth.py    # Authentication
│   │   │       ├── users.py   # User management
│   │   │       ├── projects.py # Projects
│   │   │       ├── themes.py  # Theme management
│   │   │       ├── admin.py   # Admin operations
│   │   │       └── ...
│   │   ├── email.py           # Email endpoints
│   │   └── webhooks/          # Webhook handlers
│   ├── core/                  # Core functionality
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   ├── logging.py         # Logging configuration
│   │   ├── cache.py           # Caching utilities
│   │   ├── exceptions.py      # Custom exceptions
│   │   ├── rate_limit.py     # Rate limiting
│   │   └── ...
│   ├── models/                # SQLAlchemy models
│   │   ├── user.py           # User model
│   │   ├── subscription.py   # Subscription model
│   │   ├── plan.py           # Plan model
│   │   ├── team.py           # Team model
│   │   └── ...
│   ├── schemas/               # Pydantic schemas
│   │   ├── auth.py           # Auth schemas
│   │   ├── user.py           # User schemas
│   │   └── ...
│   ├── dependencies.py        # FastAPI dependencies
│   └── main.py               # Application entry point
├── alembic/                   # Database migrations
│   └── versions/             # Migration files
├── scripts/                   # Utility scripts
├── tests/                     # Test files
├── requirements.txt           # Python dependencies
└── README.md                 # This file
```

## 🔌 API Endpoints

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete API documentation.

### Quick Reference

**Authentication:**

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/google` - Google OAuth login
- `GET /api/v1/auth/me` - Get current user

**Users:**

- `GET /api/v1/users/` - List users (paginated)
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

**Projects:**

- `GET /api/v1/projects/` - List projects
- `POST /api/v1/projects/` - Create project
- `GET /api/v1/projects/{id}` - Get project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

**Themes:**

- `GET /api/v1/themes/active` - Get active theme
- `GET /api/v1/themes/` - List themes
- `POST /api/v1/themes/` - Create theme (admin)
- `PUT /api/v1/themes/{id}` - Update theme (admin)

**Admin:**

- `POST /api/v1/admin/make-superadmin` - Make user superadmin
- `GET /api/v1/admin/stats` - System statistics

**Email:**

- `POST /api/email/send` - Send email
- `POST /api/email/welcome` - Send welcome email
- `POST /api/email/invoice` - Send invoice email

**Webhooks:**

- `POST /webhooks/stripe` - Stripe webhook handler

## 🗄️ Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete database schema documentation.

### Main Tables

- **users** - User accounts
- **roles** - Role definitions
- **user_roles** - User-role assignments
- **teams** - Teams/organizations
- **team_members** - Team membership
- **invitations** - Team invitations
- **subscriptions** - User subscriptions
- **plans** - Subscription plans
- **invoices** - Payment invoices
- **projects** - User projects
- **themes** - Theme configurations
- **files** - File metadata
- **api_keys** - API key management

## 🔐 Authentication

### JWT Tokens

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived (15 minutes by default)
   - Used for API requests
   - Contains user ID and permissions
   - Sent in `Authorization: Bearer <token>` header

2. **Refresh Token**: Long-lived (30 days by default)
   - Used to obtain new access tokens
   - Stored securely (HTTP-only cookie recommended)

### Usage Example

```python
import httpx

# Login
response = httpx.post("http://localhost:8000/api/v1/auth/login", data={
    "username": "user@example.com",
    "password": "password"
})
tokens = response.json()

# Use access token
headers = {"Authorization": f"Bearer {tokens['access_token']}"}
response = httpx.get("http://localhost:8000/api/v1/auth/me", headers=headers)
user = response.json()
```

## 🧪 Testing

### Run Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/test_auth.py

# Watch mode
pytest-watch
```

### Test Database

Tests use an in-memory SQLite database by default. Configure test database in `pytest.ini` or environment variables.

## 📊 Database Migrations

### Create Migration

```bash
# Auto-generate migration
alembic revision --autogenerate -m "description"

# Create empty migration
alembic revision -m "description"
```

### Apply Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade one version
alembic upgrade +1

# Downgrade one version
alembic downgrade -1

# Show current revision
alembic current
```

### Migration History

```bash
# Show migration history
alembic history

# Show current migration
alembic current
```

## 🔧 Configuration

### Environment Variables

All configuration is done via environment variables. See `.env.example` for all available options.

### Key Settings

- **DATABASE_URL**: PostgreSQL connection string
- **SECRET_KEY**: JWT signing key (min 32 chars)
- **CORS_ORIGINS**: Allowed CORS origins (comma-separated)
- **REDIS_URL**: Redis connection string (optional)
- **ENVIRONMENT**: `development` or `production`

## 📝 Logging

Structured JSON logging is configured by default:

```python
from app.core.logging import logger

logger.info("User created", context={"user_id": user.id})
logger.error("Database error", context={"query": query}, exc_info=exception)
```

Logs are output in JSON format for easy parsing and aggregation.

## 🚀 Deployment

### Railway

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Docker

```bash
# Build image
docker build -t modele-backend .

# Run container
docker run -p 8000:8000 --env-file .env modele-backend
```

### Manual Deployment

1. Install dependencies: `pip install -r requirements.txt`
2. Set environment variables
3. Run migrations: `alembic upgrade head`
4. Start server: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`

## 📚 Additional Documentation

### Core Documentation

- [API Endpoints](./API_ENDPOINTS.md) - Complete API reference
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure
- [Testing Guide](./README_TESTING.md) - Testing strategies and examples
- [Authentication Guide](../apps/web/AUTHENTICATION.md) - Auth setup
- [Error Handling](../apps/web/ERROR_HANDLING.md) - Error patterns

### Template Documentation

- [Template Quick Start](./TEMPLATE_QUICK_START.md) - Get started in 5 minutes
- [Template Customization Guide](./TEMPLATE_CUSTOMIZATION.md) - Customize for your needs
- [Configuration Examples](./examples/README.md) - Example environment configurations

## 🛠️ Available Scripts

```bash
# Database
alembic upgrade head          # Run migrations
alembic revision --autogenerate -m "message"  # Create migration
python scripts/seed_db.py     # Seed database

# Development
uvicorn app.main:app --reload  # Run dev server
pytest                         # Run tests
pytest --cov=app              # Test with coverage

# Production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🔍 Monitoring

### Health Check

```bash
curl http://localhost:8000/health
```

### Metrics

The API includes response time headers:

- `X-Response-Time`: Processing time
- `X-Process-Time`: Total time
- `X-Timestamp`: Response timestamp

## 🐛 Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database exists
- Check user permissions

### CORS Errors

- Verify `CORS_ORIGINS` includes frontend URL
- Check frontend is sending correct headers
- Review CORS middleware configuration

### Authentication Issues

- Verify `SECRET_KEY` is set (min 32 chars)
- Check token expiration settings
- Verify JWT algorithm matches (`HS256`)

### Rate Limiting

- Check Redis is running (if using Redis-based rate limiting)
- Review rate limit configuration
- Check `DISABLE_RATE_LIMITING` env var

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

## 📄 License

MIT

---

**Happy coding! 🚀**
