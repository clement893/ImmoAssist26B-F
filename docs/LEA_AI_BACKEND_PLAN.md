# Plan : IA Léa rapide, performante et connectée à la base

L’objectif est que la **conversation soit fluide** grâce à une IA **rapide**, **performante** et **connectée à la base de données** (historique + outils métier), pas seulement au visuel.

---

## 0. Cible : page Léa2

**La page Léa2 est la cible principale** pour connecter l’ensemble du système :

| Élément | Détail |
|--------|--------|
| **Route** | `/dashboard/lea2` (ou `/[locale]/dashboard/lea2`) |
| **Composant** | `Lea2View` (`apps/web/src/components/lea/Lea2View.tsx`) |
| **Rôle** | Interface voice-first (grand micro central, thème sombre, “Tap to Start”) qui utilise déjà `useLea`, `useVoiceRecording`, `useVoiceRecognition`, `useVoiceSynthesis`. |

**À faire :**

- Toutes les évolutions **backend** (LeaService, historique DB, outils, streaming, vocal intégré) doivent être **utilisables depuis Léa2** : même API (`/lea/chat`, `/lea/chat/stream`, `/lea/chat/voice`), même `session_id`, même hooks.
- Les évolutions **UX** (fluidité, indicateurs, erreurs, scroll) doivent être **appliquées ou vérifiées sur Léa2** en priorité (et si besoin sur la page Léa classique).
- **Vérification** : après chaque phase, tester le flux complet sur la page Léa2 (texte, stream, vocal, effacer, reprise de session).

**Pages existantes :**

- **Léa** (`/dashboard/lea`) → `LeaChat` → welcome + `LeaConversationView` (UI complète avec header, liste, saisie).
- **Léa2** (`/dashboard/lea2`) → `Lea2View` → UI voice-first, même hooks `useLea`. C’est **Léa2** qui doit bénéficier en priorité de l’IA connectée à la base et de l’UX fluide.

---

## 1. Constat actuel

| Élément | État | Problème |
|--------|------|----------|
| **LeaService** | ✅ Existe | DB, historique (`LeaConversation`), outils (agents, contacts, entreprises, stats) |
| **Endpoints chat** | ⚠️ Déconnectés | `/lea/chat` → agent externe uniquement ; `/lea/chat/stream` → AIService **sans** DB ni outils |
| **Historique** | ❌ Non utilisé en chat | Le front envoie `session_id` mais le stream n’utilise pas `LeaConversation` |
| **Outils (tools)** | ❌ Jamais appelés | Aucun appel à `LeaService.chat()` depuis les endpoints utilisés par le front |

Conséquence : Léa ne voit pas l’historique et ne peut pas interroger la base (contacts, entreprises, etc.). La conversation n’est ni persistée ni “intelligente” côté données.

---

## 2. Objectifs techniques

1. **Connexion à la base**  
   - Charger/sauvegarder l’historique par `session_id` (table `lea_conversations`).  
   - Exposer les **outils** (recherche contacts, entreprises, agents, stats) pour que Léa réponde avec les vraies données.

2. **Rapidité**  
   - Réponse perçue comme rapide : streaming dès que possible.  
   - Premier token rapide : modèle adapté (ex. `gpt-4o-mini`), prompt et historique limités.

3. **Performance**  
   - Limiter la taille du contexte (nombre de messages / tokens) pour éviter latence et coût.  
   - Exécution des outils en parallèle quand c’est possible.

---

## 3. Architecture cible

```
[Frontend] --session_id--> [POST /lea/chat ou /lea/chat/stream]
                                    |
                                    v
                    +---------------+---------------+
                    |  Intégré (OPENAI/ANTHROPIC)   |
                    +---------------+---------------+
                                    |
                    +---------------+---------------+
                    |  LeaService(db, user_id)      |
                    |  - get_or_create_conversation |
                    |  - messages = history from DB |
                    |  - chat() with tools          |
                    |  - save new messages to DB    |
                    +---------------+---------------+
                                    |
                    +---------------+---------------+
                    |  Réponse : stream OU complète  |
                    |  (stream si pas d’outils)      |
                    +---------------+---------------+
```

- **Un seul flux “intégré”** : quand `OPENAI_API_KEY` (ou Anthropic) est défini, le chat passe par **LeaService** (DB + outils).
- **Streaming** : utilisé quand la réponse est purement texte (pas d’appel d’outils), pour garder la fluidité.
- **Avec outils** : un tour de boucle (LLM → tools → LLM) sans stream, puis envoi de la réponse finale (ou stream de cette dernière phrase si on le souhaite).

---

## 4. Plan d’implémentation

### Phase 1 – Brancher LeaService sur le chat (priorité haute)

| # | Tâche | Détail |
|---|--------|--------|
| 1.1 | Utiliser LeaService pour `/lea/chat` quand l’IA est intégrée | Si `_use_integrated_lea()` : appeler `LeaService(db, current_user.id).chat(message, session_id)` au lieu de l’agent externe. Retourner `content`, `session_id`, etc. depuis la réponse du service. |
| 1.2 | Persister les messages du stream | Pour `/lea/chat/stream` : charger la conversation via LeaService, ajouter le message utilisateur, appeler l’IA (avec ou sans outils selon stratégie), **streamer** la réponse, puis sauvegarder user + assistant dans `conversation.messages` et faire `commit`. |
| 1.3 | Historique dans le prompt | Pour stream et non-stream : construire la liste `messages` à partir de `conversation.messages` (format attendu par l’API LLM), en limitant à N derniers messages (ex. 20) ou M tokens pour garder la rapidité. |

Résultat : toute conversation “intégrée” utilise la même conversation en base et peut s’appuyer sur l’historique.

### Phase 2 – Outils (DB) dans le flux (priorité haute)

| # | Tâche | Détail |
|---|--------|--------|
| 2.1 | Chat stream : gérer les tool calls | Dans le flux intégré, après un appel au LLM : si la réponse contient des `tool_calls`, exécuter `LeaService._execute_tools()`, ajouter les résultats aux messages, rappeler le LLM. Une fois la réponse finale texte seule, la streamer (ou l’envoyer en un bloc). |
| 2.2 | Ou : chemin “avec outils” sans stream | Alternative plus simple : si on détecte qu’on veut des outils, utiliser `LeaService.chat()` (déjà en place) et renvoyer la réponse complète ; sinon utiliser le stream actuel. Le front peut appeler un seul endpoint qui choisit en interne. |
| 2.3 | Cohérence du system prompt | Utiliser le même `SYSTEM_PROMPT` que LeaService (ou une version commune) partout (stream, non-stream, vocal) pour que Léa mentionne bien les capacités “base de données”. |

Résultat : Léa peut rechercher des contacts, entreprises, agents, stats, et répondre avec les données réelles.

### Phase 3 – Rapidité et performance (priorité moyenne)

| # | Tâche | Détail |
|---|--------|--------|
| 3.1 | Limiter l’historique envoyé au LLM | Garder seulement les K derniers messages (ex. K=20) ou une limite en tokens (ex. 2000–4000 tokens d’historique) pour garder des temps de réponse bas. |
| 3.2 | Modèle par défaut | S’assurer que le modèle par défaut reste rapide (ex. `gpt-4o-mini`) sauf si une variable d’environnement impose un autre modèle. |
| 3.3 | Timeout et erreurs | Timeout raisonnable sur les appels LLM (ex. 60 s) et sur les outils ; en cas d’erreur outil, renvoyer un message clair à l’utilisateur sans faire planter la conversation. |

Résultat : premier token et réponse globale rapides, coût maîtrisé.

### Phase 4 – Vocal + DB (priorité moyenne)

| # | Tâche | Détail |
|---|--------|--------|
| 4.1 | Voice avec contexte DB | Pour `/lea/chat/voice` (intégré) : après Whisper, appeler LeaService (même logique que le chat texte) avec le `session_id` pour avoir historique + outils, puis TTS sur la réponse. |
| 4.2 | Persister le tour vocal | Ajouter le message utilisateur (transcription) et la réponse assistant dans `conversation.messages` comme pour le texte. |

Résultat : la voix utilise la même “mémoire” et les mêmes données que le chat texte.

### Phase 5 – Enrichir les outils (priorité basse)

| # | Tâche | Détail |
|---|--------|--------|
| 5.1 | Outils transactions | Ajouter des outils du type `list_my_transactions`, `get_transaction_detail` (en s’appuyant sur `real_estate_transaction`, etc.) pour que Léa réponde sur les transactions de l’utilisateur. |
| 5.2 | Outils OACIQ / formulaires | Si pertinent, outils pour lister ou résumer des formulaires OACIQ liés à l’utilisateur. |
| 5.3 | Contexte utilisateur dans le prompt | Optionnel : injecter en début de conversation un résumé (ex. “L’utilisateur a X transactions, Y contacts”) pour que Léa sache à qui elle parle. |

Résultat : conversation vraiment “connectée” au métier (transactions, formulaires).

---

## 5. Ordre recommandé

1. **Phase 1** : Brancher LeaService sur `/lea/chat` et sur le flux stream (avec persistance des messages). Pas encore les tool calls dans le stream.
2. **Phase 2** : Gérer les tool calls (soit dans le stream, soit via un chemin dédié avec `LeaService.chat()`).
3. **Phase 3** : Limite d’historique, modèle, timeouts.
4. **Phase 4** : Vocal qui utilise LeaService + persistance.
5. **Phase 5** : Nouveaux outils (transactions, OACIQ, etc.) au besoin.

---

## 6. Fichiers à modifier (résumé)

| Fichier | Rôle |
|---------|------|
| **Frontend cible** | **Léa2** : `apps/web/src/app/[locale]/dashboard/lea2/page.tsx` et `Lea2View.tsx`. Tester ici en priorité après chaque phase (chat, stream, vocal, session). |
| `backend/app/api/v1/endpoints/lea.py` | Utiliser LeaService pour `/lea/chat` (intégré) ; pour `/lea/chat/stream` : charger conversation, construire messages, appeler LLM (avec ou sans outils), streamer et persister ; pour `/lea/chat/voice` : appeler LeaService après Whisper et persister. |
| `backend/app/services/lea_service.py` | Optionnel : méthode “chat sans outils” pour le stream simple ; ou méthode qui retourne un générateur de tokens après résolution des outils. Limiter les messages chargés (ex. 20 derniers). |
| `backend/app/services/ai_service.py` | Déjà utilisé ; pas de changement majeur si on garde la logique “outils” dans LeaService. |

---

## 7. Critères de succès

- **Fluide** : Réponse qui commence à s’afficher rapidement (streaming quand pas d’outils).  
- **Performant** : Temps de réponse raisonnable même avec 10–20 messages d’historique.  
- **Connecté** : Les réponses peuvent s’appuyer sur les données réelles (contacts, entreprises, agents, puis transactions si Phase 5).  
- **Persistant** : Une même `session_id` retrouve la même conversation (historique en DB).

Ce plan met l’accent sur le **fonctionnement** de l’IA (vitesse, données, persistance) pour une conversation vraiment fluide et utile.
