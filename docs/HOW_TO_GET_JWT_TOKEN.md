# 🔑 Comment Obtenir votre Token JWT pour Tester les Endpoints RBAC

## Méthode 1 : Via le Navigateur (Recommandé) 🌐

### Étape 1 : Se Connecter dans l'Application

1. Allez sur votre application frontend : `https://modele-nextjs-fullstack-production-1e92.up.railway.app`
2. Connectez-vous avec votre email : `clement@nukleo.com`
3. Une fois connecté, ouvrez les **Outils de Développeur** (F12)

### Étape 2 : Récupérer le Token depuis le LocalStorage

1. Dans les outils de développement, allez dans l'onglet **"Application"** (Chrome) ou **"Storage"** (Firefox)
2. Dans le menu de gauche, cliquez sur **"Local Storage"**
3. Sélectionnez votre domaine (Railway)
4. Cherchez la clé `auth_token` ou `token` ou `jwt_token`
5. **Copiez la valeur** (c'est votre token JWT)

### Étape 3 : Utiliser le Token

Une fois que vous avez le token, exécutez le script de test :

```powershell
.\test_rbac_endpoints.ps1 -Token "VOTRE_TOKEN_ICI"
```

---

## Méthode 2 : Via la Console du Navigateur 🖥️

1. Connectez-vous dans l'application
2. Ouvrez la console (F12 → Console)
3. Exécutez cette commande :

```javascript
// Pour récupérer le token depuis le localStorage
localStorage.getItem("auth_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("jwt_token");
```

4. **Copiez le token** affiché
5. Utilisez-le dans le script PowerShell

---

## Méthode 3 : Via l'API de Login 🔐

Si vous préférez obtenir le token directement via l'API :

```powershell
$loginBody = @{
    email = "clement@nukleo.com"
    password = "VOTRE_MOT_DE_PASSE"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://modelebackend-production-0590.up.railway.app/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

# Le token est dans $response.access_token
$token = $response.access_token
Write-Host "Token: $token"

# Utiliser le token pour tester
.\test_rbac_endpoints.ps1 -Token $token
```

**⚠️ Attention** : Cette méthode nécessite votre mot de passe. Utilisez-la uniquement si vous êtes à l'aise avec cela.

---

## Méthode 4 : Via les Headers de Requête dans le Navigateur 🌐

1. Connectez-vous dans l'application
2. Ouvrez les outils de développement (F12)
3. Allez dans l'onglet **"Network"** (Réseau)
4. Rechargez la page ou naviguez dans l'application
5. Cliquez sur une requête vers `/api/v1/...`
6. Dans les détails de la requête, allez dans l'onglet **"Headers"**
7. Cherchez **"Authorization"** dans les **"Request Headers"**
8. Le token est après `Bearer ` dans la valeur

---

## 🧪 Tester les Endpoints avec le Token

Une fois que vous avez le token, utilisez le script de test :

```powershell
# Exemple avec un token
.\test_rbac_endpoints.ps1 -Token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Le script va tester automatiquement tous les endpoints RBAC et vous dire lesquels fonctionnent.

---

## 📋 Endpoints Testés

Le script teste les endpoints suivants :

1. ✅ `GET /rbac/roles` - Liste des rôles
2. ✅ `GET /rbac/permissions` - Liste des permissions
3. ✅ `GET /rbac/users/3/roles` - Rôles d'un utilisateur
4. ✅ `GET /rbac/users/3/permissions` - Permissions d'un utilisateur
5. ✅ `GET /rbac/users/3/permissions/custom` - Permissions custom d'un utilisateur

---

## ⚠️ Notes Importantes

1. **Le token expire** : Les tokens JWT ont une durée de vie limitée. Si vous obtenez des erreurs `401 Unauthorized`, reconnectez-vous pour obtenir un nouveau token.

2. **Sécurité** : Ne partagez jamais votre token JWT publiquement. Il donne accès à votre compte.

3. **Format du token** : Le token doit être utilisé avec le préfixe `Bearer ` dans l'en-tête Authorization, mais le script le fait automatiquement.

---

## 🆘 Dépannage

### Erreur : "401 Unauthorized"

- Le token est expiré ou invalide
- **Solution** : Reconnectez-vous pour obtenir un nouveau token

### Erreur : "403 Forbidden"

- Vous n'avez pas les permissions nécessaires
- **Solution** : Vérifiez que le rôle `superadmin` est bien assigné à votre compte

### Erreur : "Token not found in localStorage"

- Le token est stocké sous un autre nom
- **Solution** : Vérifiez toutes les clés dans le LocalStorage pour trouver le token
