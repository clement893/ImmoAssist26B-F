# Léa: LLM vs heuristics (chats and decisions)

**Mise à jour** : Le routeur LLM (`_route_lea_llm`) prend désormais toutes les décisions via `docs/oaciq/LEA_ROUTING_KNOWLEDGE.md`. Les heuristiques ne servent qu'en fallback (LLM échoue ou confidence < 0.5).

This doc summarizes **where the LLM is used** vs **where heuristics are fallback**.

---

## Where the LLM **is** used

| Location | Purpose |
|----------|--------|
| **`_classify_lea_intent_llm`** (lea.py) | Classifies user intent: `create_transaction` \| `create_pa` \| `fill_pa` \| `other`. Used to: avoid creating a transaction when user wants a PA; avoid asking "vente ou achat?" when intent is create_pa. |
| **`_extract_pa_fields_llm`** (lea.py) | Extracts PA form field values from the user message (JSON). Used during PA fill flow. |
| **Main chat response** | Full LLM call (stream or completion) with system prompt + action lines. The model only **generates the reply text**; it does **not** choose which backend actions run. |

So today the **only** backend behavior the LLM controls is: “create transaction or not” and “is this create_pa / fill_pa / other”. All other routing is heuristic.

---

## Where decisions are **heuristic-only** (chat cannot override)

These functions use keywords, regex, or fixed patterns. If they return false, the corresponding action never runs and the chat is forced to follow the resulting action lines.

### 1. “User wants to create OACIQ form / PA”

- **Function:** `_wants_to_create_oaciq_form_for_transaction(message)`
- **Logic:** Requires create-like verbs + (“formulaire” / “promesse” / “oaciq” / “promesse”+“achat”, etc.).
- **Effect:** If the user says something that doesn’t match (e.g. “on fait le PA pour 229 dufferin”), `maybe_create_oaciq_form_submission_from_lea` is never called; backend never creates the PA and may ask “for which property?” instead.

### 2. “Last message asked: for which property (for form)?”

- **Function:** `_last_message_asked_for_property_for_form(last_assistant_message)`
- **Logic:** (“quelle propriété” or “quelle transaction”) and (“formulaire” or “promesse” or “préparer”).
- **Effect:** Decides whether a reply like “229 rue dufferin” is treated as “address for the PA” (create PA + add address) or just “update address”. If the assistant’s last message was phrased differently, this can be false and the PA path is skipped.

### 3. “Last message asked to confirm PA creation”

- **Function:** `_last_message_asked_to_confirm_pa_creation(last_assistant_message)`
- **Logic:** “promesse” + (“achat”/“d’achat”) + (“confirmer”/“souhaitez-vous”/…) + (“transaction”/“propriété”/“au ”).
- **Effect:** Short replies (“oui”, “exact”) only trigger PA creation if this is true; otherwise they’re not interpreted as confirming PA.

### 4. “Short confirmation message”

- **Function:** `_is_short_confirmation_message(message)`
- **Logic:** Message length ≤ 25 chars and in a fixed list (“oui”, “ok”, “exact”, etc.) or starts with “oui ” / “ok ”.
- **Effect:** Used together with (3) to create PA on confirmation; other phrasings are ignored.

### 5. “User wants to create a transaction” (vente/achat)

- **Function:** `_wants_to_create_transaction(message)` → `_ok_create`, `_tx_type`
- **Logic:** Keyword-based (e.g. “créer”, “nouveau dossier”, “vente”, “achat”).
- **Effect:** Decides if we show “Est-ce une vente ou un achat?” and what goes into pending. Only overridden by **LLM intent**: if `llm_intent == "create_pa"`, we force `ok_create = False` and skip transaction creation.

### 6. “User wants to set promise date” / “User wants OACIQ form”

- **Function:** `_wants_to_set_promise(message)`, `_wants_to_create_oaciq_form_for_transaction(message)`
- **Used in:** The “no property specified” branch: we add the line “L’utilisateur n’a pas précisé pour quelle propriété… Demande-lui : Pour quelle propriété…?” only if one of these is true. So again, phrasing that doesn’t match these heuristics never triggers that question.

### 7. Other heuristic-only helpers

- **Extraction:** `_extract_transaction_ref_from_message`, `_extract_address_hint_from_message`, `_extract_address_from_message`, etc. — all regex/pattern-based.
- **Context:** `_last_message_asked_for_sellers`, `_last_message_asked_for_buyers`, `_last_message_asked_for_address` — keyword checks on last assistant message.

So: **the chat LLM only generates text; it does not choose** “create PA”, “ask for property”, “treat as address for PA”, “treat as confirmation”, etc. Those are all decided by the functions above.

---

## Flow summary

1. **run_lea_actions** runs first and computes **action lines** using:
   - **LLM:** `_classify_lea_intent_llm` → `llm_intent` (create_transaction / create_pa / fill_pa / other).
   - **Heuristics:** everything else (create PA?, ask for property?, address update?, PA fill?, etc.).
2. **Chat** then receives (conversation history + user message + **action lines** in system/context) and generates the reply. It cannot add or remove backend actions; it can only phrase what the backend already decided.

So if you add “a lot of functions” that depend on keywords, the chat effectively **cannot** decide those branches—only the heuristics can. To let the chat “decide” more, those branches need to be driven (or at least overridden) by LLM output.

---

## Suggestions: where LLM could decide instead of heuristics

1. **“User wants to create a PA” (and which form)**  
   Use `llm_intent == "create_pa"` (or a small LLM call) to decide “create OACIQ form for transaction”, instead of (or in addition to) `_wants_to_create_oaciq_form_for_transaction(message)`. That way phrasing like “on fait le PA”, “je veux la promesse pour celle-là” can still create the PA.

2. **“Last turn was asking for which property / confirm PA”**  
   Optionally use a tiny LLM (or the same intent model) with `last_assistant_message` to classify: “assistant_asked_property_for_form” / “assistant_asked_confirm_pa”, and use that to trigger the “user replied with address” and “user confirmed PA” branches instead of (or in addition to) `_last_message_asked_for_property_for_form` and `_last_message_asked_to_confirm_pa_creation`.

3. **“Is this message a short confirmation?”**  
   For the PA confirmation branch, an LLM could decide “user confirmed” vs “user said something else” instead of `_is_short_confirmation_message` so that “oui pour celle-là”, “c’est ça” etc. are accepted.

4. **Single “routing” LLM call**  
   One structured LLM call (or tool) that returns: create_transaction, create_pa, fill_pa, asked_property_for_form, asked_confirm_pa, user_confirmed, user_gave_address, other. Then `run_lea_actions` uses these flags instead of many separate heuristic functions, so the chat “decides” via that one call.

Implementing (1) and (4) would already shift a lot of control from heuristics to the LLM so the chat can influence backend behavior in a consistent way.
