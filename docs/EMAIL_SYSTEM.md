# 📧 Système d'Emails Transactionnels

## Vue d'ensemble

Le système d'emails transactionnels utilise **SendGrid** pour envoyer des emails professionnels. Tous les emails sont traités en arrière-plan via **Celery** pour une meilleure performance et éviter de bloquer les requêtes API.

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│   FastAPI   │
│   Backend   │
└──────┬──────┘
       │ Queue Task
       ▼
┌─────────────┐
│   Celery    │
│   Worker    │
└──────┬──────┘
       │ API Call
       ▼
┌─────────────┐
│  SendGrid   │
│   Service   │
└─────────────┘
```

## Composants

### 1. Backend Service (`email_service.py`)

Service principal pour l'envoi d'emails via SendGrid.

**Localisation**: `backend/app/services/email_service.py`

**Méthodes principales**:

- `send_email()` - Envoi générique d'email
- `send_welcome_email()` - Email de bienvenue
- `send_password_reset_email()` - Réinitialisation de mot de passe
- `send_verification_email()` - Vérification d'email
- `send_invoice_email()` - Facture
- `send_subscription_created_email()` - Abonnement créé
- `send_subscription_cancelled_email()` - Abonnement annulé
- `send_trial_ending_email()` - Fin d'essai

### 2. Templates (`email_templates.py`)

Templates HTML professionnels pour tous les types d'emails.

**Localisation**: `backend/app/services/email_templates.py`

**Caractéristiques**:

- Design responsive
- Version HTML et texte
- Variables dynamiques
- Support dark mode

### 3. Celery Tasks (`email_tasks.py`)

Tâches asynchrones pour l'envoi d'emails.

**Localisation**: `backend/app/tasks/email_tasks.py`

**Avantages**:

- Traitement asynchrone
- Retry automatique avec backoff exponentiel
- Non-bloquant pour les requêtes API

### 4. API Endpoints (`email.py`)

Endpoints REST pour envoyer des emails.

**Localisation**: `backend/app/api/email.py`

**Endpoints**:

- `POST /api/email/welcome`
- `POST /api/email/invoice`
- `POST /api/email/subscription/created`
- `POST /api/email/subscription/cancelled`
- `POST /api/email/trial/ending`
- `POST /api/email/test`
- `GET /api/email/health`

### 5. Frontend Client (`client.ts`)

Client TypeScript pour l'API email.

**Localisation**: `apps/web/src/lib/email/client.ts`

**Méthodes**:

- `emailAPI.sendWelcome()`
- `emailAPI.sendInvoice()`
- `emailAPI.sendSubscriptionCreated()`
- etc.

### 6. React Hook (`useEmail.ts`)

Hook React pour faciliter l'utilisation.

**Localisation**: `apps/web/src/hooks/useEmail.ts`

**Fonctionnalités**:

- État de chargement
- Gestion des erreurs
- Notifications toast

## Configuration

### Variables d'environnement

```env
# Backend (.env)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=MODELE
FRONTEND_URL=http://localhost:3000

# Redis pour Celery
REDIS_URL=redis://localhost:6379/0
```

### Démarrer Celery Worker

```bash
# Local
celery -A app.celery_app worker --loglevel=info

# Docker Compose (déjà configuré)
docker-compose up celery_worker
```

## Utilisation

### Backend (Python)

```python
from app.tasks.email_tasks import send_welcome_email_task

# Asynchrone (recommandé)
task = send_welcome_email_task.delay("user@example.com", "John Doe")

# Synchrone (pour tests)
result = send_welcome_email_task("user@example.com", "John Doe")
```

### Frontend (TypeScript)

```typescript
import { useEmail } from "@/hooks/useEmail";

const { sendWelcomeEmail, loading } = useEmail();
await sendWelcomeEmail("user@example.com", "John Doe");
```

### API REST

```bash
curl -X POST http://localhost:8000/api/email/welcome \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to_email": "user@example.com"}'
```

## Templates Disponibles

1. **Welcome** - Email de bienvenue
2. **Password Reset** - Réinitialisation de mot de passe
3. **Email Verification** - Vérification d'email
4. **Invoice** - Facture avec détails
5. **Subscription Created** - Confirmation d'abonnement
6. **Subscription Cancelled** - Annulation d'abonnement
7. **Trial Ending** - Rappel de fin d'essai

## Monitoring

### Health Check

```bash
GET /api/email/health
```

### Logs Celery

```bash
celery -A app.celery_app worker --loglevel=debug
```

## Dépannage

### Email non envoyé

1. Vérifiez `SENDGRID_API_KEY` dans `.env`
2. Vérifiez que Celery worker est démarré
3. Vérifiez les logs Celery
4. Vérifiez le dashboard SendGrid

### Email dans spam

1. Vérifiez votre domaine dans SendGrid
2. Configurez SPF/DKIM/DMARC
3. Utilisez un email vérifié comme `from_email`

## Documentation Complète

Pour plus de détails, consultez [SENDGRID_SETUP.md](./SENDGRID_SETUP.md)

---

_Document créé le 2025-01-27_
