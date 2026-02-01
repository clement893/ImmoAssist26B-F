# Plan complet – Portail client ImmoAssist (production)

**Objectif** : Mettre en production le portail client à partir des pages démo, avec authentification, API backend, base de données, navigation courtier/client et déploiement Railway.

**Référence démo** : Commit [c0ada4f](https://github.com/clement893/ImmoAssist26B-F/commit/c0ada4f10b195d96d734f44f4816500ed20bf1cd) – 6 pages TypeScript (2 254 lignes).

---

## Synthèse des livrables

| Phase | Contenu | Fichiers principaux |
|-------|---------|----------------------|
| 1 | Modèles DB (SQLAlchemy + Alembic) | `backend/app/models/`, `alembic/versions/` |
| 2 | API Backend (FastAPI) | `backend/app/api/v1/endpoints/`, `schemas/`, `services/` |
| 3 | Frontend production | `apps/web/src/app/[locale]/dashboard/portail-client/` |
| 4 | Navigation courtier + menu client | `DashboardLayout`, `lib/navigation`, layout portail client |
| 5 | Auth & guards | `auth-guards`, `ProtectedRoute` par rôle |
| 6 | Emails invitation | `backend/app/services/email.py`, templates |
| 7 | Tests | `backend/tests/`, `apps/web/__tests__/` |
| 8 | Déploiement Railway | `railway.json`, variables d’environnement |

**Note technique** : Le projet utilise **SQLAlchemy + Alembic + PostgreSQL** (pas Prisma/MySQL). Le modèle `User` expose `first_name` / `last_name` (équivalents prénom/nom).

---

## Phase 1 – Modèles de base de données

### 1.1 Nouveaux modèles SQLAlchemy

**Fichier** : `backend/app/models/client_invitation.py` (nouveau)

- `ClientInvitation` : id, courtier_id (FK User), prenom, nom, email (unique), telephone, type_projet, statut (invite/actif/inactif), token (unique), date_invitation, date_activation, derniere_connexion, message_personnalise, acces_documents, acces_messagerie, acces_taches, acces_calendrier, acces_proprietes.
- Relations : `courtier` → User, `client` → User (optionnel), `transactions` → Transaction[].
- Index : courtier_id, email, statut.
- Table : `client_invitations`.

**Fichier** : `backend/app/models/portail_transaction.py` (nouveau)

- `Transaction` (portail) : id, client_invitation_id, courtier_id, type (achat/vente/location), statut, progression (0–100), date_debut, date_fin, adresse, ville, prix_offert, prix_accepte (Decimal).
- Relations : client_invitation, courtier, documents, messages, taches, etapes.
- Table : `portail_transactions` (pour éviter conflit avec `real_estate_transaction`).

**Fichier** : `backend/app/models/transaction_document.py` (nouveau)

- `TransactionDocument` : id, transaction_id, nom, type, categorie, taille, url, partage_par_id, date_partage, nouveau.
- Table : `transaction_documents`.

**Fichier** : `backend/app/models/transaction_message.py` (nouveau)

- `TransactionMessage` : id, transaction_id, expediteur_id, message (Text), date_envoi, lu.
- Table : `transaction_messages`.

**Fichier** : `backend/app/models/transaction_tache.py` (nouveau)

- `TransactionTache` : id, transaction_id, titre, description, priorite, categorie, echeance, completee, date_completion, cree_par_id, date_creation.
- Table : `transaction_taches`.

**Fichier** : `backend/app/models/transaction_etape.py` (nouveau)

- `TransactionEtape` : id, transaction_id, titre, description, ordre, statut, date_planifiee, heure_planifiee, date_completion.
- Table : `transaction_etapes`.

### 1.2 Mise à jour du modèle User

**Fichier** : `backend/app/models/user.py`

- Ajouter colonne optionnelle : `client_invitation_id` (Integer, FK client_invitations.id, unique, nullable).
- Ajouter relations :
  - `invitations_portail` (courtier) → ClientInvitation[].
  - `invitation_portail` (client) → ClientInvitation (backref).
  - `transactions_portail_courtier` → Transaction[].
  - `documents_partages_portail` → TransactionDocument[].
  - `messages_portail` → TransactionMessage[].
  - `taches_portail_creees` → TransactionTache[].

**Mapping prénom/nom** : Dans les schémas et endpoints, utiliser `first_name` / `last_name` côté User et exposer `prenom`/`nom` dans les réponses API si besoin (alias dans les schemas Pydantic).

### 1.3 Enregistrement des modèles

- Dans `backend/app/models/__init__.py` : importer et exposer les nouveaux modèles.
- Dans `backend/alembic/env.py` : ajouter les imports des nouveaux modèles pour autogenerate.

### 1.4 Migrations Alembic

```bash
cd backend
alembic revision --autogenerate -m "add_portail_client_models"
alembic upgrade head
```

---

## Phase 2 – Backend API

### 2.1 Schémas Pydantic

- `backend/app/schemas/client_invitation.py` : ClientInvitationCreate, ClientInvitationUpdate, ClientInvitationResponse, ClientInvitationList.
- `backend/app/schemas/portail_transaction.py` : TransactionCreate, TransactionUpdate, TransactionResponse, TransactionDetail.
- `backend/app/schemas/transaction_document.py` : TransactionDocumentCreate, TransactionDocumentResponse.
- `backend/app/schemas/transaction_message.py` : TransactionMessageCreate, TransactionMessageResponse.
- `backend/app/schemas/transaction_tache.py` : TransactionTacheCreate, TransactionTacheUpdate, TransactionTacheResponse.

### 2.2 Endpoints – Invitations

**Fichier** : `backend/app/api/v1/endpoints/client_invitations.py` (nouveau)

- `POST /` : créer invitation (courtier), générer token, optionnel : envoyer email.
- `GET /` : lister invitations du courtier (filtres : statut, type_projet, skip, limit).
- `GET /{invitation_id}` : détail invitation (vérifier courtier_id).
- `PUT /{invitation_id}` : modifier invitation.
- `POST /activate/{token}` : activer invitation + créer User (client) + lier client_invitation_id.

Dépendances : `get_db`, `get_current_user`. Vérifier rôle courtier pour création/édition (ou permission dédiée).

### 2.3 Endpoints – Transactions

**Fichier** : `backend/app/api/v1/endpoints/portail_transactions.py` (nouveau)

- `POST /` : créer transaction (courtier).
- `GET /client` : transaction active du client connecté (via client_invitation_id).
- `GET /courtier` : lister transactions du courtier (filtres optionnels).
- `GET /{transaction_id}` : détail (courtier ou client concerné).
- `PUT /{transaction_id}/progression` : mettre à jour progression (et statut dérivé).

### 2.4 Endpoints – Documents

**Fichier** : `backend/app/api/v1/endpoints/transaction_documents.py` (nouveau)

- `POST /` : upload document (transaction_id, categorie, file) → stockage (S3 ou stockage local selon config).
- `GET /transaction/{transaction_id}` : liste documents (filtre categorie).
- `GET /{document_id}` : détail + URL de téléchargement si autorisé.

### 2.5 Endpoints – Messagerie

**Fichier** : `backend/app/api/v1/endpoints/transaction_messages.py` (nouveau)

- `POST /` : envoyer message (transaction_id, message).
- `GET /transaction/{transaction_id}` : liste messages (ordre date_envoi).
- `PUT /{message_id}/mark-read` : marquer lu.

### 2.6 Endpoints – Tâches

**Fichier** : `backend/app/api/v1/endpoints/transaction_taches.py` (nouveau)

- `POST /` : créer tâche (courtier).
- `GET /transaction/{transaction_id}` : liste tâches (filtres : completee, priorite).
- `PUT /{tache_id}/toggle` : basculer completee + date_completion.
- `PUT /{tache_id}` : mise à jour partielle.

### 2.7 Enregistrement des routes

**Fichier** : `backend/app/api/v1/router.py`

- Importer les routers : client_invitations, portail_transactions, transaction_documents, transaction_messages, transaction_taches.
- Inclure avec préfixes :
  - `/client-invitations` (portail)
  - `/portail/transactions`
  - `/portail/transaction-documents`
  - `/portail/transaction-messages`
  - `/portail/transaction-taches`

### 2.8 Service email (invitation)

**Fichier** : `backend/app/services/email.py` (étendre ou créer)

- `send_invitation_email(email, prenom, courtier_nom, invitation_url, message_personnalise)`.
- Utiliser template HTML (ex. `backend/app/templates/emails/invitation.html`) avec Jinja2.
- Config : MAIL_* dans `app.core.config`.

---

## Phase 3 – Frontend (pages production)

### 3.1 Structure des dossiers

```
apps/web/src/app/[locale]/dashboard/portail-client/
├── layout.tsx                    # Layout commun (ou redirection selon rôle)
├── courtier/
│   ├── clients/
│   │   ├── page.tsx               # Liste des clients
│   │   └── inviter/
│   │       └── page.tsx           # Inviter un client
│   └── ...
└── client/
    ├── layout.tsx                # Layout avec menu latéral client uniquement
    ├── page.tsx                  # Dashboard client
    ├── documents/
    │   └── page.tsx
    ├── messages/
    │   └── page.tsx
    └── taches/
        └── page.tsx
```

### 3.2 Stratégie des pages

- **Copier** le contenu des pages démo depuis `apps/web/src/app/[locale]/demo/portail-client/` vers `dashboard/portail-client/`.
- **Remplacer** les données statiques par des appels API (fetch avec token NextAuth ou API route proxy).
- **Ajouter** : guards (requireCourtier / requireClient), loading (LoadingSpinner), erreurs (ErrorMessage), gestion erreurs réseau.

### 3.3 Pages courtier

| Page | Source démo | Adaptations |
|------|-------------|-------------|
| Liste des clients | `demo/portail-client/courtier/clients/page.tsx` | GET `/api/v1/client-invitations`, filtres, pagination, export |
| Inviter un client | `demo/portail-client/courtier/clients/inviter/page.tsx` | POST `/api/v1/client-invitations`, validation, succès/erreur |

### 3.4 Pages client

| Page | Source démo | Adaptations |
|------|-------------|-------------|
| Dashboard | `demo/portail-client/client/page.tsx` | GET `/api/v1/portail/transactions/client`, stats, prochaines étapes, docs récents, messages récents, tâches |
| Documents | `demo/portail-client/client/documents/page.tsx` | GET `/api/v1/portail/transaction-documents/transaction/{id}`, filtres catégorie |
| Messagerie | `demo/portail-client/client/messages/page.tsx` | GET/POST messages, PUT mark-read |
| Tâches | `demo/portail-client/client/taches/page.tsx` | GET tâches, PUT toggle |

### 3.5 Composants réutilisables

- `apps/web/src/components/portail-client/LoadingSpinner.tsx`
- `apps/web/src/components/portail-client/ErrorMessage.tsx`
- Optionnel : hooks `usePortailApi` ou `useClientInvitations`, `useTransaction`, etc.

### 3.6 Appels API frontend

- Base URL : variable d’environnement (ex. `NEXT_PUBLIC_API_URL`) ou API routes Next.js qui proxy vers le backend.
- Auth : envoyer `Authorization: Bearer <accessToken>` (session NextAuth).
- Gérer 401 → redirection login, 403 → message « Accès refusé ».

---

## Phase 4 – Navigation

### 4.1 Menu courtier (dashboard principal)

**Objectif** : Ajouter « Portail client » dans le menu latéral du courtier avec « Liste des clients » et « Inviter un client ».

**Fichiers à modifier** :

1. **`apps/web/src/components/layout/DashboardLayout.tsx`**  
   Dans `createSidebarItems`, ajouter un bloc **Portail client** (après Formulaire ou Calendrier) :
   - Label : « Portail client »
   - Enfants :
     - « Liste des clients » → `href: '/dashboard/portail-client/courtier/clients'`
     - « Inviter un client » → `href: '/dashboard/portail-client/courtier/clients/inviter'`
   - Icône : ex. `Users` ou `UserPlus` (lucide-react).

2. **`apps/web/src/lib/navigation/index.tsx`**  
   Si le menu principal utilise aussi `getNavigationConfig`, ajouter le même groupe **Portail client** avec les deux liens ci-dessus pour cohérence.

### 4.2 Menu client (portail client uniquement)

**Objectif** : Nouveau menu latéral dédié aux clients, avec uniquement leurs pages (pas le menu courtier).

**Approche** :

1. **Layout dédié client**  
   **Fichier** : `apps/web/src/app/[locale]/dashboard/portail-client/client/layout.tsx`  
   - Utiliser un layout avec sidebar réduite contenant uniquement :
     - Dashboard (accueil) → `/dashboard/portail-client/client`
     - Documents → `/dashboard/portail-client/client/documents`
     - Messagerie → `/dashboard/portail-client/client/messages`
     - Tâches → `/dashboard/portail-client/client/taches`
   - Réutiliser le même style que `[locale]/client/layout.tsx` (ClientNavigation) mais avec les routes et libellés du portail client ImmoAssist.
   - Afficher ce layout seulement pour les utilisateurs ayant `client_invitation_id` (ou rôle « client » portail).

2. **Constantes navigation client portail**  
   **Fichier** : `apps/web/src/lib/constants/portal.ts` (étendre) ou nouveau `portail-client.ts`  
   - Définir `PORTAIL_CLIENT_NAVIGATION` : tableau d’entrées avec path, label, icon pour Dashboard, Documents, Messages, Tâches (paths sous `/dashboard/portail-client/client/...`).

3. **Composant PortailClientNavigation**  
   **Fichier** : `apps/web/src/components/portail-client/PortailClientNavigation.tsx` (nouveau)  
   - Sidebar qui affiche uniquement les liens de `PORTAIL_CLIENT_NAVIGATION` (et optionnellement Profil / Aide si prévu).
   - Utilisé dans `dashboard/portail-client/client/layout.tsx`.

4. **Layout parent** `dashboard/portail-client/layout.tsx`  
   - Soit layout minimal qui laisse chaque sous-route gérer son propre layout (courtier vs client).
   - Soit détection de segment : si `courtier` → pas de sidebar client ; si `client` → layout avec PortailClientNavigation.

Résumé : **Courtier** voit le dashboard classique + entrée « Portail client » → Liste des clients + Inviter. **Client** voit uniquement le layout du portail client avec Dashboard, Documents, Messagerie, Tâches.

---

## Phase 5 – Authentification et sécurité

### 5.1 Guards

**Fichier** : `apps/web/src/lib/auth-guards.ts` (ou `middleware/auth-guards.ts`)

- `requireAuth()` : session requise, sinon redirect `/login`.
- `requireCourtier()` : session + rôle courtier (ou permission), sinon redirect dashboard.
- `requirePortailClient()` : session + utilisateur avec `client_invitation_id` (ou rôle client portail).

Utilisation : dans les pages ou dans un layout serveur, appeler le guard approprié et ne rendre la page que si autorisé.

### 5.2 Protection des routes

- **Courtier** : `dashboard/portail-client/courtier/**` → requireCourtier (ou permission « portail:courtier »).
- **Client** : `dashboard/portail-client/client/**` → requirePortailClient ; vérifier que la transaction/document/message/tâche appartient au client.

### 5.3 Backend

- Endpoints invitation/transaction (création, liste) : réservés au courtier (vérifier `current_user`).
- Endpoints « client » (GET transaction active, documents, messages, tâches) : vérifier que la transaction est liée au `client_invitation_id` du user.
- Ne jamais exposer les données d’un autre client/courtier.

---

## Phase 6 – Emails et notifications

### 6.1 Template email invitation

**Fichier** : `backend/app/templates/emails/invitation_portail.html`

- Variables : prenom, courtier_nom, invitation_url, message_personnalise.
- Bouton « Activer mon compte » → invitation_url (lien frontend avec token).
- Texte : validité du lien (ex. 7 jours).

### 6.2 Configuration

- Ajouter dans `app.core.config` : MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, MAIL_PORT, MAIL_SERVER, FRONTEND_URL (pour lien d’activation).
- En production : utiliser un service (SendGrid, SMTP, etc.) et variables d’environnement Railway.

---

## Phase 7 – Tests

### 7.1 Backend

- **`backend/tests/test_client_invitations_api.py`** : créer invitation, lister, activer avec token.
- **`backend/tests/test_portail_transactions_api.py`** : créer transaction, GET client, mise à jour progression.
- **`backend/tests/test_transaction_documents_api.py`** : upload, liste par transaction.
- **`backend/tests/test_transaction_messages_api.py`** : envoi, liste, mark-read.
- **`backend/tests/test_transaction_taches_api.py`** : création, liste, toggle.

Utiliser fixtures : user courtier, user client (avec client_invitation_id), transaction, etc.

### 7.2 Frontend (optionnel)

- Tests composants : LoadingSpinner, ErrorMessage.
- Tests de page : liste clients (mock API), formulaire inviter (validation).
- E2E (Playwright/Cypress) : parcours courtier (inviter) et client (dashboard, documents, messages, tâches).

---

## Phase 8 – Déploiement Railway

### 8.1 Prérequis

- Backend : migrations Alembic exécutées (commande dans `railway.json` ou au démarrage).
- Variables d’environnement : DATABASE_URL, JWT/Session, MAIL_*, FRONTEND_URL, NEXT_PUBLIC_API_URL (ou URL backend pour le frontend).

### 8.2 Build et run

- **Backend** : `pip install -r requirements.txt`, `alembic upgrade head`, `uvicorn app.main:app`.
- **Frontend** : `pnpm build` (ou équivalent), servir avec Node ou service statique.
- **Railway** : 3 services (web frontend, API backend, PostgreSQL) selon `railway.json` existant ; lier les variables et les domaines.

### 8.3 URLs de démo (objectif)

Après déploiement, viser les URLs suivantes (avec locale `fr` si applicable) :

- Courtier – Liste des clients : `https://<app>.up.railway.app/fr/dashboard/portail-client/courtier/clients`
- Courtier – Inviter : `https://<app>.up.railway.app/fr/dashboard/portail-client/courtier/clients/inviter`
- Client – Dashboard : `https://<app>.up.railway.app/fr/dashboard/portail-client/client`
- Client – Documents : `.../dashboard/portail-client/client/documents`
- Client – Messagerie : `.../dashboard/portail-client/client/messages`
- Client – Tâches : `.../dashboard/portail-client/client/taches`

---

## Ordre d’exécution recommandé

1. **Phase 1** : Modèles + migration Alembic.
2. **Phase 2** : Schémas + endpoints backend + enregistrement routes + service email.
3. **Phase 5 (partiel)** : Guards et règles d’accès backend.
4. **Phase 4** : Navigation courtier (Liste des clients dans le menu) + layout et menu client.
5. **Phase 3** : Création des dossiers, copie des pages démo, branchement API et guards sur chaque page.
6. **Phase 6** : Template email + config.
7. **Phase 7** : Tests backend puis frontend si besoin.
8. **Phase 8** : Déploiement Railway et vérification des URLs.

---

## Checklist finale

- [ ] Modèles créés et migration appliquée.
- [ ] User mis à jour (client_invitation_id + relations).
- [ ] Tous les endpoints créés et enregistrés dans le router.
- [ ] Frontend : pages production sous `dashboard/portail-client/` avec API et guards.
- [ ] Menu courtier : entrée « Portail client » avec « Liste des clients » et « Inviter un client ».
- [ ] Menu client : layout dédié avec sidebar (Dashboard, Documents, Messagerie, Tâches).
- [ ] Email d’invitation envoyé à l’activation.
- [ ] Tests backend (au moins invitations + transactions).
- [ ] Déploiement Railway et URLs de démo opérationnelles.
