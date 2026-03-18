# Léa API — Courtier Assistant

API de chat pour la création de **Transactions** et **Promesses d'Achat** (Québec).  
Léa assiste les courtiers en conversation (texte ou voix) : extraction des champs, géocodage, confirmation, création en base.

---

## Rôle des fichiers

### Racine `lea_api/`

| Fichier | Rôle |
|--------|------|
| `run.py` | Point d’entrée local : lance uvicorn avec rechargement. |
| `requirements.txt` | Dépendances Python (FastAPI, OpenAI, Deepgram, SQLAlchemy, etc.). |
| `.env.example` | Modèle des variables d’environnement ; copier en `.env` et remplir. |
| `railway.json` | Config Railway : commande de build, démarrage, healthcheck. |

### `app/` — Backend FastAPI

| Fichier | Rôle |
|--------|------|
| `main.py` | Application FastAPI : CORS, montage des routers, SPA (frontend), route `/health`. |
| `config.py` | Paramètres (pydantic-settings) : clés API, DB, Redis, options Realtime. |
| `schemas.py` | Modèles Pydantic pour les requêtes/réponses API. |

### `app/db/`

| Fichier | Rôle |
|--------|------|
| `database.py` | Connexion async (SQLite/PostgreSQL), session, `init_db`. |
| `models.py` | Modèles SQLAlchemy : Transaction, PromesseAchat, LeaConversation. |

### `app/routers/`

| Fichier | Rôle |
|--------|------|
| `chat.py` | **Cœur métier** : `POST /api/chat`, stream SSE `/api/chat/stream`, voix HTTP `/api/voice/chat`, WebSocket Deepgram `/api/ws/voice`, WebSocket **OpenAI Realtime** `/api/ws/realtime` (STT+LLM+TTS), tools (geocode, create_transaction, create_pa). |
| `knowledge.py` | `GET /api/knowledge`, lecture/édition des documents de la base de connaissance. |
| `progress.py` | `GET /api/progress/{id}` — avancement transaction + PA pour la barre latérale. |
| `tables.py` | `GET /api/tables` — aperçu des tables en base. |
| `conversations.py` | `GET /api/conversations`, `GET /api/conversation/{id}` — liste et détail des conversations. |
| `transactions.py` | `GET /api/transactions`, `GET /api/transactions/{id}` — liste et détail des transactions créées. |

### `app/services/`

| Fichier | Rôle |
|--------|------|
| `llm.py` | Appels LLM (OpenAI) : prompt système, historique, extraction d’entités et d’actions (create_transaction, create_pa, geocode). |
| `state.py` | État de session : chargement/sauvegarde/fusion du draft (transaction + PA) en base. |
| `actions.py` | Exécution des actions : `create_transaction`, `create_pa`, validation et écriture en DB. |
| `voice.py` | Transcription Whisper, TTS OpenAI (synthèse vocale), stream Deepgram pour le mode vocal non-Realtime. |
| `geocode.py` | Géocodage Nominatim/OSM pour compléter les adresses. |

### `app/prompts/`

| Fichier | Rôle |
|--------|------|
| `lea_system.md` | Court prompt système + renvoi vers le guide complet. |

### `docs/`

| Fichier | Rôle |
|--------|------|
| `lea_courtier_assistant.md` | **Guide principal** pour le LLM : intents, entités, flux transaction/PA, règles métier, exemples. |
| `lea_realtime_rules.md` | Règles spécifiques au mode vocal Realtime (français, pas de markdown, confirmation, expertise, bruit/hallucinations). |
| `lea_voice_instructions.md` | Instructions de ton/voix pour la synthèse. |
| `REALTIME_PARAMS.md` | Paramètres OpenAI Realtime (VAD, bruit, seuils). |
| `RAILWAY_DEPLOY.md` | Déploiement sur Railway (root directory, variables, branche hind-branch). |
| `fiche_technique_chat_api.md` | Fiche technique de l’API chat. |

### `frontend/`

| Fichier | Rôle |
|--------|------|
| `index.html` | **Interface unique** : chat (texte + vocal Realtime/Deepgram), barre de progression TX/PA, historique des conversations, vues Transactions / Tables / Base de connaissance, lecture vocale, bouton interrompre. |

### Autres

| Fichier | Rôle |
|--------|------|
| `vapi_assistant_config.json` | Config optionnelle pour l’assistant Vapi (téléphonie). |
| `scripts/test2.html`, `scripts/test_scripts.html` | Pages de test pour scénarios de conversation. |
| `scripts/test_realtime.py` | Script de test du WebSocket Realtime. |

---

## Sur quoi repose chaque fichier

Chaîne de dépendances principales (qui appelle quoi).

| Fichier | Repose sur |
|--------|-------------|
| **app/main.py** | Tous les routers ; `app.db.database` (init_db). |
| **app/routers/chat.py** | `config`, `state`, `llm`, `actions`, `geocode`, `voice` ; `db` (sessions) ; prompts chargés depuis `docs/`. |
| **app/routers/knowledge.py** | Fichiers dans `docs/` (lecture disque) ; `schemas`. |
| **app/routers/progress.py** | `state` (get_transaction_progress, get_pa_progress). |
| **app/routers/conversations.py** | `db`, `state` (conversations en base). |
| **app/routers/transactions.py** | `db`, `state` (transactions en base). |
| **app/routers/tables.py** | `db` (introspection tables). |
| **app/services/llm.py** | `config` (clé API, modèle) ; `docs/lea_courtier_assistant.md` (prompt système). |
| **app/services/state.py** | `db`, `models` (lecture/écriture draft, conversations). |
| **app/services/actions.py** | `db`, `models` (create_transaction, create_pa). |
| **app/services/voice.py** | `config` (OpenAI, Deepgram) ; API externes. |
| **app/services/geocode.py** | geopy (Nominatim) ; pas d’autres modules app. |
| **chat.py (Realtime)** | En plus du reste : `docs/lea_courtier_assistant.md` + `docs/lea_realtime_rules.md` (prompt concaténé). |
| **frontend/index.html** | API : `/api/chat/stream`, `/api/ws/realtime`, `/api/ws/voice`, `/api/progress`, `/api/conversations`, `/api/transactions`, `/api/knowledge`, `/api/tables`. |

En résumé : **chat** orchestre **llm**, **state**, **actions**, **geocode**, **voice** ; **state** et **actions** s’appuient sur **db** et **models** ; le **frontend** ne parle qu’aux routes API.

---

## Installation

```bash
cd lea_api
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

## Configuration

1. Copier `.env.example` en `.env`.
2. Renseigner au minimum : `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, et si besoin `DATABASE_URL` (ou variables PostgreSQL).

## Lancement

```bash
python run.py
```

Ouvrir http://localhost:8000

---

## Fonctionnalités

| Vue | Description |
|-----|-------------|
| **Chat** | Conversation avec Léa (texte ou micro) : transaction puis promesse d’achat. |
| **Avancement** | Barre latérale : 5 champs transaction, 21+ champs PA. |
| **Transactions** | Liste des transactions créées et détail. |
| **Tables** | Aperçu des tables en base. |
| **Base de connaissance** | Documents .md utilisés par l’API. |

## Endpoints principaux

- `POST /api/chat` — Chat non-streaming.
- `POST /api/chat/stream` — Chat streaming (texte + TTS par phrase).
- `GET /api/ws/realtime` — WebSocket vocal OpenAI Realtime (STT + LLM + TTS).
- `GET /api/ws/voice` — WebSocket vocal Deepgram + LLM stream + TTS.
- `GET /api/progress/{id}` — Avancement courtage.
- `GET /api/conversations` — Liste des conversations.
- `GET /api/transactions` — Liste des transactions.
- `GET /health` — Healthcheck (Railway).

## Flux métier

1. **Transaction** : 5 champs (type, adresse, vendeurs, acheteurs, prix). Géocodage puis confirmation avant création.
2. **Promesse d’achat** : après création de la transaction ; collecte des champs PA en conversation, récap, confirmation, puis création.
3. Léa extrait les entités, demande les champs manquants et ne crée qu’après confirmation explicite.
