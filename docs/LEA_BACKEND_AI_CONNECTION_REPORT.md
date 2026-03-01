# Rapport d'investigation : Connexion Léa (IA) ↔ Backend (actions)

**Date** : 1er mars 2026  
**Objet** : Pourquoi Léa semble incapable d'effectuer les actions de base (créer une transaction, enregistrer l'adresse, le prix, etc.) et impression de « déconnexion » entre l'IA et le backend.

---

## 1. Résumé exécutif

Le backend exécute correctement les **actions** (création de transaction, adresse, prix, promesse, contacts) via `run_lea_actions()`, mais selon la **configuration** (clés API vs agent externe) et l'**endpoint** utilisé (stream vs chat), soit l'**IA ne reçoit pas** le bloc « Action effectuée » et les « Données plateforme », soit le **modèle reçoit** tout mais peut encore répondre « Je ne peux pas » par non-respect des instructions.

La « déconnexion » vient surtout du **choix de chemin** (agent externe vs IA intégrée) et du fait que **l'agent externe n'a jamais accès au contexte plateforme ni aux actions**.

---

## 2. Architecture du flux

### 2.1 Frontend

- **Envoi** : `useLea.sendMessage(message)` appelle en priorité **stream** : `POST /api/v1/lea/chat/stream` (fetch manuel).
- **Si 501 ou 404** : fallback sur **chat non-stream** : `POST /api/v1/lea/chat` (body `{ message, session_id, provider }`).
- Le message utilisateur est envoyé tel quel (ex. « Créer une transaction »).

### 2.2 Backend – Points d'entrée

| Endpoint | Condition | Actions backend | Contexte envoyé à l'IA |
|----------|-----------|------------------|-------------------------|
| `POST /chat/stream` | `_use_integrated_lea()` = True | Oui | Oui (Données + Action effectuée) |
| `POST /chat` (intégré) | `not _use_external_agent()` et `_use_integrated_lea()` | Oui | Oui |
| `POST /chat` (agent) | `_use_external_agent()` = True | Oui | **Non** (message seul) |

- **Actions** : toujours exécutées via `run_lea_actions()` (création transaction, adresse, prix, promesse, vendeur/acheteur).
- **Contexte** : en mode intégré, `user_context` + « Action effectuée » sont passés dans le system prompt ; en mode agent externe, seul le message est envoyé à l'agent → pas de contexte.

### 2.3 Décision actuelle dans `lea_chat` (POST /chat)

1. Si (pas d'agent externe) ET (IA intégrée) → chemin intégré (contexte + actions). ✅  
2. Si agent externe configuré → chemin agent externe (message seul). ❌ pas de contexte  
3. Sinon → 501.

**Conséquence** : dès que `AGENT_API_URL` et `AGENT_API_KEY` sont renseignés, le backend utilise **toujours** l'agent externe pour POST /chat, même si OpenAI/Anthropic sont définis. Les actions sont faites en base mais l'IA qui répond n'a pas le contexte.

---

## 3. Scénarios problématiques

### A. Stream 501 puis fallback /chat + agent externe

- Config : pas de clé OpenAI/Anthropic ; `AGENT_API_URL` + `AGENT_API_KEY` définis.
- Flux : stream → 501 → fallback POST /chat → agent externe.
- Si le message déclenche une action (ex. « Créer une transaction ») : le backend peut renvoyer une réponse directe sans appeler l'agent → OK. Sinon : agent appelé avec message seul → « Je ne peux pas ».

### B. Agent externe seul

- Config : `AGENT_API_URL` + `AGENT_API_KEY` ; pas d'OpenAI/Anthropic.
- Les actions sont exécutées côté backend, mais l'agent qui génère la réponse n'a **jamais** accès aux actions ni aux données → incohérence.

### C. IA intégrée sans agent externe

- Config : `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` ; pas d'agent externe.
- Contexte + actions sont envoyés au modèle. Si Léa dit encore « Je ne peux pas », causes possibles : détection du message qui échoue (`action_lines` vide) ou modèle qui ignore le bloc « Action effectuée ».

### D. Agent externe ET IA intégrée configurés

- Comportement actuel : POST /chat utilise **toujours** l'agent externe → pas de contexte. Le stream lui utilise l'intégré si configuré → incohérence selon l’endpoint.

---

## 4. Causes de la « déconnexion »

| Cause | Description |
|-------|-------------|
| **Agent externe sans contexte** | L'agent ne reçoit que le message. Aucun « Données plateforme » ni « Action effectuée » → il ne peut pas confirmer les actions. |
| **Priorité agent externe** | Dès qu'agent externe est configuré, POST /chat l'utilise en priorité, même si une IA intégrée est disponible. |
| **Stream 501 → fallback** | Sans clé OpenAI/Anthropic, stream renvoie 501 → front utilise /chat → si agent externe configuré, pas de contexte. |
| **Détection des intents** | Formulation non reconnue → `action_lines` vide → pas d'« Action effectuée » même en mode intégré. |

---

## 5. Recommandations

### 5.1 Priorité à l'IA intégrée (recommandé)

Dans `lea_chat` : utiliser le **chemin intégré en premier** si `_use_integrated_lea()` est True, **sans** exiger `not _use_external_agent()`. N'utiliser l'agent externe **que si** l'IA intégrée n'est pas disponible. Ainsi, si les deux sont configurés, on utilise l'intégré (contexte + actions) ; l'agent externe ne sert qu'en secours.

### 5.2 Passer le contexte à l'agent externe (optionnel)

Étendre le payload vers l'agent avec `user_context` et `action_lines`, et adapter l'API Django pour les injecter dans le prompt. Sinon l'agent continuera à répondre sans savoir ce que le backend a fait.

### 5.3 Vérifier la configuration

- Pour le stream : s'assurer que `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` est défini et valide.
- Après correction : si on veut forcer l'agent externe, utiliser une variable dédiée (ex. `LEA_FORCE_EXTERNAL_AGENT=true`).

### 5.4 Diagnostic

- Logger pour chaque requête : `use_integrated_lea`, `use_external_agent`, présence de `action_lines`, chemin utilisé.
- Optionnel : endpoint `GET /api/v1/lea/diagnostic` (protégé) retournant `stream_available`, `integrated_lea_configured`, `external_agent_configured`.

---

## 6. Conclusion

Les **actions** sont bien exécutées côté backend. La déconnexion vient du fait que **l'entité qui génère la réponse** (agent externe ou modèle intégré) ne reçoit pas toujours le **contexte** (Données plateforme + Action effectuée). Quand l'**agent externe** est utilisé, il ne reçoit **jamais** ce contexte, et la **priorité** donnée à l'agent externe fait qu'on l'utilise même lorsqu'une IA intégrée (avec contexte) est disponible.

En priorisant l'IA intégrée lorsque ses clés sont présentes, les réponses de Léa refléteront correctement les actions effectuées par le backend.

---

*Rapport généré à partir de l'analyse du code dans `backend/app/api/v1/endpoints/lea.py`, `apps/web/src/hooks/useLea.ts`, et `apps/web/src/lib/api.ts`.*
