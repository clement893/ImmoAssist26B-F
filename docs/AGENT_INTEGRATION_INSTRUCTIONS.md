# Instructions pour l'Agent Externe (Léa)

Ce document décrit ce que l'API agent (immoassist-agent, Django) doit implémenter pour recevoir les requêtes du backend ImmoAssist et y répondre correctement.

---

## 1. Vue d'ensemble

| ImmoAssist (Frontend) | ImmoAssist (Backend) | Agent (Django) |
|----------------------|----------------------|----------------|
| Utilisateur tape ou parle | Envoie à l'API Léa | Reçoit et répond |
| POST /v1/lea/chat | → POST {AGENT_API_URL}/api/external/agent/chat | Texte |
| POST /v1/lea/chat/voice | → POST {AGENT_API_URL}/api/external/agent/chat/voice | Audio |

L'agent doit exposer ces deux endpoints et les protéger avec `AGENT_API_KEY`.

---

## 2. Authentification

Toutes les requêtes du backend ImmoAssist incluent :

```
X-API-Key: <AGENT_API_KEY>
```

L'agent doit :
1. Vérifier la présence du header `X-API-Key`
2. Comparer avec sa clé configurée
3. Rejeter avec `401 Unauthorized` si invalide ou absente

---

## 3. Endpoint 1 : Chat texte

### URL

```
POST /api/external/agent/chat
```

### Headers reçus

| Header | Valeur |
|--------|--------|
| `Content-Type` | `application/json` |
| `X-API-Key` | Clé partagée |

### Corps JSON (body)

```json
{
  "message": "Bonjour, quelle est la procédure pour une vente ?",
  "session_id": "uuid-optionnel",
  "conversation_id": null
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `message` | string | Oui | Message de l'utilisateur |
| `session_id` | string | Non | ID de session (nouvelle ou existante) |
| `conversation_id` | int | Non | ID de conversation existante |

### Réponse attendue (200 OK, JSON)

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
| `success` | boolean | Oui | `true` si OK |
| `response` | string | Oui | Réponse texte de l'assistant |
| `session_id` | string | Oui | ID de session (réutiliser ou créer) |
| `conversation_id` | int | Non | ID de conversation |
| `model` | string | Non | Modèle utilisé |
| `provider` | string | Non | Fournisseur (openai, anthropic...) |
| `assistant_audio_url` | string | Non | URL d'un audio TTS (optionnel) |

### En cas d'erreur (400, 500)

```json
{
  "success": false,
  "error": "Message d'erreur explicite"
}
```

---

## 4. Endpoint 2 : Chat vocal

### URL

```
POST /api/external/agent/chat/voice
```

### Headers reçus

| Header | Valeur |
|--------|--------|
| `Content-Type` | `multipart/form-data; boundary=...` |
| `X-API-Key` | Clé partagée |

### Corps multipart/form-data

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `audio` | fichier | Oui | Audio enregistré (webm, mp4 ou ogg) |
| `session_id` | string | Non | ID de session |
| `conversation_id` | string | Non | ID de conversation |
| `user_id` | string | Non | ID utilisateur ImmoAssist |
| `user_email` | string | Non | Email utilisateur |

> Le champ fichier peut s'appeler `audio` ou `file` selon la config côté ImmoAssist (`AGENT_VOICE_FIELD`).

### Réponse attendue (200 OK, JSON)

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
| `success` | boolean | Oui | `true` si OK |
| `transcription` | string | Oui | Texte transcrit de l'audio utilisateur |
| `response` | string | Oui | Réponse texte de l'assistant |
| `session_id` | string | Oui | ID de session |
| `conversation_id` | int | Non | ID de conversation |
| `assistant_audio_url` | string | Non | URL TTS pour lecture dans le navigateur |

### En cas d'erreur (400, 500)

```json
{
  "success": false,
  "error": "Message d'erreur explicite"
}
```

---

## 5. Exemple Django (DRF)

### Chat texte

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated  # ou custom
from rest_framework.response import Response
from rest_framework import status

def check_api_key(request):
    key = request.headers.get("X-API-Key")
    if not key or key != settings.AGENT_API_KEY:
        return Response(
            {"error": "Invalid or missing X-API-Key"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    return None

@api_view(["POST"])
def agent_chat(request):
    err = check_api_key(request)
    if err:
        return err
    
    message = request.data.get("message")
    if not message:
        return Response(
            {"success": False, "error": "message is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    session_id = request.data.get("session_id")
    conversation_id = request.data.get("conversation_id")
    
    # ... votre logique LLM / agent ...
    response_text = call_llm(message, session_id, conversation_id)
    
    return Response({
        "success": True,
        "response": response_text,
        "session_id": session_id or create_new_session_id(),
        "conversation_id": conversation_id,
        "model": "gpt-4o-mini",
        "provider": "openai",
    })
```

### Chat vocal

```python
@api_view(["POST"])
def agent_chat_voice(request):
    err = check_api_key(request)
    if err:
        return err
    
    # Le fichier est dans "audio" (ou "file" selon AGENT_VOICE_FIELD)
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
    
    # 1. Transcrire l'audio (Whisper, etc.)
    transcription = transcribe_audio(audio_file)
    
    # 2. Obtenir la réponse du LLM
    response_text = call_llm(transcription, session_id, conversation_id)
    
    # 3. (Optionnel) Générer un audio TTS
    assistant_audio_url = synthesize_speech(response_text)  # ou None
    
    return Response({
        "success": True,
        "transcription": transcription,
        "response": response_text,
        "session_id": session_id or create_new_session_id(),
        "conversation_id": conversation_id,
        "assistant_audio_url": assistant_audio_url,
    })
```

### urls.py

```python
urlpatterns = [
    path("api/external/agent/chat", agent_chat),
    path("api/external/agent/chat/voice", agent_chat_voice),
]
```

---

## 6. Formats audio supportés

L'enregistrement côté frontend utilise `MediaRecorder`, typiquement :

- `audio/webm` (Chrome, Firefox)
- `audio/mp4` (Safari)
- `audio/ogg` (fallback)

L'agent doit accepter au moins un de ces formats (idéalement via Whisper ou un service compatible).

---

## 7. Checklist de mise en place

- [ ] Endpoint `POST /api/external/agent/chat` implémenté
- [ ] Endpoint `POST /api/external/agent/chat/voice` implémenté
- [ ] Authentification par `X-API-Key`
- [ ] Champ fichier accepté sous le nom `audio` (ou `file` si configuré côté ImmoAssist)
- [ ] Réponse JSON avec `success`, `response`, `session_id`
- [ ] Pour la voix : `transcription` et `response` renvoyés
- [ ] CORS autorisé pour les origines ImmoAssist (si applicable)
- [ ] Variable `AGENT_API_KEY` identique des deux côtés
