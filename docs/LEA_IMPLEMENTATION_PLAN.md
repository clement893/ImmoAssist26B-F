# Plan d'implémentation – Léa : fluidité, performance et résilience

**Référence :** `docs/LEA_PERFORMANCE_ET_CONNEXION_RAPPORT.md` (sections 7 et 8).  
**Objectif :** Réduire le TTFB, améliorer la fluidité d'accès au backend et à l'IA, et renforcer la résilience (timeout, 401, rate limit).

---

## Vue d'ensemble

| Phase | Objectif | Fichiers principaux | Dépendances |
|-------|----------|---------------------|-------------|
| **P0** | Premier octet immédiat (TTFB) | `backend/.../lea.py` | — |
| **P1a** | Timeout sur le stream | `apps/web/src/lib/api.ts` | — |
| **P1b** | Gestion 401 sur stream | `apps/web/src/lib/api.ts`, `useLea.ts` | P1a optionnel |
| **P2a** | Parallélisation contexte + conversation | `backend/.../lea.py` | P0 |
| **P2b** | Rate limit Léa | `backend/.../lea.py` | — |
| **P3** | Indicateur « Connexion établie » | `useLea.ts`, `LeaConversationView.tsx` | P0 livré |

---

## P0 – Premier octet immédiat (backend)

**But :** Le client reçoit les en-têtes HTTP et le premier octet du corps juste après auth + DB, sans attendre run_lea_actions ni get_lea_user_context.

### P0.1 – Modifier `lea_chat_stream`

- [ ] **Fichier :** `backend/app/api/v1/endpoints/lea.py`
- [ ] **Action :**
  1. Après `if not _use_integrated_lea(): raise ...`, ne plus appeler `run_lea_actions`, `get_lea_user_context`, `link_lea_session_to_transaction`, `get_or_create_lea_conversation`, ni `build_llm_messages_from_history`.
  2. Retourner immédiatement :
     ```python
     return StreamingResponse(
         _stream_lea_sse(
             message=request.message,
             session_id=request.session_id,
             last_assistant_message=request.last_assistant_message,
             db=db,
             user_id=current_user.id,
         ),
         media_type="text/event-stream",
         headers={...},
     )
     ```
  3. S'assurer que `_stream_lea_sse` peut recevoir `last_assistant_message` et n'a plus besoin de `user_context`, `action_lines`, `confirmation_text`, `messages_for_llm` en entrée (ils seront calculés dans le générateur).

**Critères d'acceptation :** La route `lea_chat_stream` ne fait plus aucun `await` après la vérification `_use_integrated_lea()` avant le `return StreamingResponse(...)`.

---

### P0.2 – Refactoriser `_stream_lea_sse`

- [ ] **Fichier :** `backend/app/api/v1/endpoints/lea.py`
- [ ] **Action :**
  1. Changer la signature pour accepter : `message`, `session_id`, `last_assistant_message`, `db`, `user_id` (plus `user_context`, `action_lines`, `confirmation_text`, `messages_for_llm` en paramètres).
  2. En tout début du générateur (avant tout `await`) : `yield ": ok\n\n"` (et optionnellement `yield f"data: {json.dumps({'status': 'connecting'})}\n\n"` pour le front P3).
  3. Ensuite, dans un bloc `try`, exécuter dans l'ordre :
     - `action_lines, created_tx = await run_lea_actions(db, user_id, message, last_assistant_message)`
     - `user_context = await get_lea_user_context(db, user_id)`
     - Si `action_lines` : `user_context += "\n\n--- Action effectuée ---\n" + "\n".join(action_lines)`
     - Si `session_id` et `action_lines` : `tx_to_link = created_tx or await get_user_latest_transaction(db, user_id)` puis `await link_lea_session_to_transaction(db, user_id, session_id, tx_to_link.id)` si `tx_to_link`
     - `conv, sid = await get_or_create_lea_conversation(db, user_id, session_id)`
     - `messages_for_llm = build_llm_messages_from_history(conv.messages or [], message)`
     - Déduire `confirmation_text` si `created_tx and action_lines`
  4. Puis réutiliser la logique actuelle : si `confirmation_text`, streamer le texte caractère par caractère et fin avec `done` + persist ; sinon appeler `service.stream_chat_completion(...)` et yield des deltas, puis `done` + persist.
  5. En cas d'exception après le premier `yield` : `yield f"data: {json.dumps({'error': str(e)})}\n\n"` puis `yield f"data: {json.dumps({'done': True, 'session_id': sid})}\n\n"` (avec `sid` défini au début, ex. `session_id or str(uuid.uuid4())`).

**Critères d'acceptation :**
- Le client reçoit un premier octet (": ok" ou premier événement SSE) en moins d’environ 1 s après l’envoi du message (hors latence réseau).
- Le comportement métier est inchangé : actions, contexte, historique, confirmation création de transaction, stream IA, persistance des messages.

**Note :** Pour que `link_lea_session_to_transaction` et `get_or_create_lea_conversation` aient accès à `session_id`, utiliser la variable `session_id` passée en paramètre (ou `request.session_id` si on passe la request) ; dans le générateur on n’a pas `request`, donc passer `session_id` explicitement depuis `lea_chat_stream`.

---

## P1a – Timeout sur le stream (frontend)

**But :** Éviter une attente infinie si le backend ou le réseau bloque.

### P1a.1 – Timeout dans `chatStream`

- [ ] **Fichier :** `apps/web/src/lib/api.ts`
- [ ] **Action :**
  1. Dans `leaAPI.chatStream`, créer un `AbortController`.
  2. Lancer un `setTimeout` (ex. 120 000 ms) qui appelle `controller.abort()`.
  3. Passer `signal: controller.signal` dans l’appel `fetch(...)`.
  4. Quand le stream se termine normalement (onDone ou fin de lecture), annuler le timeout (`clearTimeout`). Pour cela, il faut stocker l’id du timer et le clearer dans les callbacks `onDone` et `onError`.
  5. En cas d’abort (dans le `catch` ou via un check `res.body`), appeler `callbacks.onError('Délai dépassé. Réessayez.')` (ou message équivalent).

**Critères d'acceptation :** Si le backend ne répond pas pendant 120 s, l’utilisateur voit un message d’erreur et le chargement s’arrête.

---

## P1b – Gestion 401 sur stream (frontend)

**But :** En cas de token expiré, tenter un refresh et réessayer le stream une fois, ou afficher un message clair.

### P1b.1 – Détection 401 et retry avec refresh

- [ ] **Fichier :** `apps/web/src/lib/api.ts` (et éventuellement `apps/web/src/hooks/useLea.ts`)
- [ ] **Action :**
  1. Dans `chatStream`, après `const res = await fetch(...)` : si `res.status === 401`, ne pas lire le body en stream.
  2. Tenter un refresh du token (même logique que l’intercepteur axios : `POST /v1/auth/refresh` avec `refresh_token` depuis `TokenStorage.getRefreshToken()`).
  3. Si le refresh réussit : rappeler `fetch` une seule fois avec le nouveau token dans `Authorization`, puis continuer le traitement du stream comme aujourd’hui.
  4. Si le refresh échoue ou il n’y a pas de refresh token : appeler `callbacks.onError('Session expirée. Veuillez vous reconnecter.')` et retourner.

**Critères d'acceptation :** Après expiration du token, le premier message qui renvoie 401 déclenche un refresh et une seule retry ; si le refresh échoue, message explicite « Session expirée ».

---

## P2a – Parallélisation (backend)

**But :** Réduire la latence entre le premier octet et le premier token de contenu IA.

### P2a.1 – Paralléliser contexte et conversation

- [ ] **Fichier :** `backend/app/api/v1/endpoints/lea.py`
- [ ] **Action :** Dans `_stream_lea_sse`, après `run_lea_actions` et le link session→transaction si besoin, lancer en parallèle :
  - `user_context = await get_lea_user_context(db, user_id)`
  - `conv, sid = await get_or_create_lea_conversation(db, user_id, session_id)`
  avec `asyncio.gather`. Puis enchaîner : mise à jour de `user_context` avec `action_lines`, `build_llm_messages_from_history(conv.messages, message)`, et le reste (confirmation_text, stream IA).
  - Le link `link_lea_session_to_transaction` doit rester après `run_lea_actions` (il dépend de `created_tx`). Il peut être fait avant le `gather` ou après, selon si on a besoin de `sid` pour le link (non). Donc : run_lea_actions → link si action_lines → gather(get_lea_user_context, get_or_create_lea_conversation) → suite.

**Critères d'acceptation :** Les appels à `get_lea_user_context` et `get_or_create_lea_conversation` sont effectués en parallèle (ex. `asyncio.gather`), sans changer le comportement fonctionnel.

---

## P2b – Rate limit (backend)

**But :** Protéger le backend et les coûts IA.

### P2b.1 – Appliquer un rate limit sur les routes Léa

- [ ] **Fichier :** `backend/app/api/v1/endpoints/lea.py`
- [ ] **Action :**
  1. Importer le décorateur utilisé ailleurs : `from app.core.rate_limit import rate_limit_decorator`.
  2. Appliquer `@rate_limit_decorator("30/minute")` sur `lea_chat_stream` et `lea_chat` (et optionnellement sur `lea_chat_voice`).
  3. En cas de dépassement, le décorateur renvoie en général 429 ; vérifier que le front gère 429 (affichage d’un message « Trop de requêtes, réessayez dans un instant »).

**Critères d'acceptation :** Au-delà de 30 requêtes/minute par utilisateur sur chat/stream et chat, la route renvoie 429. Le front affiche un message compréhensible.

---

## P3 – Indicateur « Connexion établie » (frontend)

**But :** Améliorer la perception de fluidité en affichant un retour visuel dès le premier événement SSE.

### P3.1 – État « connecting » / « Léa réfléchit »

- [ ] **Fichier :** `apps/web/src/lib/api.ts` et `apps/web/src/hooks/useLea.ts`
- [ ] **Action :**
  1. Dans `chatStream`, dès réception du premier événement SSE (ligne qui commence par `data: `) avec `data.status === 'connecting'` ou dès la réception de `: ok` (commentaire SSE), appeler un callback optionnel `onConnecting?.()` ou passer un état dans `onDone`/meta.
  2. Dans `useLea.ts`, ajouter un état local `isConnecting` (true après envoi du message, false dès le premier événement SSE ou premier delta). Ou déduire : pas de contenu assistant encore mais stream démarré = « Léa réfléchit ».
  3. Dans `LeaConversationView` (ou `LeaMessagesList`), afficher une phrase du type « Connexion établie, Léa réfléchit… » tant que `isLoading && !lastAssistantMessageContent` (ou tant que `isConnecting` si on l’expose).

**Critères d'acceptation :** Dès que le premier octet/événement SSE est reçu, l’utilisateur voit un indicateur « Connexion établie » ou « Léa réfléchit… » avant l’apparition du premier mot de la réponse.

---

## Récapitulatif des fichiers à modifier

| Fichier | Phases |
|---------|--------|
| `backend/app/api/v1/endpoints/lea.py` | P0, P2a, P2b |
| `apps/web/src/lib/api.ts` | P1a, P1b, P3 (callback connecting) |
| `apps/web/src/hooks/useLea.ts` | P1b (si retry au niveau hook), P3 |
| `apps/web/src/components/lea/LeaConversationView.tsx` ou `LeaMessagesList` | P3 |

---

## Ordre d’implémentation recommandé

1. **P0** (P0.1 + P0.2) – Impact majeur sur la fluidité perçue.
2. **P1a** – Timeout pour éviter les attentes infinies.
3. **P1b** – 401 + refresh pour les longues sessions.
4. **P2a** – Parallélisation (après P0 pour ne pas mélanger les refactors).
5. **P2b** – Rate limit (indépendant).
6. **P3** – Indicateur « Connexion établie » (améliore le perçu une fois P0 en place).

---

## Tests manuels suggérés

- **P0 :** Envoyer un message à Léa ; vérifier (DevTools → Network) que les en-têtes de la réponse stream arrivent en &lt; 1 s (hors géocodage lourd). Vérifier que la réponse IA et les actions (ex. création de formulaire) sont identiques à avant.
- **P1a :** Simuler un backend lent (ex. breakpoint) et vérifier qu’après 120 s une erreur « Délai dépassé » s’affiche.
- **P1b :** Expirer le token (ou modifier le token en session) puis envoyer un message ; vérifier refresh + retry ou message « Session expirée ».
- **P2b :** Envoyer &gt; 30 messages en moins d’une minute ; vérifier 429 et message côté front.
- **P3 :** Envoyer un message et vérifier l’affichage « Léa réfléchit… » avant le premier mot.

---

*Document créé le 1er mars 2026. À mettre à jour au fur et à mesure de l’avancement (cocher les cases).*
