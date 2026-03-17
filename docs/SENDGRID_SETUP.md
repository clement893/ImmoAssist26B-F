# 📧 Configuration SendGrid - Guide Complet

## 🎯 Vue d'ensemble

Le système d'emails transactionnels utilise **SendGrid** pour envoyer des emails professionnels. Tous les emails sont traités en arrière-plan via **Celery** pour une meilleure performance.

---

## ⚙️ Configuration

### 1. Créer un compte SendGrid

1. Allez sur [sendgrid.com](https://sendgrid.com)
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre domaine (recommandé pour production)

### 2. Obtenir la clé API

1. Dans le dashboard SendGrid, allez dans **Settings > API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom (ex: "MODELE Production")
4. Sélectionnez **Full Access** ou **Restricted Access** avec permissions email
5. Copiez la clé API (elle ne sera affichée qu'une seule fois !)

### 3. Configurer les variables d'environnement

Ajoutez dans votre fichier `.env` du backend :

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=MODELE
FRONTEND_URL=http://localhost:3000
```

**Important** :

- `SENDGRID_FROM_EMAIL` doit être vérifié dans SendGrid
- Pour le développement, utilisez l'email de vérification SendGrid
- Pour la production, vérifiez votre domaine

---

## 📧 Templates Disponibles

### 1. Welcome Email

Email de bienvenue pour les nouveaux utilisateurs.

**Usage** :

```python
from app.tasks.email_tasks import send_welcome_email_task

send_welcome_email_task.delay("user@example.com", "John Doe")
```

**Endpoint API** :

```bash
POST /api/email/welcome
{
  "to_email": "user@example.com"
}
```

### 2. Password Reset Email

Email de réinitialisation de mot de passe.

**Usage** :

```python
from app.tasks.email_tasks import send_password_reset_email_task

send_password_reset_email_task.delay(
    "user@example.com",
    "John Doe",
    "reset_token_123"
)
```

### 3. Email Verification

Email de vérification d'adresse email.

**Usage** :

```python
from app.tasks.email_tasks import send_verification_email_task

send_verification_email_task.delay(
    "user@example.com",
    "John Doe",
    "verification_token_123"
)
```

### 4. Invoice Email

Email de facture avec détails.

**Usage** :

```python
from app.tasks.email_tasks import send_invoice_email_task

send_invoice_email_task.delay(
    "user@example.com",
    "John Doe",
    "INV-2025-001",
    "2025-01-27",
    99.99,
    "EUR",
    "https://app.com/invoices/INV-2025-001",
    [
        {"description": "Plan Pro - Janvier", "amount": 99.99}
    ]
)
```

**Endpoint API** :

```bash
POST /api/email/invoice
{
  "to_email": "user@example.com",
  "name": "John Doe",
  "invoice_number": "INV-2025-001",
  "invoice_date": "2025-01-27",
  "amount": 99.99,
  "currency": "EUR",
  "invoice_url": "https://app.com/invoices/INV-2025-001",
  "items": [
    {"description": "Plan Pro - Janvier", "amount": 99.99}
  ]
}
```

### 5. Subscription Created

Email de confirmation d'abonnement.

**Usage** :

```python
from app.tasks.email_tasks import send_subscription_created_email_task

send_subscription_created_email_task.delay(
    "user@example.com",
    "John Doe",
    "Plan Pro",
    99.99,
    "EUR"
)
```

**Endpoint API** :

```bash
POST /api/email/subscription/created
{
  "to_email": "user@example.com",
  "name": "John Doe",
  "plan_name": "Plan Pro",
  "amount": 99.99,
  "currency": "EUR"
}
```

### 6. Subscription Cancelled

Email de confirmation d'annulation d'abonnement.

**Usage** :

```python
from app.tasks.email_tasks import send_subscription_cancelled_email_task

send_subscription_cancelled_email_task.delay(
    "user@example.com",
    "John Doe",
    "Plan Pro",
    "2025-02-27"
)
```

**Endpoint API** :

```bash
POST /api/email/subscription/cancelled
{
  "to_email": "user@example.com",
  "name": "John Doe",
  "plan_name": "Plan Pro",
  "end_date": "2025-02-27"
}
```

### 7. Trial Ending

Email d'avertissement de fin d'essai.

**Usage** :

```python
from app.tasks.email_tasks import send_trial_ending_email_task

send_trial_ending_email_task.delay(
    "user@example.com",
    "John Doe",
    3,  # jours restants
    "https://app.com/pricing"
)
```

**Endpoint API** :

```bash
POST /api/email/trial/ending
{
  "to_email": "user@example.com",
  "name": "John Doe",
  "days_remaining": 3,
  "upgrade_url": "https://app.com/pricing"
}
```

---

## 🚀 Utilisation Frontend

### Hook useEmail

```typescript
import { useEmail } from '@/hooks/useEmail';

function MyComponent() {
  const { sendWelcomeEmail, loading } = useEmail();

  const handleWelcome = async () => {
    await sendWelcomeEmail('user@example.com', 'John Doe');
  };

  return (
    <button onClick={handleWelcome} disabled={loading}>
      Envoyer email de bienvenue
    </button>
  );
}
```

### API Client Direct

```typescript
import { emailAPI } from "@/lib/email/client";

// Envoyer une facture
await emailAPI.sendInvoice({
  to_email: "user@example.com",
  name: "John Doe",
  invoice_number: "INV-2025-001",
  invoice_date: "2025-01-27",
  amount: 99.99,
  currency: "EUR",
});
```

---

## 🔧 Queue d'Emails (Celery)

Tous les emails sont envoyés via **Celery** en arrière-plan pour éviter de bloquer les requêtes API.

### Démarrer Celery Worker

```bash
# Dans le répertoire backend
celery -A app.celery_app worker --loglevel=info
```

### Avec Docker Compose

Le worker Celery est déjà configuré dans `docker-compose.yml` :

```yaml
celery_worker:
  command: celery -A app.celery_app worker --loglevel=info
```

### Vérifier les tâches

```python
from app.tasks.email_tasks import send_welcome_email_task

# Envoyer immédiatement (synchrone)
result = send_welcome_email_task("user@example.com", "John Doe")

# Envoyer en arrière-plan (asynchrone - recommandé)
task = send_welcome_email_task.delay("user@example.com", "John Doe")
print(f"Task ID: {task.id}")
```

---

## 📊 Monitoring

### Health Check

```bash
GET /api/email/health
```

Réponse :

```json
{
  "configured": true,
  "from_email": "noreply@yourdomain.com",
  "from_name": "MODELE",
  "status": "ready"
}
```

### Info API

```bash
GET /api/email/info
```

---

## 🧪 Tests

### Test Email

```bash
POST /api/email/test
{
  "to_email": "your-email@example.com"
}
```

### Test depuis le Frontend

```typescript
import { emailAPI } from "@/lib/email/client";

await emailAPI.sendTest("your-email@example.com");
```

---

## 🎨 Personnalisation des Templates

Les templates sont dans `backend/app/services/email_templates.py`.

Pour personnaliser :

1. Modifiez le template dans `EmailTemplates`
2. Les templates utilisent un design responsive
3. Support dark mode (via CSS media queries)
4. Variables disponibles : `name`, `app_name`, `frontend_url`, etc.

---

## ⚠️ Dépannage

### Email non envoyé

1. Vérifiez `SENDGRID_API_KEY` dans `.env`
2. Vérifiez que Celery worker est démarré
3. Vérifiez les logs Celery : `celery -A app.celery_app worker --loglevel=debug`
4. Vérifiez le dashboard SendGrid pour les erreurs

### Email dans spam

1. Vérifiez votre domaine dans SendGrid
2. Configurez SPF/DKIM/DMARC
3. Utilisez un email vérifié comme `from_email`

### Erreur "SendGrid not configured"

1. Vérifiez que `SENDGRID_API_KEY` est défini
2. Redémarrez le backend après modification de `.env`
3. Vérifiez que la clé API est valide

---

## 📝 Checklist de Configuration

- [ ] Compte SendGrid créé
- [ ] Clé API générée et copiée
- [ ] Variables d'environnement configurées
- [ ] Email `from_email` vérifié dans SendGrid
- [ ] Celery worker démarré
- [ ] Test email envoyé avec succès
- [ ] Domain vérifié (production)

---

## 🔗 Ressources

- [Documentation SendGrid](https://docs.sendgrid.com/)
- [SendGrid Python SDK](https://github.com/sendgrid/sendgrid-python)
- [Celery Documentation](https://docs.celeryproject.org/)

---

_Document créé le 2025-01-27_
