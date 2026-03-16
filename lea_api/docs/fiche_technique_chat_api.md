# Fiche Technique — API Chat Courtier Assistant (Léa)

**Stack :** Next.js (frontend) + Python FastAPI (backend) + PostgreSQL/Redis (state)  
**Modèle LLM :** Claude (Anthropic API)  
**Rôle du LLM :** Comprendre le message, lire le draft, décider les actions

---

## 1. Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js (Frontend)                                             │
│  ┌──────────────┐                                               │
│  │  Chat UI     │  POST /api/chat  ──────────────────────────┐  │
│  │  (messages,  │  ← réponse Léa + actions                   │  │
│  │   actions)   │                                            │  │
│  └──────────────┘                                            │  │
└─────────────────────────────────────────────────────────────┼──┘
                                                              │
                                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI (Backend)                                              │
│                                                                 │
│  POST /chat                                                     │
│    │                                                            │
│    ├─ 1. Charger le state (Redis/Postgres)                      │
│    ├─ 2. Construire le prompt (system .md + historique + state) │
│    ├─ 3. Appeler Anthropic API                                  │
│    ├─ 4. Parser la réponse LLM (message + actions JSON)         │
│    ├─ 5. Exécuter les actions (create_transaction, etc.)        │
│    ├─ 6. Sauvegarder le nouveau state                           │
│    └─ 7. Retourner réponse au frontend                          │
│                                                                 │
└──────────┬──────────────────────┬───────────────────────────────┘
           │                      │
           ▼                      ▼
    ┌─────────────┐        ┌─────────────┐
    │    Redis    │        │  PostgreSQL  │
    │  (session,  │        │  (transactions│
    │   draft,    │        │   PA, users) │
    │  historique)│        │              │
    └─────────────┘        └─────────────┘
```

---

## 2. Structure des Données

### 2.1 Session State (Redis)

Clé : `session:{conversation_id}`  
TTL : 24h (renouvelé à chaque message)

```json
{
  "conversation_id": "uuid",
  "user_id": "uuid",
  "active_domain": "transaction" | "promesse_achat" | null,
  "transaction": {
    "id": "uuid | null",
    "status": "pending" | "created",
    "fields": {
      "property_address": null,
      "sellers": [],
      "buyers": [],
      "offered_price": null,
      "transaction_type": null
    }
  },
  "promesse_achat": {
    "id": "uuid | null",
    "status": "pending" | "created",
    "fields": {
      "acheteur_adresse": null,
      "acheteur_telephone": null,
      "acheteur_courriel": null,
      "vendeur_adresse": null,
      "vendeur_telephone": null,
      "vendeur_courriel": null,
      "description_immeuble": null,
      "acompte": null,
      "date_acompte": null,
      "delai_remise_depot": null,
      "mode_paiement": null,
      "montant_hypotheque": null,
      "delai_financement": null,
      "date_acte_vente": null,
      "condition_inspection": null,
      "date_limite_inspection": null,
      "condition_documents": null,
      "inclusions": [],
      "exclusions": [],
      "autres_conditions": null,
      "delai_acceptation": null
    }
  },
  "awaiting_field": null,
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

### 2.2 Tables PostgreSQL

```sql
-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  conversation_id UUID,
  property_address TEXT NOT NULL,
  sellers TEXT[] NOT NULL,
  buyers TEXT[] NOT NULL,
  offered_price NUMERIC NOT NULL,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('vente', 'achat')),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promesses d'Achat
CREATE TABLE promesses_achat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  -- Champs préremplis depuis la transaction
  acheteurs TEXT[],
  vendeurs TEXT[],
  property_address TEXT,
  prix_offert NUMERIC,
  prix_achat NUMERIC,
  -- Champs dérivés
  property_city TEXT,
  property_postal_code TEXT,
  property_province TEXT DEFAULT 'Québec',
  courtier_vendeur_nom TEXT,
  courtier_vendeur_permis TEXT,
  courtier_acheteur_nom TEXT,
  courtier_acheteur_permis TEXT,
  -- Champs utilisateur
  acheteur_adresse TEXT,
  acheteur_telephone TEXT,
  acheteur_courriel TEXT,
  vendeur_adresse TEXT,
  vendeur_telephone TEXT,
  vendeur_courriel TEXT,
  description_immeuble TEXT,
  acompte NUMERIC,
  date_acompte DATE,
  delai_remise_depot TEXT,
  mode_paiement TEXT,
  montant_hypotheque NUMERIC,
  delai_financement TEXT,
  date_acte_vente DATE,
  condition_inspection BOOLEAN,
  date_limite_inspection DATE,
  condition_documents BOOLEAN,
  inclusions TEXT[],
  exclusions TEXT[],
  autres_conditions TEXT,
  delai_acceptation DATE,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Format de Réponse LLM

Le LLM retourne **toujours** un JSON structuré avec deux parties : le message conversationnel et les actions à exécuter.

### Instruction dans le system prompt

Ajouter à la fin du `.md` :

```
## Format de réponse obligatoire

Tu dois toujours répondre en JSON valide, sans texte autour, avec cette structure exacte :

{
  "message": "Le message conversationnel à afficher au courtier",
  "actions": [
    {
      "type": "action_type",
      "payload": { ... }
    }
  ],
  "state_updates": {
    "active_domain": "...",
    "awaiting_field": "...",
    "fields": { "field_name": "value" }
  }
}

- "message" : toujours présent, en français, affiché dans le chat
- "actions" : liste vide [] si aucune action à exécuter
- "state_updates" : uniquement les champs modifiés (pas tout le state)
```

### Exemple de réponse LLM

```json
{
  "message": "Parfait, j'ai bien noté tout ça. Voici le résumé avant de créer la transaction :\n\n- Adresse : 123 rue des Érables, Montréal, QC\n- Vendeur : Tremblay\n- Acheteur : Martin\n- Prix : 325 000 $\n- Type : Vente\n\nJe confirme la création ?",
  "actions": [],
  "state_updates": {
    "active_domain": "transaction",
    "awaiting_field": "confirmation_transaction",
    "fields": {
      "property_address": "123 rue des Érables, Montréal, QC",
      "sellers": ["Tremblay"],
      "buyers": ["Martin"],
      "offered_price": 325000,
      "transaction_type": "vente"
    }
  }
}
```

### Types d'actions disponibles

| `type` | Déclencheur | Payload |
|---|---|---|
| `create_transaction` | Tous les 5 champs + confirmation | `{ property_address, sellers, buyers, offered_price, transaction_type }` |
| `update_transaction` | Modification d'un champ transaction | `{ transaction_id, field, value }` |
| `create_pa` | Tous les champs PA + confirmation | Objet PA complet |
| `update_pa` | Modification d'un champ PA | `{ pa_id, field, value }` |
| `request_missing_fields` | Champs manquants détectés | `{ domain, missing_fields: [] }` |

---

## 4. Code FastAPI

### 4.1 Structure du projet

```
backend/
├── main.py
├── routers/
│   └── chat.py
├── services/
│   ├── llm.py          # Appel Anthropic + parsing
│   ├── state.py        # Lecture/écriture Redis
│   └── actions.py      # Exécution des actions métier
├── db/
│   ├── models.py       # SQLAlchemy models
│   └── session.py      # Connexion Postgres
├── prompts/
│   └── lea_courtier_assistant.md   # Ton system prompt
└── schemas.py          # Pydantic models
```

### 4.2 Endpoint principal

```python
# routers/chat.py
from fastapi import APIRouter, Depends
from schemas import ChatRequest, ChatResponse
from services.llm import call_llm
from services.state import load_state, save_state
from services.actions import execute_actions

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user=Depends(get_current_user)):
    
    # 1. Charger le state depuis Redis
    state = await load_state(request.conversation_id)
    
    # 2. Appeler le LLM
    llm_response = await call_llm(
        user_message=request.message,
        state=state,
        user=user
    )
    
    # 3. Mettre à jour le state avec les state_updates du LLM
    state = merge_state(state, llm_response["state_updates"])
    
    # 4. Exécuter les actions
    action_results = []
    for action in llm_response["actions"]:
        result = await execute_actions(action, state, user)
        action_results.append(result)
        # Mettre à jour les IDs dans le state si créés
        if action["type"] == "create_transaction":
            state["transaction"]["id"] = result["id"]
            state["transaction"]["status"] = "created"
        elif action["type"] == "create_pa":
            state["promesse_achat"]["id"] = result["id"]
            state["promesse_achat"]["status"] = "created"
    
    # 5. Ajouter à l'historique
    state["history"].append({ "role": "user", "content": request.message })
    state["history"].append({ "role": "assistant", "content": llm_response["message"] })
    
    # 6. Sauvegarder le state
    await save_state(request.conversation_id, state)
    
    # 7. Retourner la réponse
    return ChatResponse(
        message=llm_response["message"],
        actions=llm_response["actions"],
        state=state
    )
```

### 4.3 Service LLM

```python
# services/llm.py
import json
import re
from pathlib import Path
import anthropic

client = anthropic.Anthropic()  # Lit ANTHROPIC_API_KEY depuis l'env

SYSTEM_PROMPT = Path("prompts/lea_courtier_assistant.md").read_text()

RESPONSE_FORMAT_INSTRUCTION = """
## Format de réponse obligatoire

Réponds UNIQUEMENT en JSON valide, sans texte autour :

{
  "message": "message conversationnel en français",
  "actions": [],
  "state_updates": {
    "active_domain": "...",
    "awaiting_field": "...",
    "fields": {}
  }
}
"""

async def call_llm(user_message: str, state: dict, user: dict) -> dict:
    
    # Construire le contexte state pour le LLM
    state_context = f"""
## State actuel de la conversation

```json
{json.dumps(state, ensure_ascii=False, indent=2)}
```

## Infos courtier connecté
- Nom : {user['full_name']}
- Numéro de permis : {user['permis_number']}
- Rôle transaction actuelle : {state['transaction']['fields'].get('transaction_type', 'non défini')}
"""
    
    # Historique des messages (max 20 derniers pour contrôler les tokens)
    history = state.get("history", [])[-20:]
    messages = history + [{ "role": "user", "content": user_message }]
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=SYSTEM_PROMPT + "\n\n" + state_context + "\n\n" + RESPONSE_FORMAT_INSTRUCTION,
        messages=messages
    )
    
    raw = response.content[0].text
    
    # Parser le JSON retourné par le LLM
    try:
        # Nettoyer les backticks éventuels
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except json.JSONDecodeError:
        # Fallback si le LLM ne respecte pas le format
        return {
            "message": raw,
            "actions": [],
            "state_updates": {}
        }
```

### 4.4 Service State (Redis)

```python
# services/state.py
import json
import redis.asyncio as redis

redis_client = redis.from_url("redis://localhost:6379")
TTL = 86400  # 24h

def default_state(conversation_id: str, user_id: str) -> dict:
    return {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "active_domain": None,
        "transaction": {
            "id": None,
            "status": "pending",
            "fields": {
                "property_address": None,
                "sellers": [],
                "buyers": [],
                "offered_price": None,
                "transaction_type": None
            }
        },
        "promesse_achat": {
            "id": None,
            "status": "pending",
            "fields": {}
        },
        "awaiting_field": None,
        "history": []
    }

async def load_state(conversation_id: str, user_id: str = None) -> dict:
    data = await redis_client.get(f"session:{conversation_id}")
    if data:
        return json.loads(data)
    return default_state(conversation_id, user_id)

async def save_state(conversation_id: str, state: dict):
    await redis_client.setex(
        f"session:{conversation_id}",
        TTL,
        json.dumps(state, ensure_ascii=False)
    )

def merge_state(state: dict, updates: dict) -> dict:
    if not updates:
        return state
    if "active_domain" in updates and updates["active_domain"]:
        state["active_domain"] = updates["active_domain"]
    if "awaiting_field" in updates:
        state["awaiting_field"] = updates["awaiting_field"]
    if "fields" in updates:
        domain = state["active_domain"]
        if domain and domain in state:
            state[domain]["fields"].update(updates["fields"])
    return state
```

### 4.5 Service Actions

```python
# services/actions.py
from db.session import get_db
from db.models import Transaction, PromesseAchat

async def execute_actions(action: dict, state: dict, user: dict) -> dict:
    action_type = action["type"]
    payload = action.get("payload", {})
    
    async with get_db() as db:
        
        if action_type == "create_transaction":
            transaction = Transaction(
                user_id=user["id"],
                conversation_id=state["conversation_id"],
                **payload
            )
            db.add(transaction)
            await db.commit()
            await db.refresh(transaction)
            return { "id": str(transaction.id), "status": "created" }
        
        elif action_type == "create_pa":
            # Auto-remplir depuis la transaction
            transaction_fields = state["transaction"]["fields"]
            pa_data = {
                "transaction_id": state["transaction"]["id"],
                "user_id": user["id"],
                "acheteurs": transaction_fields.get("buyers"),
                "vendeurs": transaction_fields.get("sellers"),
                "property_address": transaction_fields.get("property_address"),
                "prix_offert": transaction_fields.get("offered_price"),
                "prix_achat": transaction_fields.get("offered_price"),
                **payload
            }
            # Remplir les infos courtier selon le type
            if transaction_fields.get("transaction_type") == "vente":
                pa_data["courtier_vendeur_nom"] = user["full_name"]
                pa_data["courtier_vendeur_permis"] = user["permis_number"]
            else:
                pa_data["courtier_acheteur_nom"] = user["full_name"]
                pa_data["courtier_acheteur_permis"] = user["permis_number"]
            
            pa = PromesseAchat(**pa_data)
            db.add(pa)
            await db.commit()
            await db.refresh(pa)
            return { "id": str(pa.id), "status": "created" }
        
        elif action_type in ("update_transaction", "update_pa"):
            # Update partiel selon le field/value
            ...
            return { "status": "updated" }
    
    return { "status": "no_action" }
```

---

## 5. Code Next.js (Frontend)

### 5.1 Hook `useChat`

```typescript
// hooks/useChat.ts
import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, conversation_id: conversationId })
    });

    const data = await res.json();
    setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
    setLoading(false);

    return data; // contient aussi data.actions, data.state
  };

  return { messages, sendMessage, loading };
}
```

### 5.2 Route API Next.js (proxy vers FastAPI)

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = req.cookies.get("auth_token")?.value;

  const response = await fetch(`${process.env.FASTAPI_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

---

## 6. Variables d'Environnement

### Backend (`backend/.env`)
```env
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/courtier_db
```

### Frontend (`frontend/.env.local`)
```env
FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. Flux Complet — Exemple de bout en bout

```
Courtier : "Nouvelle transaction, vendeur Tremblay, acheteur Martin, 
            123 rue des Érables Montréal, 325 000$, c'est une vente"

1. Next.js → POST /api/chat { message, conversation_id }
2. FastAPI → charge state Redis (vide = nouveau)
3. FastAPI → construit prompt :
     system  = lea.md + state JSON + format instruction
     messages = [{ role: user, content: "Nouvelle transaction..." }]
4. LLM répond :
     {
       "message": "Parfait ! Voici le résumé... Confirmer ?",
       "actions": [],
       "state_updates": {
         "active_domain": "transaction",
         "awaiting_field": "confirmation_transaction",
         "fields": {
           "property_address": "123 rue des Érables, Montréal",
           "sellers": ["Tremblay"],
           "buyers": ["Martin"],
           "offered_price": 325000,
           "transaction_type": "vente"
         }
       }
     }
5. FastAPI → merge state + save Redis
6. Frontend affiche : "Parfait ! Voici le résumé... Confirmer ?"

Courtier : "Oui confirme"

7. LLM répond :
     {
       "message": "Transaction créée avec succès ✅",
       "actions": [{ "type": "create_transaction", "payload": { ... } }],
       "state_updates": { "awaiting_field": null }
     }
8. FastAPI → execute create_transaction → INSERT Postgres
9. State mis à jour : transaction.id = "uuid", status = "created"
10. Frontend affiche succès
```

---

## 8. Points d'Attention

| Sujet | Recommandation |
|---|---|
| **Tokens** | Tronquer l'historique à 20 messages max pour éviter les dépassements |
| **JSON parsing** | Toujours utiliser un fallback si le LLM ne retourne pas du JSON valide |
| **Sécurité** | Ne jamais exposer `ANTHROPIC_API_KEY` côté frontend — passer par le proxy FastAPI |
| **Idempotence** | Vérifier qu'une transaction n'existe pas déjà avant `create_transaction` |
| **Timeout LLM** | Mettre un timeout de 30s sur l'appel Anthropic et gérer l'erreur côté chat |
| **Historique** | Stocker l'historique complet dans Redis, mais n'envoyer que les 20 derniers au LLM |
