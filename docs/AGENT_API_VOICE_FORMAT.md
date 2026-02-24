# Format attendu par l'API Agent pour le chat vocal

Le backend ImmoAssist transmet les messages vocaux à l'agent externe (`AGENT_API_URL`).

## Endpoint

```
POST {AGENT_API_URL}/api/external/agent/chat/voice
```

## Headers

- `X-API-Key`: `AGENT_API_KEY`
- `Content-Type`: `multipart/form-data` (géré automatiquement)

## Corps (multipart/form-data)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `audio` ou `file` | fichier | Oui | Fichier audio (webm, mp4, ogg) |
| `session_id` | string | Non | ID de session conversation |
| `conversation_id` | string | Non | ID de conversation |
| `user_id` | string | Non | ID utilisateur ImmoAssist |
| `user_email` | string | Non | Email utilisateur |

## Variable AGENT_VOICE_FIELD

Si l'agent attend le fichier sous le nom `file` au lieu de `audio`, définir :

```env
AGENT_VOICE_FIELD=file
```

## Réponse attendue (JSON)

```json
{
  "success": true,
  "transcription": "Texte transcrit...",
  "response": "Réponse de l'assistant...",
  "session_id": "...",
  "conversation_id": 123,
  "assistant_audio_url": "https://..." 
}
```

## Erreur 400 Bad Request

Si l'agent renvoie 400, vérifier :

1. **Nom du champ** : Essayer `AGENT_VOICE_FIELD=file`
2. **Format audio** : L'agent supporte-t-il `audio/webm` ?
3. **Champs requis** : L'agent attend-il d'autres champs obligatoires ?

Les logs backend incluent désormais la réponse brute de l'agent pour faciliter le débogage.
