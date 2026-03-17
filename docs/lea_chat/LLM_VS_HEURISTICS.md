# Léa: LLM vs heuristics (chats and decisions)

**Mise à jour** : Le routeur LLM prend désormais toutes les décisions via `docs/oaciq/LEA_ROUTING_KNOWLEDGE.md`. Les heuristiques ne servent qu'en fallback (LLM échoue ou confidence < 0.5).

This doc summarizes **where the LLM is used** vs **where heuristics are fallback**.

---

## Where the LLM **is** used

| Location | Purpose |
|----------|---------|
| **Router LLM** | Classifies user intent: `create_transaction` \| `create_pa` \| `fill_pa` \| `other`. Used to: avoid creating a transaction when user wants a PA; avoid asking "vente ou achat?" when intent is create_pa. |
| **`_extract_pa_fields_llm`** | Extracts PA form field values from the user message (JSON). Used during PA fill flow. |
| **Main chat response** | Full LLM call (stream or completion) with system prompt + action lines. The model only **generates the reply text**; it does **not** choose which backend actions run. |

---

## Where decisions are **heuristic-only** (fallback)

These functions use keywords, regex, or fixed patterns. If they return false, the corresponding action never runs.

### 1. "User wants to create OACIQ form / PA"

- **Function:** `_wants_to_create_oaciq_form_for_transaction(message)`
- **Logic:** Requires create-like verbs + ("formulaire" / "promesse" / "oaciq" / "promesse"+"achat", etc.).

### 2. "Last message asked: for which property (for form)?"

- **Function:** `_last_message_asked_for_property_for_form(last_assistant_message)`
- **Logic:** ("quelle propriété" or "quelle transaction") and ("formulaire" or "promesse" or "préparer").

### 3. "Last message asked to confirm PA creation"

- **Function:** `_last_message_asked_to_confirm_pa_creation(last_assistant_message)`
- **Logic:** "promesse" + ("achat"/"d'achat") + ("confirmer"/"souhaitez-vous"/…) + ("transaction"/"propriété"/"au ").

### 4. "Short confirmation message"

- **Function:** `_is_short_confirmation_message(message)`
- **Logic:** Message length ≤ 25 chars and in a fixed list ("oui", "ok", "exact", etc.).

### 5. "User wants to create a transaction" (vente/achat)

- **Function:** `_wants_to_create_transaction(message)` → `_ok_create`, `_tx_type`
- **Logic:** Keyword-based (e.g. "créer", "nouveau dossier", "vente", "achat").
- **Override:** If `llm_intent == "create_pa"`, we force `ok_create = False` and skip transaction creation.

---

## Flow summary

1. **run_lea_actions** runs first and computes **action lines** using:
   - **LLM:** Router → intent (create_transaction / create_pa / fill_pa / other).
   - **Heuristics:** everything else (create PA?, ask for property?, address update?, PA fill?, etc.).
2. **Chat** then receives (conversation history + user message + **action lines** in system/context) and generates the reply. It cannot add or remove backend actions; it can only phrase what the backend already decided.

---

## Suggestions: where LLM could decide instead of heuristics

1. **"User wants to create a PA"** — Use `llm_intent == "create_pa"` to decide "create OACIQ form for transaction".
2. **"Last turn was asking for which property / confirm PA"** — Use LLM with `last_assistant_message` to classify.
3. **Single "routing" LLM call** — One structured LLM call that returns: create_transaction, create_pa, fill_pa, asked_property_for_form, asked_confirm_pa, user_confirmed, user_gave_address, other. Then `run_lea_actions` uses these flags instead of many separate heuristic functions.
