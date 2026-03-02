# Rapport d'évaluation : Performance et connexion de Léa

**Date :** 1er mars 2026  
**Périmètre :** Backend (FastAPI), Frontend (Next.js), services IA (OpenAI/Anthropic), agent externe (Django).

---

## 1. Résumé exécutif

| Critère | État | Commentaire |
|--------|------|-------------|
| **Connexion Backend ↔ IA** | ✅ Bon | Intégré (OpenAI/Anthropic) prioritaire ; agent externe en secours avec timeouts explicites. |
| **Connexion Frontend ↔ Backend** | ⚠️ À renforcer | Streaming SSE sans timeout côté client ; pas de retry sur erreur réseau. |
| **Performance première réponse** | ❌ Problématique | Le client ne reçoit rien (même pas les en-têtes) avant la fin de tout le pipeline (actions + contexte + conversation). Voir § 7 et 8. |
| **Performance chaîne d’actions** | ⚠️ À surveiller | `run_lea_actions` + `get_lea_user_context` séquentiels ; plusieurs requêtes DB par message. |
| **Résilience** | ⚠️ Partielle | Pas de rate limit sur Léa ; pas de timeout sur le `fetch` stream côté front. |
| **Observabilité** | ✅ Correct | Logs backend ; métadonnées (model, provider, usage) renvoyées au client pour les logs IA. |

---

## 2. Architecture de connexion

### 2.1 Choix du mode (intégré vs agent externe)

- **Priorité 1 :** IA intégrée si `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` est défini (`_use_integrated_lea()`).
- **Priorité 2 :** Agent externe si `AGENT_API_URL` + `AGENT_API_KEY` sont définis (Django).
- **Streaming :** Uniquement en mode intégré. En mode agent externe, le chat non-streamé utilise `POST /api/external/agent/chat` (timeout 60 s).

### 2.2 Flux d’un message (mode intégré, stream)

1. **Frontend** : `useLea.sendMessage()` → `leaAPI.chatStream()` (fetch POST `/api/v1/lea/chat/stream`).
2. **Backend** :
   - `run_lea_actions(db, user_id, message, last_assistant_message)` — créations/mises à jour (transaction, adresse, formulaire OACIQ, contacts, prix, etc.).
   - `get_lea_user_context(db, user_id)` — construction du bloc « Données plateforme » (transactions, formulaires OACIQ, portail client).
   - `get_or_create_lea_conversation()` + `build_llm_messages_from_history()` — chargement de l’historique.
   - `StreamingResponse(_stream_lea_sse(...))` :
     - Envoi immédiat de `: ok\n\n` (évite 503 proxy).
     - Appel `AIService.stream_chat_completion()` (OpenAI stream ou Anthropic non-streamé).
     - Envoi des chunks `data: {"delta": "..."}\n\n` puis `data: {"done": true, "session_id", "actions", "model", "provider", "usage"}\n\n`.
     - Persistance des messages en base après le stream.
3. **Frontend** : lecture du body en stream, `onDelta` / `onDone` / `onError` ; mise à jour de l’UI et des métadonnées (actions, model, provider, usage).

### 2.3 Endpoints concernés

| Endpoint | Méthode | Rôle | Timeout (côté backend si appel externe) |
|----------|---------|------|----------------------------------------|
| `/v1/lea/chat/stream` | POST | Chat streamé (intégré) | Aucun (stream illimité) |
| `/v1/lea/chat` | POST | Chat non streamé (intégré ou agent) | Agent : 60 s (httpx) |
| `/v1/lea/chat/voice` | POST | Vocal (Whisper + LLM + TTS ou agent) | Agent : 90 s (httpx) |
| `/v1/lea/context` | GET | Contexte / historique par session | - |
| `/v1/lea/capabilities/check` | POST | Vérification capacité (ex. agent) | 10 s (httpx) |

---

## 3. Performance

### 3.1 Points forts

- **Premier octet dans le générateur** : le code fait bien `yield ": ok\n\n"` en tête du générateur SSE, mais en FastAPI le générateur ne s’exécute qu’une fois la réponse renvoyée au client. Or la route ne retourne `StreamingResponse(...)` qu’**après** avoir exécuté tout le pipeline (run_lea_actions, get_lea_user_context, get_or_create_lea_conversation, etc.). Donc le client n’a aucun octet ni même les en-têtes HTTP avant la fin de ce travail — d’où une sensation de « blocage » ou de lenteur. Voir § 8 (fluidité).
- **Streaming token par token** : OpenAI en mode stream ; l’utilisateur voit la réponse apparaître progressivement.
- **Contexte et actions en une passe** : Contexte plateforme + actions effectuées injectés une fois dans le system prompt ; pas d’aller-retour supplémentaire pour « appliquer » les actions.
- **Confirmation sans LLM** : En cas de création de transaction, une confirmation fixe est streamée sans appel IA, ce qui est rapide et prévisible.
- **Config tokens** : `LEA_MAX_TOKENS` (défaut 256, max 1024) limite la longueur des réponses et donc le temps de génération.

### 3.2 Goulots potentiels

- **Séquence synchrone avant le stream**  
  Avant d’envoyer le premier octet, le backend exécute :
  - `run_lea_actions()` : plusieurs traitements (création transaction, adresse, géocodage, formulaire OACIQ, contacts, prix, date de clôture, etc.) et plusieurs requêtes DB.
  - `get_lea_user_context()` : plusieurs `select` (transactions, formulaires OACIQ, référentiel forms, portail client).
  - `get_or_create_lea_conversation()` + chargement de l’historique.  
  Si la base ou un service externe (géocodage) est lent, le délai avant le premier token peut augmenter.

- **Taille du contexte**  
  Le system prompt inclut `LEA_SYSTEM_PROMPT` + « Données plateforme » (transactions, formulaires par tx, prochaine étape document, etc.). Plus l’utilisateur a de transactions/formulaires, plus le prompt est lourd (coût et latence).

- **Anthropic en non-stream**  
  Dans `ai_service.py`, pour Anthropic le « stream » est simulé : une seule requête puis yield du contenu en une fois. Pas de vrai streaming token par token côté Claude.

- **Vocal**  
  Chaîne Whisper → actions → contexte → LLM → TTS. Tout est séquentiel ; un seul maillon lent ralentit toute la réponse.

### 3.3 Recommandations performance

1. **Paralléliser** ce qui peut l’être avant le stream (ex. `get_lea_user_context` et `get_or_create_lea_conversation` en parallèle avec `run_lea_actions` si la sémantique le permet).
2. **Limiter la taille du contexte** : par exemple limiter à N dernières transactions ou à un résumé plus court pour les listes longues.
3. **Vérifier LEA_MAX_TOKENS** en production (256 par défaut) : suffisant pour des réponses courtes ; augmenter si besoin (jusqu’à 1024) en gardant en tête la latence.
4. **Envisager un cache** pour le référentiel formulaires OACIQ (inchangé souvent) pour alléger `get_lea_user_context`.

---

## 4. Connexion et résilience

### 4.1 Backend

- **IA intégrée** : pas de timeout explicite sur `client.chat.completions.create(..., stream=True)` ; dépend du comportement par défaut du SDK OpenAI/Anthropic.
- **Agent externe** :
  - Chat : `httpx.AsyncClient(timeout=60.0)`.
  - Vocal : `timeout=90.0`.
  - Capabilities check : `timeout=10.0`.
- **Erreurs** : `HTTPException` 501 (streaming non disponible), 502 (agent injoignable / erreur agent), 500 (erreur interne). Logs avec `logger.error` / `logger.warning`.

### 4.2 Frontend

- **chatStream** : `fetch(url, { method: 'POST', ... })` **sans `signal` (AbortController)** et **sans timeout**. La requête peut rester ouverte indéfiniment si le backend ou le réseau bloque.
- **Fallback chat** (non-stream) : utilise `apiClient.post(..., { signal: abortControllerRef.current.signal })` ; l’utilisateur peut annuler ; pas de timeout explicite.
- **Gestion d’erreur** : en cas de `!res.ok`, le body est lu et passé à `onError` ; pas de retry automatique.
- **Vocal** : `leaAPI.chatVoice(audioBlob)` via axios (config globale du client) ; pas de timeout dédié visible pour Léa.

### 4.3 Rate limiting

- **Aucun rate limit** spécifique sur les routes `/v1/lea/*` (contrairement à auth, 2FA, api-keys, etc.). Un abus pourrait surcharger l’IA ou l’agent.

### 4.4 Recommandations connexion / résilience

1. **Timeout côté front pour le stream** : utiliser `AbortController` + `setTimeout` (ex. 120 s) et passer `signal` à `fetch` pour `chatStream`, puis appeler `onError` en cas d’abort.
2. **Retry limité** : pour les erreurs 502/503 ou réseau, 1–2 retries avec backoff court sur le chat (et éventuellement le vocal) pour améliorer la résilience perçue.
3. **Rate limit Léa** : par exemple `@rate_limit_decorator("30/minute")` sur `lea_chat_stream` et `lea_chat` (et éventuellement vocal) pour protéger le backend et les fournisseurs IA.
4. **Timeout optionnel côté backend** sur l’appel stream OpenAI/Anthropic (si les SDK le permettent) pour éviter des streams qui traînent indéfiniment.

---

## 5. Observabilité et débogage

- **Logs backend** : erreurs et warnings loggés (`logger.error`, `logger.warning`) avec trace d’exception pour Léa et agent.
- **Métadonnées dans le stream** : `session_id`, `actions`, `model`, `provider`, `usage` (tokens) envoyés en fin de stream et affichables dans l’UI (export conversation).
- **Pas de métriques dédiées** : pas de compteurs de requêtes Léa, latence P50/P95, ou taux d’erreur exposés (ex. Prometheus). Les logs et les réponses « Logs IA » permettent un débogage manuel.

**Recommandation** : si la charge Léa augmente, ajouter des métriques (nombre de requêtes, latence avant premier token, latence totale, erreurs par type) pour surveiller la performance et la connexion.

---

## 6. Synthèse des risques et actions prioritaires

| Risque | Gravité | Action recommandée |
|--------|---------|---------------------|
| TTFB élevé (pipeline avant tout octet) | Haute | Déplacer actions + contexte + conversation dans le générateur après un premier yield (§ 8.2). |
| Stream front sans timeout | Moyenne | Ajouter AbortController + timeout (ex. 120 s) sur `chatStream`. |
| Aucun rate limit sur Léa | Moyenne | Mettre un rate limit (ex. 30/min) sur chat et vocal. |
| 401 sur stream sans retry | Moyenne | Refresh token avant stream ou retry une fois sur 401 (§ 8.4). |
| Contexte + actions séquentiels | Faible | Étudier parallélisation (contexte + conversation) avec run_lea_actions. |
| Pas de retry sur erreur réseau | Faible | Retry limité (1–2) sur 502/503 ou erreur réseau pour le chat. |
| Anthropic sans vrai stream | Faible | Documenter ; envisager support stream Claude si l’API le permet. |

---

## 7. Fluidité d'accès : audit détaillé

### 7.1 Problème principal : temps jusqu'au premier octet (TTFB)

En FastAPI, quand une route retourne `StreamingResponse(gen)` :

1. La route s’exécute **en entier** (tous les `await` jusqu’au `return`).
2. Ce n’est qu’une fois le `return` effectué que la réponse HTTP (en-têtes + corps) est remise au serveur ASGI.
3. Le **générateur** `gen` n’est exécuté qu’au moment où le client lit le corps de la réponse.

Donc, pour `lea_chat_stream` actuellement :

- La route exécute **dans l’ordre** : `get_current_user` (JWT + 1 requête DB), `get_db`, puis **tout** le pipeline :
  - `run_lea_actions(...)` (création tx, adresse, **géocodage HTTP**, formulaire OACIQ, contacts, prix, date de clôture, etc.) ;
  - `get_lea_user_context(...)` (liste forms, transactions, OACIQ par tx, portail client) ;
  - `link_lea_session_to_transaction(...)` si besoin ;
  - `get_or_create_lea_conversation(...)` ;
  - `build_llm_messages_from_history(...)`.
- **Ensuite seulement** la route fait `return StreamingResponse(_stream_lea_sse(...))`.
- Le client ne reçoit donc **rien** (pas même les en-têtes 200) avant la fin de tout ce travail.

Conséquences pour la fluidité perçue :

- L’utilisateur envoie un message et reste sans retour visuel pendant **plusieurs secondes** (souvent 2–10 s, voire plus si géocodage ou DB lente).
- L’UI affiche un chargement sans aucun premier octet ni indicateur « connexion établie ».
- Sensation de « blocage » ou d’accès peu fluide au backend et à l’IA.

Le `yield ": ok\n\n"` au début de `_stream_lea_sse` n’est utile qu’une fois le stream démarré ; il ne peut pas aider au TTFB car le générateur ne tourne pas avant que la route ait terminé.

### 7.2 Chaîne d’exécution côté backend (ordre actuel)

| Étape | Opération | I/O / coût |
|-------|-----------|------------|
| 1 | `get_current_user` | JWT decode + 1 × DB (select User) |
| 2 | `get_db` | Session DB créée |
| 3 | `run_lea_actions` | Plusieurs DB + possible **géocodage HTTP** (latence externe) |
| 4 | `get_lea_user_context` | Plusieurs selects (forms, transactions, OACIQ, portail) |
| 5 | `link_lea_session_to_transaction` | 1 × DB (insert/select) |
| 6 | `get_or_create_lea_conversation` | 1 × DB (select ou insert + commit) |
| 7 | `build_llm_messages_from_history` | Mémoire (pas d’I/O) |
| 8 | `return StreamingResponse(...)` | — |
| 9 | Client reçoit en-têtes + corps | **Premier octet ici** |
| 10 | Générateur : `yield ": ok\n\n"` | Envoyé au client |
| 11 | Générateur : appel LLM stream | Réseau OpenAI/Anthropic |

Tout ce qui est entre les étapes 3 et 8 retarde le premier octet perçu par le client.

### 7.3 Fluidité côté frontend

- **Stream en `fetch` pur** : `leaAPI.chatStream` utilise `fetch`, pas `apiClient` (axios). Donc :
  - Aucun **refresh token** sur 401 : si le token expire (ex. longue conversation), le prochain message renvoie 401 sans retry ni renouvellement automatique → rupture de fluidité.
  - Aucun **timeout** : la requête peut rester en attente indéfiniment si le backend ou le réseau bloque.
- **Pas de retry** : une erreur réseau ou 502/503 affiche directement l’erreur, sans nouvelle tentative.
- **État de chargement** : l’UI affiche bien un indicateur (placeholder assistant + `isLoading`), mais sans distinction « en attente de connexion » vs « stream en cours », ce qui renforce l’impression d’accès lent au backend/IA.

### 7.4 Synthèse des causes de « non-fluidité »

| Cause | Impact |
|-------|--------|
| Pipeline complet avant tout octet | TTFB élevé (2–10+ s) ; pas de retour visuel rapide. |
| Géocodage / DB lents dans `run_lea_actions` | Amplifie le délai avant réponse. |
| Stream en `fetch` sans refresh sur 401 | Session longue → 401 → erreur sans retry. |
| Pas de timeout sur le stream | Attente infinie possible en cas de blocage. |
| Pas de parallélisation avant stream | Toutes les étapes s’enchaînent séquentiellement. |

---

## 8. Plan d’action : fluidité et accès backend / IA

### 8.1 Objectifs

- Réduire le **temps jusqu’au premier octet** perçu par le client.
- Rendre l’**accès au backend et à l’IA** plus fluide (retour visuel rapide, moins de blocages).
- Renforcer la **résilience** (timeout, 401, retry) sans casser le streaming.

### 8.2 Backend : premier octet immédiat après auth

**Principe :** Retourner `StreamingResponse` **dès que** l’auth et la session DB sont disponibles, et déplacer tout le reste (actions, contexte, conversation, LLM) **à l’intérieur** du générateur, après un premier `yield` destiné au client.

**Modifications proposées :**

1. **`lea_chat_stream`**  
   - Après `get_current_user` et `get_db`, vérifier uniquement `_use_integrated_lea()`.  
   - **Retourner immédiatement**  
     `StreamingResponse(_stream_lea_sse(request.message, request.session_id, request.last_assistant_message, db=db, user_id=current_user.id), ...)`  
     en passant les paramètres nécessaires au générateur (y compris `db` et `current_user` / `user_id`).

2. **`_stream_lea_sse` (générateur)**  
   - **En tout premier** : `yield ": ok\n\n"` (ou un premier événement SSE du type `data: {"status":"connecting"}\n\n`) pour que le client reçoive un premier octet dès l’établissement du stream.  
   - **Ensuite** (dans le générateur) :  
     `action_lines, created_tx = await run_lea_actions(db, user_id, message, last_assistant_message)`  
     puis  
     `user_context = await get_lea_user_context(db, user_id)`  
     puis link session, `get_or_create_lea_conversation`, `build_llm_messages_from_history`, et enfin boucle LLM + `yield` des deltas et de la fin de stream.  
   - Gestion d’erreur : en cas d’exception après le premier `yield`, envoyer un événement SSE d’erreur (`data: {"error": "..."}\n\n`) pour que le client puisse afficher un message propre.

Effet attendu : le client reçoit les en-têtes et le premier octet du corps **juste après** auth + création de la session DB (souvent &lt; 500 ms), puis éventuellement un court délai pendant actions + contexte, puis le stream de la réponse IA. La sensation d’accès au backend et à l’IA devient nettement plus fluide.

### 8.3 Backend : alléger et paralléliser (optionnel)

- **Paralléliser** dans le générateur, après le premier `yield` :  
  `get_lea_user_context(db, user_id)` et `get_or_create_lea_conversation(db, user_id, session_id)` peuvent être lancés en parallèle (avec `asyncio.gather`) une fois que `run_lea_actions` est terminé (car le lien session→transaction peut dépendre de `created_tx`).  
- **Réduire le coût de `get_lea_user_context`** : limiter le nombre de transactions/formulaires résumés, ou mettre en cache le référentiel des forms OACIQ (peu changeant).  
- **Rate limit** : ajouter un rate limit (ex. 30/min) sur `lea_chat_stream` et `lea_chat` pour protéger le backend et l’IA.

### 8.4 Frontend : timeout et résilience du stream

- **Timeout sur le stream** :  
  - Créer un `AbortController`, l’associer à un `setTimeout` (ex. 120 s).  
  - Passer `signal: controller.signal` à `fetch` dans `leaAPI.chatStream`.  
  - Si le timeout se déclenche, `abort()` et appeler `onError("Délai dépassé. Réessayez.")` (ou message équivalent).
- **Gestion 401** :  
  - Soit : avant d’appeler `chatStream`, faire un appel léger (ex. `GET /v1/auth/me` ou refresh silencieux) pour rafraîchir le token si besoin, puis ouvrir le stream avec un token valide.  
  - Soit : si `res.status === 401`, tenter une fois un refresh token (même logique que l’intercepteur axios), puis réessayer le `chatStream` une seule fois ; sinon afficher un message clair (« Session expirée, veuillez vous reconnecter »).
- **Retry limité** : en cas d’erreur réseau ou 502/503, réessayer une fois après 1–2 s, puis afficher l’erreur si ça échoue encore.

### 8.5 Frontend : retour visuel

- Dès réception du **premier** événement SSE (ex. `: ok` ou `{"status":"connecting"}`), passer l’UI en état « Connexion établie » ou « Léa réfléchit… » (sans attendre le premier token de contenu).  
- Puis, à la réception du premier `delta` de texte, afficher « Réponse en cours… » ou simplement le texte qui s’accumule.  
Cela améliore la perception de fluidité d’accès au backend et à l’IA.

### 8.6 Ordre de mise en œuvre recommandé

| Priorité | Action | Fichiers | Gain |
|----------|--------|----------|------|
| P0 | Déplacer tout le pipeline (run_lea_actions, get_lea_user_context, conversation, LLM) après un premier `yield` dans le générateur | `lea.py` | TTFB fortement réduit ; fluidité majeure |
| P1 | Timeout (AbortController + 120 s) sur `chatStream` | `api.ts`, éventuellement `useLea.ts` | Évite attente infinie |
| P1 | Gestion 401 sur stream (refresh puis retry une fois, ou message clair) | `api.ts` / `useLea.ts` | Fluidité en session longue |
| P2 | Paralléliser get_lea_user_context et get_or_create_lea_conversation après run_lea_actions | `lea.py` | Réduction latence avant premier token |
| P2 | Rate limit sur `/v1/lea/chat` et `/v1/lea/chat/stream` | `lea.py` | Stabilité et coûts IA |
| P3 | Indicateur « Connexion établie » au premier événement SSE | `useLea.ts` / `LeaConversationView` | Meilleure perception |

---

## 9. Fichiers principaux

| Rôle | Fichier |
|------|---------|
| Backend Léa | `backend/app/api/v1/endpoints/lea.py` |
| Service IA | `backend/app/services/ai_service.py` |
| Service Léa (conversations, tools) | `backend/app/services/lea_service.py` |
| Config | `backend/app/core/config.py` (LEA_MAX_TOKENS, LEA_TTS_*, AGENT_*) |
| Front API Léa | `apps/web/src/lib/api.ts` (leaAPI.chatStream, chat, chatVoice, …) |
| Hook Léa | `apps/web/src/hooks/useLea.ts` |
| UI conversation | `apps/web/src/components/lea/LeaConversationView.tsx` |

---

*Rapport généré à partir de l’analyse du code (backend et frontend) au 1er mars 2026.*
