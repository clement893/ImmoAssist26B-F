# Plan d'implémentation : Module de gestion des rendez-vous

**Date :** 2026-02-01  
**Objectif :** Implémenter un module complet de gestion des rendez-vous avec synchronisation bidirectionnelle Google Calendar et Outlook, et proposition de créneaux intelligents.

---

## 1. Architecture générale

Le module s'articule autour de 4 piliers :

| Pilier | Description |
|--------|-------------|
| **Modèles de données** | SQLAlchemy : Appointment, AppointmentAttendee, CalendarConnection |
| **API Backend** | FastAPI : CRUD rendez-vous, disponibilités, OAuth2 calendriers, webhooks |
| **Interface Frontend** | React/Next.js : calendrier, formulaires, configuration, réservation publique |
| **Services de synchronisation** | Tâches Celery : synchro bidirectionnelle, rappels par email |

**Dépendances existantes :** `User`, `UserAvailability`, `RealEstateTransaction`, `RealEstateContact`.

---

## 2. Inventaire des pages (routes) à créer ou modifier

### 2.1 Pages dashboard courtier (module Calendrier / Rendez-vous)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/dashboard/modules/calendrier` | `apps/web/src/app/[locale]/dashboard/modules/calendrier/page.tsx` | **Modifier** – Vue calendrier principale (remplacer données mock par API appointments) |
| `/dashboard/modules/calendrier/agenda` | `apps/web/src/app/[locale]/dashboard/modules/calendrier/agenda/page.tsx` | **Modifier** – Vue agenda (liste des RV) |
| `/dashboard/modules/calendrier/rendez-vous` | `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/page.tsx` | **Créer** – Liste des rendez-vous (tableau avec filtres) |
| `/dashboard/modules/calendrier/rendez-vous/nouveau` | `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/nouveau/page.tsx` | **Créer** – Formulaire de création d’un RV |
| `/dashboard/modules/calendrier/rendez-vous/[id]` | `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/[id]/page.tsx` | **Créer** – Détail d’un rendez-vous |
| `/dashboard/modules/calendrier/rendez-vous/[id]/modifier` | `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/[id]/modifier/page.tsx` | **Créer** – Formulaire d’édition d’un RV |
| `/dashboard/modules/calendrier/disponibilites` | `apps/web/src/app/[locale]/dashboard/modules/calendrier/disponibilites/page.tsx` | **Existant** – Conserver (UserAvailability) |
| `/dashboard/modules/calendrier/evenements/*` | (existant) | **Optionnel** – Garder ou fusionner avec rendez-vous selon besoin |

### 2.2 Pages paramètres (connexion calendriers)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/dashboard/modules/profil/settings/page.tsx` ou `/settings/calendar` | **Recommandé :** `apps/web/src/app/[locale]/dashboard/modules/profil/settings/page.tsx` (onglet) OU `apps/web/src/app/[locale]/settings/calendar/page.tsx` | **Créer** – Page « Connexion calendrier » : boutons Google / Outlook, statut, déconnexion |

**Recommandation :** Créer une page dédiée **`/settings/calendar`** pour cohérence avec les autres settings (api, billing, integrations) :

- **Créer** `apps/web/src/app/[locale]/settings/calendar/page.tsx`  
- **Modifier** `apps/web/src/app/[locale]/settings/layout.tsx` (ou menu) pour ajouter le lien « Calendrier » vers `/settings/calendar`.

### 2.3 Page de réservation publique (client)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/[locale]/book/[username]` | `apps/web/src/app/[locale]/book/[username]/page.tsx` | **Créer** – Page publique : choix du courtier par `username`, affichage des créneaux disponibles, réservation d’un créneau |
| `/[locale]/book/[username]/confirmation` | `apps/web/src/app/[locale]/book/[username]/confirmation/page.tsx` | **Créer** (optionnel) – Confirmation après réservation (ou réutiliser `book/confirmation` avec paramètre) |

**Note :** Le dossier `apps/web/src/app/[locale]/book/` existe déjà (page.tsx, checkout, confirmation, payment). Il faut ajouter le segment dynamique `[username]` et une page dédiée au flux « choisir créneau → réserver » pour un courtier donné.

---

## 3. Modèles de base de données (SQLAlchemy)

### 3.1 Fichiers à créer

| Fichier | Contenu |
|---------|---------|
| `backend/app/models/appointment.py` | `Appointment` (title, description, start_time, end_time, status, broker_id, transaction_id, google_event_id, outlook_event_id, relations) |
| `backend/app/models/appointment_attendee.py` | `AppointmentAttendee` (appointment_id, contact_id, email, name, status) |
| `backend/app/models/calendar_connection.py` | `CalendarConnection` (user_id, provider, access_token, refresh_token, expires_at, scope). **Note :** contrainte unique sur `(user_id, provider)` pour permettre à un même user d’avoir Google et Outlook. |

### 3.2 Modifications des modèles existants

- **`backend/app/models/user.py`** : ajouter les relations `appointments` et `calendar_connections` (liste, car un user peut avoir Google et Outlook).
- **`backend/app/models/real_estate_transaction.py`** : ajouter la relation `appointments`.
- **`backend/app/models/__init__.py`** : importer et exporter les nouveaux modèles et enums.

### 3.3 Enums

- **AppointmentStatus :** `confirmed`, `pending`, `cancelled`
- **AttendeeStatus :** `accepted`, `declined`, `tentative`, `needs_action`
- **CalendarProvider :** `google`, `outlook`

### 3.4 Migration Alembic

- Créer une nouvelle migration (ex. `xxx_add_appointments_calendar_connection.py`) qui crée les tables `appointments`, `appointment_attendees`, `calendar_connections` et ajoute les clés étrangères / index nécessaires.

---

## 4. API Backend (FastAPI)

### 4.1 Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `backend/app/api/v1/endpoints/appointments.py` | CRUD rendez-vous + endpoint disponibilités |
| `backend/app/api/v1/endpoints/calendar_connections.py` | OAuth2 Google/Outlook + déconnexion |
| `backend/app/schemas/appointment.py` | Schémas Pydantic (Create, Update, Response, List) |
| `backend/app/schemas/appointment_attendee.py` | Schémas pour les participants |
| `backend/app/schemas/calendar_connection.py` | Schémas pour les connexions calendrier |
| `backend/app/services/calendar_sync/` (optionnel) | Logique de synchro (appels Google/Outlook) |
| Webhooks : `backend/app/api/webhooks/google_calendar.py` et `microsoft_calendar.py` (ou sous-routes dans un router webhooks) | Réception des notifications de changement |

### 4.2 Endpoints – Rendez-vous

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/appointments` | Créer un rendez-vous |
| GET | `/appointments` | Lister les rendez-vous (filtres : date, statut, transaction_id) |
| GET | `/appointments/{id}` | Détail d’un rendez-vous |
| PUT | `/appointments/{id}` | Mettre à jour un rendez-vous |
| DELETE | `/appointments/{id}` | Annuler (soft delete ou status cancelled) |
| GET | `/appointments/availability` | Créneaux disponibles (UserAvailability + rendez-vous existants, durée donnée) |

### 4.3 Endpoints – Connexions calendrier

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/calendar/connections/oauth/google` | Redirection vers Google OAuth2 |
| GET | `/calendar/connections/oauth/google/callback` | Callback Google OAuth2 |
| GET | `/calendar/connections/oauth/outlook` | Redirection vers Microsoft OAuth2 |
| GET | `/calendar/connections/oauth/outlook/callback` | Callback Microsoft OAuth2 |
| GET | `/calendar/connections` | Liste/statut des connexions de l’utilisateur |
| DELETE | `/calendar/connections` (ou `/{provider}`) | Déconnecter un calendrier |

### 4.4 Webhooks (synchronisation entrante)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/webhooks/google/calendar` | Notifications Google Calendar (push) |
| POST | `/webhooks/microsoft/calendar` | Notifications Microsoft Graph |

### 4.5 Enregistrement des routers

- Dans `backend/app/api/v1/router.py` : inclure les routers `appointments` et `calendar_connections`.
- Enregistrer les webhooks (souvent sous un préfixe `/webhooks` sans préfixe `/api/v1` selon la config actuelle).

---

## 5. Interface Frontend (React/Next.js)

### 5.1 Composants à créer ou modifier

| Composant | Fichier | Description |
|-----------|---------|-------------|
| Vue Calendrier | `apps/web/src/components/appointments/AppointmentCalendar.tsx` | Calendrier (react-big-calendar ou FullCalendar) : mois/semaine/jour, clic pour créer, glisser-déposer |
| Formulaire RV | `apps/web/src/components/appointments/AppointmentForm.tsx` | Champs : titre, description, date/heure, durée, participants (recherche contacts), lien transaction |
| Liste / détail | `apps/web/src/components/appointments/AppointmentList.tsx`, `AppointmentDetail.tsx` | Liste avec filtres ; affichage détail avec actions modifier/annuler |
| Configuration calendrier | `apps/web/src/components/settings/CalendarConnectionSettings.tsx` | Boutons « Connecter Google » / « Connecter Outlook », statut, déconnexion |
| Réservation publique | `apps/web/src/components/book/BrokerAvailabilityPicker.tsx`, `BrokerBookingForm.tsx` | Affichage créneaux du courtier ; formulaire nom/email + confirmation |

### 5.2 Hooks et services frontend

- `apps/web/src/hooks/useAppointments.ts` – Appels API CRUD rendez-vous.
- `apps/web/src/hooks/useAppointmentAvailability.ts` – Appel GET `/appointments/availability`.
- `apps/web/src/hooks/useCalendarConnections.ts` – Statut et déconnexion.
- `apps/web/src/services/api/appointments.ts` (ou équivalent) – Fonctions fetch vers les endpoints.

---

## 6. Logique de synchronisation et rappels

### 6.1 Synchronisation sortante (ImmoAssist → Google/Outlook)

- Lors de la création/mise à jour d’un rendez-vous (API ou formulaire), déclencher une tâche Celery.
- La tâche utilise les tokens stockés dans `CalendarConnection` pour créer/modifier l’événement dans Google Calendar ou Outlook.
- Stocker `google_event_id` ou `outlook_event_id` sur l’`Appointment`.

### 6.2 Synchronisation entrante (Google/Outlook → ImmoAssist)

- Les webhooks reçoivent les notifications de changement.
- Créer ou mettre à jour l’`Appointment` en base (et les participants si nécessaire).
- Gérer les conflits et éviter les boucles (IDs externes, timestamps, flag « source »).

### 6.3 Service de rappels

- Celery Beat : tâche périodique qui vérifie les rendez-vous à venir.
- Envoyer un email (via le service email existant) au courtier et aux participants (24 h et 1 h avant).

---

## 7. Plan d’implémentation en 5 phases (avec pages)

### Phase 1 : Base de données et API de base

**Objectif :** Modèles + migration + CRUD rendez-vous (sans synchro).

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 1.1 | Créer les modèles `Appointment`, `AppointmentAttendee`, `CalendarConnection` | `backend/app/models/appointment.py`, `appointment_attendee.py`, `calendar_connection.py` |
| 1.2 | Mettre à jour `User`, `RealEstateTransaction`, `__init__.py` | Relations + imports |
| 1.3 | Créer la migration Alembic | `alembic revision --autogenerate` puis vérifier/éditer |
| 1.4 | Appliquer la migration | `alembic upgrade head` |
| 1.5 | Créer les schémas Pydantic | `backend/app/schemas/appointment.py`, `appointment_attendee.py`, `calendar_connection.py` |
| 1.6 | Implémenter les endpoints CRUD `/appointments` | `backend/app/api/v1/endpoints/appointments.py` |
| 1.7 | Implémenter GET `/appointments/availability` | Même fichier ou service dédié |
| 1.8 | Enregistrer le router appointments | `backend/app/api/v1/router.py` |

**Pages concernées :** Aucune nouvelle page en Phase 1 (uniquement backend).

---

### Phase 2 : Interface de gestion interne (courtier)

**Objectif :** Le courtier peut gérer ses rendez-vous dans l’app (calendrier + formulaires + liste/détail).

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 2.1 | Créer les composants calendrier et formulaire | `AppointmentCalendar.tsx`, `AppointmentForm.tsx` |
| 2.2 | Créer les hooks et appels API frontend | `useAppointments.ts`, `useAppointmentAvailability.ts`, services API |
| 2.3 | **Page : Vue calendrier** | Modifier `dashboard/modules/calendrier/page.tsx` (intégrer `AppointmentCalendar`, données API) |
| 2.4 | **Page : Liste des rendez-vous** | Créer `dashboard/modules/calendrier/rendez-vous/page.tsx` (tableau + filtres) |
| 2.5 | **Page : Nouveau rendez-vous** | Créer `dashboard/modules/calendrier/rendez-vous/nouveau/page.tsx` (utilise `AppointmentForm`) |
| 2.6 | **Page : Détail rendez-vous** | Créer `dashboard/modules/calendrier/rendez-vous/[id]/page.tsx` |
| 2.7 | **Page : Modifier rendez-vous** | Créer `dashboard/modules/calendrier/rendez-vous/[id]/modifier/page.tsx` |
| 2.8 | Mettre à jour la navigation du module Calendrier | Liens vers rendez-vous, nouveau, agenda (layout ou menu latéral) |

**Pages livrées en Phase 2 :**

- `/dashboard/modules/calendrier` (modifiée)
- `/dashboard/modules/calendrier/rendez-vous`
- `/dashboard/modules/calendrier/rendez-vous/nouveau`
- `/dashboard/modules/calendrier/rendez-vous/[id]`
- `/dashboard/modules/calendrier/rendez-vous/[id]/modifier`

---

### Phase 3 : Connexion aux calendriers externes

**Objectif :** OAuth2 Google et Outlook, page de configuration, stockage sécurisé des tokens.

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 3.1 | Implémenter les endpoints OAuth2 Google et Outlook + callbacks | `backend/app/api/v1/endpoints/calendar_connections.py` |
| 3.2 | GET/DELETE connexions | Même fichier |
| 3.3 | Créer le composant de configuration | `CalendarConnectionSettings.tsx` |
| 3.4 | **Page : Paramètres Calendrier** | Créer `settings/calendar/page.tsx` ; ajouter lien « Calendrier » dans le layout ou menu des settings |
| 3.5 | Hook frontend pour connexions | `useCalendarConnections.ts` |

**Pages livrées en Phase 3 :**

- `/settings/calendar` (ou équivalent sous dashboard/profil/settings avec onglet Calendrier)

---

### Phase 4 : Synchronisation sortante

**Objectif :** Les RV créés/modifiés dans ImmoAssist sont poussés vers Google et Outlook.

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 4.1 | Intégrer les librairies (google-api-python-client, microsoftgraph-python) | `requirements.txt` ou équivalent |
| 4.2 | Créer les services de push (créer/mettre à jour événement) | `backend/app/services/calendar_sync/google_calendar.py`, `outlook_calendar.py` (ou un module commun) |
| 4.3 | Tâche Celery : après création/update d’un Appointment, appeler le service et sauvegarder l’ID externe | Déclencher depuis l’endpoint ou un signal |
| 4.4 | Gérer le refresh des tokens (OAuth2) dans les services | Utiliser refresh_token quand access_token expiré |

**Pages :** Aucune nouvelle page (comportement transparent côté UI).

---

### Phase 5 : Synchronisation entrante et rappels

**Objectif :** Webhooks reçoivent les changements des calendriers externes ; rappels automatiques par email.

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 5.1 | Implémenter POST `/webhooks/google/calendar` | Parser la notification, créer/mettre à jour/supprimer Appointment |
| 5.2 | Implémenter POST `/webhooks/microsoft/calendar` | Idem pour Microsoft Graph |
| 5.3 | Éviter les boucles (ne pas re-pusher un événement venu du webhook) | Flag ou règle basée sur source / ID externe |
| 5.4 | Tâche Celery Beat : détecter les RV à 24 h et 1 h | Créer la tâche périodique |
| 5.5 | Envoyer les emails de rappel (courtier + participants) | Réutiliser le service email existant |

**Pages :** Aucune nouvelle page.

---

## 8. Récapitulatif des pages (checklist)

À créer ou modifier pour le module rendez-vous :

- [ ] `apps/web/src/app/[locale]/dashboard/modules/calendrier/page.tsx` – **Modifier** (calendrier réel)
- [ ] `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/page.tsx` – **Créer**
- [ ] `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/nouveau/page.tsx` – **Créer**
- [ ] `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/[id]/page.tsx` – **Créer**
- [ ] `apps/web/src/app/[locale]/dashboard/modules/calendrier/rendez-vous/[id]/modifier/page.tsx` – **Créer**
- [ ] `apps/web/src/app/[locale]/settings/calendar/page.tsx` – **Créer**
- [ ] Lien « Calendrier » dans le menu/layout des settings – **Modifier**
- [ ] `apps/web/src/app/[locale]/book/[username]/page.tsx` – **Créer** (réservation publique)
- [ ] `apps/web/src/app/[locale]/book/[username]/confirmation/page.tsx` – **Créer** (optionnel)

Composants et hooks à créer (référencés dans le plan) :

- [ ] `AppointmentCalendar.tsx`, `AppointmentForm.tsx`, `AppointmentList.tsx`, `AppointmentDetail.tsx`
- [ ] `CalendarConnectionSettings.tsx`
- [ ] `BrokerAvailabilityPicker.tsx`, `BrokerBookingForm.tsx`
- [ ] Hooks : `useAppointments`, `useAppointmentAvailability`, `useCalendarConnections`

---

## 9. Dépendances techniques

- **Backend :** `google-api-python-client`, `google-auth-oauthlib`, `microsoftgraph-python` (ou SDK Microsoft officiel), Celery, Celery Beat.
- **Frontend :** `react-big-calendar` ou `@fullcalendar/react` (et paquets core), librairie de formulaires (déjà en place dans le projet).
- **Variables d’environnement :** Client ID / Secret Google et Microsoft pour OAuth2 ; URLs de callback et de webhook.

---

Ce document sert de feuille de route pour une livraison incrémentale et couvre explicitement toutes les pages à ajouter ou à modifier pour le module de gestion des rendez-vous.
