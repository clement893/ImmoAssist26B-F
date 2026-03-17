# 🔐 Configuration de la Bootstrap Key

## ✅ Changements Déployés

Les nouveaux endpoints RBAC ont été poussés sur GitHub et seront déployés automatiquement sur Railway.

## 🔑 Clé Bootstrap Générée

Utilisez cette clé pour accéder aux endpoints de bootstrap :

```
d56a6fe0a9aa46c9a2a7f57603b89e9f947b0b0989ae72e87e0eff30bf1dd860
```

**⚠️ IMPORTANT : Gardez cette clé secrète et ne la partagez pas publiquement !**

## 📋 Étapes de Configuration

### 1. Ajouter la Clé dans Railway

1. Allez sur votre projet Railway : https://railway.app
2. Sélectionnez votre projet backend
3. Ouvrez l'onglet **"Variables"**
4. Cliquez sur **"New Variable"**
5. Ajoutez :
   - **Nom** : `BOOTSTRAP_SUPERADMIN_KEY`
   - **Valeur** : `d56a6fe0a9aa46c9a2a7f57603b89e9f947b0b0989ae72e87e0eff30bf1dd860`
6. Cliquez sur **"Add"**

### 2. Attendre le Déploiement

Attendez que Railway déploie automatiquement les nouveaux changements (généralement 1-2 minutes).

Vous pouvez vérifier le statut du déploiement dans l'onglet **"Deployments"** de Railway.

### 3. Utiliser les Endpoints

Une fois déployé, vous pouvez utiliser les nouveaux endpoints :

#### Diagnostic

```powershell
Invoke-RestMethod -Uri "https://modelebackend-production-0590.up.railway.app/api/v1/admin/rbac/diagnose?user_email=clement@nukleo.com" -Method Get
```

#### Correction avec Bootstrap Key

```powershell
$body = @{
    user_email = "clement@nukleo.com"
    seed_data = $true
    assign_superadmin = $true
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Bootstrap-Key" = "d56a6fe0a9aa46c9a2a7f57603b89e9f947b0b0989ae72e87e0eff30bf1dd860"
}

Invoke-RestMethod -Uri "https://modelebackend-production-0590.up.railway.app/api/v1/admin/rbac/fix" -Method Post -Body $body -Headers $headers
```

#### Ou utiliser l'endpoint bootstrap existant

```powershell
$body = @{
    email = "clement@nukleo.com"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Bootstrap-Key" = "d56a6fe0a9aa46c9a2a7f57603b89e9f947b0b0989ae72e87e0eff30bf1dd860"
}

Invoke-RestMethod -Uri "https://modelebackend-production-0590.up.railway.app/api/v1/admin/bootstrap-superadmin" -Method Post -Body $body -Headers $headers
```

## 🎯 Résultat Attendu

Après avoir exécuté la correction, vous devriez voir :

```json
{
  "success": true,
  "message": "RBAC fix completed successfully",
  "roles_created": 2,
  "permissions_created": 16,
  "superadmin_assigned": true
}
```

## ⚠️ Important

1. **Reconnectez-vous** dans l'application frontend après avoir assigné le rôle superadmin
2. Cela générera un nouveau token JWT avec les nouvelles permissions
3. Les erreurs `403 Forbidden` devraient disparaître

## 🆘 Dépannage

Si vous rencontrez des erreurs :

1. Vérifiez que la variable `BOOTSTRAP_SUPERADMIN_KEY` est bien configurée dans Railway
2. Vérifiez que le déploiement est terminé
3. Vérifiez que vous utilisez la bonne clé dans le header `X-Bootstrap-Key`
4. Vérifiez les logs Railway pour voir les erreurs détaillées
