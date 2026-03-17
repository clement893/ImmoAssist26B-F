# 🚀 Guide de Déploiement

Guide complet pour déployer le template en production.

---

## 📋 Table des Matières

- [Préparation](#préparation)
- [Déploiement avec Docker](#déploiement-avec-docker)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [Déploiement sur Railway](#déploiement-sur-railway)
- [Déploiement sur AWS](#déploiement-sur-aws)
- [Configuration Production](#configuration-production)

---

## 🔧 Préparation

### 1. Variables d'Environnement

Générer tous les secrets nécessaires :

```bash
# SECRET_KEY (Backend)
python -c 'import secrets; print(secrets.token_urlsafe(32))'

# NEXTAUTH_SECRET (Frontend)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Base de Données

Créer une base de données PostgreSQL de production.

### 3. Migrations

Appliquer les migrations :

```bash
cd backend
alembic upgrade head
```

---

## 🐳 Déploiement avec Docker

### Build et Run

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Start
docker-compose -f docker-compose.prod.yml up -d
```

### Variables d'Environnement

Créer un fichier `.env.production` :

```env
ENVIRONMENT=production
PROJECT_NAME=YourAppName
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
SECRET_KEY=your-generated-secret-key
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-generated-secret
```

---

## ▲ Déploiement sur Vercel (Frontend)

### 1. Configuration

1. Connecter votre dépôt GitHub à Vercel
2. Sélectionner le projet `apps/web`
3. Configurer les variables d'environnement

### 2. Variables Requises

- `NEXT_PUBLIC_API_URL` - URL de l'API backend
- `NEXT_PUBLIC_APP_URL` - URL de l'application
- `NEXTAUTH_URL` - URL de base pour NextAuth
- `NEXTAUTH_SECRET` - Secret NextAuth
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth (optionnel)
- `GOOGLE_CLIENT_SECRET` - Google OAuth Secret (optionnel)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe (optionnel)

### 3. Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm build --filter=@modele/web`
- **Output Directory**: `.next`

---

## 🚂 Déploiement sur Railway (Backend)

### 1. Configuration

1. Connecter votre dépôt GitHub à Railway
2. Créer un nouveau projet
3. Ajouter PostgreSQL et Redis (optionnel)

### 2. Variables Requises

- `ENVIRONMENT=production`
- `PROJECT_NAME` - Nom de votre application
- `DATABASE_URL` - URL PostgreSQL (générée automatiquement par Railway)
- `SECRET_KEY` - Secret généré
- `FRONTEND_URL` - URL du frontend
- `SENDGRID_API_KEY` - SendGrid (optionnel)
- `STRIPE_SECRET_KEY` - Stripe (optionnel)

### 3. Build Settings

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## ☁️ Déploiement sur AWS

### Option 1: ECS Fargate

1. Build les images Docker
2. Push vers ECR
3. Créer les services ECS
4. Configurer ALB

### Option 2: Elastic Beanstalk

1. Package l'application
2. Déployer via EB CLI
3. Configurer les variables d'environnement

---

## 🔒 Configuration Production

### Sécurité

- ✅ HTTPS uniquement
- ✅ Headers de sécurité configurés
- ✅ CORS restreint
- ✅ Rate limiting activé
- ✅ Secrets sécurisés

### Performance

- ✅ CDN pour les assets statiques
- ✅ Cache Redis configuré
- ✅ Compression activée
- ✅ Monitoring configuré

### Monitoring

- ✅ Logs centralisés
- ✅ Alertes configurées
- ✅ Health checks

---

## 📚 Ressources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [AWS Documentation](https://aws.amazon.com/documentation/)
- [Docker Documentation](https://docs.docker.com/)

---

**Pour plus d'informations, voir [Guide de Sécurité](./SECURITY.md)**
