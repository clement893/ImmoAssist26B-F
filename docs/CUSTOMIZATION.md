# 🎨 Guide de Personnalisation

Guide complet pour personnaliser le template selon vos besoins.

---

## 📋 Table des Matières

- [Personnalisation du Thème](#personnalisation-du-thème)
- [Ajout de Fonctionnalités](#ajout-de-fonctionnalités)
- [Modification de la Structure](#modification-de-la-structure)
- [Configuration des Services](#configuration-des-services)
- [Personnalisation des Composants](#personnalisation-des-composants)

---

## 🎨 Personnalisation du Thème

### Changer les Couleurs

Le thème utilise des variables CSS. Modifiez `apps/web/src/app/globals.css` :

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... autres couleurs */
}
```

### Changer les Polices

Modifiez `apps/web/src/app/layout.tsx` :

```tsx
import { Inter } from "next/font/google";

const customFont = Inter({
  subsets: ["latin"],
  variable: "--font-custom",
});
```

### Utiliser un Thème Personnalisé

Voir [Theme Management Guide](./THEME_MANAGEMENT.md) et [Theme Setup](./THEME_SETUP.md) pour la documentation complète du système de thème.

---

## ➕ Ajout de Fonctionnalités

### Ajouter un Composant

```bash
pnpm generate:component MonComposant
```

Cela crée :

- `apps/web/src/components/ui/MonComposant.tsx`
- `apps/web/src/components/ui/MonComposant.test.tsx`
- `apps/web/src/components/ui/MonComposant.stories.tsx`

### Ajouter une Page

```bash
pnpm generate:page ma-page
```

Cela crée :

- `apps/web/src/app/ma-page/page.tsx`

### Ajouter une Route API

```bash
pnpm generate:api ma-route
```

Cela crée :

- `backend/app/api/v1/endpoints/ma_route.py`
- `backend/app/schemas/ma_route.py`

---

## 🏗️ Modification de la Structure

### Ajouter un Nouveau Package

1. Créer le dossier dans `packages/`
2. Ajouter `package.json`
3. Mettre à jour `pnpm-workspace.yaml`

### Modifier la Structure des Dossiers

Le template est flexible. Vous pouvez :

- Réorganiser les composants
- Créer de nouveaux dossiers
- Modifier la structure selon vos besoins

---

## ⚙️ Configuration des Services

### SendGrid

Voir [docs/SENDGRID_SETUP.md](./SENDGRID_SETUP.md)

### Stripe

Voir [docs/STRIPE_SETUP.md](./STRIPE_SETUP.md)

### Autres Services

Pour ajouter d'autres services (S3, etc.) :

1. Installer le package
2. Créer un service dans `backend/app/services/`
3. Ajouter les variables d'environnement
4. Documenter l'utilisation

---

## 🧩 Personnalisation des Composants

### Modifier un Composant Existant

Les composants sont dans `apps/web/src/components/ui/`. Vous pouvez :

- Modifier directement les composants
- Créer des variantes
- Étendre les fonctionnalités

### Créer des Composants Personnalisés

```tsx
// apps/web/src/components/custom/MonComposant.tsx
import { Button } from "@/components/ui";

export function MonComposant() {
  return (
    <div>
      <Button>Mon Bouton</Button>
    </div>
  );
}
```

---

## 📝 Exemples de Personnalisation

### Exemple 1 : Changer les Couleurs Principales

```css
/* apps/web/src/app/globals.css */
:root {
  --primary: 142.1 76.2% 36.3%; /* Vert au lieu de bleu */
}
```

### Exemple 2 : Ajouter une Page Personnalisée

```tsx
// apps/web/src/app/mon-app/page.tsx
export default function MonApp() {
  return (
    <div>
      <h1>Ma Page Personnalisée</h1>
    </div>
  );
}
```

### Exemple 3 : Créer un Service Personnalisé

```python
# backend/app/services/mon_service.py
from typing import Dict

class MonService:
    @staticmethod
    async def ma_methode() -> Dict:
        return {"message": "Hello"}
```

---

## 🔄 Migration depuis le Template

Voir [Guide de Migration](./MIGRATION_GUIDE.md) pour transformer le template en votre projet.

---

## 📚 Ressources

- [Documentation des Composants](./COMPONENTS.md)
- [Guide de Développement](./DEVELOPMENT.md)
- [Exemples SaaS](../apps/web/src/app/examples/README.md)

---

**Bon développement ! 🚀**
