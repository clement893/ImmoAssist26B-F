# Comparaison des fonctionnalités : ImmoAssist26B-F-2 vs ImmoAssistV1

**Date :** mars 2025  
**Repo actuel :** ImmoAssist26B-F-2 (monorepo Next.js 16 + FastAPI)  
**Repo de référence :** [clement893/ImmoAssistV1](https://github.com/clement893/ImmoAssistV1) — **analyse réalisée via CLI** (repo cloné en local avec `gh`).

---

## Méthode

- Accès au repo **ImmoAssistV1** via GitHub CLI (`gh repo view`, repo déjà cloné en `C:\Users\cleme\ImmoAssistV1`).
- Analyse du code : `package.json`, `server/routers.ts`, `server/routers/assistant.ts`, `drizzle/schema.ts`, `server/_core/index.ts`, et structure des pages/composants client.

---

# Partie A – ImmoAssistV1 (analyse réelle)

## 1. Stack technique – ImmoAssistV1

| Domaine | Technologies |
|--------|---------------|
| **Frontend** | Vite 7, React 19, TypeScript, Tailwind 4, wouter (routing) |
| **Backend** | Express (Node.js), tout dans le même repo |
| **API** | tRPC v11 (pas de REST), tout sous `/api/trpc` |
| **Base de données** | PostgreSQL, Drizzle ORM |
| **Auth** | Google OAuth (jose, google-auth-library), cookies de session |
| **Stockage** | AWS S3 (documents, photos) |
| **Email** | SendGrid |
| **IA** | OpenAI (LLM, extraction formulaires, chat), TTS/STT pour l’assistant vocal |
| **Build** | Vite (client) + esbuild (serveur Node), une seule app (pas de monorepo) |

**Pas de :** Next.js, FastAPI, Redis, Stripe, RBAC avancé, MFA, multi-locale (i18n).

---

## 2. Fonctionnalités métier – ImmoAssistV1 (d’après les routers tRPC)

### 2.1 Transactions

- **CRUD** : list, getById, create, update, updateStatus.
- **Statuts** : nombreux statuts (initial_meeting → completed/cancelled, offer_received, counter_offer, firm_sale, repair_negotiation, etc.).
- **Actions** : getPriorityActions, completeAction, getCompletedActions, uncompleteAction.
- **Notes** : notes par transaction (list, create, update, delete).
- **Mise à jour de statut** : crée automatiquement des délais selon le statut (deadlines).

### 2.2 Clients

- list, create (buyer/seller). Pas de CRUD complet (pas d’update/delete exposé dans le router).

### 2.3 Documents

- listByTransaction, upload (base64 → S3, types : mandate, offer, inspection_report, etc.).

### 2.4 Rendez-vous & calendrier

- **Appointments** : listByTransaction, listUpcoming, create, getAvailability, setAvailability, disableAvailability, blockDate, getBlockedDates, unblockDate, getAvailableSlots (public), book (public), getUpcoming, updateStatus, cancel.
- **Sync calendrier** : table `calendarSync` (Google + Outlook) dans le schéma ; pas de routes tRPC dédiées visibles dans `routers.ts` (possiblement utilisée en interne).

### 2.5 Notifications

- list, markAsRead (notifications en base, pas de WebSocket).

### 2.6 Chat (assistant texte, par transaction)

- sendMessage (avec contexte transaction + historique), getHistory. Utilise OpenAI, pas de stream exposé dans ce router.

### 2.7 Contacts

- list, getById, create, update, delete, exportCSV, importCSV, getByTransaction, addToTransaction, removeFromTransaction. Types : client_buyer, client_seller, broker, notary, mortgage_broker, inspector, appraiser, other.

### 2.8 Tâches (tasks)

- listByTransaction, getById, create, update, delete, listByAssignee. Statuts : todo, in_progress, completed, cancelled. Priorités : low, medium, high, urgent.

### 2.9 Formulaires OACIQ

- **Forms** : list, getByCode, extractFields (PDF), extractFieldsWithAI, updateFields.
- **Submissions** : listByTransaction, getById, create, update (avec versioning), versions (list, restore), validate (règles OACIQ), prefill (depuis transaction/contacts).
- **Legacy CCA** : prefill, fillWithAI (assistant pour remplir formulaire).

### 2.10 Clauses personnalisées

- **Clauses** : list, getById, create, update, delete, listByFormType. Catégories : inspection, financement, vente_propriete, garantie, assurance, conformite, environnement, generale, autre.
- **FormClauses** : add, remove, listBySubmission, updateContent, reorder (liaison clause ↔ soumission).

### 2.11 Photos de propriétés

- listByTransaction, upload, update, delete, setPrimary. Stockage S3.

### 2.12 Portail client (accès par token)

- **clientPortal** : login(token), getTransaction(token), getSharedDocuments, getMessages, sendMessage, markMessagesAsRead. Tout en publicProcedure avec token.
- **clientAccess** (côté courtier) : generate(contactId), revoke, shareDocument, getBrokerSharedDocuments, revokeShare, list, getAll, getStats, sendInvitation, resendInvitation. Envoi d’invitations par email.

### 2.13 Délais (deadlines)

- getActive, getUpcoming, getOverdue, getByTransaction, markCompleted, extend, createCustom, getUrgency. Types : mandate_expiry, price_reevaluation, offer_response, inspection_end, financing_approval, notary_signature, custom, etc. Cron : sendDeadlineNotifications (protégé par CRON_SECRET_TOKEN).

### 2.14 Assistant IA vocal (assistant router)

- getActiveConversation, startConversation (avec transactionId optionnel), sendMessage (texte ou voix), transcribeAudio (base64), synthesizeSpeech (texte → audio), endConversation. Conversations et messages persistés (assistantConversations, assistantMessages, assistantWorkflows). TTS/STT (services dédiés), intent/entities/choices/formFields/actionSuggestions dans les métadonnées.

### 2.15 Démo

- demo.generateData, demo.resetData, getDemoTransaction.

### 2.16 Système

- system.health, system.notifyOwner (admin), system.cleanupDuplicateTables (admin). Auth : auth.me, auth.logout. Tutorial : getStatus, markCompleted, reset.

---

## 3. Schéma de données (Drizzle) – ImmoAssistV1

Tables principales : users, clients, transactions, documents, appointments, notifications, chatMessages, contacts, transactionContacts, tasks, clientAccess, forms, formSubmissions, formSubmissionVersions, clauses, formClauses, propertyPhotos, clientMessages, sharedDocuments, brokerAvailability, dateBlocks, appointmentBookings, calendarSync, actionCompletions, transactionNotes, transactionDeadlines, assistantConversations, assistantMessages, assistantWorkflows.

Pas de : organisations, teams, invitations, rbac, themes, subscriptions, posts, pages, menus, seo, backups, scheduled_tasks, audit_trail, etc.

---

## 4. Frontend (pages & composants) – ImmoAssistV1

**Pages (client/src/pages)** : Agenda, AvailabilitySettings, BookAppointment, Chat, Clauses, ClientAccessManagement, ClientDashboard, ClientDemo, ClientLogin, ClientPortal, ComponentShowcase, ContactDetail, Contacts, Dashboard, Deadlines, Demo, FormFieldsEditor, FormFill, FormFillOACIQ, Forms, Home, NewTransaction, NotFound, Tasks, Timeline, TransactionDetail, Transactions, TransactionsKanban.

**Composants métier** : ActionButton, ActionCheckbox, AIChatBox, ClausesSection, ClientAccessManager, DashboardLayout, DeadlineCard, DocumentSharingManager, FormVersionHistory, InteractiveNextSteps, PropertyPhotosManager, TransactionForms, TransactionNotes, Assistant (ConversationView, VoiceInput, VoiceOutput), flows (AppointmentFlow, FormInlineFlow, SimpleConfirmFlow, UploadFlow), timeline (TimelineAxis, TimelineControls, TimelineRow). UI : shadcn-style (Radix), une trentaine de composants ui.

**Une seule app** : pas de i18n (pas de next-intl), pas de découpage en packages.

---

# Partie B – ImmoAssist26B-F-2 (rappel)

## 5. Stack technique – ImmoAssist26B-F-2

- **Frontend** : Next.js 16, React 19, TypeScript, Tailwind, next-intl (FR, EN, AR, HE).
- **Backend** : FastAPI, SQLAlchemy async, Pydantic.
- **Monorepo** : pnpm workspaces, Turborepo, packages (@immoassist/*, @modele/*).
- **API** : REST (70+ endpoints), pas de tRPC.
- **Auth** : JWT (httpOnly), OAuth (Google, GitHub, Microsoft), MFA (TOTP), RBAC, API keys.
- **Paiements** : Stripe. **Notifications** : WebSocket.
- **Base** : PostgreSQL, Redis (optionnel).

---

## 6. Comparaison réelle V1 vs 26B-F-2

| Critère | ImmoAssistV1 | ImmoAssist26B-F-2 |
|---------|---------------|-------------------|
| **Architecture** | Une app (Vite + Express), pas de monorepo | Monorepo (Next.js app + packages + backend FastAPI) |
| **Frontend** | Vite, React 19, wouter | Next.js 16, React 19, App Router |
| **Backend** | Express (Node), tRPC | FastAPI (Python), REST |
| **API** | tRPC uniquement (`/api/trpc`) | REST (`/api/v1/*`) |
| **Base de données** | PostgreSQL, Drizzle | PostgreSQL, SQLAlchemy (+ Redis optionnel) |
| **Auth** | Google OAuth, cookies | JWT, OAuth (Google/GitHub/Microsoft), MFA, RBAC, API keys |
| **i18n** | Non | Oui (FR, EN, AR, HE) |
| **Transactions** | Oui (CRUD, statuts, actions, notes, délais auto) | Oui (CRUD, progression, contacts, documents, photos, analyze-pdf, actions, steps) |
| **Portail client** | Oui (token, transaction, documents partagés, messages, invitations email) | Oui (transactions portail, invitations, documents, messages, tâches) |
| **Formulaires OACIQ** | Oui (list, getByCode, extract PDF/AI, submissions, versions, validate, prefill, fillWithAI) | Oui (CRUD, import, extract, submissions, lien transactions, complétion) |
| **Clauses** | Oui (CRUD, formClauses, reorder) | Non (pas de module dédié clauses) |
| **Contacts** | Oui (CRUD, import/export CSV, par transaction) | Oui (real_estate, commercial, réseau contacts/companies) |
| **Tâches** | Oui (par transaction, assignation, priorités) | Oui (tâches portail, toggle) |
| **Documents / photos** | Oui (S3, types document, propertyPhotos) | Oui (upload, refresh URL, photos) |
| **Rendez-vous & calendrier** | Oui (disponibilités, créneaux, book public, blocages, sync Google/Outlook en schéma) | Oui (availability, calendar connections, appointments) |
| **Deadlines** | Oui (actifs, à venir, dépassés, compléter, prolonger, custom, cron notifications) | Étapes guidées / steps (pas de module “deadlines” identique) |
| **Chat assistant (texte)** | Oui (par transaction, historique, OpenAI) | Oui (Léa : chat, stream, contexte, settings) |
| **Assistant vocal** | Oui (conversations persistées, TTS/STT, intent/entities, workflows) | Oui (Léa : chat/voice, transcribe, synthesize) |
| **Notifications** | Oui (list, markAsRead, en base) | Oui (WebSocket, center, read/unread) |
| **ERP / Stripe / CMS** | Non | Oui (ERP, Stripe, posts, pages, tags, SEO, menus) |
| **Teams / orgs / RBAC** | Non (rôle user/admin simple) | Oui (teams, invitations, RBAC, organisations) |
| **Thèmes / personnalisation** | next-themes (client) | Thèmes serveur, polices, theme builder |
| **Backups / audit / scheduled tasks** | Non | Oui |
| **Nombre de pages** | ~25 pages métier + démos | 200+ pages |
| **Composants** | ~30 ui + composants métier ciblés | 357 composants (91 UI + 266 feature) |

---

## 7. Synthèse

- **ImmoAssistV1** : application fullstack unique (Vite + Express + tRPC + Drizzle), centrée courtier OACIQ : transactions, formulaires OACIQ (avec clauses et prefill/fillWithAI), portail client par token, rendez-vous/calendrier, délais critiques, assistant texte + vocal avec conversations persistées. Pas d’ERP, pas de Stripe, pas de RBAC avancé, pas d’i18n.
- **ImmoAssist26B-F-2** : template SaaS évolué (monorepo Next.js + FastAPI) qui ajoute ERP, Stripe, RBAC, i18n, WebSocket, CMS, thèmes, backups, audit, et un très grand nombre de pages/composants. Les briques métier “transaction, portail client, OACIQ, calendrier, assistant Léa (texte + voix)” sont présentes ; le module **clauses** (bibliothèque + liaison aux formulaires) et le **système de deadlines** avec cron sont des spécificités de V1 à considérer pour une migration ou une parité fonctionnelle.

*Document mis à jour après analyse du repo ImmoAssistV1 (accès via `gh`, chemin local utilisé : ImmoAssistV1). Mars 2025.*
