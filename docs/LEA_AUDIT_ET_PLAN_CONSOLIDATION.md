# Audit en profondeur : Léa et connexion BD / plateforme

**Date :** 1er mars 2026  
**Périmètre :** Backend (endpoints Léa, run_lea_actions, contexte), frontend (useLea, API), modèles BD, capacités annoncées vs implémentées.

---

## 1. Architecture actuelle

### 1.1 Deux flux distincts

| Composant | Rôle | Utilisé par |
|-----------|------|-------------|
| **endpoints/lea.py** | Chat principal : `run_lea_actions` + `AIService.chat_completion` (ou agent externe). Contexte plateforme injecté dans le prompt. | `POST /lea/chat`, `POST /lea/chat/stream`, `POST /lea/chat/voice` |
| **LeaService** (lea_service.py) | Ancien service avec tools (search_agents, search_contacts, etc.) et `chat()` multi-tour avec appels d’outils. | `GET /lea/context` (get_or_create_conversation), `GET /lea/conversations` |

Le chat texte/vocal **n’utilise pas** LeaService.chat() : il appelle directement `run_lea_actions` puis `AIService.chat_completion` avec **un seul message** (pas d’historique).

### 1.2 Flux d’une requête chat (IA intégrée)

1. Frontend envoie `message` + `session_id` + `last_assistant_message` (dernier message assistant uniquement).
2. Backend : `run_lea_actions(db, user_id, message, last_assistant_message)` → retourne `(action_lines, created_tx)`.
3. Backend : `get_lea_user_context(db, user_id)` → texte « Données plateforme » (transactions + portail).
4. Backend : prompt = LEA_SYSTEM_PROMPT + bloc « Données plateforme » + éventuellement « Action effectuée ».
5. Backend : `AIService.chat_completion(messages=[{"role": "user", "content": request.message}], system_prompt=...)` → **un seul message utilisateur**, pas d’historique.
6. Réponse renvoyée avec `actions=action_lines`.

---

## 2. Connexion à la base de données et à la plateforme

### 2.1 Contexte injecté (get_lea_user_context)

- **Lecture BD :**
  - `RealEstateTransaction` : 15 dernières (user_id, ordre `updated_at` desc).
  - `PortailTransaction` : 15 dernières (courtier_id = user_id).
- **Contenu :**
  - Liste des transactions avec numéro, adresse, statut.
  - Pour la **dernière** transaction : vendeurs, acheteurs, prix (pour éviter de redemander).
  - Infos « manquantes » (adresse, vendeurs, acheteurs, prix) pour guider les questions.
- **Non inclus aujourd’hui :**
  - Date de clôture prévue (`expected_closing_date`).
  - Formulaires OACIQ / soumissions liées aux transactions.
  - Contacts du Réseau (module Réseau / commercial).
  - Détails portail au-delà de la liste (adresse, type, statut).

### 2.2 Actions réelles (run_lea_actions)

Toutes les actions ci‑dessous écrivent en base et retournent des lignes « Action effectuée » pour le prompt.

| Action | Détection | Écriture BD | Modèles |
|--------|-----------|-------------|---------|
| Créer une transaction | `_wants_to_create_transaction` | `RealEstateTransaction` | real_estate_transactions |
| Mettre à jour l’adresse | `_wants_to_update_address` + `_extract_address_from_message` | `RealEstateTransaction` (property_address, city, postcode, province) + géocodage Nominatim | real_estate_transactions |
| Géocoder une adresse existante | `_wants_to_geocode_existing_address` | Mise à jour ville/code postal/province | real_estate_transactions |
| Date promesse d’achat | `_wants_to_set_promise` | `promise_to_purchase_date = date.today()` | real_estate_transactions |
| Créer soumission formulaire OACIQ | `_wants_to_create_oaciq_form_for_transaction` | `FormSubmission` + `FormSubmissionVersion` (form_code PA par défaut) | forms, form_submissions, form_submission_versions |
| Ajouter / remplacer vendeurs ou acheteurs | `_extract_seller_buyer_names_list` ou `_extract_seller_buyer_names_from_assistant_question` | `RealEstateContact` + `TransactionContact` + `transaction.sellers` / `transaction.buyers` | real_estate_contacts, transaction_contacts, real_estate_transactions |
| Modifier vendeurs/acheteurs (remplacement) | Détection « changer les vendeurs » + au tour suivant noms | Remplacement liste `sellers` / `buyers` + nouveaux contacts | idem |
| Enregistrer un prix | `_extract_price_from_message` | `listing_price` ou `offered_price` | real_estate_transactions |
| Date de clôture prévue | `_parse_french_date_from_message` | `expected_closing_date` | real_estate_transactions |

Résolution de la transaction cible : par `transaction_id` / `dossier_number` (`_extract_transaction_ref_from_message`), par indice d’adresse (ex. « Bordeaux » → `get_user_transaction_by_address_hint`), sinon dernière transaction (`get_user_latest_transaction`).

### 2.3 Lien session ↔ transaction

- `LeaSessionTransactionLink` : après une action, si `session_id` présent et `action_lines` non vides, on lie la session à la transaction (créée ou dernière). Utilisé pour l’historique des conversations par transaction (`list_lea_conversations_by_transaction`).

### 2.4 Persistance des messages de conversation

- **Modèle :** `LeaConversation` (table `lea_conversations`) : `session_id`, `messages` (JSON), `context`.
- **Problème :** les endpoints `POST /lea/chat` et `POST /lea/chat/stream` **ne sauvegardent pas** les messages dans `LeaConversation`. Seul le frontend garde l’historique en mémoire (React state).
- **Conséquence :** `GET /lea/context?session_id=...` (utilisé par `loadConversation`) retourne les messages de `LeaService.get_or_create_conversation(session_id).messages`, qui restent **vides** dans le flux actuel. Recharger une conversation par session ne ramène donc pas les échanges réels.

---

## 3. Capacités annoncées (LEA_CAPABILITIES) vs implémenté

| ID | Label | Annoncé | Implémenté | Détail |
|----|--------|---------|------------|--------|
| create_transaction | Créer une transaction | Oui | Oui | Détection « promesse d’achat », « créer une transaction », type achat/vente ; création `RealEstateTransaction`. |
| update_transaction | Modifier une transaction | Oui | Oui (partiel) | Adresse, vendeurs, acheteurs (ajout + remplacement), prix, date clôture, date promesse, création soumission OACIQ (PA). Pas de modification générique « champ X = Y ». |
| create_contact | Créer un contact | Oui (Réseau) | Non | Aucun appel à l’API Réseau/commercial ou real_estate_contacts pour « créer un contact dans le Réseau ». Les contacts créés le sont uniquement dans le cadre d’une transaction (vendeurs/acheteurs). |
| update_contact | Modifier un contact | Oui (Réseau) | Non | Aucune action Léa qui appelle l’API de mise à jour de contact. |
| access_oaciq_forms | Accéder aux formulaires OACIQ | Oui | Non | Aucune action qui liste les formulaires OACIQ ou renvoie les détails d’un formulaire dans le contexte. Léa ne « consulte » pas la liste des formulaires via run_lea_actions. |
| modify_oaciq_forms | Modifier des formulaires OACIQ | Oui | Oui (création soumission) | Création d’une soumission (brouillon) liée à une transaction (code PA). Pas de modification de champs d’une soumission existante ni de complétion. |

---

## 4. Frontend

- **useLea** : envoie `lastAssistantMessage` (dernier message assistant) pour le tour courant ; utilise le stream en priorité (`/lea/chat/stream`), fallback sur `POST /lea/chat`. Les messages et métadonnées (actions, model, provider, usage) sont gardés en state.
- **loadConversation(sessionId)** : appelle `GET /lea/context?session_id=...` et affiche `data.messages` — aujourd’hui vide côté backend pour les sessions utilisées par le chat actuel.
- **resetContext** : `DELETE /lea/context?session_id=...` supprime la conversation côté BD (LeaConversation).

---

## 5. Agent externe

- Si `AGENT_API_URL` + `AGENT_API_KEY` sont définis et que l’IA intégrée n’est pas utilisée (ou en secours), le backend appelle `_call_external_agent_chat(message, session_id, conversation_id=None)`.
- `conversation_id` est **toujours** `None` : l’agent externe ne reçoit pas d’ID de conversation persistée.
- Avant l’appel agent : `run_lea_actions` est exécuté ; en cas d’actions (ex. création transaction, mise à jour), une réponse directe est renvoyée sans appeler l’agent. Sinon, le message utilisateur est envoyé à l’agent et la réponse est renvoyée **sans** le champ `actions` (donc « aucune action enregistrée » dans les logs).

---

## 6. Paramètres Léa (admin)

- **GET /lea/settings** : retourne le prompt système, max_tokens, tts_model, tts_voice (depuis config / env).
- **PUT /lea/settings** : retourne **501** — pas de persistance des paramètres (tout vient du code / variables d’environnement).

---

## 7. Synthèse des écarts et risques

| Écart | Impact |
|-------|--------|
| Historique conversation non envoyé au LLM | Contexte multi-tours limité ; le modèle ne « voit » que le dernier message assistant (pour les cas type « oui enregistrez », « nouveaux vendeurs »). |
| Messages non persistés en BD pour le flux chat actuel | Liste des conversations et reprise d’une session inutiles ou vides. |
| create_contact / update_contact (Réseau) non branchés | Capacités affichées en admin non honorées. |
| access_oaciq_forms non implémenté | Léa ne peut pas lister ou décrire les formulaires OACIQ dans la conversation. |
| Contexte plateforme sans date de clôture ni formulaires | Léa peut redemander la date de clôture ou ignorer les formulaires déjà créés. |
| Agent externe sans conversation_id | Pas de continuité côté agent si un jour il gère l’historique. |
| Paramètres Léa non persistés | Pas de personnalisation par instance sans redéploiement / env. |

---

# Plan de consolidation

## Objectifs

1. Aligner les capacités annoncées et le comportement réel (BD + plateforme).
2. Donner à Léa un vrai contexte multi-tours et une conversation persistée.
3. Clarifier et unifier les flux (endpoints vs LeaService) et la connexion BD.

---

## Phase 1 : Persistance et historique (priorité haute)

### 1.1 Persister les messages dans LeaConversation

- **Backend :** après chaque réponse réussie de `POST /lea/chat` et en fin de stream `POST /lea/chat/stream`, récupérer ou créer la `LeaConversation` pour `session_id` + `user_id`, puis mettre à jour `messages` (append user message + assistant message) et `updated_at`.
- **Format messages :** garder un format compatible avec le frontend (role, content, timestamp, actions, model, provider, usage).
- **Effet :** `loadConversation(sessionId)` et liste des conversations reflètent les vrais échanges.

### 1.2 Envoyer l’historique au LLM (IA intégrée)

- Construire `messages` pour `AIService.chat_completion` à partir des N derniers messages de la conversation (ex. 10 à 20 tours), en respectant la limite de tokens du modèle.
- Continuer à injecter le bloc « Données plateforme » et « Action effectuée » dans le system prompt ou en premier message système.
- Adapter le stream : soit envoyer l’historique à chaque requête (stream), soit repasser par un service unique qui gère conversation + appels LLM (voir phase 3).

**Livrable :** conversation persistée + historique envoyé au LLM pour l’IA intégrée.

---

## Phase 2 : Contexte plateforme et capacités (priorité haute)

### 2.1 Enrichir get_lea_user_context

- Ajouter pour la dernière transaction (et éventuellement les 2–3 précédentes) :
  - `expected_closing_date` (date de clôture prévue).
  - Présence / nombre de soumissions OACIQ (ex. « 1 formulaire PA en brouillon »).
- Optionnel : résumé des contacts Réseau (nombre ou liste courte) si on souhaite que Léa propose « créer un contact » ou « lier à un contact existant ».

### 2.2 Aligner LEA_CAPABILITIES

- **create_contact / update_contact :**  
  - Soit implémenter des actions Léa qui appellent l’API Réseau (create/update contact) après extraction de noms/email/téléphone, avec une ligne « Action effectuée » dans le prompt.  
  - Soit retirer ou nuancer ces capacités dans l’UI (ex. « À venir ») et dans la doc.
- **access_oaciq_forms :**  
  - Soit ajouter une action (ou un outil) qui récupère la liste des formulaires OACIQ (et éventuellement les détails d’un code) et injecte le résultat dans le contexte ou une ligne « Action effectuée » pour que Léa puisse en parler.  
  - Soit retirer ou marquer « À venir ».

**Livrable :** Contexte plateforme enrichi ; capacités soit implémentées soit clairement signalées comme non disponibles.

---

## Phase 3 : Unifier le flux Léa (priorité moyenne)

### 3.1 Clarifier le rôle de LeaService

- **Option A :** Déprécier l’ancien `LeaService.chat()` (tools search_agents, search_contacts, etc.) et ne garder que la persistance (get_or_create_conversation, list_conversations) utilisée par les endpoints actuels.
- **Option B :** Réutiliser LeaService pour la persistance ET pour construire la liste des messages envoyés au LLM (historique), tout en gardant `run_lea_actions` dans les endpoints comme couche « actions métier » avant l’appel LLM.

### 3.2 Documenter le flux unique

- Un seul schéma documenté :  
  `run_lea_actions` → mise à jour BD + lignes « Action effectuée » → construction du prompt (système + contexte plateforme + historique + message courant) → appel LLM → persistance des messages dans LeaConversation → réponse au client.

**Livrable :** Un seul flux documenté, code mort ou doublons identifiés et traités.

---

## Phase 4 : Agent externe et paramètres (priorité basse)

### 4.1 Agent externe

- Si l’agent externe gère des conversations : créer ou récupérer une `LeaConversation` côté backend et passer un `conversation_id` (ou équivalent) à l’agent pour qu’il puisse charger/sauvegarder l’historique.
- Après réponse de l’agent : persister les messages (user + assistant) dans la même `LeaConversation` pour cohérence avec le frontend.

### 4.2 Paramètres Léa

- Implémenter la persistance des paramètres (prompt, max_tokens, tts, etc.) en base (table type `global_settings` ou dédiée) et les utiliser dans les endpoints chat/voice/settings.
- Ou documenter explicitement que seules les variables d’environnement sont supportées et retirer l’endpoint PUT /lea/settings ou le faire retourner une réponse explicite « lecture seule depuis l’environnement ».

**Livrable :** Comportement agent externe et paramètres clairs et cohérents.

---

## Phase 5 : Qualité et robustesse (priorité moyenne)

- **Tests :** scénarios E2E ou d’intégration pour les actions critiques (création transaction, adresse, vendeurs/acheteurs, prix, date clôture, formulaire OACIQ, modification vendeurs/acheteurs).
- **Logs / observabilité :** tracer les actions exécutées par `run_lea_actions` (quelle action, quelle transaction, succès/échec) pour faciliter le diagnostic.
- **Gestion d’erreurs :** messages utilisateur clairs en cas d’échec BD ou d’API (géocodage, formulaire introuvable, etc.) et consignes dans le prompt pour que Léa ne prétende pas avoir réussi si une action a échoué.

---

## Ordre de mise en œuvre recommandé

1. **Phase 1.1** – Persister les messages (LeaConversation) dans le flux chat actuel.  
2. **Phase 2.1** – Enrichir le contexte (date clôture, formulaires).  
3. **Phase 1.2** – Envoyer l’historique au LLM.  
4. **Phase 2.2** – Ajuster LEA_CAPABILITIES (implémentation ou désactivation explicite).  
5. **Phase 3** – Unifier et documenter le flux.  
6. **Phases 4 et 5** – Selon priorités produit et ressources.

---

## Fichiers principaux concernés

| Fichier | Rôle |
|---------|------|
| `backend/app/api/v1/endpoints/lea.py` | Endpoints chat, run_lea_actions, get_lea_user_context, LEA_CAPABILITIES |
| `backend/app/services/lea_service.py` | LeaService, LeaConversation (get_or_create, list), ancien chat avec tools |
| `backend/app/models/lea_conversation.py` | LeaConversation, LeaToolUsage, LeaSessionTransactionLink |
| `apps/web/src/hooks/useLea.ts` | État messages, sendMessage, loadConversation, lastAssistantMessage |
| `apps/web/src/lib/api.ts` | leaAPI.chatStream, leaAPI.getContext, etc. |

Ce document peut servir de référence pour les tickets (backend, frontend, produit) et pour les mises à jour de la documentation utilisateur ou technique.
