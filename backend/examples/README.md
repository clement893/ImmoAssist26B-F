# Configuration Examples

This directory contains example environment configuration files for different scenarios.

## 📁 Available Examples

### 1. `env.development.example`

**Use for**: Local development

**Features**:

- Longer token expiration (easier testing)
- CSRF and rate limiting disabled (easier development)
- All optional services can be configured
- Debug logging enabled

**Copy to**: `.env` in backend root

---

### 2. `env.production.example`

**Use for**: Production deployment

**Features**:

- Short token expiration (security)
- All security features enabled
- Production-ready settings
- Security checklist included

**Copy to**: Set as environment variables in your hosting platform

---

### 3. `env.minimal.example`

**Use for**: Minimal setup (no external services)

**Features**:

- Only PostgreSQL required
- No Redis, Stripe, SendGrid, S3, etc.
- Perfect for testing or simple apps
- All optional features gracefully disabled

**Copy to**: `.env` in backend root

---

### 4. `env.testing.example`

**Use for**: Running tests

**Features**:

- In-memory SQLite database
- All security features disabled
- Mocked external services
- Optimized for test execution

**Copy to**: `.env.test` or set as environment variables for tests

---

## 🚀 Quick Start

### For Development

```bash
# Copy development example
cp examples/env.development.example .env

# Edit .env and set:
# - PROJECT_NAME
# - DATABASE_URL
# - SECRET_KEY
# - FRONTEND_URL
```

### For Production

```bash
# Copy production example
cp examples/env.production.example .env

# Edit .env and set ALL production values
# ⚠️ Use strong secrets!
```

### For Minimal Setup

```bash
# Copy minimal example
cp examples/env.minimal.example .env

# Edit .env and set:
# - DATABASE_URL
# - SECRET_KEY
# - FRONTEND_URL
```

---

## 📝 Usage Instructions

1. **Copy the example file** that matches your needs
2. **Rename to `.env`** (or set as environment variables)
3. **Edit the values** - at minimum set:
   - `PROJECT_NAME`
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `FRONTEND_URL`
4. **Start the server** - it will use your `.env` file

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - they contain secrets
2. **Generate strong SECRET_KEY** - use `openssl rand -hex 32`
3. **Use test keys in development** - never use production keys locally
4. **All optional services** can be omitted if not used
5. **Database is required** - PostgreSQL must be configured

---

## 🔐 Security Checklist (Production)

When using `env.production.example`:

- [ ] Strong SECRET_KEY (32+ random characters)
- [ ] HTTPS URLs only in CORS_ORIGINS
- [ ] Production database with SSL
- [ ] Production Stripe keys (not test keys)
- [ ] Strong passwords for all services
- [ ] CSRF and rate limiting enabled
- [ ] DEBUG=False
- [ ] ENVIRONMENT=production
- [ ] All secrets stored securely
- [ ] Regular secret rotation

---

## 📚 Related Documentation

- [Quick Start Guide](../TEMPLATE_QUICK_START.md)
- [Template Customization Guide](../TEMPLATE_CUSTOMIZATION.md)
- [Main README](../README.md)

---

**Need help?** Check the [Quick Start Guide](../TEMPLATE_QUICK_START.md) for step-by-step instructions.
