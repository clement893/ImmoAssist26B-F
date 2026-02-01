# Plan d'implémentation : Étapes de transaction guidées par Léa

**Objectif :** Intégrer un système de suivi des étapes de transaction immobilière (parcours acheteur et vendeur) dans ImmoAssist, aligné sur la [page démo](https://immoassist26b-f-production.up.railway.app/fr/demo/transactions/steps-v2) et le parcours québécois documenté.

**Référence démo :** `/fr/demo/transactions/steps-v2`

---

## 1. Vue d'ensemble

### 1.1 État actuel

| Composant | Existant | À faire |
|-----------|----------|---------|
| **Backend** | | |
| `RealEstateTransaction` | ✅ Modèle complet (dates, statuts, documents) | Ajouter `completed_steps`, `transaction_data` (JSON) |
| `TransactionAction` | ✅ Actions basées sur `from_status`/`to_status` | Étendre pour étapes acheteur/vendeur |
| `ActionCompletion` | ✅ Historique des actions | Réutiliser pour cocher les actions |
| `calculateTransactionSteps` | ✅ Logique frontend basée sur les dates | Fusionner avec nouvelles étapes |
| **Frontend** | | |
| Page démo `steps-v2` | ✅ Maquette complète (données statiques) | Connecter à l’API |
| Page dashboard `/transactions/steps` | ✅ `StatusStepper` + `progression.ts` | Enrichir ou rediriger vers steps-v2 |
| **Léa (AI)** | ❌ | Conseil statique ou API AI |

### 1.2 Architecture cible

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
├─────────────────────────────────────────────────────────────────┤
│  /dashboard/transactions/[id]/steps  (ou /transactions/steps)   │
│  - Sélecteur de transaction                                      │
│  - Vue acheteur / vendeur                                        │
│  - Étapes + actions (checkboxes)                                 │
│  - Panneau Léa                                                   │
│  - Rappels                                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API
┌───────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
├─────────────────────────────────────────────────────────────────┤
│  GET  /transactions/{id}/steps        → Étapes, actions, rappels │
│  POST /transactions/{id}/actions/{code}/complete                 │
│  GET  /transactions/lea-guidance/{action_code}                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  RealEstateTransaction                                           │
│  - completed_steps: string[] (codes d'étapes complétées)         │
│  - completed_actions: string[] (codes d'actions complétées)      │
│  - transaction_data: JSON (dates limites, etc.)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Modèle de données

### 2.1 Étapes et actions (structure de référence)

Les étapes et actions sont **définies en code** (config/seed) plutôt que modélisées en base pour cette phase. Cela permet d’itérer rapidement sans migrations complexes.

**Référence :** notes sur le parcours québécois.

#### Parcours acheteur (7 étapes)

| Code | Titre | Actions (code) |
|------|-------|----------------|
| `preparation` | Préparation et recherche | a1, a2, a3 |
| `submit_offer` | Promesse d'achat | a4, a5 |
| `accept_offer` | Offre acceptée (conditions suspensives) | a6, a7, a8 |
| `complete_inspection` | Inspection complétée | a9, a10 |
| `approve_financing` | Financement approuvé | a11, a12 |
| `complete_signing` | Signature chez le notaire | a13, a14 |
| `transfer_keys` | Prise de possession | a15, a16 |

#### Parcours vendeur (6 étapes)

| Code | Titre | Actions (code) |
|------|-------|----------------|
| `preparation` | Préparation et mise en marché | v1, v2, v3 |
| `publish_listing` | Propriété listée | v4, v5 |
| `receive_offer` | Réception d'offre | v6, v7 |
| `accept_offer` | Offre acceptée | v8, v9, v10 |
| `complete_signing` | Signature chez le notaire | v11, v12 |
| `transfer_keys` | Remise des clés | v13, v14 |

### 2.2 Modifications backend

#### Fichier : `backend/app/models/real_estate_transaction.py`

```python
# Ajouter ces colonnes
completed_steps = Column(JSON, nullable=True, default=list, comment="Codes d'étapes complétées")
completed_actions = Column(JSON, nullable=True, default=list, comment="Codes d'actions complétées")
transaction_data = Column(JSON, nullable=True, default=dict, comment="Données (dates limites, etc.)")
```

#### Nouveau fichier : `backend/app/config/transaction_steps.py`

Définition des étapes et actions (acheteur + vendeur) avec :

- `code`, `title`, `description`, `order_index`, `view` (acheteur | vendeur)
- Pour chaque action : `code`, `title`, `description`, `required`, `documents`, `lea_guidance`, `due_date_offset_days` (optionnel)

**Mapping vers les champs de `RealEstateTransaction` :**

- `inspection_deadline` → action a6 (planifier inspection)
- `financing_deadline` → action a7 (finaliser financement)
- `promise_acceptance_date` → étape `accept_offer` début
- etc.

---

## 3. API Backend

### 3.1 Endpoints à créer

#### `backend/app/api/v1/endpoints/transaction_steps.py`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/transactions/{id}/steps` | Étapes, actions, statuts, rappels pour une transaction |
| POST | `/transactions/{id}/actions/{action_code}/complete` | Marquer une action comme complétée |
| POST | `/transactions/{id}/actions/{action_code}/uncomplete` | (optionnel) Démarquer une action |
| GET | `/transactions/lea-guidance/{action_code}` | Conseil Léa pour une action (ou intégré dans steps) |

#### Schéma de réponse `GET /transactions/{id}/steps`

```json
{
  "transaction": {
    "id": 1,
    "name": "...",
    "status": "...",
    "progress": 35,
    ...
  },
  "buyer_steps": [
    {
      "code": "preparation",
      "title": "Préparation et recherche",
      "status": "completed",
      "completed_date": "2024-01-15",
      "actions": [
        {
          "code": "a1",
          "title": "Définir budget et besoins",
          "completed": true,
          "required": true,
          "documents": [],
          "lea_guidance": "...",
          "due_date": null
        }
      ],
      "reminders": []
    }
  ],
  "vendor_steps": [ /* idem */ ]
}
```

**Logique :**

1. Charger la transaction et ses `completed_steps`, `completed_actions`, `transaction_data`
2. Charger la config des étapes (acheteur + vendeur)
3. Pour chaque étape : calculer `status` (completed | current | upcoming | overdue) selon :
   - Dates de la transaction (`inspection_deadline`, `financing_deadline`, etc.)
   - `completed_steps` et `completed_actions`
4. Générer les rappels à partir des actions avec `due_date` non atteintes

---

## 4. Frontend

### 4.1 Intégration de la page démo

**Option A (recommandée) :** Utiliser la page démo comme base et la déplacer sous `/dashboard/transactions/steps` avec données dynamiques.

**Option B :** Garder la démo séparée et créer une nouvelle page dashboard qui réutilise les mêmes composants.

#### Fichiers à modifier / créer

| Fichier | Action |
|---------|--------|
| `apps/web/src/app/[locale]/dashboard/transactions/steps/page.tsx` | Remplacer par la logique steps-v2 + appels API |
| `apps/web/src/components/transactions/TransactionStepsV2.tsx` | Extraire le contenu de la page en composant réutilisable |
| `apps/web/src/lib/api/transaction-steps.ts` | Adapter API pour `getSteps`, `completeAction` |
| `apps/web/src/lib/api.ts` | Exporter `transactionStepsAPI` |

#### Flux de données

1. **Chargement :** `GET /transactions/{id}/steps` → `useState` / `useQuery`
2. **Checkbox :** `onChange` → `POST /transactions/{id}/actions/{code}/complete` → invalidation cache / mise à jour état
3. **Léa :** conseils déjà dans la réponse (`lea_guidance`) ; pas d’appel supplémentaire en phase 1
4. **Transaction :** sélecteur existant → `selectedTransactionId` → `GET /transactions/{id}/steps`

### 4.2 Lien avec la liste des transactions

- Depuis `/dashboard/transactions` : lien "Voir les étapes" vers `/dashboard/transactions/steps?transaction={id}`
- Depuis la fiche transaction `/dashboard/transactions/[id]` : onglet ou lien "Étapes détaillées"

---

## 5. Migrations et seeding

### 5.1 Migration Alembic

```bash
cd backend
alembic revision --autogenerate -m "add_completed_steps_and_actions_to_real_estate_transaction"
alembic upgrade head
```

### 5.2 Seed des étapes (optionnel)

Si on décide de persister les étapes en base plus tard :

- Créer `backend/scripts/seed_transaction_steps.py`
- Peupler une table `transaction_steps` et `transaction_step_actions` si on passe à un modèle dynamique

Pour la phase 1 : config Python suffit (`transaction_steps.py`).

---

## 6. Rappels (phase 2)

- **Tâche planifiée :** (ex. Celery, APScheduler, ou cron)
- **Fréquence :** quotidienne
- **Logique :** pour chaque transaction "En cours", vérifier les `due_date` des actions non complétées
- **Notification :** créer une notification (table `notifications`) ou envoyer un email au courtier

---

## 7. Léa (conseils AI)

**Phase 1 :** Texte statique par action (`lea_guidance` dans la config).

**Phase 2 (optionnel) :**

- Appel à un LLM (OpenAI, etc.) avec contexte : transaction, action, documents
- Endpoint `POST /transactions/lea-ask` avec `{ action_code, question }` → réponse AI

---

## 8. Checklist d’implémentation

### Phase 1 – MVP

- [ ] **Backend**
  - [ ] Ajouter `completed_steps`, `completed_actions`, `transaction_data` à `RealEstateTransaction`
  - [ ] Migration Alembic
  - [ ] Créer `backend/app/config/transaction_steps.py` avec étapes acheteur + vendeur (d’après notes + démo)
  - [ ] Créer `transaction_steps.py` (endpoints)
  - [ ] `GET /transactions/{id}/steps` : construire la réponse à partir de la config + transaction
  - [ ] `POST /transactions/{id}/actions/{code}/complete` : mettre à jour `completed_actions` (et `completed_steps` si besoin)

- [ ] **Frontend**
  - [ ] Créer `transactionStepsAPI` dans `lib/api`
  - [ ] Extraire le contenu de `steps-v2/page.tsx` en composant `TransactionStepsV2`
  - [ ] Remplacer les données statiques par `useQuery` / `fetch` vers l’API
  - [ ] Connecter les checkboxes à `completeAction`
  - [ ] Intégrer la page sous `/dashboard/transactions/steps` avec sélecteur de transaction
  - [ ] Lien depuis la liste/fiche des transactions

- [ ] **Tests**
  - [ ] Test unitaire `GET /transactions/{id}/steps`
  - [ ] Test `POST .../complete`
  - [ ] Test manuel du flux complet

### Phase 2 – Enrichissements

- [ ] Service de rappels (tâche planifiée)
- [ ] Notifications pour échéances proches
- [ ] Variantes (financement refusé, inspection insatisfaisante, etc.) – affichage conditionnel
- [ ] Léa AI (LLM) si requis

---

## 9. Correspondance notes ↔ démo

| Notes (parcours acheteur) | Démo (buyerSteps) |
|---------------------------|-------------------|
| Étape 1 : Préparation et recherche | `preparation` |
| Définir besoins et budget | a1 |
| Préapprobation hypothécaire | a2 |
| Contrat de courtage | a3 |
| Étape 2 : Promesse d'achat | `submit_offer` |
| Rédiger promesse | a4 |
| Négocier termes | a5 |
| Étape 3 : Finalisation | `accept_offer` + `complete_inspection` + `approve_financing` + `complete_signing` + `transfer_keys` |

Les notes regroupent en 3 grandes étapes ; la démo en détaille 7. Le plan suit la démo pour une granularité plus fine.

---

## 10. Fichiers de référence

- Démo : `apps/web/src/app/[locale]/demo/transactions/steps-v2/page.tsx`
- Progression actuelle : `apps/web/src/lib/transactions/progression.ts`
- Page étapes dashboard : `apps/web/src/app/[locale]/dashboard/transactions/steps/page.tsx`
- Modèle transaction : `backend/app/models/real_estate_transaction.py`
- Actions : `backend/app/models/transaction_action.py`, `backend/app/services/transaction_action_service.py`
