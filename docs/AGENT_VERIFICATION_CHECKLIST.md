# Checklist de Vérification - Intégration Agent ImmoAssist

Ce document permet de vérifier que l'intégration entre ImmoAssist et l'agent Django est correctement configurée et fonctionnelle.

---

## ✅ 1. Vérification côté Agent (Django)

### Routes configurées
- [x] `POST /api/external/agent/chat` implémenté
- [x] `POST /api/external/agent/chat/voice` implémenté
- [x] `GET /api/external/agent/health` implémenté (optionnel mais recommandé)

### Authentification
- [x] Vérification du header `X-API-Key`
- [x] Support optionnel de `Authorization: Bearer`
- [x] Retourne `401 Unauthorized` si invalide

### Endpoint Chat Texte
- [x] URL correcte : `/api/external/agent/chat`
- [x] Méthode : `POST`
- [x] Accepte : `message` (requis), `session_id` (optionnel), `conversation_id` (optionnel)
- [x] Réponse JSON avec :
  - `success: true`
  - `response` (texte)
  - `session_id` (UUID généré si absent)
  - `conversation_id`
  - `model: "gpt-4o-mini"`
  - `provider: "openai"`
  - `assistant_audio_url` (optionnel)
- [x] Gestion d'erreurs : `{"success": false, "error": "..."}`

### Endpoint Chat Vocal
- [x] URL correcte : `/api/external/agent/chat/voice`
- [x] Méthode : `POST`
- [x] Accepte : fichier audio sous `audio` ou `file`
- [x] Accepte : `session_id`, `conversation_id`, `user_id`, `user_email` (optionnels)
- [x] Transcription avec Whisper
- [x] Réponse JSON avec :
  - `success: true`
  - `transcription` (texte transcrit)
  - `response` (texte)
  - `session_id`
  - `conversation_id`
  - `assistant_audio_url` (optionnel)
- [x] Gestion d'erreurs : `{"success": false, "error": "..."}`

### Formats audio
- [x] Support des formats `webm`, `mp4`, `ogg` via Whisper

### Configuration
- [x] Variable `AGENT_API_KEY` dans `settings.py`
- [x] Variable `AGENT_API_BASE_URL` pour les URLs absolues (optionnel)
- [x] Variable `OPENAI_API_KEY` configurée

---

## ✅ 2. Vérification côté ImmoAssist (Backend)

### Variables d'environnement
- [ ] `AGENT_API_URL` défini (ex: `https://immoassist-agent.railway.app`)
- [ ] `AGENT_API_KEY` défini (identique à celui de l'agent)
- [ ] `AGENT_VOICE_FIELD` défini si nécessaire (défaut: `"audio"`)

### Configuration Railway
- [ ] Variables ajoutées dans Railway → Backend → Variables
- [ ] `AGENT_API_URL` pointe vers l'URL correcte de l'agent
- [ ] `AGENT_API_KEY` est identique à celui configuré côté agent

---

## 🧪 3. Tests de connexion

### Test 1 : Health Check (si disponible)

```bash
curl -X GET https://immoassist-agent.railway.app/api/external/agent/health \
  -H "X-API-Key: votre-cle-api"
```

**Résultat attendu** : `200 OK` avec un JSON de statut

### Test 2 : Chat Texte

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle-api" \
  -d '{
    "message": "Bonjour, test de l'\''API"
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "response": "...",
  "session_id": "uuid-généré",
  "conversation_id": null,
  "model": "gpt-4o-mini",
  "provider": "openai",
  "assistant_audio_url": null
}
```

### Test 3 : Chat Texte avec session_id

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle-api" \
  -d '{
    "message": "Deuxième message",
    "session_id": "test-session-123"
  }'
```

**Résultat attendu** : Même structure, avec `session_id: "test-session-123"`

### Test 4 : Chat Vocal (nécessite un fichier audio)

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat/voice \
  -H "X-API-Key: votre-cle-api" \
  -F "audio=@test-audio.webm" \
  -F "session_id=test-session-123" \
  -F "user_id=1" \
  -F "user_email=test@example.com"
```

**Résultat attendu** :
```json
{
  "success": true,
  "transcription": "Texte transcrit de l'audio",
  "response": "Réponse de l'assistant",
  "session_id": "test-session-123",
  "conversation_id": null,
  "assistant_audio_url": null
}
```

### Test 5 : Erreur d'authentification

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mauvaise-cle" \
  -d '{"message": "Test"}'
```

**Résultat attendu** : `401 Unauthorized`

### Test 6 : Erreur de validation

```bash
curl -X POST https://immoassist-agent.railway.app/api/external/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle-api" \
  -d '{}'
```

**Résultat attendu** : `400 Bad Request` avec `{"success": false, "error": "message is required"}`

---

## 🔍 4. Vérification depuis ImmoAssist

### Test depuis l'interface web

1. **Ouvrir** : `https://immoassist26b-f-production.up.railway.app/fr/dashboard/lea`
2. **Tester le chat texte** :
   - Taper un message dans le champ de texte
   - Cliquer sur "Envoyer"
   - Vérifier que la réponse s'affiche

3. **Tester le chat vocal** :
   - Cliquer sur le bouton "Parlez à Léa"
   - Autoriser l'accès au microphone
   - Parler un message
   - Vérifier que la transcription et la réponse s'affichent

### Vérification des logs

**Côté Backend ImmoAssist** :
- Vérifier les logs Railway pour voir les requêtes vers l'agent
- Vérifier qu'il n'y a pas d'erreurs 404, 401, ou 500

**Côté Agent Django** :
- Vérifier les logs pour voir les requêtes reçues
- Vérifier que les réponses sont générées correctement

---

## 🐛 5. Dépannage

### Erreur 404 Not Found

**Symptôme** : `Client error '404 Not Found' for url 'https://immoassist-agent.railway.app/api/external/agent/chat'`

**Solutions** :
1. Vérifier que les routes sont bien configurées dans `urls.py`
2. Vérifier que l'URL de base est correcte (sans trailing slash)
3. Vérifier que le serveur agent est bien déployé et accessible

### Erreur 401 Unauthorized

**Symptôme** : `401 Unauthorized` ou `Invalid X-API-Key`

**Solutions** :
1. Vérifier que `AGENT_API_KEY` est identique des deux côtés
2. Vérifier que le header `X-API-Key` est bien envoyé
3. Vérifier que la variable d'environnement est bien définie dans Railway

### Erreur 400 Bad Request

**Symptôme** : `400 Bad Request` avec `message is required`

**Solutions** :
1. Vérifier que le champ `message` est bien présent dans la requête
2. Vérifier le format JSON de la requête

### Erreur 500 Internal Server Error

**Symptôme** : `500 Internal Server Error` côté agent

**Solutions** :
1. Vérifier les logs de l'agent pour voir l'erreur exacte
2. Vérifier que `OPENAI_API_KEY` est configuré côté agent
3. Vérifier que les services LLM sont accessibles

### Le bouton vocal ne fonctionne pas

**Symptôme** : Le bouton "Parlez à Léa" ne fait rien

**Solutions** :
1. Vérifier la console du navigateur pour les erreurs
2. Vérifier que la reconnaissance vocale est supportée par le navigateur
3. Vérifier que les permissions microphone sont accordées
4. Vérifier que l'endpoint `/api/external/agent/chat/voice` fonctionne avec curl

---

## 📋 6. Checklist finale

### Configuration
- [ ] `AGENT_API_URL` configuré dans Railway (Backend)
- [ ] `AGENT_API_KEY` configuré dans Railway (Backend) et identique côté agent
- [ ] `AGENT_VOICE_FIELD` configuré si nécessaire
- [ ] `OPENAI_API_KEY` configuré côté agent

### Tests
- [ ] Health check fonctionne
- [ ] Chat texte fonctionne depuis curl
- [ ] Chat texte fonctionne depuis l'interface web
- [ ] Chat vocal fonctionne depuis curl
- [ ] Chat vocal fonctionne depuis l'interface web
- [ ] Gestion d'erreurs fonctionne (401, 400, 500)

### Déploiement
- [ ] Agent déployé et accessible
- [ ] Backend ImmoAssist déployé avec les bonnes variables
- [ ] Pas d'erreurs dans les logs

---

## 🎉 7. Validation finale

Une fois tous les tests passés :

1. ✅ L'agent répond correctement aux requêtes
2. ✅ L'authentification fonctionne
3. ✅ Le chat texte fonctionne
4. ✅ Le chat vocal fonctionne
5. ✅ Les erreurs sont gérées correctement
6. ✅ L'interface web ImmoAssist peut communiquer avec l'agent

**L'intégration est complète et fonctionnelle !** 🚀
