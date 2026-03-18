# Déploiement Léa API sur Railway

## Prérequis

- Compte Railway connecté à votre GitHub
- Projet Railway existant avec un environnement

---

## Option 1 : Nouveau service dans le projet existant

Pour ajouter **Léa API** comme service séparé dans votre projet Railway :

### 1. Créer un nouveau service

1. Dans le dashboard Railway → votre projet
2. **+ New** → **GitHub Repo**
3. Sélectionnez le repo `ImmoAssist_Clement_NEW` (ou le nom du dépôt)
4. **Root Directory** : `lea_api` (important — le code est dans ce dossier)
5. **Branch** : choisissez `hind-branch` pour déployer depuis cette branche

### 2. Variables d'environnement

Dans **Variables** du service, ajoutez :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `OPENAI_API_KEY` | ✅ | Clé API OpenAI |
| `DEEPGRAM_API_KEY` | ✅ | Pour le mode vocal Deepgram |
| `DATABASE_URL` | ✅ | PostgreSQL Railway ou `sqlite+aiosqlite:///./lea_api.db` |
| `LLM_MODEL` | ❌ | Défaut : gpt-4o |
| `REALTIME_DISABLE_TRANSCRIPTION` | ❌ | `true` si transcription Whisper pose problème |

### 3. Base de données PostgreSQL (recommandé en prod)

- Railway propose **PostgreSQL** en un clic : **+ New** → **Database** → **PostgreSQL**
- Railway génère `DATABASE_URL` → attachez-le au service Léa API
- Ou définissez manuellement :  
  `postgresql+asyncpg://user:password@host:port/dbname`

---

## Option 2 : Workflow avec hind-branch

Pour développer sur `hind-branch` et déployer ces changements :

### Configuration du service

1. **Settings** du service → **Source**
2. **Branch** : `hind-branch` (au lieu de `main`)
3. Chaque push sur `hind-branch` déclenche un déploiement

### Workflow

```
main          ← production (optionnel, si vous avez un 2ᵉ service)
hind-branch   ← vos changements → déploiement automatique
```

- Vous travaillez sur `hind-branch`
- Vous poussez : `git push origin hind-branch`
- Railway déploie automatiquement
- Quand c’est prêt : merge `hind-branch` → `main`

### Deux environnements (optionnel)

- **Production** : service branché sur `main`
- **Staging** : service branché sur `hind-branch`

Créez 2 services dans le même projet, chacun lié à une branche différente.

---

## Vérification

- **Health** : `https://votre-app.railway.app/health` → `{"status":"ok","service":"lea-api"}`
- **Chat** : `https://votre-app.railway.app/`
- **WebSocket Realtime** : nécessite HTTPS (Railway le fournit)

---

## Remarques

1. **Root Directory** : toujours `lea_api` pour ce projet
2. **Port** : Railway définit `$PORT`, le `railway.json` l’utilise déjà
3. **CORS** : l’app autorise `*` ; restreignez en production si besoin
