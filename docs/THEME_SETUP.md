# Guide de Configuration - Système de Thèmes Globaux

Ce guide vous explique comment configurer et utiliser le système de gestion des thèmes globaux.

## ✅ Étapes de Configuration

### 1. Migration de la Base de Données

Exécutez la migration Alembic pour créer la table `themes` :

```bash
cd backend
alembic upgrade head
```

Si la migration n'existe pas encore, créez-la :

```bash
cd backend
alembic revision --autogenerate -m "Create themes table"
alembic upgrade head
```

### 2. Vérification de l'Intégration

Le système est déjà intégré dans votre application :

- ✅ `GlobalThemeProvider` ajouté au layout principal (`apps/web/src/app/layout.tsx`)
- ✅ Page admin créée (`apps/web/src/app/admin/themes/page.tsx`)
- ✅ Carte "Thèmes" ajoutée au tableau de bord admin
- ✅ API adaptée pour utiliser `TokenStorage`

### 3. Création d'un Rôle Superadmin

Pour pouvoir gérer les thèmes, vous devez avoir un utilisateur avec le rôle "superadmin".

#### Via l'API (si vous avez déjà un utilisateur admin) :

```bash
# 1. Créer le rôle superadmin (si pas déjà créé)
curl -X POST http://localhost:8000/api/v1/rbac/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Super Admin",
    "slug": "superadmin",
    "description": "Super administrator with full system access",
    "is_system": true
  }'

# 2. Assigner le rôle à un utilisateur
curl -X POST http://localhost:8000/api/v1/rbac/users/{user_id}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "role_id": ROLE_ID
  }'
```

#### Via SQL (directement dans la base de données) :

```sql
-- 1. Créer le rôle superadmin
INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW());

-- 2. Récupérer l'ID du rôle créé
SELECT id FROM roles WHERE slug = 'superadmin';

-- 3. Assigner le rôle à un utilisateur (remplacez USER_ID et ROLE_ID)
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES (USER_ID, ROLE_ID, NOW());
```

### 4. Création du Premier Thème

#### Via l'Interface Admin :

1. Connectez-vous en tant que superadmin
2. Accédez à `/admin/themes`
3. Cliquez sur "Create New Theme"
4. Utilisez l'exemple de configuration JSON fourni dans `examples/theme-config-example.json`

#### Via l'API :

```bash
curl -X POST http://localhost:8000/api/v1/themes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "default-light",
    "display_name": "Default Light Theme",
    "description": "Theme clair par défaut",
    "config": {
      "color": {
        "background": "#ffffff",
        "foreground": "#000000",
        "primary": "#0070f3",
        "secondary": "#6b7280",
        "accent": "#f59e0b",
        "border": "#e5e7eb"
      },
      "spacing": {
        "unit": "8px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px"
      }
    },
    "is_active": true
  }'
```

### 5. Utilisation des Variables CSS

Les variables CSS du thème sont automatiquement appliquées au document root. Utilisez-les dans vos composants :

```css
/* styles/globals.css ou dans vos composants */
.my-component {
  background-color: var(--color-background);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  padding: var(--spacing-md);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}
```

## 🔍 Vérification

### Vérifier que le thème est actif :

```bash
# Endpoint public - pas besoin d'authentification
curl http://localhost:8000/api/v1/themes/active
```

### Vérifier que les variables CSS sont appliquées :

1. Ouvrez votre application dans le navigateur
2. Ouvrez les outils de développement (F12)
3. Dans la console, tapez : `getComputedStyle(document.documentElement).getPropertyValue('--color-background')`
4. Vous devriez voir la valeur du thème actif

## 🐛 Dépannage

### Le thème ne s'applique pas

1. Vérifiez que le `GlobalThemeProvider` est bien dans le layout
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que l'API backend répond à `/api/v1/themes/active`
4. Vérifiez que vous avez un thème actif en base de données

### Erreur 403 lors de la gestion des thèmes

1. Vérifiez que vous êtes connecté en tant que superadmin
2. Vérifiez que le rôle "superadmin" existe et est assigné à votre utilisateur
3. Vérifiez que le token d'authentification est valide

### La migration Alembic échoue

1. Vérifiez que la base de données est accessible
2. Vérifiez que `DATABASE_URL` est correcte dans `backend/.env`
3. Vérifiez que vous avez les permissions nécessaires

## 📚 Documentation Complète

- [THEME_MANAGEMENT.md](./THEME_MANAGEMENT.md) - Documentation complète du système
- [INTEGRATION_THEME.md](../INTEGRATION_THEME.md) - Guide d'intégration détaillé
- [Exemples de configuration](../examples/) - Exemples de configurations de thème

## ✅ Checklist de Configuration

- [ ] Migration Alembic exécutée
- [ ] Rôle superadmin créé
- [ ] Utilisateur avec rôle superadmin configuré
- [ ] Premier thème créé et activé
- [ ] Variables CSS testées dans les composants
- [ ] Interface admin accessible (`/admin/themes`)

---

**Le système est maintenant prêt à être utilisé !** 🎨
