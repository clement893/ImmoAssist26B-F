# 📚 Exemples d'Utilisation

Guide complet avec des exemples pratiques pour utiliser le template.

---

## 🎨 Composants UI

### Formulaire Complet

```tsx
"use client";

import { useState } from "react";
import { Button, Card, Input, Select, Checkbox } from "@/components/ui";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    newsletter: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Traitement du formulaire
    console.log(formData);
  };

  return (
    <Card title="Contactez-nous" className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nom"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="votre@email.com"
          required
        />

        <Select
          label="Pays"
          options={[
            { label: "France", value: "fr" },
            { label: "Belgique", value: "be" },
            { label: "Suisse", value: "ch" },
          ]}
          value={formData.country}
          onChange={(e) =>
            setFormData({ ...formData, country: e.target.value })
          }
          placeholder="Sélectionnez un pays"
        />

        <Checkbox
          label="S'abonner à la newsletter"
          checked={formData.newsletter}
          onChange={(e) =>
            setFormData({ ...formData, newsletter: e.target.checked })
          }
        />

        <Button type="submit" variant="primary" fullWidth>
          Envoyer
        </Button>
      </form>
    </Card>
  );
}
```

### Tableau de Données

```tsx
"use client";

import { DataTable } from "@/components/ui";
import { Column } from "@/components/ui/DataTable";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  { key: "name", label: "Nom", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "role", label: "Rôle" },
];

export default function UsersTable() {
  const users: User[] = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "User" },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      pagination
      pageSize={10}
      onRowClick={(user) => console.log("Clicked:", user)}
    />
  );
}
```

---

## 🔐 Authentification

### Page de Connexion

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError("Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card title="Connexion" className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 text-danger-700 rounded">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Se connecter
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

### Route Protégée

```tsx
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div>
        <h1>Tableau de bord</h1>
        <p>Bienvenue, {user?.email}!</p>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 💳 Billing & Stripe

### Page d'Abonnement

```tsx
"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);

    try {
      const response = await fetch("/api/v1/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: "free", name: "Gratuit", price: 0 },
    { id: "pro", name: "Pro", price: 29 },
    { id: "enterprise", name: "Enterprise", price: 99 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} title={plan.name} hover>
          <div className="text-3xl font-bold mb-4">
            ${plan.price}
            <span className="text-sm font-normal">/mois</span>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleSubscribe(plan.id)}
            loading={loading}
          >
            S'abonner
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

---

## 📊 Analytics

### Dashboard Analytics

```tsx
"use client";

import { useEffect, useState } from "react";
import { AnalyticsDashboard, Chart } from "@/components/analytics";

export default function AnalyticsPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Charger les données
    fetch("/api/v1/analytics")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsDashboard />

      <Chart
        data={data}
        type="line"
        title="Évolution des ventes"
        xKey="date"
        yKey="value"
      />
    </div>
  );
}
```

---

## 🔧 API Backend

### Créer un Endpoint

```python
# backend/app/api/v1/endpoints/my_feature.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limit import rate_limit_decorator
from app.models.user import User
from app.schemas.my_feature import MyFeatureCreate, MyFeatureResponse

router = APIRouter()

@router.post("/my-endpoint", response_model=MyFeatureResponse)
@rate_limit_decorator("100/hour")
async def create_feature(
    data: MyFeatureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new feature.

    Requires authentication and is rate-limited to 100 requests per hour.
    """
    # Logique métier
    return {"message": "Feature created", "data": data}
```

### Middleware Personnalisé

```python
# backend/app/core/my_middleware.py
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class MyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Avant la requête
        print(f"Request: {request.method} {request.url}")

        response = await call_next(request)

        # Après la requête
        response.headers["X-Custom-Header"] = "value"

        return response
```

---

## 🌍 Internationalisation

### Utiliser les Traductions

```tsx
"use client";

import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <div>
      <LanguageSwitcher />
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

---

## 🎯 Hooks Personnalisés

### Hook pour les Données

```tsx
// apps/web/src/hooks/useData.ts
import { useState, useEffect } from "react";

export function useData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}

// Utilisation
const { data, loading, error } = useData<User[]>("/api/v1/users");
```

---

## 🧪 Tests

### Test de Composant

```tsx
// apps/web/src/components/ui/__tests__/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Button from "../Button";

describe("Button", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📝 Plus d'Exemples

Pour plus d'exemples, consultez :

- [Component Showcase](/components) - Tous les composants en action
- [Storybook](http://localhost:6006) - Documentation interactive
- [API Documentation](http://localhost:8000/docs) - Documentation Swagger
