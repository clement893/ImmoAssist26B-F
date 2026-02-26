# Guide d'Implémentation de l'API Agent (Django)

Ce guide fournit les instructions complètes pour implémenter l'API agent externe qui communique avec ImmoAssist.

---

## 📋 Vue d'ensemble

L'agent Django doit exposer **2 endpoints** pour recevoir les requêtes du backend ImmoAssist :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/external/agent/chat` | POST | Chat texte |
| `/api/external/agent/chat/voice` | POST | Chat vocal (audio) |

---

## 🔐 1. Authentification

Toutes les requêtes incluent un header d'authentification :

```
X-API-Key: <AGENT_API_KEY>
```

### Implémentation Django

```python
# settings.py
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "")

# utils/auth.py
def check_api_key(request):
    """Vérifie le header X-API-Key"""
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != settings.AGENT_API_KEY:
        return Response(
            {"error": "Invalid or missing X-API-Key"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    return None
```

---

## 💬 2. Endpoint Chat Texte

### URL
```
POST /api/external/agent/chat
```

### Headers reçus
- `Content-Type: application/json`
- `X-API-Key: <AGENT_API_KEY>`

### Corps JSON (Request)

```json
{
  "message": "Bonjour, quelle est la procédure pour une vente ?",
  "session_id": "uuid-optionnel",
  "conversation_id": null
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `message` | string | ✅ Oui | Message de l'utilisateur |
| `session_id` | string | ❌ Non | ID de session (nouvelle ou existante) |
| `conversation_id` | int | ❌ Non | ID de conversation existante |

### Réponse attendue (200 OK)

```json
{
  "success": true,
  "response": "Voici les étapes principales pour une vente immobilière...",
  "session_id": "uuid-session",
  "conversation_id": 42,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "assistant_audio_url": null
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `success` | boolean | ✅ Oui | `true` si OK |
| `response` | string | ✅ Oui | Réponse texte de l'assistant |
| `session_id` | string | ✅ Oui | ID de session (réutiliser ou créer) |
| `conversation_id` | int | ❌ Non | ID de conversation |
| `model` | string | ❌ Non | Modèle utilisé (ex: "gpt-4o-mini") |
| `provider` | string | ❌ Non | Fournisseur (ex: "openai", "anthropic") |
| `assistant_audio_url` | string | ❌ Non | URL d'un audio TTS (optionnel) |

### Réponse en cas d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur explicite"
}
```

### Code Django (DRF)

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

@api_view(["POST"])
def agent_chat(request):
    # Vérifier l'authentification
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != settings.AGENT_API_KEY:
        return Response(
            {"error": "Invalid or missing X-API-Key"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Valider les données
    message = request.data.get("message")
    if not message:
        return Response(
            {"success": False, "error": "message is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    session_id = request.data.get("session_id")
    conversation_id = request.data.get("conversation_id")
    
    # Appeler votre service LLM/Agent
    try:
        # Exemple avec OpenAI
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es Léa, une assistante immobilière experte."},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
        )
        
        response_text = response.choices[0].message.content
        
        # Créer ou récupérer la session
        if not session_id:
            import uuid
            session_id = str(uuid.uuid4())
        
        return Response({
            "success": True,
            "response": response_text,
            "session_id": session_id,
            "conversation_id": conversation_id,
            "model": "gpt-4o-mini",
            "provider": "openai",
        })
        
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## 🎤 3. Endpoint Chat Vocal

### URL
```
POST /api/external/agent/chat/voice
```

### Headers reçus
- `Content-Type: multipart/form-data`
- `X-API-Key: <AGENT_API_KEY>`

### Corps multipart/form-data

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `audio` ou `file` | fichier | ✅ Oui | Audio enregistré (webm, mp4 ou ogg) |
| `session_id` | string | ❌ Non | ID de session |
| `conversation_id` | string | ❌ Non | ID de conversation |
| `user_id` | string | ❌ Non | ID utilisateur ImmoAssist |
| `user_email` | string | ❌ Non | Email utilisateur |

> **Note** : Le champ fichier peut s'appeler `audio` ou `file` selon la configuration côté ImmoAssist (`AGENT_VOICE_FIELD`). Vérifiez les deux.

### Réponse attendue (200 OK)

```json
{
  "success": true,
  "transcription": "Bonjour, quelle est la procédure pour une vente ?",
  "response": "Voici les étapes principales...",
  "session_id": "uuid-session",
  "conversation_id": 42,
  "assistant_audio_url": "https://storage.example.com/audio/reponse-123.mp3"
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `success` | boolean | ✅ Oui | `true` si OK |
| `transcription` | string | ✅ Oui | Texte transcrit de l'audio utilisateur |
| `response` | string | ✅ Oui | Réponse texte de l'assistant |
| `session_id` | string | ✅ Oui | ID de session |
| `conversation_id` | int | ❌ Non | ID de conversation |
| `assistant_audio_url` | string | ❌ Non | URL TTS pour lecture dans le navigateur |

### Réponse en cas d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur explicite"
}
```

### Code Django (DRF)

```python
@api_view(["POST"])
def agent_chat_voice(request):
    # Vérifier l'authentification
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != settings.AGENT_API_KEY:
        return Response(
            {"error": "Invalid or missing X-API-Key"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Récupérer le fichier audio (vérifier les deux noms possibles)
    audio_file = request.FILES.get("audio") or request.FILES.get("file")
    if not audio_file:
        return Response(
            {"success": False, "error": "audio or file is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    session_id = request.POST.get("session_id")
    conversation_id = request.POST.get("conversation_id")
    user_id = request.POST.get("user_id")
    user_email = request.POST.get("user_email")
    
    try:
        # 1. Transcrire l'audio (Whisper, etc.)
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        transcription_response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="fr"
        )
        transcription = transcription_response.text
        
        # 2. Obtenir la réponse du LLM
        chat_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es Léa, une assistante immobilière experte."},
                {"role": "user", "content": transcription}
            ],
            temperature=0.7,
        )
        response_text = chat_response.choices[0].message.content
        
        # 3. (Optionnel) Générer un audio TTS
        assistant_audio_url = None
        # Exemple avec OpenAI TTS
        # tts_response = client.audio.speech.create(
        #     model="tts-1",
        #     voice="alloy",
        #     input=response_text
        # )
        # Sauvegarder l'audio et obtenir l'URL
        
        # Créer ou récupérer la session
        if not session_id:
            import uuid
            session_id = str(uuid.uuid4())
        
        return Response({
            "success": True,
            "transcription": transcription,
            "response": response_text,
            "session_id": session_id,
            "conversation_id": int(conversation_id) if conversation_id else None,
            "assistant_audio_url": assistant_audio_url,
        })
        
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## 🔗 4. Configuration des URLs

### urls.py

```python
from django.urls import path
from . import views

urlpatterns = [
    path("api/external/agent/chat", views.agent_chat, name="agent_chat"),
    path("api/external/agent/chat/voice", views.agent_chat_voice, name="agent_chat_voice"),
]
```

---

## 🎵 5. Formats audio supportés

L'enregistrement côté frontend utilise `MediaRecorder`, typiquement :

- `audio/webm` (Chrome, Firefox)
- `audio/mp4` (Safari)
- `audio/ogg` (fallback)

L'agent doit accepter au moins un de ces formats. OpenAI Whisper supporte tous ces formats.

---

## ⚙️ 6. Variables d'environnement

### Côté Agent (Django)

```env
# Clé API partagée avec ImmoAssist
AGENT_API_KEY=your-secret-api-key-here

# Clés API pour les services LLM
OPENAI_API_KEY=sk-...
# ou
ANTHROPIC_API_KEY=sk-ant-...
```

### Côté ImmoAssist (Backend)

```env
# URL de l'agent
AGENT_API_URL=https://immoassist-agent.railway.app

# Clé API (identique à AGENT_API_KEY côté agent)
AGENT_API_KEY=your-secret-api-key-here

# Nom du champ pour l'audio (optionnel, défaut: "audio")
AGENT_VOICE_FIELD=audio
```

---

## ✅ 7. Checklist de mise en place

- [ ] Endpoint `POST /api/external/agent/chat` implémenté
- [ ] Endpoint `POST /api/external/agent/chat/voice` implémenté
- [ ] Authentification par `X-API-Key` vérifiée
- [ ] Champ fichier accepté sous le nom `audio` (ou `file` si configuré)
- [ ] Réponse JSON avec `success`, `response`, `session_id`
- [ ] Pour la voix : `transcription` et `response` renvoyés
- [ ] CORS autorisé pour les origines ImmoAssist (si applicable)
- [ ] Variable `AGENT_API_KEY` identique des deux côtés
- [ ] Gestion des erreurs avec `success: false` et `error`
- [ ] Support des formats audio (webm, mp4, ogg)

---

## 🧪 8. Tests

### Test Chat Texte

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "message": "Bonjour, test de l\'API",
    "session_id": "test-session-123"
  }'
```

### Test Chat Vocal

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat/voice \
  -H "X-API-Key: your-secret-api-key" \
  -F "audio=@test-audio.webm" \
  -F "session_id=test-session-123" \
  -F "user_id=1" \
  -F "user_email=test@example.com"
```

---

## 🐛 9. Dépannage

### Erreur 404 Not Found
- Vérifier que les URLs sont exactement `/api/external/agent/chat` et `/api/external/agent/chat/voice`
- Vérifier que les routes sont bien enregistrées dans `urls.py`

### Erreur 401 Unauthorized
- Vérifier que `AGENT_API_KEY` est identique des deux côtés
- Vérifier que le header `X-API-Key` est bien envoyé

### Erreur 400 Bad Request (chat vocal)
- Vérifier que le champ fichier s'appelle `audio` ou `file`
- Vérifier que le format audio est supporté (webm, mp4, ogg)
- Vérifier que tous les champs requis sont présents

### Erreur 500 Internal Server Error
- Vérifier les logs du serveur agent
- Vérifier que les clés API LLM sont configurées
- Vérifier que les services (OpenAI, Whisper, etc.) sont accessibles

---

## 📚 10. Ressources

- Documentation OpenAI API: https://platform.openai.com/docs
- Documentation Anthropic API: https://docs.anthropic.com
- Documentation Django REST Framework: https://www.django-rest-framework.org/

---

## 📝 Notes importantes

1. **Session ID** : Si aucun `session_id` n'est fourni, l'agent doit en créer un nouveau (UUID)
2. **Conversation ID** : Peut être `null` pour une nouvelle conversation
3. **Gestion d'erreurs** : Toujours retourner `{"success": false, "error": "..."}` en cas d'erreur
4. **CORS** : Si l'agent est appelé depuis le frontend directement, configurer CORS
5. **Timeout** : Les requêtes peuvent prendre du temps (transcription + LLM), prévoir des timeouts appropriés
