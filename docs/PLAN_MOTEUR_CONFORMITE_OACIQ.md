# Plan d'implémentation : Moteur de conformité OACIQ en temps réel

**Date :** 2026-02-01  
**Objectif :** Implémenter un système qui assiste le courtier en validant la conformité des formulaires OACIQ en temps réel pendant le remplissage, et en fournissant des alertes et des suggestions contextuelles.

---

## 1. Architecture générale : moteur de règles backend

Le cœur du système est un **moteur de règles côté backend**. Le frontend envoie l'état actuel du formulaire à une API, qui retourne une liste de problèmes de conformité.

### 1.1 Workflow de validation

| Étape | Acteur | Action |
|-------|--------|--------|
| 1 | Frontend | L'utilisateur modifie un champ dans le formulaire. |
| 2 | Frontend | Après un délai (debounce 500 ms), l'état complet du formulaire est envoyé à l'API backend. |
| 3 | Backend | L'API reçoit les données et les transmet au moteur de règles de conformité. |
| 4 | Backend | Le moteur exécute toutes les règles applicables au formulaire en cours. |
| 5 | Backend | L'API retourne une liste de validations (erreurs, avertissements, suggestions). |
| 6 | Frontend | L'interface affiche les messages à côté des champs concernés et dans un panneau de résumé. |

### 1.2 Piliers du module

| Pilier | Description |
|--------|-------------|
| **Modèle Form** | Extension : champ JSON `compliance_rules` pour stocker les règles par formulaire. |
| **Service Backend** | `ComplianceRuleEngine` : interprétation et exécution des règles. |
| **API** | `POST /forms/{form_id}/submissions/validate` : validation en temps réel. |
| **Frontend** | Debounce, affichage inline, ComplianceSidebar, désactivation du bouton de soumission. |

**Dépendances existantes :** `Form`, `FormSubmission`, `FormRenderer`, page de remplissage OACIQ `/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill`.

---

## 2. Inventaire des fichiers à créer ou modifier

### 2.1 Backend

| Fichier | Action | Description |
|---------|--------|-------------|
| `backend/app/models/form.py` | **Modifier** | Ajouter la colonne `compliance_rules = Column(JSON, nullable=True)`. |
| `backend/alembic/versions/xxx_add_compliance_rules_to_forms.py` | **Créer** | Migration : ajout de `compliance_rules` à la table `forms`. |
| `backend/app/services/compliance_service.py` | **Créer** | Moteur de règles : `ComplianceRuleEngine`, méthode `validate(form_rules, form_data) -> List[dict]`. |
| `backend/app/api/v1/endpoints/forms.py` | **Modifier** | Ajouter l'endpoint `POST /forms/{form_id}/submissions/validate`. |
| `backend/app/schemas/compliance.py` | **Créer** (optionnel) | Schémas Pydantic pour requête/ réponse de validation. |
| `backend/scripts/seed_compliance_rules.py` | **Créer** (Phase 2) | Script pour peupler `compliance_rules` des formulaires OACIQ. |

### 2.2 Frontend

| Fichier | Action | Description |
|---------|--------|-------------|
| `apps/web/src/components/forms/FormRenderer.tsx` | **Modifier** | Accepter `validationErrors?: Record<string, ValidationIssue[]>`, afficher erreurs inline et bordures (rouge/jaune). |
| `apps/web/src/components/forms/ComplianceSidebar.tsx` | **Créer** | Panneau latéral : liste des problèmes groupés par sévérité, clic → scroll vers le champ. |
| `apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill/page.tsx` | **Modifier** | Appel à l'API validate avec debounce 500 ms, état des validations, désactivation du bouton si erreurs bloquantes. |
| `apps/web/src/hooks/useComplianceValidation.ts` | **Créer** (optionnel) | Hook pour appeler l'API validate avec debounce et gérer le chargement. |
| `apps/web/src/lib/api/oaciq-forms.ts` ou `forms.ts` | **Modifier** | Ajouter `validateSubmission(formId: number, formData: Record<string, unknown>)` → appel POST validate. |

### 2.3 Pages concernées (aucune nouvelle route)

| Route | Fichier | Modification |
|-------|---------|--------------|
| `/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill` | `apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill/page.tsx` | Intégration validation temps réel + ComplianceSidebar + bouton soumission conditionnel. |

---

## 3. Modèle de données (SQLAlchemy)

### 3.1 Extension du modèle Form

**Fichier :** `backend/app/models/form.py`

- Ajouter une colonne :
  - `compliance_rules = Column(JSON, nullable=True)`  
  - Commentaire : « Ensemble de règles de conformité OACIQ (structure décrite ci-dessous). »

### 3.2 Structure d'une règle (JSON dans `compliance_rules`)

Le champ `compliance_rules` contient un objet avec une clé `rules` (liste d'objets). Chaque règle :

| Clé | Type | Description |
|-----|------|-------------|
| `code` | string | Identifiant unique (ex. `R001`). |
| `description` | string | Description métier de la règle. |
| `field` | string (optionnel) | Champ concerné (pour affichage inline). |
| `type` | string | Type de règle : `required`, `comparison`, `regex`, `conditional_required`, `date_comparison`, `custom`, etc. |
| `params` | object | Paramètres de la règle (opérateur, valeur, champs conditionnels, etc.). |
| `severity` | string | `error` \| `warning` \| `info`. |
| `message` | string | Message affiché à l'utilisateur. |

**Exemples :**

```json
{
  "rules": [
    {
      "code": "R001",
      "description": "Le prix d'achat doit être supérieur à zéro.",
      "field": "purchase_price",
      "type": "comparison",
      "params": { "operator": ">", "value": 0 },
      "severity": "error",
      "message": "Le prix d'achat doit être un nombre positif."
    },
    {
      "code": "R002",
      "description": "Si la clause d'inspection est incluse, la date limite doit être spécifiée.",
      "type": "conditional_required",
      "params": {
        "if_field": "inspection_clause_included",
        "if_value": true,
        "then_field_is_required": "inspection_deadline"
      },
      "severity": "warning",
      "message": "N'oubliez pas de spécifier une date limite pour l'inspection."
    }
  ]
}
```

### 3.3 Migration Alembic

- Créer une migration qui ajoute la colonne `compliance_rules` (JSON, nullable) à la table `forms`.
- Pas de nouvelle table.

---

## 4. API Backend (FastAPI)

### 4.1 Service ComplianceRuleEngine

**Fichier :** `backend/app/services/compliance_service.py`

- **Classe / fonctions :**
  - `validate(form_rules: dict, form_data: dict) -> List[ComplianceResult]`.
  - Interprétation des règles par `type` :
    - `required` : champ présent et non vide.
    - `comparison` : comparaison numérique ou chaîne (opérateurs `>`, `<`, `>=`, `<=`, `==`, `!=`).
    - `regex` : valeur conforme à un motif.
    - `conditional_required` : si `params.if_field` == `if_value`, alors `then_field_is_required` doit être rempli.
    - `date_comparison` : comparaison de dates (ex. date signature < date entrée en vigueur).
    - (Optionnel) `custom` ou formules pour règles avancées.
- **Format de sortie :** liste d’objets avec au minimum : `code`, `field`, `severity`, `message`, éventuellement `description`.

### 4.2 Endpoint de validation

- **Route :** `POST /api/v1/forms/{form_id}/submissions/validate`  
  (ou `POST /api/v1/oaciq/forms/{form_id}/validate` si les formulaires OACIQ sont sous un préfixe dédié.)

- **Corps de la requête :**  
  `{ "form_data": { ... } }` — état actuel des champs du formulaire.

- **Réponse :**  
  `{ "valid": bool, "issues": [ { "code", "field", "severity", "message", "description?" } ] }`

- **Logique :**
  1. Récupérer le `Form` par `form_id` et ses `compliance_rules`.
  2. Si `compliance_rules` est vide ou absent, retourner `{ "valid": true, "issues": [] }`.
  3. Sinon, appeler `ComplianceRuleEngine.validate(compliance_rules, form_data)`.
  4. Retourner la liste des problèmes et `valid: false` s’il existe au moins une issue de sévérité `error`.

- **Sécurité :** même contrôle d’accès que pour la lecture du formulaire (utilisateur authentifié, accès au form).

---

## 5. Interface Frontend (React/Next.js)

### 5.1 Intégration dans le formulaire (page fill)

- **Debounce :** à chaque modification de `formData`, lancer un timer de 500 ms après lequel on envoie `formData` à `POST .../validate`.
- **État :** stocker les résultats dans un state (ex. `validationIssues: ComplianceIssue[]`).
- **Annulation :** annuler la requête précédente si une nouvelle modification intervient avant la fin du debounce.

### 5.2 Composant ComplianceSidebar

- **Emplacement :** à côté du formulaire (layout deux colonnes ou drawer).
- **Contenu :**
  - Liste des problèmes groupés par sévérité (Erreurs, Avertissements, Suggestions).
  - Chaque élément : message + champ concerné, cliquable.
  - Au clic : `scrollIntoView` ou focus sur le champ correspondant (id ou name).
- **Visibilité :** afficher le panneau seulement s’il y a au moins une issue, ou toujours avec un compteur (ex. « 2 erreurs, 1 avertissement »).

### 5.3 Affichage des erreurs inline (FormRenderer)

- **Props :** ajouter `validationErrors?: Record<string, ComplianceIssue[]>` (clé = nom du champ).
- Pour chaque champ :
  - S’il existe des issues pour ce champ, afficher le message sous le champ.
  - Bordure : rouge si au moins une `error`, jaune si seulement `warning`, bleu/gris si `info`.

### 5.4 Bouton de soumission

- Désactiver le bouton « Soumettre » (ou « Finaliser ») tant qu’il existe au moins une issue de sévérité `error`.
- Optionnel : autoriser la soumission avec des `warning` après confirmation (ex. modal « Vous avez des avertissements, confirmer ? »).

### 5.5 UX

- Indicateur de chargement pendant l’appel à `/validate` (ex. spinner discret ou skeleton).
- Animations légères (ex. apparition des messages, scroll) pour une expérience fluide.

---

## 6. Exemples de règles à implémenter

| Type | Exemple |
|------|--------|
| **Champs obligatoires** | Le nom de l'acheteur ne peut pas être vide. (`required`, `field: buyer_name`) |
| **Format** | Le numéro de téléphone doit correspondre au format nord-américain. (`regex`) |
| **Logique de date** | La date de signature doit être antérieure à la date d'entrée en vigueur. (`date_comparison`) |
| **Dépendances conditionnelles** | Si « Vente sans garantie légale » est coché, la clause 10.5 doit être remplie. (`conditional_required`) |
| **Calculs** | Le total des ajustements ne peut pas dépasser 5 % du prix d'achat. (`comparison` ou règle dédiée) |
| **Avertissements** | « Attention, la date de prise de possession est un jour férié. » (`info`, règle custom ou date_comparison + calendrier) |

---

## 7. Plan d'implémentation en 4 phases

### Phase 1 : Backend – Infrastructure

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 1.1 | Ajouter la colonne `compliance_rules` au modèle `Form` | `backend/app/models/form.py` |
| 1.2 | Créer et appliquer la migration Alembic | `backend/alembic/versions/xxx_add_compliance_rules_to_forms.py` |
| 1.3 | Créer le squelette du service `ComplianceRuleEngine` | `backend/app/services/compliance_service.py` (signature `validate`, retour liste vide ou 1–2 règles en dur pour test) |
| 1.4 | Créer l'endpoint `POST /forms/{form_id}/submissions/validate` | `backend/app/api/v1/endpoints/forms.py` (récupération du form, appel au moteur, retour JSON) |
| 1.5 | Exposer la route dans le routeur API | Vérifier que le router forms est bien monté sous `/api/v1` |

**Livrable :** API de validation appelable, réponse cohérente même sans règles.

---

### Phase 2 : Backend – Contenu des règles

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 2.1 | Implémenter les types de règles : `required`, `comparison`, `regex` | `backend/app/services/compliance_service.py` |
| 2.2 | Implémenter `conditional_required` et `date_comparison` | Même fichier |
| 2.3 | Analyser les formulaires OACIQ cibles (ex. Promesse d'achat) et rédiger les règles au format JSON | Documentation ou fichier de référence |
| 2.4 | Créer un script de peuplement `compliance_rules` | `backend/scripts/seed_compliance_rules.py` (ou commande management) |
| 2.5 | Tester la validation avec des données réelles ou de test | Tests unitaires du service + tests d’intégration de l’endpoint |

**Livrable :** Moteur complet et formulaires OACIQ principaux dotés de règles.

---

### Phase 3 : Frontend – Intégration et affichage

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 3.1 | Ajouter la méthode `validateSubmission(formId, formData)` dans l’API client | `apps/web/src/lib/api/oaciq-forms.ts` ou `forms.ts` |
| 3.2 | Dans la page fill, appeler l’API validate avec debounce 500 ms à chaque changement de `formData` | `apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill/page.tsx` |
| 3.3 | Stocker les résultats dans un state (ex. `validationIssues`) | Même page |
| 3.4 | Étendre `FormRenderer` : prop `validationErrors` (par champ), affichage des messages sous les champs, bordures rouge/jaune | `apps/web/src/components/forms/FormRenderer.tsx` |

**Livrable :** Validation en temps réel et erreurs affichées inline.

---

### Phase 4 : Frontend – Finalisation UX

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 4.1 | Créer le composant `ComplianceSidebar` | `apps/web/src/components/forms/ComplianceSidebar.tsx` |
| 4.2 | Intégrer le sidebar dans la page fill (layout deux colonnes ou drawer) | Page fill |
| 4.3 | Implémenter le scroll (ou focus) vers le champ au clic sur une issue du sidebar | ComplianceSidebar + id/name des champs |
| 4.4 | Désactiver le bouton de soumission s’il existe au moins une issue de sévérité `error` | Page fill |
| 4.5 | Ajouter indicateur de chargement pendant la validation et petites animations | Page fill + ComplianceSidebar |

**Livrable :** Expérience complète : sidebar, soumission conditionnelle, feedback visuel.

---

## 8. Checklist des fichiers

### Backend

- [ ] `backend/app/models/form.py` – ajout de `compliance_rules`
- [ ] `backend/alembic/versions/xxx_add_compliance_rules_to_forms.py` – migration
- [ ] `backend/app/services/compliance_service.py` – moteur de règles
- [ ] `backend/app/api/v1/endpoints/forms.py` – endpoint `POST .../validate`
- [ ] `backend/app/schemas/compliance.py` – (optionnel) schémas requête/réponse
- [ ] `backend/scripts/seed_compliance_rules.py` – (Phase 2) seed des règles

### Frontend

- [ ] `apps/web/src/components/forms/FormRenderer.tsx` – validationErrors + affichage inline
- [ ] `apps/web/src/components/forms/ComplianceSidebar.tsx` – panneau latéral
- [ ] `apps/web/src/app/[locale]/dashboard/modules/formulaire/oaciq/[code]/fill/page.tsx` – debounce, état, sidebar, bouton
- [ ] `apps/web/src/hooks/useComplianceValidation.ts` – (optionnel) hook debounce + API
- [ ] `apps/web/src/lib/api/oaciq-forms.ts` (ou équivalent) – méthode `validateSubmission`

### Types / schémas

- [ ] Définir un type TypeScript pour une issue de conformité (code, field, severity, message).
- [ ] Définir le type pour la réponse API (valid, issues[]).

---

## 9. Résumé

Ce plan permet de construire un **assistant de conformité OACIQ en temps réel** :

1. **Backend :** modèle `Form` étendu, moteur de règles interprétant un JSON, endpoint de validation.
2. **Frontend :** appel debounced à l’API, affichage inline des erreurs, sidebar récapitulative, soumission bloquée en cas d’erreurs.
3. **Évolutivité :** ajout de nouvelles règles = ajout d’objets dans `compliance_rules` et, si besoin, de nouveaux types de règles dans le moteur.

Les quatre phases (infrastructure backend → règles et données → intégration frontend → UX) permettent une livraison incrémentale et testable à chaque étape.
