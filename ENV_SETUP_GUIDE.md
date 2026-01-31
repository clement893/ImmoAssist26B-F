# 🔐 Guide de Configuration des Variables d'Environnement

Ce guide explique comment configurer les variables d'environnement pour le template.

## 📋 Fichiers .env.example

Les fichiers `.env.example` sont ignorés par `.gitignore` pour des raisons de sécurité. 
Créez-les manuellement en copiant les exemples ci-dessous.

## 🚀 Configuration Rapide

### 1. Générer les Secrets

```bash
# Générer tous les secrets nécessaires
node scripts/generate-secrets.js

# Ou sauvegarder dans un fichier
node scripts/generate-secrets.js --output .env.secrets
```

### 2. Créer les Fichiers .env

#### Backend (`backend/.env.example`)

Créez `backend/.env` en copiant depuis `backend/examples/env.development.example`:

```bash
cp backend/examples/env.development.example backend/.env
```

Puis mettez à jour avec vos secrets générés.

#### Frontend (`apps/web/.env.local.example`)

Créez `apps/web/.env.local` avec ce contenu:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=<generated-secret>
JWT_ISSUER=modele-app
JWT_AUDIENCE=modele-users

# OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

#### Docker Compose (`.env` à la racine)

Créez `.env` à la racine du projet:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<generated-password>
POSTGRES_DB=modele_db

# Backend
DATABASE_URL=postgresql+asyncpg://postgres:<password>@postgres:5432/modele_db
REDIS_URL=redis://redis:6379/0
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
SECRET_KEY=<generated-secret>
```

## 📝 Variables Requises

### Backend (Minimum)

- `DATABASE_URL` - URL de connexion PostgreSQL
- `SECRET_KEY` - Clé secrète (min 32 caractères)
- `FRONTEND_URL` - URL du frontend pour CORS

### Frontend (Minimum)

- `NEXT_PUBLIC_API_URL` - URL de l'API backend
- `NEXTAUTH_SECRET` - Secret pour NextAuth
- `NEXTAUTH_URL` - URL de l'application
- `JWT_SECRET` - Secret pour JWT

## 🔒 Sécurité

1. **Ne jamais commiter** les fichiers `.env` ou `.env.local`
2. **Générer des secrets forts** avec `scripts/generate-secrets.js`
3. **Utiliser des secrets différents** pour développement et production
4. **Rotater les secrets** régulièrement en production

## 📚 Documentation Complète

- `docs/ENV_VARIABLES.md` - Documentation complète des variables
- `backend/examples/` - Exemples de configuration
- `scripts/generate-secrets.js` - Script de génération de secrets
