# Léa API — Courtier Assistant

API de chat pour la création de **Transactions** et **Promesses d'Achat** (Québec).  
Reproduction standalone du système chat de ImmoAssist pour tester le flux Transaction + PA.

## Structure

```
lea_api/
├── app/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Settings (Anthropic, DB)
│   ├── schemas.py        # Pydantic models
│   ├── db/
│   │   ├── database.py   # SQLite/PostgreSQL async
│   │   └── models.py    # Transaction, PromesseAchat, LeaConversation
│   ├── routers/
│   │   ├── chat.py       # POST /api/chat
│   │   ├── knowledge.py  # GET /api/knowledge
│   │   └── progress.py   # GET /api/progress/{id}
│   ├── services/
│   │   ├── llm.py        # Anthropic API (Claude)
│   │   ├── state.py      # Session state (in-memory)
│   │   └── actions.py    # create_transaction, create_pa
│   └── prompts/
│       └── lea_system.md # Prompt léger + référence doc
├── docs/
│   ├── lea_courtier_assistant.md  # Guide LLM (intents, entités, actions)
│   └── fiche_technique_chat_api.md # Fiche technique
├── frontend/
│   └── index.html        # Chat UI + Avancement + Base de connaissance
├── requirements.txt
├── .env.example
└── run.py
```

## Installation

```bash
cd lea_api
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

## Configuration

1. Copiez `.env.example` en `.env`
2. Définissez `ANTHROPIC_API_KEY=sk-ant-...`

## Lancement

```bash
python run.py
```

Ouvrir http://localhost:8000

## Fonctionnalités

| Vue | Description |
|-----|-------------|
| **Chat** | Conversation avec Léa (Transaction + PA) |
| **Avancement** | Progression des champs Transaction (5) et PA (21+) |
| **Base de connaissance** | Liste des docs .md utilisés pour construire l'API |

## Endpoints

- `POST /api/chat` — Envoyer un message, recevoir la réponse Léa
- `GET /api/progress/{conversation_id}` — Avancement courtage
- `GET /api/knowledge` — Liste des documents de la base de connaissance

## Flux

1. **Transaction** : 5 champs requis (adresse, vendeurs, acheteurs, prix, type)
2. **Promesse d'Achat** : uniquement après une transaction créée ; ~21 champs utilisateur
3. Léa extrait les entités, demande les champs manquants, confirme avant création
