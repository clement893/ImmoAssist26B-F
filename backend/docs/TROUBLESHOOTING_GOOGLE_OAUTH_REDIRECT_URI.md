# Troubleshooting: Google OAuth redirect_uri_mismatch Error

## Problème

Lors de la connexion avec Google OAuth, vous recevez l'erreur suivante :

```
Erreur 400 : redirect_uri_mismatch
Accès bloqué : la demande de cette appli n'est pas valide
```

## Cause

Cette erreur se produit lorsque l'URI de redirection utilisé dans la requête OAuth ne correspond **pas exactement** (caractère par caractère) à celui configuré dans la console Google Cloud.

Google OAuth est très strict sur la correspondance exacte de l'URI de redirection. Même une petite différence (trailing slash, http vs https, port, etc.) provoquera cette erreur.

## Comment fonctionne le redirect URI dans ce projet

Le backend construit automatiquement le redirect URI selon cette logique :

1. **Si `GOOGLE_REDIRECT_URI` est défini** : utilise cette valeur exacte
2. **Sinon** : construit l'URI à partir de `BASE_URL` + `/api/v1/auth/google/callback`

### Format du redirect URI

Le redirect URI suit ce format :
```
{BASE_URL}/api/v1/auth/google/callback
```

Exemples :
- Développement local : `http://localhost:8000/api/v1/auth/google/callback`
- Production : `https://api.votredomaine.com/api/v1/auth/google/callback`

## Solutions

### Solution 1 : Définir explicitement GOOGLE_REDIRECT_URI (Recommandé)

C'est la méthode la plus fiable. Définissez exactement l'URI que vous avez configuré dans Google Cloud Console.

#### Étape 1 : Vérifier l'URI utilisé par le backend

1. Appelez l'endpoint `/api/v1/auth/google` pour obtenir l'URL d'authentification
2. Regardez les logs du backend - ils affichent le `callback_uri` utilisé
3. Ou inspectez l'URL générée dans la réponse `auth_url`

#### Étape 2 : Configurer dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID**
5. Dans **Authorized redirect URIs**, ajoutez exactement l'URI utilisé par votre backend :
   - Pour le développement : `http://localhost:8000/api/v1/auth/google/callback`
   - Pour la production : `https://votre-backend.com/api/v1/auth/google/callback`

⚠️ **Important** :
- L'URI doit correspondre **exactement** (même protocole http/https, même port, même chemin)
- Pas de trailing slash à la fin
- Respectez la casse

#### Étape 3 : Définir la variable d'environnement

Définissez `GOOGLE_REDIRECT_URI` avec exactement la même valeur que dans Google Cloud Console :

```bash
# Développement
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Production
GOOGLE_REDIRECT_URI=https://api.votredomaine.com/api/v1/auth/google/callback
```

### Solution 2 : Utiliser BASE_URL

Si vous préférez laisser le backend construire automatiquement l'URI, définissez `BASE_URL` :

```bash
# Développement
BASE_URL=http://localhost:8000

# Production
BASE_URL=https://api.votredomaine.com
```

Puis configurez le même URI dans Google Cloud Console :
- `http://localhost:8000/api/v1/auth/google/callback` (développement)
- `https://api.votredomaine.com/api/v1/auth/google/callback` (production)

## Vérification

### 1. Vérifier les variables d'environnement

```bash
# Vérifier que les variables sont définies
echo $GOOGLE_REDIRECT_URI
echo $BASE_URL
echo $GOOGLE_CLIENT_ID
```

### 2. Vérifier les logs du backend

Lors de l'appel à `/api/v1/auth/google`, les logs affichent :
```
Google OAuth callback URI: http://localhost:8000/api/v1/auth/google/callback
GOOGLE_REDIRECT_URI from settings: http://localhost:8000/api/v1/auth/google/callback
BASE_URL from settings: http://localhost:8000
```

### 3. Tester l'endpoint

```bash
# Appeler l'endpoint pour voir l'URI généré
curl http://localhost:8000/api/v1/auth/google

# La réponse contient auth_url avec le redirect_uri utilisé
```

### 4. Vérifier dans Google Cloud Console

1. Allez dans **APIs & Services** > **Credentials**
2. Ouvrez votre OAuth 2.0 Client ID
3. Vérifiez que l'URI dans **Authorized redirect URIs** correspond exactement à celui utilisé par le backend

## Erreur spécifique : Guillemets dans l'URI

### ❌ Erreur : `invalid_request` avec guillemet dans l'URI

**Symptôme** :
```
Erreur 400 : invalid_request
redirect_uri=https://example.com"/api/v1/auth/google/callback
```

**Cause** : La variable d'environnement `GOOGLE_REDIRECT_URI` contient un guillemet supplémentaire, souvent causé par :
- Copier-coller avec guillemets depuis un fichier
- Configuration incorrecte dans Railway/Heroku/etc.
- Guillemets ajoutés automatiquement par certains outils

**Solution** :

1. **Vérifier dans Railway** :
   - Allez dans votre projet Railway
   - Ouvrez les variables d'environnement
   - Vérifiez `GOOGLE_REDIRECT_URI`
   - Assurez-vous qu'il n'y a **PAS de guillemets** autour de la valeur
   
   ❌ **Incorrect** :
   ```
   GOOGLE_REDIRECT_URI="https://example.com/api/v1/auth/google/callback"
   ```
   
   ✅ **Correct** :
   ```
   GOOGLE_REDIRECT_URI=https://example.com/api/v1/auth/google/callback
   ```

2. **Le code nettoie automatiquement** : Le code a été mis à jour pour supprimer automatiquement les guillemets, mais il est préférable de corriger la variable d'environnement à la source.

3. **Redéployer** : Après correction, redéployez votre service pour que les changements prennent effet.

## Erreurs courantes

### ❌ Erreur : Trailing slash

**Problème** :
- Google Cloud : `https://api.example.com/api/v1/auth/google/callback/`
- Backend : `https://api.example.com/api/v1/auth/google/callback`

**Solution** : Supprimez le trailing slash dans Google Cloud Console

### ❌ Erreur : Protocole différent

**Problème** :
- Google Cloud : `http://api.example.com/api/v1/auth/google/callback`
- Backend : `https://api.example.com/api/v1/auth/google/callback`

**Solution** : Utilisez le même protocole (https en production)

### ❌ Erreur : Port manquant ou différent

**Problème** :
- Google Cloud : `http://localhost/api/v1/auth/google/callback`
- Backend : `http://localhost:8000/api/v1/auth/google/callback`

**Solution** : Incluez le port dans les deux configurations

### ❌ Erreur : Chemin différent

**Problème** :
- Google Cloud : `https://api.example.com/auth/google/callback`
- Backend : `https://api.example.com/api/v1/auth/google/callback`

**Solution** : Le chemin doit être exactement `/api/v1/auth/google/callback`

## Configuration par environnement

### Développement local

```bash
# .env.local ou variables d'environnement
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
# OU
BASE_URL=http://localhost:8000
```

Dans Google Cloud Console, ajoutez :
```
http://localhost:8000/api/v1/auth/google/callback
```

### Production (Railway, Heroku, etc.)

```bash
# Variables d'environnement dans votre plateforme
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://votre-backend.railway.app/api/v1/auth/google/callback
# OU
BASE_URL=https://votre-backend.railway.app
```

Dans Google Cloud Console, ajoutez :
```
https://votre-backend.railway.app/api/v1/auth/google/callback
```

### Production avec domaine personnalisé

```bash
# Variables d'environnement
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://api.votredomaine.com/api/v1/auth/google/callback
# OU
BASE_URL=https://api.votredomaine.com
```

Dans Google Cloud Console, ajoutez :
```
https://api.votredomaine.com/api/v1/auth/google/callback
```

## Diagnostic avancé

### Vérifier l'URI exact utilisé

1. **Via les logs** : Les logs du backend affichent l'URI exact utilisé
2. **Via l'endpoint** : Appelez `/api/v1/auth/google` et inspectez l'URL générée
3. **Via le code** : Le code construit l'URI à la ligne 734 de `backend/app/api/v1/endpoints/auth.py`

### Script de vérification

Créez un script pour vérifier la configuration :

```python
# check_google_oauth_config.py
import os
from urllib.parse import urlparse

GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
BASE_URL = os.getenv("BASE_URL", "")

if GOOGLE_REDIRECT_URI:
    redirect_uri = GOOGLE_REDIRECT_URI
elif BASE_URL:
    redirect_uri = f"{BASE_URL.rstrip('/')}/api/v1/auth/google/callback"
else:
    redirect_uri = "http://localhost:8000/api/v1/auth/google/callback"

print(f"Redirect URI utilisé: {redirect_uri}")
print(f"\nVérifiez que cet URI est configuré dans Google Cloud Console:")
print(f"1. Allez sur https://console.cloud.google.com/")
print(f"2. APIs & Services > Credentials")
print(f"3. Ouvrez votre OAuth 2.0 Client ID")
print(f"4. Ajoutez dans 'Authorized redirect URIs':")
print(f"   {redirect_uri}")
```

## Résumé des étapes

1. ✅ Déterminez l'URI exact utilisé par votre backend (via logs ou endpoint)
2. ✅ Configurez exactement le même URI dans Google Cloud Console
3. ✅ Définissez `GOOGLE_REDIRECT_URI` ou `BASE_URL` dans vos variables d'environnement
4. ✅ Vérifiez qu'il n'y a pas de trailing slash, que le protocole correspond, etc.
5. ✅ Testez la connexion Google OAuth

## Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez les logs détaillés du backend pour voir l'URI exact utilisé
2. Comparez caractère par caractère avec celui dans Google Cloud Console
3. Vérifiez que vous utilisez le bon OAuth Client ID (développement vs production)
4. Assurez-vous que le domaine est vérifié dans Google Cloud Console (pour les domaines personnalisés)
