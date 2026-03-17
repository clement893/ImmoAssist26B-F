# Système RBAC (Role-Based Access Control)

## 📋 Vue d'ensemble

Le système RBAC permet une gestion fine des permissions dans l'application. Il supporte :

- **Rôles** : Groupes de permissions assignés aux utilisateurs
- **Permissions** : Actions spécifiques (ex: `users:create`, `projects:read`)
- **Permissions Custom** : Permissions individuelles assignées directement à un utilisateur (au-delà de ses rôles)

## 🏗️ Architecture

### Backend

#### Modèles de données

- **`Role`** : Rôle avec nom, slug, description, statut système
- **`Permission`** : Permission avec ressource, action, nom
- **`RolePermission`** : Relation many-to-many entre rôles et permissions
- **`UserRole`** : Relation many-to-many entre utilisateurs et rôles
- **`UserPermission`** : Permissions custom assignées directement à un utilisateur

#### Services

- **`RBACService`** : Service principal pour toutes les opérations RBAC
  - Gestion des rôles et permissions
  - Agrégation des permissions (rôles + custom)
  - Bulk operations

#### Endpoints API

Tous les endpoints sont préfixés par `/api/v1/rbac` :

- **Roles** :
  - `GET /rbac/roles` - Liste des rôles
  - `GET /rbac/roles/{id}` - Détails d'un rôle
  - `POST /rbac/roles` - Créer un rôle
  - `PUT /rbac/roles/{id}` - Modifier un rôle
  - `DELETE /rbac/roles/{id}` - Supprimer un rôle

- **Permissions** :
  - `GET /rbac/permissions` - Liste des permissions
  - `POST /rbac/permissions` - Créer une permission

- **Role Permissions** :
  - `POST /rbac/roles/{id}/permissions` - Assigner permission à un rôle
  - `DELETE /rbac/roles/{id}/permissions/{perm_id}` - Retirer permission d'un rôle
  - `PUT /rbac/roles/{id}/permissions` - Bulk update des permissions d'un rôle

- **User Roles** :
  - `GET /rbac/users/{id}/roles` - Rôles d'un utilisateur
  - `POST /rbac/users/{id}/roles` - Assigner rôle à un utilisateur
  - `DELETE /rbac/users/{id}/roles/{role_id}` - Retirer rôle d'un utilisateur
  - `PUT /rbac/users/{id}/roles` - Bulk update des rôles d'un utilisateur

- **User Permissions** :
  - `GET /rbac/users/{id}/permissions` - Toutes les permissions d'un utilisateur (rôles + custom)
  - `GET /rbac/users/{id}/permissions/custom` - Permissions custom d'un utilisateur
  - `POST /rbac/users/{id}/permissions/custom` - Ajouter permission custom
  - `DELETE /rbac/users/{id}/permissions/custom/{perm_id}` - Retirer permission custom

- **Permission Check** :
  - `POST /rbac/check` - Vérifier si l'utilisateur actuel a une permission

### Frontend

#### API Client

- **`rbacAPI`** (`apps/web/src/lib/api/rbac.ts`) : Client API complet avec toutes les méthodes

#### Hooks React

- **`useRoles()`** : Gérer les rôles
- **`usePermissions()`** : Gérer les permissions
- **`useUserRoles(userId)`** : Gérer les rôles d'un utilisateur
- **`useUserPermissions(userId)`** : Gérer les permissions d'un utilisateur
- **`usePermissionCheck(permission)`** : Vérifier une permission

#### Composants UI

- **`RoleForm`** : Formulaire pour créer/modifier des rôles
- **`RolePermissionsEditor`** : Éditeur de permissions pour un rôle
- **`UserRolesEditor`** : Éditeur de rôles pour un utilisateur
- **`UserPermissionsEditor`** : Éditeur de permissions custom pour un utilisateur

## 🚀 Utilisation

### Backend

#### Créer un rôle avec permissions

```python
from app.services.rbac_service import RBACService

rbac_service = RBACService(db)

# Créer un rôle
role = await rbac_service.create_role(
    name="Editor",
    slug="editor",
    description="Can edit content"
)

# Créer des permissions
perm1 = await rbac_service.create_permission(
    resource="content",
    action="edit"
)

# Assigner permission au rôle
await rbac_service.assign_permission_to_role(role.id, perm1.id)
```

#### Assigner un rôle à un utilisateur

```python
await rbac_service.assign_role(user_id, role_id)
```

#### Obtenir les permissions d'un utilisateur

```python
permissions = await rbac_service.get_user_permissions(user_id)
# Retourne un Set[str] avec toutes les permissions (rôles + custom)
```

#### Ajouter une permission custom

```python
await rbac_service.add_custom_permission(user_id, permission_id)
```

### Frontend

#### Utiliser les hooks

```tsx
import { useRoles, useUserRoles } from "@/hooks/useRBAC";

function RolesPage() {
  const { roles, loading, createRole } = useRoles();

  const handleCreate = async () => {
    await createRole({
      name: "Editor",
      slug: "editor",
      description: "Can edit content",
    });
  };

  return (
    <div>
      {roles.map((role) => (
        <div key={role.id}>{role.name}</div>
      ))}
    </div>
  );
}

function UserRoles({ userId }: { userId: number }) {
  const { roles, updateRoles } = useUserRoles(userId);

  const handleUpdate = async () => {
    await updateRoles([1, 2, 3]); // IDs des rôles
  };

  return (
    <div>
      {roles.map((role) => (
        <div key={role.id}>{role.name}</div>
      ))}
    </div>
  );
}
```

#### Utiliser l'API directement

```tsx
import { rbacAPI } from "@/lib/api/rbac";

// Créer un rôle
const role = await rbacAPI.createRole({
  name: "Editor",
  slug: "editor",
  description: "Can edit content",
});

// Assigner des permissions (bulk)
await rbacAPI.updateRolePermissions(role.id, [1, 2, 3]);

// Assigner des rôles à un utilisateur (bulk)
await rbacAPI.updateUserRoles(userId, [1, 2]);

// Ajouter permission custom
await rbacAPI.addCustomPermission(userId, permissionId);
```

#### Vérifier une permission

```tsx
import { usePermissionCheck } from "@/hooks/useRBAC";

function ProtectedComponent() {
  const { hasPermission, loading } = usePermissionCheck("users:create");

  if (loading) return <Loading />;
  if (!hasPermission) return <div>Accès refusé</div>;

  return <div>Contenu protégé</div>;
}
```

## 🔒 Sécurité

### Validations Backend

- **Rôles système** : Ne peuvent pas être modifiés ou supprimés
- **Dernier superadmin** : Ne peut pas perdre son rôle superadmin
- **Permissions existantes** : Validation avant assignation
- **Rôles assignés** : Ne peuvent pas être supprimés s'ils sont assignés à des utilisateurs

### Permissions Spéciales

- **`admin:*`** : Permission wildcard qui donne accès à tout (superadmin uniquement)
- **Permissions custom** : Override les permissions de rôle en cas de conflit

## 📊 Rôles Système

Les rôles système suivants sont créés automatiquement :

- **`superadmin`** : Accès complet (`admin:*`)
- **`admin`** : Administration générale
- **`manager`** : Gestion d'équipe
- **`member`** : Membre de base
- **`client`** : Utilisateur client portal
- **`employee`** : Employé ERP portal
- **`sales`** : Ventes
- **`accounting`** : Comptabilité
- **`inventory`** : Inventaire

## 🔄 Seeding

Pour initialiser les données RBAC :

```bash
cd backend
python scripts/seed_rbac_data.py
```

Ce script :

- Crée toutes les permissions définies dans `Permission` constants
- Crée tous les rôles système
- Assigne les permissions aux rôles selon `get_role_permissions_hardcoded()`

Le script est **idempotent** et peut être exécuté plusieurs fois sans problème.

## 📝 Bonnes Pratiques

### Backend

1. **Utiliser RBACService** : Toujours utiliser `RBACService` plutôt que d'accéder directement aux modèles
2. **Permissions async** : Toutes les méthodes sont async, utiliser `await`
3. **Bulk operations** : Utiliser les méthodes bulk pour les mises à jour multiples
4. **Audit logging** : Les changements sont automatiquement loggés

### Frontend

1. **Utiliser les hooks** : Préférer les hooks React aux appels API directs
2. **Loading states** : Toujours gérer les états de chargement
3. **Error handling** : Gérer les erreurs avec des messages clairs
4. **Optimistic updates** : Recharger les données après les mutations

## 🧪 Tests

### Backend

```bash
cd backend
pytest tests/api/test_rbac_endpoints.py -v
```

### Frontend

```bash
pnpm test -- rbac
```

## 📚 Documentation Complémentaire

- [API Endpoints](./API_ENDPOINTS.md#rbac-endpoints)
- [Permissions Constants](../backend/app/core/permissions.py)
- [RBAC Service](../backend/app/services/rbac_service.py)

## 🔗 Pages UI

- **`/admin/rbac`** : Gestion des rôles et permissions
- **`/admin/users`** : Gestion des utilisateurs avec rôles/permissions

## 🐛 Dépannage

### Les permissions ne sont pas appliquées

1. Vérifier que l'utilisateur a bien les rôles assignés
2. Vérifier que les rôles ont bien les permissions
3. Vérifier les permissions custom de l'utilisateur
4. Vérifier que `RBACService.get_user_permissions()` retourne les bonnes permissions

### Erreur "Cannot delete system role"

Les rôles système ne peuvent pas être supprimés. Désactiver le rôle à la place (`is_active = False`).

### Erreur "Cannot remove superadmin role from last superadmin"

Il doit toujours y avoir au moins un superadmin dans le système. Assigner le rôle superadmin à un autre utilisateur avant de le retirer.
