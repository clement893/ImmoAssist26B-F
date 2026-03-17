# Dépannage : Erreur 404 - Agent endpoint not found

## 🔴 Problème

Vous recevez l'erreur :
```
❌ Erreur: Léa service error: 502: Agent endpoint not found (404): 
https://immoassist-agent.railway.app/api/external/agent/chat. 
Please verify that the agent server has the endpoint POST /api/external/agent/chat implemented.
```

## 🔍 Diagnostic

### Étape 1 : Vérifier que l'URL de base est accessible

```bash
curl https://immoassist-agent.railway.app
```

**Résultat attendu** : Une réponse HTTP (200, 301, 302, etc.) - pas d'erreur de connexion

**Si erreur de connexion** :
- Le serveur agent n'est pas déployé ou n'est pas accessible
- Vérifiez le déploiement sur Railway
- Vérifiez que le service agent est bien démarré

### Étape 2 : Vérifier que l'endpoint existe

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle-api" \
  -d '{"message": "test"}'
```

**Résultat attendu** : `200 OK` avec une réponse JSON

**Si 404** : L'endpoint n'existe pas → Voir solutions ci-dessous

**Si 401** : L'endpoint existe mais l'API key est incorrecte

**Si 500** : L'endpoint existe mais il y a une erreur serveur

## ✅ Solutions

### Solution 1 : Vérifier les routes dans urls.py

**Fichier** : `urls.py` de votre projet Django agent

**Vérifier que les routes sont bien configurées** :

```python
from django.urls import path
from . import views

urlpatterns = [
    # ... autres routes ...
    path('api/external/agent/chat', views.agent_chat, name='agent_chat'),
    path('api/external/agent/chat/voice', views.agent_chat_voice, name='agent_chat_voice'),
]
```

**⚠️ Points importants** :
- Les routes doivent être exactement `/api/external/agent/chat` (sans trailing slash dans la définition)
- Si vous utilisez un préfixe d'URL (ex: `/api/v1/`), ajustez en conséquence
- Vérifiez que les routes ne sont pas commentées

### Solution 2 : Vérifier que les vues existent

**Fichier** : `views.py` de votre projet Django agent

**Vérifier que les fonctions existent** :

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["POST"])
def agent_chat(request):
    # ... votre code ...
    pass

@api_view(["POST"])
def agent_chat_voice(request):
    # ... votre code ...
    pass
```

### Solution 3 : Vérifier l'ordre des routes

**Problème courant** : Une route plus générale capture la requête avant d'arriver à votre endpoint.

**Solution** : Placez les routes spécifiques **avant** les routes génériques :

```python
urlpatterns = [
    # Routes spécifiques EN PREMIER
    path('api/external/agent/chat', views.agent_chat),
    path('api/external/agent/chat/voice', views.agent_chat_voice),
    
    # Routes génériques APRÈS
    path('api/', include('other_app.urls')),
    # ...
]
```

### Solution 4 : Vérifier les logs du serveur agent

**Sur Railway** :
1. Allez dans votre service agent
2. Ouvrez l'onglet "Logs"
3. Recherchez les erreurs lors du démarrage
4. Vérifiez que les routes sont bien enregistrées

**Rechercher dans les logs** :
- `urlpatterns`
- `agent_chat`
- `api/external/agent/chat`
- Erreurs de routing

### Solution 5 : Tester localement

**Sur votre machine locale** :

1. Démarrez le serveur Django :
```bash
python manage.py runserver
```

2. Testez l'endpoint :
```bash
curl -X POST http://localhost:8000/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle-api" \
  -d '{"message": "test"}'
```

**Si ça fonctionne localement mais pas sur Railway** :
- Vérifiez que le code est bien déployé
- Vérifiez que les migrations sont appliquées
- Vérifiez les variables d'environnement

### Solution 6 : Vérifier le préfixe d'URL

**Si votre projet Django a un préfixe d'URL** (ex: `/api/v1/`), vous devez l'inclure :

**Dans urls.py** :
```python
urlpatterns = [
    path('api/v1/external/agent/chat', views.agent_chat),
]
```

**Dans ImmoAssist** :
```env
AGENT_API_URL=https://immoassist-agent.railway.app/api/v1
```

### Solution 7 : Vérifier les middlewares

**Vérifier que les middlewares ne bloquent pas les requêtes** :

**settings.py** :
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Si vous utilisez CORS
    'django.middleware.common.CommonMiddleware',
    # ...
]
```

### Solution 8 : Vérifier CORS (si applicable)

**Si l'agent est appelé depuis le frontend directement** :

**settings.py** :
```python
CORS_ALLOWED_ORIGINS = [
    "https://immoassist26b-f-production.up.railway.app",
    # ...
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-api-key',  # Important pour l'authentification
    'x-csrftoken',
    'x-requested-with',
]
```

## 🧪 Test de diagnostic complet

Utilisez le script de diagnostic :

```bash
chmod +x scripts/diagnose-agent-connection.sh
./scripts/diagnose-agent-connection.sh https://immoassist-agent.railway.app votre-cle-api
```

## 📋 Checklist de vérification

- [ ] Le serveur agent est déployé et accessible
- [ ] Les routes sont définies dans `urls.py`
- [ ] Les vues existent et sont importées
- [ ] L'ordre des routes est correct (spécifiques avant génériques)
- [ ] Le serveur agent a été redémarré après les modifications
- [ ] Les logs ne montrent pas d'erreurs de routing
- [ ] L'endpoint fonctionne en local
- [ ] Les variables d'environnement sont correctes
- [ ] CORS est configuré si nécessaire

## 🔗 Ressources

- [Guide d'implémentation complet](./AGENT_IMPLEMENTATION_GUIDE.md)
- [Exemple de code Django](./AGENT_DJANGO_EXAMPLE.py)
- [Checklist de vérification](./AGENT_VERIFICATION_CHECKLIST.md)

## 💡 Contact

Si le problème persiste après avoir vérifié tous les points ci-dessus :

1. Vérifiez les logs complets du serveur agent
2. Testez l'endpoint directement avec curl
3. Vérifiez que le code est identique à l'exemple fourni
4. Vérifiez que toutes les dépendances sont installées
