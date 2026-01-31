# Guide d'Implémentation du Système d'Authentification

## Vue d'Ensemble

Ce document décrit l'architecture et l'implémentation complète du système d'authentification pour ce template Next.js Fullstack.

## Architecture

### Backend (FastAPI)

#### Schémas de Données

**UserResponse** (Format API):

```python
{
  "id": 1,                    # int
  "email": "user@example.com",
  "first_name": "John",       # Optional[str]
  "last_name": "Doe",         # Optional[str]
  "is_active": true,
  "theme_preference": "system",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**TokenWithUser** (Réponse Login):

```python
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "refresh_token": "eyJhbGci...",  # Optional
  "user": { ... }  # UserResponse
}
```

#### Endpoints Principaux

- `POST /api/v1/auth/login` - Connexion (JSON ou form-data)
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `GET /api/v1/auth/me` - Obtenir les informations de l'utilisateur actuel
- `POST /api/v1/auth/logout` - Déconnexion

### Frontend (Next.js)

#### Format Store (Zustand)

**User** (Format Store):

```typescript
{
  id: string;                 // Converti depuis int
  email: string;
  name: string;               // Combiné depuis first_name/last_name
  is_active: boolean;
  is_verified: boolean;        // Valeur par défaut
  is_admin?: boolean;          // Valeur par défaut
  created_at?: string;
  updated_at?: string;
}
```

#### Transformation des Données

**Fonction de Transformation**: `transformApiUserToStoreUser()`

Cette fonction convertit automatiquement le format API (backend) vers le format store (frontend):

```typescript
import { transformApiUserToStoreUser } from "@/lib/auth/userTransform";

const apiUser = response.data.user; // Format backend
const storeUser = transformApiUserToStoreUser(apiUser); // Format store
```

**Toujours utiliser cette fonction** lorsque vous recevez des données utilisateur de l'API.

#### Stockage des Tokens

- **sessionStorage**: Stockage immédiat pour accès synchrone
- **Cookies httpOnly**: Stockage sécurisé via API route `/api/auth/token`
- **Zustand persist**: Persistance dans localStorage pour hydratation

#### Composants Principaux

- `ProtectedRoute` - Protection des routes nécessitant une authentification
- `useAuth` - Hook pour la gestion de l'authentification
- `useAuthStore` - Store Zustand pour l'état d'authentification

## Flux d'Authentification

### 1. Login avec Email/Password

```typescript
// apps/web/src/app/[locale]/auth/login/page.tsx
const response = await authAPI.login(email, password);
const { access_token, refresh_token, user } = response.data;

// Transformer les données utilisateur
const userForStore = transformApiUserToStoreUser(user);

// Stocker dans le store
login(userForStore, access_token, refresh_token);

// Rediriger vers dashboard
router.push("/dashboard");
```

### 2. Register puis Auto-Login

```typescript
// apps/web/src/app/[locale]/auth/register/page.tsx
await authAPI.register(email, password, name);
const loginResponse = await authAPI.login(email, password);
const { access_token, refresh_token, user } = loginResponse.data;

// Transformer les données utilisateur
const userForStore = transformApiUserToStoreUser(user);

// Stocker dans le store
login(userForStore, access_token, refresh_token);

// Rediriger vers dashboard
router.push("/dashboard");
```

### 3. OAuth Callback (Google)

```typescript
// apps/web/src/app/[locale]/auth/callback/page.tsx
const accessToken = searchParams.get("token");
const refreshToken = searchParams.get("refresh_token");

// Stocker les tokens
await TokenStorage.setToken(accessToken, refreshToken);

// Récupérer les données utilisateur
const response = await usersAPI.getMe();
const user = response.data;

// Transformer les données utilisateur
const userForStore = transformApiUserToStoreUser(user);

// Stocker dans le store
await login(userForStore, accessToken, refreshToken);

// Rediriger vers dashboard
router.push("/dashboard");
```

### 4. Vérification d'Authentification (ProtectedRoute)

```typescript
// apps/web/src/components/auth/ProtectedRoute.tsx
const { user, token } = useAuthStore();

// Vérifier l'authentification
const tokenFromStorage = TokenStorage.getToken();
const currentToken = token || tokenFromStorage;
const isAuth = !!user && !!currentToken;

if (!isAuth) {
  router.replace('/auth/login?redirect=' + pathname);
  return;
}

// Afficher le contenu protégé
return <>{children}</>;
```

## Patterns à Suivre

### ✅ À FAIRE

1. **Toujours utiliser `transformApiUserToStoreUser`** lorsque vous recevez des données utilisateur de l'API
2. **Utiliser `refresh_token`** si disponible pour le refresh automatique
3. **Vérifier `user` et `token`** dans `ProtectedRoute` plutôt que `isAuthenticated()`
4. **Attendre les opérations async** (`await TokenStorage.removeTokens()`)

### ❌ À ÉVITER

1. **Ne pas utiliser directement** les données utilisateur de l'API sans transformation
2. **Ne pas réinitialiser** `isAuthorized` dans `ProtectedRoute` lors de la connexion
3. **Ne pas oublier** `await` devant les opérations async
4. **Ne pas dupliquer** la logique de transformation

## Gestion des Erreurs

### Erreurs d'Authentification

- **401 Unauthorized**: Token invalide ou expiré → Rediriger vers login
- **422 Unprocessable Content**: Données invalides → Afficher l'erreur
- **403 Forbidden**: Utilisateur inactif → Rediriger vers login

### Refresh Automatique

L'intercepteur API gère automatiquement le refresh du token:

```typescript
// apps/web/src/lib/api.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken) {
        // Tenter le refresh
        const newToken = await refreshToken();
        // Réessayer la requête originale
        return apiClient.request(error.config);
      }
    }
  },
);
```

## Tests Recommandés

### Tests Unitaires

- Transformation des données utilisateur
- Stockage et récupération des tokens
- Logique d'autorisation dans `ProtectedRoute`

### Tests d'Intégration

- Flux complet login → dashboard
- Flux register → auto-login → dashboard
- OAuth callback → dashboard
- Refresh automatique du token

### Tests E2E

- Login avec email/password
- Register puis auto-login
- OAuth login
- Logout
- Protection des routes

## Configuration

### Variables d'Environnement

**Backend**:

- `ACCESS_TOKEN_EXPIRE_MINUTES`: Durée de vie du token d'accès (défaut: 15)
- `REFRESH_TOKEN_EXPIRE_DAYS`: Durée de vie du refresh token (défaut: 5)

**Frontend**:

- `NEXT_PUBLIC_API_URL`: URL de l'API backend

## Sécurité

### Bonnes Pratiques Implémentées

1. **Tokens JWT**: Signés avec secret key
2. **Refresh Tokens**: Durée de vie limitée
3. **httpOnly Cookies**: Pour stockage sécurisé (optionnel)
4. **Rate Limiting**: Sur les endpoints d'authentification
5. **Audit Logging**: Tous les événements d'authentification sont loggés

### Recommandations

1. Utiliser HTTPS en production
2. Configurer CORS correctement
3. Implémenter CSRF protection si nécessaire
4. Surveiller les tentatives de login échouées
5. Implémenter 2FA pour les comptes sensibles

## Dépannage

### Problème: Redirection vers login après connexion

**Solution**: Vérifier que `ProtectedRoute` ne réinitialise pas `isAuthorized` lors de la connexion.

### Problème: Format utilisateur incorrect

**Solution**: Utiliser `transformApiUserToStoreUser()` partout où vous recevez des données utilisateur.

### Problème: Refresh token non disponible

**Solution**: Vérifier que le backend retourne `refresh_token` dans la réponse login.

## Références

- [AUTHENTICATION_FIX_PLAN.md](../AUTHENTICATION_FIX_PLAN.md) - Plan de correction détaillé
- [SYSTEM_AUTHENTICATION_AUDIT.md](../SYSTEM_AUTHENTICATION_AUDIT.md) - Audit complet du système
- [Backend API Documentation](../backend/API_ENDPOINTS.md) - Documentation des endpoints
