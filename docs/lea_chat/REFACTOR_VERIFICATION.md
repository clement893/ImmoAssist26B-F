# Vérification du refactor Léa chat – Full stack

Référence : [PLAN_REFACTOR_LEA_CHAT.md](./PLAN_REFACTOR_LEA_CHAT.md)

---

## 1. Module lea_chat (backend)

### Structure

| Fichier | Rôle | Statut |
|---------|------|--------|
| `schemas.py` | LeaSignals, LeaIntent, ActionResult (TypedDict) | ✅ OK |
| `orchestrator.py` | Point d'entrée `run()` → délègue à `run_lea_actions` | ✅ OK |
| `router.py` | `compute_intent()` (structure Phase 2) | ✅ Présent, non branché |
| `response_composer.py` | `build_context()` (Phase 3) | ✅ Présent, non branché |
| `knowledge.py` | `load_lea_knowledge_async()`, `load_pa_files()` | ✅ OK, branché |
| `actions/session.py` | get_transaction_for_session, link_lea_session_to_transaction, get_or_create_lea_conversation | ✅ OK |
| `actions/transaction.py` | maybe_create_transaction_from_lea, extraction adresse/prix/vendeurs/acheteurs | ✅ OK |
| `actions/purchase_offer.py` | extract_pa_fields_llm | ✅ OK |
| `actions/address` | Absorbé dans transaction (voir plan) | ✅ OK |

### Règles respectées

- **Router** : aucune écriture DB, aucune logique métier.
- **Response_composer** : prépare le contexte uniquement, n'appelle pas le LLM.
- **Phase 1** : comportement identique, délégation via orchestrator.

---

## 2. API endpoints (lea.py)

### Endpoints Léa

| Endpoint | Méthode | Usage |
|----------|---------|-------|
| `/lea/chat` | POST | Chat non-stream |
| `/lea/chat/stream` | POST | Chat streamé (SSE) |
| `/lea/chat/voice` | POST | Vocal (Whisper + LLM + TTS) |

### Orchestrator

Les 3 endpoints appellent `run_lea_actions_from_orchestrator` (alias de `orchestrator.run()`).

### Imports lea_chat

- `actions.session` : get_transaction_for_session, link_lea_session_to_transaction, get_or_create_lea_conversation
- `actions.transaction` : maybe_create_transaction_from_lea, _extract_address_from_message, etc.
- `actions.purchase_offer` : extract_pa_fields_llm
- `orchestrator` : run
- `knowledge` : load_lea_knowledge_async

---

## 3. Frontend

### API client (leaAPI)

| Méthode | Endpoint | Correspondance |
|---------|----------|----------------|
| `chatStream` | POST /api/v1/lea/chat/stream | ✅ |
| `chat` | POST /api/v1/lea/chat | ✅ |
| `chatVoice` | POST /api/v1/lea/chat/voice | ✅ |

### Contrat request/response

- **Request** : `message`, `session_id`, `last_assistant_message`, `transaction_id`, `provider`
- **Response** : `content`, `session_id`, `model`, `provider`, `usage`, `actions`
- **Stream** : `data: {"delta":"..."}`, `data: {"done":true, "session_id":"...", "actions":[...]}`

### Composants

- `LeaChat`, `Lea2View`, `LeaConversationView` → `useLea` → `leaAPI`
- `LeaChatInput` : saisie + vocal
- Page transaction : `leaAPI.listConversationsByTransaction()`

---

## 4. Base de données

### Modèles utilisés par lea_chat

| Modèle | Table | Usage |
|--------|-------|--------|
| LeaConversation | lea_conversations | Persistance des conversations |
| LeaSessionTransactionLink | lea_session_transaction_links | Lien session ↔ transaction |
| RealEstateTransaction | real_estate_transactions | Création/mise à jour via actions |
| Form, FormSubmission | forms, form_submissions | PA (dans run_lea_actions) |

### Migrations

- `033_create_lea_conversations_tables.py`
- `047_lea_session_transaction_links.py`

### Sessions DB

Les actions reçoivent `db: AsyncSession` et utilisent la même session que l’endpoint → transactions cohérentes.

---

## 5. Chaîne d’intégration

```
Frontend (useLea.sendMessage)
    → leaAPI.chatStream(message, sessionId, ...)
    → POST /api/v1/lea/chat/stream
        → lea.py endpoint
            → run_lea_actions_from_orchestrator()  [orchestrator.run]
                → run_lea_actions() dans lea.py
                    → get_transaction_for_session (lea_chat.actions.session)
                    → get_or_create_lea_conversation (lea_chat.actions.session)
                    → maybe_create_transaction_from_lea (lea_chat.actions.transaction)
                    → load_lea_knowledge_from_module (lea_chat.knowledge)
                    → _extract_pa_fields_llm (lea_chat.actions.purchase_offer)
                    → ...
```

---

## 6. Points à surveiller (évolutions futures)

- **Router / response_composer** : structure en place, branchement prévu en Phase 2–3.
- **Import circulaire** : évité grâce à l’import tardif de `run_lea_actions` dans `orchestrator.run()`.
- **Chemin knowledge** : `docs/oaciq/` relatif à la racine projet (5 niveaux depuis knowledge.py).

---

*Dernière vérification : suite au refactor Phase 1.*
