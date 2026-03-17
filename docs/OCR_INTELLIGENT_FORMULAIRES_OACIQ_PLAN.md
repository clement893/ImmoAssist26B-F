# Plan d'implémentation : OCR intelligent pour formulaires OACIQ

**Date :** 2026-02-01  
**Objectif :** Implémenter un système qui, lors de l'import d'un formulaire OACIQ (PDF ou image), détecte le type de formulaire, en extrait les données manuscrites ou dactylographiées, et pré-remplit les champs correspondants dans la plateforme ImmoAssist.

---

## 1. Vue d'ensemble

### 1.1 Fonctionnalités cibles

- **Import** : dépôt d'un fichier PDF ou image (glisser-déposer ou sélection).
- **Classification** : identification automatique du formulaire OACIQ (ex. PA, CCVE, ACD).
- **Extraction** : OCR + LLM pour produire des données structurées.
- **Révision** : interface côte à côte (document original / formulaire pré-rempli) avec correction et approbation.

### 1.2 Architecture : approche hybride (OCR + LLM)

| Étape | Rôle | Technologie |
|-------|------|-------------|
| 1. Classification | Identifier le formulaire OACIQ | LLM avec vision (ex. GPT-4o, Claude 3) |
| 2. Extraction brute | Texte + position (coordonnées) | OCR (ex. AWS Textract) |
| 3. Extraction structurée | Mapper le texte aux champs + confiance | LLM (GPT-4o, Claude 3) + `extraction_schema` |

---

## 2. Pages et flux utilisateur

### 2.1 Pages concernées

| Page / composant | Rôle | Fichier (frontend) |
|------------------|------|--------------------|
| **Import** | Zone d’upload + lancement du traitement | À intégrer dans une page existante ou dédiée (voir ci‑dessous) |
| **Suivi de tâche** | Affichage de la progression (polling ou WebSocket) | Même page que l’import ou modal |
| **Révision** | Document original (gauche) + formulaire pré-rempli (droite), correction, approbation | `app/[locale]/dashboard/forms/submissions/[id]/review/page.tsx` |

### 2.2 Flux utilisateur

```
[Utilisateur]                    [Frontend]                      [Backend]
     |                                |                                 |
     |  Glisse-dépose PDF/image       |                                 |
     |------------------------------->|                                 |
     |                                |  POST /forms/submissions/       |
     |                                |  upload-and-process             |
     |                                |-------------------------------->|
     |                                |                                 |  Upload S3 + création tâche
     |                                |  { task_id }                    |
     |                                |<--------------------------------|
     |                                |                                 |
     |  Poll GET /tasks/{id}/status  |                                 |
     |<----------------------------->|<-------------------------------->|  Celery : Classification
     |                                |                                 |  -> OCR -> LLM -> FormSubmission
     |  Redirection vers             |                                 |
     |  /forms/submissions/{id}/review                               |
     |<-------------------------------                                 |
     |                                |                                 |
     |  Corrige / Approuve            |  PATCH submission, needs_review |
     |------------------------------->|-------------------------------->|
```

### 2.3 Système d’import (côté frontend)

- **Composant d’upload** : `apps/web/src/components/forms/FormUploader.tsx`
  - Zone glisser-déposer (drag & drop).
  - Accepte : `application/pdf`, `image/*`.
  - Au dépôt : appel `POST /api/v1/forms/submissions/upload-and-process` avec le fichier.
  - Réception de `task_id`, puis polling `GET /api/v1/tasks/{task_id}/status` jusqu’à `completed` / `failed`.
  - En cas de succès : redirection vers `/[locale]/dashboard/forms/submissions/{submission_id}/review`.

- **Emplacement d’intégration** (au choix) :
  - Page dédiée : `app/[locale]/dashboard/forms/import/page.tsx` (liste des imports + zone d’upload).
  - Ou intégration dans la page liste des formulaires OACIQ : `app/[locale]/dashboard/modules/formulaire/oaciq/page.tsx` (bouton « Importer un formulaire scanné » ouvrant un modal avec `FormUploader`).

---

## 3. Modèles de base de données (SQLAlchemy)

### 3.1 Fichiers à modifier

- **Modèles :** `backend/app/models/form.py`
- **Migration :** nouveau fichier sous `backend/alembic/versions/`.

### 3.2 Modèle `Form`

**Fichier :** `backend/app/models/form.py`

Ajouter un champ pour le schéma d’extraction utilisé par le LLM :

```python
# À ajouter dans class Form(Base):
extraction_schema = Column(JSON, nullable=True)  # Schéma pour guider l'extraction par le LLM
```

**Format type de `extraction_schema` :**

```json
{
  "fields": [
    { "name": "buyer_name", "description": "Le nom complet de l'acheteur" },
    { "name": "property_address", "description": "L'adresse complète de la propriété" },
    { "name": "purchase_price", "description": "Le prix d'achat offert" }
  ]
}
```

### 3.3 Modèle `FormSubmission`

**Fichier :** `backend/app/models/form.py`

Ajouter les champs de traçabilité et confiance :

```python
# À ajouter dans class FormSubmission(Base):
source_document_url = Column(String(512), nullable=True)   # Lien vers le PDF/image original (S3)
extraction_confidence = Column(JSON, nullable=True)       # Confiance par champ ex: {"buyer_name": 0.95}
needs_review = Column(Boolean, default=True, nullable=False)  # Révision manuelle nécessaire
```

### 3.4 Migration Alembic

- **Action :** créer une migration (ex. `XXX_add_ocr_extraction_fields_to_forms.py`) qui :
  - ajoute `extraction_schema` à `forms` ;
  - ajoute `source_document_url`, `extraction_confidence`, `needs_review` à `form_submissions`.

---

## 4. API Backend (FastAPI)

### 4.1 Nouveau module : `form_ocr`

**Fichier à créer :** `backend/app/api/v1/endpoints/form_ocr.py`

| Méthode | Route | Description |
|---------|--------|-------------|
| POST | `/forms/submissions/upload-and-process` | Accepte un fichier (PDF/image), upload S3, crée une tâche Celery, retourne `task_id`. |
| GET  | `/tasks/{task_id}/status` | Retourne le statut de la tâche (`pending`, `running`, `completed`, `failed`) et en cas de succès `submission_id`. |

**Enregistrement du router :** dans `backend/app/api/v1/router.py`, inclure `form_ocr.router` avec le préfixe adapté (ex. sous `/forms` ou à la racine v1 selon votre convention).

### 4.2 Workflow de l’endpoint `upload-and-process`

1. Vérifier l’authentification et les permissions.
2. Valider le fichier (type : PDF ou image, taille max).
3. Uploader le fichier vers un stockage temporaire (S3 ou équivalent) et obtenir une URL (ou clé).
4. Créer une tâche Celery (ou tâche asynchrone équivalente) avec l’URL/clé du document.
5. Retourner immédiatement `{ "task_id": "...", "message": "Traitement en cours" }`.

### 4.3 Tâche de fond (Celery)

**Fichier à créer / étendre :** par ex. `backend/app/tasks/form_ocr_tasks.py` (ou sous `backend/app/worker/` selon votre structure).

**Pipeline de la tâche :**

1. **Classification du formulaire**
   - Extraire la première page du document (image ou PDF page 1).
   - Envoyer à un LLM avec vision (GPT-4o / Claude 3) avec un prompt du type : *« Parmi cette liste de codes OACIQ : [PA, CCVE, ACD, …], quel formulaire est-ce ? Réponds uniquement avec le code. »*
   - Récupérer le `Form` correspondant (par `code`) et son `extraction_schema`.

2. **Extraction OCR**
   - Appeler le service OCR (ex. AWS Textract) pour obtenir texte, cases à cocher, coordonnées.
   - Stocker le résultat brut (texte par bloc/page) pour l’étape suivante.

3. **Extraction structurée (LLM)**
   - Construire un prompt contenant :
     - le texte brut issu de l’OCR ;
     - le `extraction_schema` du formulaire ;
     - une consigne : *« Extrais les informations demandées et retourne un JSON. Pour chaque champ, fournis la valeur et un score de confiance entre 0 et 1. »*
   - Appeler le LLM via le service existant (ex. `ai_service` / `lea`).
   - Parser la réponse JSON et valider les champs.

4. **Sauvegarde**
   - Créer une `FormSubmission` avec :
     - `form_id`, `data` (champs extraits), `source_document_url`, `extraction_confidence`, `needs_review=True`.
   - Mettre à jour le statut de la tâche à `completed` et associer `submission_id`.

**Gestion d’erreurs :** en cas d’échec (classification, OCR, LLM, validation), mettre le statut de la tâche à `failed` et enregistrer un message d’erreur (pour affichage côté frontend).

### 4.4 Configuration AWS Textract (si utilisé)

- Variables d’environnement : `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, optionnellement `AWS_S3_BUCKET_OCR_INPUT`.
- Documentation / script : indiquer comment créer un bucket S3 dédié aux documents temporaires et les permissions IAM pour Textract.

---

## 5. Interface frontend (Next.js / React)

### 5.1 Composant d’import

**Fichier à créer :** `apps/web/src/components/forms/FormUploader.tsx`

- Zone de glisser-déposer (drag & drop) avec message du type « Déposez un PDF ou une image ».
- Types acceptés : `application/pdf`, `image/png`, `image/jpeg`, `image/webp`.
- À l’upload : `POST /api/v1/forms/submissions/upload-and-process` (multipart).
- Récupération de `task_id` puis polling `GET /api/v1/tasks/{task_id}/status` (ex. toutes les 2 s).
- Affichage d’une barre de progression ou statut (en cours / terminé / échec).
- En cas de succès : `router.push(`/${locale}/dashboard/forms/submissions/${submission_id}/review`)`.

### 5.2 Page de révision

**Fichier à créer :** `apps/web/src/app/[locale]/dashboard/forms/submissions/[id]/review/page.tsx`

- **Layout :** deux panneaux côte à côte (responsive : empilés sur mobile).
  - **Gauche :** affichage du document original (PDF ou image) via URL `source_document_url` (iframe ou viewer existant).
  - **Droite :** formulaire ImmoAssist (champs issus de `FormSubmission.data`) avec édition possible.
- **Confiance :** champs avec score de confiance faible (ex. &lt; 0.8) mis en surbrillance (style « à vérifier »).
- **Actions :**
  - Sauvegarder les corrections (PATCH submission).
  - Bouton « Approuver » : mettre `needs_review` à `false` (PATCH) et optionnellement rediriger vers la fiche soumission ou la liste.

### 5.3 Endpoints frontend à consommer

- `POST /api/v1/forms/submissions/upload-and-process` (multipart).
- `GET /api/v1/tasks/{task_id}/status`.
- `GET /api/v1/forms/submissions/{id}` (détail soumission).
- `PATCH /api/v1/forms/submissions/{id}` (correction + approbation).

---

## 6. Plan d’implémentation en 4 phases

### Phase 1 : Backend – Modèles et API de base

| # | Action | Fichier(s) |
|---|--------|------------|
| 1.1 | Ajouter `extraction_schema` au modèle `Form` | `backend/app/models/form.py` |
| 1.2 | Ajouter `source_document_url`, `extraction_confidence`, `needs_review` à `FormSubmission` | `backend/app/models/form.py` |
| 1.3 | Générer et appliquer la migration Alembic | `backend/alembic/versions/` |
| 1.4 | Créer le module `form_ocr.py` avec les endpoints upload-and-process et task status | `backend/app/api/v1/endpoints/form_ocr.py` |
| 1.5 | Enregistrer le router dans `router.py` | `backend/app/api/v1/router.py` |
| 1.6 | Créer la structure de la tâche Celery (signature + enqueue), sans logique OCR/LLM réelle ; créer une soumission de test ou marquer la tâche comme « completed » avec un `submission_id` factice pour les tests | `backend/app/tasks/form_ocr_tasks.py` (ou équivalent) |

**Critère de fin de phase 1 :** migration appliquée, upload de fichier possible, tâche créée et statut consultable, soumission créée (mock) et récupérable par ID.

---

### Phase 2 : Frontend – Upload et suivi

| # | Action | Fichier(s) |
|---|--------|------------|
| 2.1 | Créer le composant `FormUploader` (drag & drop, appel upload-and-process, polling du statut) | `apps/web/src/components/forms/FormUploader.tsx` |
| 2.2 | Créer la page ou le point d’entrée pour l’import (page dédiée ou modal dans la liste OACIQ) | ex. `apps/web/src/app/[locale]/dashboard/forms/import/page.tsx` ou intégration dans une page existante |
| 2.3 | Adapter les adaptateurs API / clients pour `upload-and-process` et `GET /tasks/{id}/status` | ex. `apps/web/src/lib/api/` (forms ou tasks) |

**Critère de fin de phase 2 :** l’utilisateur peut déposer un fichier, voir la progression, et être redirigé vers une URL de révision (même si la soumission est encore mock).

---

### Phase 3 : Backend – Pipeline d’extraction

| # | Action | Fichier(s) |
|---|--------|------------|
| 3.1 | Intégrer AWS Textract (ou OCR choisi) : extraction texte + coordonnées (et cases à cocher si besoin) | service dédié ex. `backend/app/services/ocr_service.py` |
| 3.2 | Implémenter la classification du formulaire (première page → LLM vision → code OACIQ) | dans la tâche Celery ou `backend/app/services/form_classifier.py` |
| 3.3 | Implémenter l’extraction structurée (texte OCR + `extraction_schema` → prompt LLM → JSON) | dans la tâche Celery ou `backend/app/services/form_extraction_llm.py` |
| 3.4 | Brancher le pipeline complet dans la tâche Celery : classification → OCR → LLM → création `FormSubmission` avec `source_document_url`, `extraction_confidence`, `needs_review=True` | `backend/app/tasks/form_ocr_tasks.py` |
| 3.5 | Renseigner `extraction_schema` pour au moins un formulaire OACIQ (ex. Promesse d’achat) en base ou via seed | script ou migration de données |

**Critère de fin de phase 3 :** un PDF/image de test produit une `FormSubmission` pré-remplie avec des champs et des scores de confiance, et la tâche passe à `completed` avec le bon `submission_id`.

---

### Phase 4 : Frontend – Interface de révision

| # | Action | Fichier(s) |
|---|--------|------------|
| 4.1 | Créer la page de révision côte à côte (document original | formulaire) | `apps/web/src/app/[locale]/dashboard/forms/submissions/[id]/review/page.tsx` |
| 4.2 | Afficher le document original (PDF/image) à partir de `source_document_url` | même page, panneau gauche |
| 4.3 | Afficher les champs de la soumission avec mise en évidence des champs à faible confiance | même page, panneau droit |
| 4.4 | Implémenter la sauvegarde des corrections (PATCH) et le bouton « Approuver » (PATCH avec `needs_review=false`) | même page + appels API |

**Critère de fin de phase 4 :** un courtier peut réviser, corriger et approuver une soumission importée par OCR.

---

## 7. Récapitulatif des fichiers

### Backend

| Fichier | Action |
|---------|--------|
| `backend/app/models/form.py` | Modifier (Form + FormSubmission) |
| `backend/alembic/versions/XXX_add_ocr_extraction_fields.py` | Créer |
| `backend/app/api/v1/endpoints/form_ocr.py` | Créer |
| `backend/app/api/v1/router.py` | Modifier (inclure form_ocr) |
| `backend/app/tasks/form_ocr_tasks.py` | Créer (ou équivalent worker) |
| `backend/app/services/ocr_service.py` | Créer (Textract / OCR) |
| `backend/app/services/form_classifier.py` | Créer (optionnel, peut être dans la tâche) |
| `backend/app/services/form_extraction_llm.py` | Créer (optionnel, peut être dans la tâche) |

### Frontend

| Fichier | Action |
|---------|--------|
| `apps/web/src/components/forms/FormUploader.tsx` | Créer |
| `apps/web/src/app/[locale]/dashboard/forms/import/page.tsx` | Créer (ou intégration ailleurs) |
| `apps/web/src/app/[locale]/dashboard/forms/submissions/[id]/review/page.tsx` | Créer |
| `apps/web/src/lib/api/` (forms / tasks) | Adapter ou ajouter appels upload-and-process et task status |

### Configuration / Documentation

- Variables d’environnement : `AWS_*` pour Textract ; clés API pour le LLM (déjà présentes si LEA/AI existant).
- Mise à jour de la doc (ex. `docs/ENV_VARIABLES.md`, `docs/MODULE_FORMULAIRE_OACIQ_PLAN.md`) pour l’OCR et les nouvelles routes.

---

## 8. Dépendances et risques

- **Celery** : s’assurer que le worker et la file (Redis/RabbitMQ) sont configurés en dev et en production.
- **AWS Textract** : coût par page ; prévoir des quotas et un bucket S3 dédié avec politique de rétention (suppression des fichiers après traitement).
- **LLM** : coût et limites de taux (rate limits) ; gérer les timeouts et les échecs de parsing JSON (retry, fallback, message clair à l’utilisateur).

Ce document sert de référence unique pour l’implémentation de l’OCR intelligent formulaires OACIQ ; il peut être découpé en tickets (une tâche par ligne du tableau de phase) pour le suivi projet.
