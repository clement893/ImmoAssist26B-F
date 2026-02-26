# Guide Étape par Étape : Résoudre l'Erreur 404 Agent

## 🎯 Objectif

Vérifier et corriger l'erreur 404 pour l'endpoint `/api/external/agent/chat`

---

## 📋 Étape 1 : Vérifier que le serveur agent est accessible

### Test de base

```bash
curl https://immoassist-agent.railway.app
```

**Résultat attendu** : Une réponse HTTP (peu importe le code, tant qu'il n'y a pas d'erreur de connexion)

**Si erreur de connexion** :
- ❌ Le serveur agent n'est pas déployé ou n'est pas accessible
- ✅ **Action** : Vérifiez le déploiement sur Railway

---

## 📋 Étape 2 : Vérifier l'endpoint exact

### Test de l'endpoint

```bash
curl -v -X POST https://immoassist-agent.railway.app/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: VOTRE_CLE_API" \
  -d '{"message": "test"}'
```

**Options importantes** :
- `-v` : Mode verbeux pour voir tous les détails
- Notez le code HTTP retourné

**Codes HTTP possibles** :
- `200 OK` : ✅ L'endpoint fonctionne
- `401 Unauthorized` : ✅ L'endpoint existe mais l'API key est incorrecte
- `404 Not Found` : ❌ L'endpoint n'existe pas → Continuez avec les étapes suivantes
- `500 Internal Server Error` : ✅ L'endpoint existe mais il y a une erreur serveur

---

## 📋 Étape 3 : Vérifier la structure des URLs dans Django

### 3.1 Vérifier le fichier principal urls.py

**Fichier** : `[projet_django]/[nom_projet]/urls.py` (fichier principal)

**Vérifier** :
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # ... autres routes ...
    
    # IMPORTANT : Inclure les routes de l'agent
    path('', include('nom_de_votre_app.urls')),  # ou le nom de votre app
]
```

### 3.2 Vérifier le fichier urls.py de votre app

**Fichier** : `[projet_django]/[nom_app]/urls.py`

**Doit contenir** :
```python
from django.urls import path
from . import views

urlpatterns = [
    # Routes de l'agent - EXACTEMENT comme ci-dessous
    path('api/external/agent/chat', views.agent_chat, name='agent_chat'),
    path('api/external/agent/chat/voice', views.agent_chat_voice, name='agent_chat_voice'),
]
```

**⚠️ Points critiques** :
1. **Pas de trailing slash** : `'api/external/agent/chat'` et non `'api/external/agent/chat/'`
2. **Ordre important** : Routes spécifiques AVANT routes génériques
3. **Import correct** : `from . import views` doit fonctionner

---

## 📋 Étape 4 : Vérifier que les vues existent

### 4.1 Vérifier views.py

**Fichier** : `[projet_django]/[nom_app]/views.py`

**Doit contenir** :
```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

@api_view(["POST"])
def agent_chat(request):
    # Vérifier l'API key
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != settings.AGENT_API_KEY:
        return Response(
            {"error": "Invalid or missing X-API-Key"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Votre logique ici
    message = request.data.get("message")
    # ...
    
    return Response({
        "success": True,
        "response": "Réponse de test",
        "session_id": "test-session",
    })

@api_view(["POST"])
def agent_chat_voice(request):
    # Votre logique ici
    pass
```

### 4.2 Vérifier que les vues sont importables

**Test dans le shell Django** :
```bash
python manage.py shell
```

```python
from nom_de_votre_app import views
print(views.agent_chat)
print(views.agent_chat_voice)
```

**Résultat attendu** : Les fonctions s'affichent sans erreur

---

## 📋 Étape 5 : Vérifier l'ordre des routes

### Problème courant

Si vous avez des routes génériques qui capturent les requêtes avant d'arriver à votre endpoint :

```python
# ❌ MAUVAIS - Route générique capture tout
urlpatterns = [
    path('api/', include('other_app.urls')),  # Capture /api/external/agent/chat
    path('api/external/agent/chat', views.agent_chat),  # Jamais atteint
]

# ✅ BON - Routes spécifiques en premier
urlpatterns = [
    path('api/external/agent/chat', views.agent_chat),  # Match en premier
    path('api/external/agent/chat/voice', views.agent_chat_voice),
    path('api/', include('other_app.urls')),  # Routes génériques après
]
```

---

## 📋 Étape 6 : Vérifier les middlewares

### Vérifier settings.py

**Fichier** : `[projet_django]/[nom_projet]/settings.py`

**Vérifier** :
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Si vous utilisez CORS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # ...
]
```

**⚠️ Si vous utilisez CSRF** :
- Soit désactiver CSRF pour ces endpoints spécifiques
- Soit utiliser `@csrf_exempt` sur les vues

```python
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(["POST"])
def agent_chat(request):
    # ...
```

---

## 📋 Étape 7 : Vérifier les logs Django

### 7.1 Activer le mode DEBUG temporairement

**settings.py** :
```python
DEBUG = True  # Temporairement pour voir les erreurs
```

### 7.2 Vérifier les logs

**Sur Railway** :
1. Allez dans votre service agent
2. Onglet "Logs"
3. Recherchez :
   - `urlpatterns`
   - `agent_chat`
   - `404`
   - `Not Found`

**En local** :
```bash
python manage.py runserver
# Ensuite, faites une requête et regardez les logs
```

---

## 📋 Étape 8 : Test complet local

### 8.1 Démarrer le serveur local

```bash
cd [votre_projet_django]
python manage.py runserver
```

### 8.2 Tester l'endpoint local

```bash
curl -X POST http://localhost:8000/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle-api" \
  -d '{"message": "test"}'
```

**Si ça fonctionne en local mais pas sur Railway** :
- ✅ Le code est correct
- ❌ Problème de déploiement ou de configuration Railway

---

## 📋 Étape 9 : Vérifier le déploiement Railway

### 9.1 Vérifier que le code est déployé

1. Allez sur Railway → Votre service agent
2. Vérifiez que le dernier déploiement est récent
3. Vérifiez les logs de build pour voir s'il y a des erreurs

### 9.2 Vérifier les variables d'environnement

**Railway → Service agent → Variables** :
- `AGENT_API_KEY` doit être défini
- `OPENAI_API_KEY` doit être défini (si vous utilisez OpenAI)
- `DJANGO_SECRET_KEY` doit être défini
- `DATABASE_URL` doit être défini (si vous utilisez une DB)

### 9.3 Vérifier les migrations

Si vous utilisez une base de données, vérifiez que les migrations sont appliquées :

**Dans Railway** :
- Vérifiez les logs pour voir si les migrations sont exécutées
- Ou ajoutez une commande de migration dans votre processus de démarrage

---

## 📋 Étape 10 : Solution de contournement temporaire

### Créer un endpoint de test simple

**views.py** :
```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["POST"])
def agent_chat_test(request):
    """Endpoint de test simple pour vérifier que le routing fonctionne"""
    return JsonResponse({
        "success": True,
        "message": "Endpoint accessible",
        "path": request.path,
        "method": request.method,
    })
```

**urls.py** :
```python
urlpatterns = [
    path('api/external/agent/chat/test', views.agent_chat_test, name='agent_chat_test'),
    path('api/external/agent/chat', views.agent_chat, name='agent_chat'),
    # ...
]
```

**Tester** :
```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat/test \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Si le test fonctionne** : Le routing fonctionne, le problème est dans la vue `agent_chat`
**Si le test ne fonctionne pas** : Le problème est dans le routing

---

## 🔧 Checklist de vérification finale

Avant de redéployer, vérifiez :

- [ ] Les routes sont dans `urls.py` avec le bon chemin
- [ ] Les vues existent dans `views.py`
- [ ] Les vues sont importables (test dans le shell Django)
- [ ] L'ordre des routes est correct (spécifiques avant génériques)
- [ ] CSRF est géré (soit désactivé, soit `@csrf_exempt`)
- [ ] Les variables d'environnement sont configurées
- [ ] Le code fonctionne en local
- [ ] Le serveur a été redémarré après les modifications
- [ ] Les logs ne montrent pas d'erreurs

---

## 🚀 Après correction

1. **Commit et push** vos modifications
2. **Attendez le redéploiement** sur Railway
3. **Testez à nouveau** l'endpoint
4. **Vérifiez les logs** Railway pour confirmer

---

## 💡 Si rien ne fonctionne

1. **Créez un endpoint minimal** pour tester le routing
2. **Vérifiez les logs complets** Railway
3. **Testez en local** pour isoler le problème
4. **Vérifiez la documentation Django** sur le routing
