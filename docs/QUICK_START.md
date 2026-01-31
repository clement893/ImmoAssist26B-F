# ⚡ Démarrage Rapide en 5 Minutes

Guide ultra-rapide pour démarrer avec le template en moins de 5 minutes.

---

## 🚀 Installation Express

### 1. Cloner et Setup (2 minutes)

```bash
# Cloner le template
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git mon-projet
cd mon-projet

# Configuration automatique
pnpm setup
```

Le script `setup` vous demande :

- ✅ Nom du projet
- ✅ Configuration de la base de données
- ✅ Génération automatique des secrets

### 2. Installer les Dépendances (1 minute)

```bash
pnpm install
```

### 3. Créer la Base de Données (30 secondes)

```bash
# Créer la base de données (remplacer par le nom de votre projet)
createdb mon_projet_db

# Appliquer les migrations
cd backend && alembic upgrade head && cd ..
```

### 4. Démarrer le Projet (30 secondes)

```bash
pnpm dev:full
```

### 5. Vérifier (30 secondes)

```bash
# Dans un autre terminal
pnpm post-install
```

**C'est tout ! 🎉**

Accédez à :

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🎯 Prochaines Étapes

1. **Personnaliser le projet**

   ```bash
   pnpm rename
   ```

2. **Ajouter vos fonctionnalités**

   ```bash
   pnpm generate:component MonComposant
   pnpm generate:page ma-page
   ```

3. **Configurer les services** (optionnel)
   - SendGrid pour les emails
   - Stripe pour les paiements

---

## 💡 Exemples d'Utilisation

### Créer une Page avec Composants

```tsx
// apps/web/src/app/examples/page.tsx
import { Button, Card, Input, DataTable } from "@/components/ui";

export default function ExamplesPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Exemples de Composants</h1>

        {/* Formulaire */}
        <form className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            helperText="Minimum 8 caractères"
          />
          <Button type="submit" variant="primary">
            Se connecter
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

### Utiliser les Composants de Billing

```tsx
// apps/web/src/app/billing/page.tsx
import { BillingDashboard, InvoiceList } from "@/components/billing";

export default function BillingPage() {
  return (
    <div>
      <BillingDashboard />
      <InvoiceList />
    </div>
  );
}
```

### Créer une API Route

```python
# backend/app/api/v1/endpoints/my_feature.py
from fastapi import APIRouter, Depends
from app.core.rate_limit import rate_limit_decorator
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.get("/my-endpoint")
@rate_limit_decorator("100/hour")
async def my_endpoint(db: AsyncSession = Depends(get_db)):
    """Mon endpoint personnalisé"""
    return {"message": "Hello World"}
```

### Utiliser l'Authentification

```tsx
// apps/web/src/app/dashboard/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <ProtectedRoute>
      <div>
        <h1>Bienvenue, {user?.email}!</h1>
      </div>
    </ProtectedRoute>
  );
}
```

### Intégrer Stripe

```tsx
// apps/web/src/app/subscribe/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    const stripe = await stripePromise;

    const response = await fetch("/api/v1/billing/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "premium" }),
    });

    const { sessionId } = await response.json();
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <Button onClick={handleSubscribe} loading={loading}>
      S'abonner
    </Button>
  );
}
```

### Utiliser les Composants d'Analytics

```tsx
// apps/web/src/app/analytics/page.tsx
import { AnalyticsDashboard, Chart } from "@/components/analytics";

export default function AnalyticsPage() {
  const data = [
    { date: "2025-01-01", value: 100 },
    { date: "2025-01-02", value: 150 },
    { date: "2025-01-03", value: 200 },
  ];

  return (
    <div>
      <AnalyticsDashboard />
      <Chart data={data} type="line" title="Évolution des ventes" />
    </div>
  );
}
```

### Gérer les Erreurs

```tsx
// apps/web/src/app/error.tsx
"use client";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { ErrorDisplay } from "@/components/errors/ErrorDisplay";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorBoundary>
      <ErrorDisplay
        error={error}
        onRetry={reset}
        title="Une erreur est survenue"
      />
    </ErrorBoundary>
  );
}
```

---

## 🆘 Problèmes ?

### "pnpm: command not found"

```bash
npm install -g pnpm
```

### "Database connection failed"

```bash
# Vérifier que PostgreSQL est démarré
psql -U postgres

# Créer la base de données
createdb votre_db
```

### "Port already in use"

```bash
# Changer les ports dans .env
FRONTEND_URL=http://localhost:3001
```

---

## 📚 Documentation Complète

- [Guide de Démarrage Complet](../GETTING_STARTED.md)
- [Guide de Développement](./DEVELOPMENT.md)
- [Guide de Déploiement](../DEPLOYMENT.md)

---

**Temps total : ~5 minutes ⏱️**
