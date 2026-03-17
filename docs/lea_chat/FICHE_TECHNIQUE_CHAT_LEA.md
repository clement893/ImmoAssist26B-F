# Fiche technique — Système Chat IA Léa

**Document de référence pour reproduire ou adapter ce type de chat assisté dans un autre projet.**

---

## 1. Vue d'ensemble

Le système Léa est un **assistant conversationnel guidé par un routeur LLM** qui :

1. **Comprend** l'intention de l'utilisateur (domain + intent + entities)
2. **Exécute** des actions backend (création dossiers, formulaires, etc.)
3. **Génère** une réponse naturelle en s'appuyant sur le résultat des actions

**Principe clé** : le LLM ne fait pas les actions ; il **décide** ce que l'utilisateur veut. Le backend **exécute** et retourne des "lignes d'action" que le LLM final utilise pour formuler la réponse.

---

## 2. Architecture en couches

```
┌─────────────────────────────────────────────────────────────────┐
│                         API (endpoints)                          │
│  POST /chat, POST /chat/stream, POST /voice                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                                │
│  1. Charge le contexte actif (session, transaction, PA, etc.)     │
│  2. Appelle le ROUTER pour obtenir une RoutingDecision            │
│  3. Délègue à l'EXECUTOR (qui exécute les actions)               │
│  4. Retourne (action_lines, transaction)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────────┐
│   ROUTER      │   │   CONTEXT     │   │   EXECUTOR        │
│   (LLM)       │   │   LOADER      │   │   (actions)       │
│               │   │               │   │                   │
│ - Domain      │   │ - Transaction │   │ - Création tx     │
│ - Intent      │   │   active      │   │ - Création PA     │
│ - Entities    │   │ - PA en       │   │ - Remplissage     │
│ - Signals     │   │   cours       │   │ - Mises à jour    │
│ - Confidence  │   │ - Pending     │   │                   │
└───────────────┘   └───────────────┘   └───────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE COMPOSER                             │
│  Construit le system_prompt final = knowledge + règles +          │
│  données plateforme + action_lines                               │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM FINAL (génération)                        │
│  Reçoit : messages + system_prompt                               │
│  Produit : réponse naturelle en français                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Modèle conceptuel : Domain-Intent-Entities

### 3.1 Séparation des responsabilités

| Couche | Décide | Ne décide pas |
|--------|--------|---------------|
| **LLM routeur** | Ce que l'utilisateur veut (domain, intent), ce qu'il a dit (entities), indices conversationnels (signals) | Actions backend, validations |
| **Backend (executor)** | Si l'action est permise, quel objet créer, validations, prochain état | Comment formuler la réponse |
| **LLM final** | Comment répondre clairement, comment poser la prochaine question | Quelles actions exécuter |

### 3.2 Domain

Répond à : **De quel univers métier parle l'utilisateur ?**

| Domain | Signification |
|--------|---------------|
| `transaction` | Création ou gestion d'un dossier |
| `purchase_offer` | Promesse d'achat (formulaire) |
| `general_assistance` | Questions générales |
| `other` | Hors périmètre |

**Extensibilité** : ajouter `contract`, `form`, `deadline`, etc. sans refonte.

### 3.3 Intent

Répond à : **Que veut faire l'utilisateur dans ce domaine ?**

| Intent | Signification |
|--------|---------------|
| `create` | Créer un nouvel objet |
| `fill` | Fournir des champs (formulaire en cours) |
| `update` | Corriger une info déjà fournie |
| `confirm` | Confirmer une action proposée |
| `cancel` | Annuler le flow |
| `resume` | Reprendre un flow suspendu |
| `ask_help` | Demander une explication |
| `answer` | Répondre à une question de suivi |

**Règle** : intents génériques, pas `create_transaction` ou `fill_pa` (ça mélange domain + action).

### 3.4 Entities

Répond à : **Quelles données concrètes l'utilisateur a-t-il fournies ?**

Format : `{ name, value, confidence? }`

Exemples : `transaction_type`, `property_reference`, `seller_names`, `buyer_names`, `listing_price`, `occupation_date`, `deposit_amount`, etc.

### 3.5 Signals

Indices conversationnels booléens :

- `user_confirmed` : message = confirmation courte (oui, c'est ça)
- `user_gave_address` : message contient une adresse
- `asked_property_for_form` : dernier message assistant demandait pour quelle propriété
- `last_message_asked_for_sellers` : dernier message demandait les vendeurs
- `flow_interruption` : utilisateur change de sujet
- etc.

### 3.6 Confidence

`0.0` à `1.0`. En dessous d'un seuil (ex. 0.5), basculer sur des heuristiques ou demander clarification.

---

## 4. Flux de traitement d'un message

```
Message utilisateur
    │
    ▼
┌─────────────────────────────────────────┐
│ load_active_conversation_context()      │
│ → transaction_active, pa_active,        │
│   pending_transaction, summary          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ route_user_message(message, last_msg,   │
│                    context_summary)     │
│ → RoutingDecision (domain, intent,      │
│   entities, signals, confidence)        │
└─────────────────────────────────────────┘
    │
    ├─ confidence >= seuil → utiliser la décision
    └─ confidence < seuil  → heuristiques (fallback)
    │
    ▼
┌─────────────────────────────────────────┐
│ execute_actions(router_decision)         │
│ → actions backend (création, remplissage,│
│   mises à jour)                         │
│ → action_lines : liste de lignes        │
│   "Action effectuée"                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ build_context(user_context,             │
│               action_lines, knowledge)  │
│ → system_prompt complet                 │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ LLM.chat_completion(messages,           │
│                    system_prompt)       │
│ → réponse naturelle                     │
└─────────────────────────────────────────┘
```

---

## 5. Bloc « Action effectuée »

Les actions backend ne génèrent pas la réponse ; elles produisent des **lignes textuelles** injectées dans le contexte du LLM.

**Exemples de lignes :**
- « Transaction #78 créée. Confirme et propose d'aller dans Transactions. »
- « Demande immédiatement les infos pour la section Prix et acompte : acompte, date_acompte. »
- « L'adresse a été ajoutée à la transaction #78 : 229 rue Dufferin. »

**Règles pour le LLM final :**
1. Ne jamais inventer une action non mentionnée dans le bloc
2. Confirmer ce qui est indiqué
3. Demander explicitement ce qui est demandé (écrire la question, pas « répondez à ma prochaine question »)
4. Ne pas conclure par « avez-vous d'autres questions ? » tant que des infos restent à collecter

---

## 6. Base de connaissance

### 6.1 Fichier unique recommandé

Un seul fichier Markdown contenant :
- Instructions centrales (ton, bloc Action effectuée)
- Domaines, intents, entities, signals
- Tous les cas métier (ex. T1–T10 transaction, P1–P14 PA)
- Explication de chaque champ des formulaires
- Règles de priorité pour le routage
- Cas transversaux (annulation, ambiguïté, reprise)

### 6.2 Chargement

```
Priorité :
1. Fichier unique LEA_KNOWLEDGE.md
2. Contenu DB (admin-editable)
3. Documents uploadés par l'utilisateur (supplément)
```

### 6.3 Fichier de routage séparé

Pour le routeur LLM : un fichier dédié avec le format de sortie JSON attendu (RoutingDecision), la description des domaines, intents, entities, signals, et les règles de priorité.

---

## 7. Router LLM

### 7.1 Rôle

- **Entrée** : message, dernier message assistant, résumé du contexte
- **Sortie** : JSON structuré (RoutingDecision)
- **Aucune écriture DB**
- **Aucune logique métier** : décision pure

### 7.2 Fallback

Si le LLM principal échoue :
1. Routeur legacy (même prompt, format simplifié)
2. Classifieur minimal (intent uniquement)
3. Heuristiques (règles déterministes)

### 7.3 Format de sortie

```json
{
  "domain": "transaction" | "purchase_offer" | "general_assistance" | "other",
  "intent": "create" | "fill" | "update" | "confirm" | "cancel" | "resume" | "ask_help" | "answer",
  "entities": [{"name": "...", "value": "...", "confidence": 0.9}],
  "signals": {"user_confirmed": false, "user_gave_address": true, ...},
  "confidence": 0.85
}
```

---

## 8. Context Loader

Charge l'état actif de la conversation :
- Transaction liée à la session
- PA en cours de remplissage (draft, section, champ attendu)
- Brouillon de création (pending)
- Dernier message assistant
- Résumé texte pour le prompt du routeur

---

## 9. Executor / Actions

Reçoit la RoutingDecision et exécute les actions backend appropriées.

**Mapping typique :**
| domain | intent | Action |
|--------|--------|--------|
| transaction | create | Flow création (collecte type, adresse, parties, prix) |
| transaction | answer | Fusion des entities dans le brouillon |
| transaction | update | Mise à jour selon entities |
| purchase_offer | create | Création draft PA, liaison transaction |
| purchase_offer | confirm | Création PA si signals de confirmation |
| purchase_offer | fill | Extraction champs, sauvegarde, prochain champ |
| (any) | cancel | Vider pending, réinitialiser |

---

## 10. Response Composer

Construit le `system_prompt` final :
```
[Base de connaissance]
[Règles système / LEA_SYSTEM_PROMPT]
[Données plateforme + Action effectuée]
```

**Ne fait pas** l'appel LLM ; l'endpoint reste responsable.

---

## 11. API et intégration

### 11.1 Endpoints typiques

- `POST /chat` : message → réponse complète
- `POST /chat/stream` : message → flux SSE (deltas)
- `POST /voice` : audio → transcription → actions → LLM → TTS → audio

### 11.2 Paramètres de requête

- `message` : texte utilisateur
- `session_id` : identifiant de conversation (pour contexte)
- `last_assistant_message` : dernier message de l'assistant (pour confirmer « oui »)
- `transaction_id` (optionnel) : pour lier la session à une transaction

### 11.3 Réponse

- `content` : texte de l'assistant
- `session_id` : session utilisée
- `actions` : lignes d'action effectuées (pour debug / affichage front)

---

## 12. Modèles de données typiques

### 12.1 Session / Conversation

- `session_id` : UUID ou identifiant
- `messages` : historique (role, content)
- `context` : JSON (pending_transaction_creation, oaciq_fill, etc.)
- Lien session ↔ transaction (pour prioriser une transaction)

### 12.2 Pending (brouillon création)

```
{
  "type": "vente" | "achat",
  "stage": "type" | "address" | "sellers" | "buyers" | "price" | "ready",
  "address": "...",
  "city": "...",
  "postal_code": "...",
  "sellers": [...],
  "buyers": [...],
  "price": 525000
}
```

### 12.3 PA en cours de remplissage

```
{
  "submission_id": 123,
  "last_asked_section": "...",
  "last_asked_field": "...",
  "section_title": "...",
  "missing_in_section": [[field_id, label], ...]
}
```

---

## 13. Heuristiques (fallback)

Quand le routeur LLM échoue ou confidence < seuil :
- Détection de mots-clés (« créer », « transaction », « PA », « promesse »)
- Analyse du dernier message assistant (« quelle adresse ? », « pour quelle propriété ? »)
- Extraction par regex (adresse, prix, noms)

**Règle** : le LLM reste prioritaire ; les heuristiques sont un filet de sécurité.

---

## 14. Checklist pour un nouveau projet

- [ ] Définir les **domains** métier
- [ ] Définir les **intents** génériques
- [ ] Lister les **entities** par domaine
- [ ] Lister les **signals** conversationnels
- [ ] Créer le fichier de **connaissance** (instructions + cas + champs)
- [ ] Créer le fichier de **routage** (format JSON attendu)
- [ ] Implémenter **context_loader** (état actif)
- [ ] Implémenter **router** (LLM + fallback)
- [ ] Implémenter **executor** (mapping domain+intent → actions)
- [ ] Implémenter **response_composer**
- [ ] Brancher sur l’API chat (stream + non-stream)
- [ ] Tester les cas principaux et les cas limites

---

## 15. Fichiers clés (référence ImmoAssist)

| Fichier | Rôle |
|---------|------|
| `lea_chat/orchestrator.py` | Point d'entrée, coordination |
| `lea_chat/router.py` | Routage LLM, Domain-Intent-Entities |
| `lea_chat/context_loader.py` | Contexte actif (transaction, PA, pending) |
| `lea_chat/executor.py` | Délégation aux actions |
| `lea_chat/schemas.py` | RoutingDecision, LeaEntity, LeaSignals |
| `lea_chat/knowledge.py` | Chargement base de connaissance |
| `lea_chat/response_composer.py` | Construction system_prompt |
| `lea_chat/actions/transaction.py` | Actions transaction |
| `lea_chat/actions/purchase_offer.py` | Actions PA |
| `lea_chat/heuristics.py` | Fallback déterministe |
| `docs/oaciq/LEA_KNOWLEDGE.md` | Base de connaissance unique |
| `docs/lea/prompts/LEA_ROUTING_KNOWLEDGE.md` | Routage (format JSON) |

---

## 16. Extensibilité

Pour ajouter un nouveau domaine (ex. `contract`) :
1. Ajouter le domain dans les schémas et le knowledge
2. Créer `actions/contract.py`
3. Étendre le mapping dans l’executor
4. Documenter les cas dans LEA_KNOWLEDGE.md
5. Mettre à jour le fichier de routage

La structure Domain-Intent-Entities évite de multiplier les booléens et les branches ad hoc.
