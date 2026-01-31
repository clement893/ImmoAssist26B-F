# Gestion des Thèmes Globaux

Ce document décrit le système de gestion des thèmes globaux pour la plateforme. Les thèmes sont configurés par le superadmin ou les développeurs et s'appliquent à tous les utilisateurs de la plateforme.

## Architecture

### Backend (FastAPI)

#### Modèle de données (`app/models/theme.py`)

Le modèle `Theme` stocke les configurations de thème :

- `id` : Identifiant unique
- `name` : Nom unique du thème (identifiant technique)
- `display_name` : Nom d'affichage
- `description` : Description optionnelle
- `config` : Configuration JSON contenant les variables CSS et paramètres du thème
- `is_active` : Indique si le thème est actif (un seul thème peut être actif à la fois)
- `created_by` : ID de l'utilisateur qui a créé le thème
- `created_at` / `updated_at` : Timestamps

#### Endpoints API

**Public (sans authentification) :**

- `GET /api/v1/themes/active` - Récupère le thème actif

**Admin (requiert authentification superadmin) :**

- `GET /api/v1/themes` - Liste tous les thèmes
- `GET /api/v1/themes/{theme_id}` - Récupère un thème spécifique
- `POST /api/v1/themes` - Crée un nouveau thème
- `PUT /api/v1/themes/{theme_id}` - Met à jour un thème
- `POST /api/v1/themes/{theme_id}/activate` - Active un thème
- `DELETE /api/v1/themes/{theme_id}` - Supprime un thème

### Frontend (Next.js)

#### Types TypeScript (`packages/types/src/theme.ts`)

Types partagés pour la gestion des thèmes, synchronisés avec les schémas Pydantic du backend.

#### Service API (`apps/web/src/lib/api/theme.ts`)

Fonctions client pour interagir avec l'API backend :

- `getActiveTheme()` - Récupère le thème actif (public)
- `listThemes()` - Liste tous les thèmes (admin)
- `createTheme()` - Crée un thème (admin)
- `updateTheme()` - Met à jour un thème (admin)
- `activateTheme()` - Active un thème (admin)
- `deleteTheme()` - Supprime un thème (admin)

#### Provider Global (`apps/web/src/lib/theme/global-theme-provider.tsx`)

Le `GlobalThemeProvider` :

1. Charge automatiquement le thème actif au démarrage
2. Applique les variables CSS du thème au document root
3. Rafraîchit le thème toutes les 5 minutes
4. Fournit un hook `useGlobalTheme()` pour accéder au thème

#### Interface Admin (`apps/web/src/components/admin/themes/ThemeManager.tsx`)

Composant React pour gérer les thèmes :

- Liste tous les thèmes
- Crée de nouveaux thèmes
- Modifie les thèmes existants
- Active/désactive des thèmes
- Supprime des thèmes

## Utilisation

### 1. Configuration de la base de données

Exécutez la migration Alembic pour créer la table `themes` :

```bash
cd backend
alembic upgrade head
```

### 2. Intégration dans l'application Next.js

Enveloppez votre application avec le `GlobalThemeProvider` dans votre layout principal :

```tsx
// app/layout.tsx
import { GlobalThemeProvider } from "@/lib/theme/global-theme-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GlobalThemeProvider>{children}</GlobalThemeProvider>
      </body>
    </html>
  );
}
```

### 3. Utilisation du thème dans les composants

Les variables CSS du thème sont automatiquement appliquées au document root. Utilisez-les dans vos styles :

```css
/* styles/globals.css */
.my-component {
  background-color: var(--color-background);
  color: var(--color-text);
  border-color: var(--color-border);
}
```

### 4. Création d'un thème via l'interface admin

1. Accédez à la page de gestion des thèmes (nécessite authentification superadmin)
2. Cliquez sur "Create New Theme"
3. Remplissez le formulaire :
   - **Theme Name** : Identifiant technique (ex: `dark-blue`)
   - **Display Name** : Nom d'affichage (ex: `Dark Blue Theme`)
   - **Description** : Description optionnelle
   - **Configuration** : JSON contenant les variables CSS

### 5. Format de configuration JSON

Exemple de configuration de thème :

```json
{
  "color": {
    "background": "#ffffff",
    "foreground": "#000000",
    "primary": "#0070f3",
    "secondary": "#6b7280",
    "accent": "#f59e0b",
    "border": "#e5e7eb"
  },
  "spacing": {
    "unit": "8px"
  },
  "typography": {
    "font-family": "Inter, sans-serif",
    "font-size": {
      "base": "16px",
      "sm": "14px",
      "lg": "18px"
    }
  }
}
```

Cette configuration sera convertie en variables CSS :

- `--color-background`
- `--color-foreground`
- `--color-primary`
- `--spacing-unit`
- `--typography-font-family`
- etc.

### 6. Activation d'un thème

Pour activer un thème pour tous les utilisateurs :

1. Dans l'interface admin, cliquez sur "Activate" sur le thème souhaité
2. Le thème sera immédiatement appliqué à tous les utilisateurs
3. Les utilisateurs verront le nouveau thème au prochain rafraîchissement (automatique toutes les 5 minutes)

## Sécurité

- Seuls les superadmins peuvent créer, modifier, activer ou supprimer des thèmes
- L'endpoint `/api/v1/themes/active` est public pour permettre le chargement du thème sans authentification
- Les autres endpoints nécessitent un token JWT valide avec le rôle superadmin

## Migration

Pour créer la table `themes` dans votre base de données :

```bash
cd backend
alembic revision --autogenerate -m "Create themes table"
alembic upgrade head
```

## Exemple d'utilisation complète

```typescript
// Dans un composant admin
import { ThemeManager } from '@/components/admin/themes/ThemeManager';

export default function AdminThemesPage() {
  const { token } = useAuth(); // Votre hook d'authentification

  return (
    <div>
      <h1>Theme Management</h1>
      <ThemeManager authToken={token} />
    </div>
  );
}
```

## Notes importantes

1. **Un seul thème actif** : Seul un thème peut être actif à la fois. L'activation d'un nouveau thème désactive automatiquement l'ancien.

2. **Suppression** : Vous ne pouvez pas supprimer le thème actif. Vous devez d'abord activer un autre thème.

3. **Rafraîchissement automatique** : Le `GlobalThemeProvider` rafraîchit automatiquement le thème toutes les 5 minutes. Vous pouvez également forcer un rafraîchissement avec `refreshTheme()`.

4. **Variables CSS** : Les variables CSS sont appliquées au niveau du document root, ce qui permet de les utiliser partout dans votre application.

5. **Format JSON** : La configuration doit être un JSON valide. Le formulaire valide le JSON avant la soumission.
