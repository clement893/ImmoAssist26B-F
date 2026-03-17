# 🛠️ Utilitaires

Documentation complète des fonctions utilitaires disponibles dans le projet.

---

## 📚 Table des Matières

- [Theme Utilities](#theme-utilities)
- [Performance Utilities](#performance-utilities)
- [API Utilities](#api-utilities)
- [Type Utilities](#type-utilities)

---

## 🎨 Theme Utilities

### `hexToRgb`

Convertit une couleur hexadécimale en RGB.

**Localisation** : `@/components/theme/utils`

**Signature** :

```typescript
function hexToRgb(hex: string): { r: number; g: number; b: number } | null;
```

**Utilisation** :

```tsx
import { hexToRgb } from "@/components/theme/utils";

const rgb = hexToRgb("#3B82F6");
// { r: 59, g: 130, b: 246 }

const invalid = hexToRgb("invalid");
// null
```

**Paramètres** :

| Paramètre | Type     | Description                             |
| --------- | -------- | --------------------------------------- |
| `hex`     | `string` | Couleur hexadécimale (avec ou sans `#`) |

**Retour** : Objet RGB ou `null` si la couleur est invalide

**Exemples** :

```tsx
hexToRgb("#3B82F6"); // { r: 59, g: 130, b: 246 }
hexToRgb("3B82F6"); // { r: 59, g: 130, b: 246 }
hexToRgb("#FFF"); // null (format non supporté)
hexToRgb("invalid"); // null
```

---

### `hexToRgbString`

Convertit une couleur hexadécimale en chaîne RGB pour CSS.

**Localisation** : `@/components/theme/utils`

**Signature** :

```typescript
function hexToRgbString(hex: string): string | null;
```

**Utilisation** :

```tsx
import { hexToRgbString } from "@/components/theme/utils";

const rgbString = hexToRgbString("#3B82F6");
// "59, 130, 246"

// Utilisation dans CSS
const style = {
  backgroundColor: `rgba(${rgbString}, 0.1)`,
};
```

**Paramètres** :

| Paramètre | Type     | Description          |
| --------- | -------- | -------------------- |
| `hex`     | `string` | Couleur hexadécimale |

**Retour** : Chaîne RGB (`"r, g, b"`) ou `null`

**Exemples** :

```tsx
hexToRgbString("#3B82F6"); // "59, 130, 246"
hexToRgbString("#FF0000"); // "255, 0, 0"
hexToRgbString("invalid"); // null
```

---

### `generateColorShades`

Génère automatiquement les nuances d'une couleur (50-900) et les applique comme variables CSS.

**Localisation** : `@/components/theme/utils`

**Signature** :

```typescript
function generateColorShades(hex: string, baseName: string): void;
```

**Utilisation** :

```tsx
import { generateColorShades } from "@/components/theme/utils";

// Génère les nuances pour la couleur primaire
generateColorShades("#3B82F6", "primary");

// Crée les variables CSS :
// --color-primary-50
// --color-primary-100
// ...
// --color-primary-900
// --color-primary-rgb
```

**Paramètres** :

| Paramètre  | Type     | Description                        |
| ---------- | -------- | ---------------------------------- |
| `hex`      | `string` | Couleur de base (hexadécimale)     |
| `baseName` | `string` | Nom de base pour les variables CSS |

**Nuances générées** :

- `50` : Très clair (base + 200)
- `100` : Clair (base + 150)
- `200` : Légèrement clair (base + 100)
- `300` : Légèrement clair (base + 50)
- `400` : Légèrement clair (base + 25)
- `500` : Couleur de base
- `600` : Légèrement foncé (base - 25)
- `700` : Foncé (base - 50)
- `800` : Très foncé (base - 100)
- `900` : Très très foncé (base - 150)

**Note** : Les valeurs sont clampées entre 0 et 255

---

### `applyTheme`

Applique une configuration de thème complète au document.

**Localisation** : `@/components/theme/utils`

**Signature** :

```typescript
function applyTheme(theme: ThemeConfig): void;
```

**Utilisation** :

```tsx
import { applyTheme } from "@/components/theme/utils";
import type { ThemeConfig } from "@/components/theme/types";

const customTheme: ThemeConfig = {
  primary: "#3B82F6",
  secondary: "#10B981",
  // ...
};

applyTheme(customTheme);
```

**Paramètres** :

| Paramètre | Type          | Description                     |
| --------- | ------------- | ------------------------------- |
| `theme`   | `ThemeConfig` | Configuration complète du thème |

**Actions effectuées** :

1. Génère les nuances pour toutes les couleurs principales
2. Applique les polices (corps, titres, sous-titres)
3. Applique les couleurs de texte
4. Applique les couleurs d'erreur/succès
5. Applique le border radius

**Note** : Cette fonction est généralement appelée automatiquement par `useThemeManager`

---

### `loadThemeFromStorage`

Charge le thème sauvegardé depuis localStorage.

**Localisation** : `@/components/theme/utils`

**Signature** :

```typescript
function loadThemeFromStorage(): ThemeConfig | null;
```

**Utilisation** :

```tsx
import { loadThemeFromStorage } from "@/components/theme/utils";

const savedTheme = loadThemeFromStorage();
if (savedTheme) {
  applyTheme(savedTheme);
}
```

**Retour** : Configuration du thème ou `null` si aucune sauvegarde

**Note** : Retourne `null` si exécuté côté serveur (SSR)

---

### `saveThemeToStorage`

Sauvegarde le thème dans localStorage.

**Localisation** : `@/components/theme/utils`

**Signature** :

```typescript
function saveThemeToStorage(theme: ThemeConfig): void;
```

**Utilisation** :

```tsx
import { saveThemeToStorage } from "@/components/theme/utils";

const theme: ThemeConfig = {
  /* ... */
};
saveThemeToStorage(theme);
```

**Paramètres** :

| Paramètre | Type          | Description                          |
| --------- | ------------- | ------------------------------------ |
| `theme`   | `ThemeConfig` | Configuration du thème à sauvegarder |

**Note** : Ne fait rien si exécuté côté serveur (SSR)

---

## ⚡ Performance Utilities

### `createLazyComponent`

Crée un composant lazy-loaded avec Suspense intégré.

**Localisation** : `@/lib/performance/lazy`

**Signature** :

```typescript
function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
): ComponentType<React.ComponentProps<T>>;
```

**Utilisation** :

```tsx
import { createLazyComponent } from "@/lib/performance/lazy";

const HeavyComponent = createLazyComponent(() => import("./HeavyComponent"));

// Utilisation
<HeavyComponent prop1="value" />;
```

**Paramètres** :

| Paramètre  | Type                            | Description                                   |
| ---------- | ------------------------------- | --------------------------------------------- |
| `importFn` | `() => Promise<{ default: T }>` | Fonction d'import dynamique                   |
| `fallback` | `ReactNode` (optionnel)         | Composant de fallback (défaut: `<Spinner />`) |

**Avantages** :

- Réduction de la taille du bundle initial
- Chargement à la demande
- Gestion automatique du Suspense

---

### `lazyLoad`

Alternative à `createLazyComponent` avec composant de chargement personnalisé.

**Localisation** : `@/lib/performance/lazy`

**Signature** :

```typescript
function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent?: ComponentType,
): ComponentType<React.ComponentProps<T>>;
```

**Utilisation** :

```tsx
import { lazyLoad } from "@/lib/performance/lazy";
import CustomLoader from "./CustomLoader";

const MyComponent = lazyLoad(() => import("./MyComponent"), CustomLoader);
```

**Différence avec `createLazyComponent`** :

- Accepte un composant React comme fallback au lieu d'un ReactNode

---

## 🌐 API Utilities

### `apiClient`

Client API centralisé avec gestion d'erreurs automatique.

**Localisation** : `@/lib/api/client`

**Utilisation** :

```tsx
import { apiClient } from "@/lib/api/client";

// GET request
const response = await apiClient.get<User>("/api/users/me");

// POST request
const newUser = await apiClient.post<User>("/api/users", {
  name: "John Doe",
  email: "john@example.com",
});

// PUT request
await apiClient.put<User>("/api/users/1", updatedData);

// DELETE request
await apiClient.delete("/api/users/1");
```

**Méthodes disponibles** :

| Méthode           | Signature                                                                                  | Description                           |
| ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| `get`             | `<T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>`                 | Requête GET                           |
| `post`            | `<T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>` | Requête POST                          |
| `put`             | `<T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>` | Requête PUT                           |
| `patch`           | `<T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>` | Requête PATCH                         |
| `delete`          | `<T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>`                 | Requête DELETE                        |
| `setAuthToken`    | `(token: string) => void`                                                                  | Définir le token d'authentification   |
| `removeAuthToken` | `() => void`                                                                               | Supprimer le token d'authentification |

**Gestion d'erreurs** :

- Intercepteurs automatiques pour les erreurs
- Logging structuré
- Transformation des erreurs Axios en erreurs applicatives

---

## 📦 Type Utilities

### `ApiResponse<T>`

Type générique pour les réponses API.

**Localisation** : `@modele/types`

**Signature** :

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}
```

**Utilisation** :

```tsx
import type { ApiResponse } from "@modele/types";

const response: ApiResponse<User> = await apiClient.get("/api/users/me");
const user = response.data;
```

---

## 🔧 Helpers Généraux

### `clsx`

Utilitaire pour combiner des classes CSS conditionnellement.

**Localisation** : Package `clsx`

**Utilisation** :

```tsx
import { clsx } from "clsx";

const className = clsx(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class",
  customClass,
);
```

**Avantages** :

- Combinaison conditionnelle de classes
- Gestion des valeurs falsy
- Performance optimisée

---

## 📝 Bonnes Pratiques

### 1. Utiliser les utilitaires de thème pour la cohérence

```tsx
// ✅ Bon
import { hexToRgb } from "@/components/theme/utils";
const rgb = hexToRgb(color);

// ❌ Mauvais
const rgb = manualHexToRgb(color); // Duplication
```

### 2. Utiliser `createLazyComponent` pour les gros composants

```tsx
// ✅ Bon
const HeavyChart = createLazyComponent(() => import("./HeavyChart"));

// ❌ Mauvais
import HeavyChart from "./HeavyChart"; // Charge toujours
```

### 3. Utiliser `apiClient` pour toutes les requêtes API

```tsx
// ✅ Bon
const data = await apiClient.get<Type>("/api/endpoint");

// ❌ Mauvais
const data = await fetch("/api/endpoint"); // Pas de gestion d'erreurs centralisée
```

---

## 🐛 Dépannage

### Les couleurs ne se génèrent pas correctement

**Problème** : `generateColorShades` ne crée pas les variables CSS

**Solution** :

1. Vérifier que la fonction est appelée côté client (pas SSR)
2. Vérifier que `document.documentElement` est disponible
3. Vérifier la console pour les erreurs

### Le lazy loading ne fonctionne pas

**Problème** : Les composants lazy ne se chargent pas

**Solution** :

1. Vérifier que le composant est bien exporté par défaut
2. Vérifier que le chemin d'import est correct
3. Vérifier que Suspense est disponible (React 18+)

---

## 📚 Ressources

- [Documentation API](./API.md)
- [Guide de Thème](../apps/web/src/components/theme/README.md)
- [Hooks Personnalisés](./HOOKS.md)

---

**Dernière mise à jour** : 2025-01-22
