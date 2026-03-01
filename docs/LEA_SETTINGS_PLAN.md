# Plan : Page Paramètres Léa (super admin)

## Objectif

Une page **Paramètres Léa** accessible aux **super admins** dans le menu **Admin**, permettant de modifier les paramètres et instructions de l’assistante Léa (prompt système, max tokens, voix TTS, etc.).

---

## 1. Accès et emplacement

- **Menu** : Dashboard → **Admin** → **Paramètres Léa**
- **URL** : `/dashboard/modules/admin/parametres-lea` (ou `/admin/parametres-lea` selon convention)
- **Droits** : réservé aux **super admins** (ou aux utilisateurs avec `is_admin` selon le choix produit)

---

## 2. Contenu de la page (paramètres modifiables)

### 2.1 Instructions / Prompt système

- **Champ** : zone de texte (textarea) pour le **prompt système** de Léa.
- **Rôle** : définit le rôle, le ton et les consignes de l’assistante (ex. « Tu es Léa, assistante immobilière au Québec… »).
- **Comportement** : valeur par défaut = prompt actuel codé en dur dans le backend (`LEA_SYSTEM_PROMPT`). Si une valeur est enregistrée en base, elle remplace ce défaut.

### 2.2 Paramètres de réponses

- **Max tokens** : nombre max de tokens pour une réponse (ex. 64–1024). Valeur par défaut = `LEA_MAX_TOKENS` (ex. 256).
- **Rôle** : contrôle la longueur des réponses (réponses courtes vs plus détaillées).

### 2.3 Synthèse vocale (TTS)

- **Modèle TTS** : choix entre `tts-1` (rapide) et `tts-1-hd` (meilleure qualité). Défaut = `LEA_TTS_MODEL`.
- **Voix TTS** : choix parmi les voix OpenAI (alloy, echo, fable, onyx, nova, shimmer). Défaut = `LEA_TTS_VOICE` (ex. nova pour une voix féminine).

### 2.4 (Optionnel) Autres paramètres

- **Provider** : openai / anthropic / auto (si exposé côté config).
- **Agent externe** : indication en lecture seule (AGENT_API_URL configuré ou non).

---

## 3. Backend

### 3.1 Stockage

- **Option A (recommandée)** : table dédiée **global_settings**  
  - Colonnes : `key` (texte, unique), `value` (JSONB), `updated_at`.  
  - Une entrée `key = 'lea_config'` avec `value = { system_prompt, max_tokens, tts_model, tts_voice }`.
- **Option B** : réutilisation d’une table type « préférences » globale (si elle existe) avec une clé du type `lea_settings`.

### 3.2 Endpoints API

- **GET `/api/v1/lea/settings`**  
  - Protégé : super admin (ou admin).  
  - Réponse : `{ system_prompt, max_tokens, tts_model, tts_voice }`.  
  - Logique : lire la config depuis `global_settings` (ou équivalent) ; si absente, renvoyer les valeurs par défaut (config env + `LEA_SYSTEM_PROMPT` actuel).

- **PUT `/api/v1/lea/settings`**  
  - Protégé : super admin (ou admin).  
  - Body : `{ system_prompt?, max_tokens?, tts_model?, tts_voice? }`.  
  - Logique : enregistrer en base (écraser ou fusionner la clé `lea_config`).

### 3.3 Utilisation dans le code Léa

- Dans `lea.py` (ou service appelé) : avant chaque appel au LLM / TTS, récupérer la config depuis la base (avec cache court si besoin).  
- Si une valeur est présente en base, l’utiliser ; sinon garder le comportement actuel (constante `LEA_SYSTEM_PROMPT` + variables d’environnement).

---

## 4. Frontend

### 4.1 Page Paramètres Léa

- **Route** : `apps/web/src/app/[locale]/dashboard/modules/admin/parametres-lea/page.tsx` (aligné avec les autres pages admin sous `modules/admin`).
- **Contenu** :
  - Titre : « Paramètres Léa »
  - Formulaire :
    - Instructions / prompt système (textarea)
    - Max tokens (number input)
    - Modèle TTS (select)
    - Voix TTS (select)
  - Boutons : **Enregistrer** (soumet le formulaire vers PUT), **Réinitialiser** (optionnel, remet les valeurs par défaut ou dernière sauvegarde).
- **Protection** : même pattern que les autres pages admin (ex. `ProtectedRoute` + vérification `is_admin` ou `ProtectedSuperAdminRoute` pour super admin uniquement).
- **Chargement** : au montage, appel GET `/api/v1/lea/settings` pour préremplir le formulaire.

### 4.2 Menu

- Dans la config de navigation (ex. `getNavigationConfig`), sous le bloc **Admin**, ajouter un item :
  - **Label** : « Paramètres Léa »
  - **Lien** : `/dashboard/modules/admin/parametres-lea`
  - **Icône** : ex. Settings ou Bot/MessageSquare.

---

## 5. Ordre de mise en œuvre suggéré

1. **Backend**  
   - Créer la table `global_settings` (migration) si Option A.  
   - Implémenter GET et PUT `/api/v1/lea/settings` (protégés super admin).  
   - Adapter `lea.py` (et TTS) pour lire la config depuis la base avec repli sur les valeurs par défaut.

2. **Frontend**  
   - Créer la page Paramètres Léa (formulaire + appels GET/PUT).  
   - Ajouter l’entrée « Paramètres Léa » dans le menu Admin.

3. **Tests**  
   - Vérifier que seuls les super admins peuvent accéder à la page et aux endpoints.  
   - Vérifier l’enregistrement et la prise en compte des paramètres (prompt, max_tokens, TTS) dans les réponses Léa et la synthèse vocale.

---

## 6. Fichiers principaux concernés

| Zone        | Fichier(s) |
|------------|------------|
| Backend    | `backend/app/api/v1/endpoints/lea.py`, `backend/app/core/config.py`, nouvelle migration + éventuel modèle `GlobalSetting` |
| Frontend   | `apps/web/src/app/[locale]/dashboard/modules/admin/parametres-lea/page.tsx`, `apps/web/src/lib/navigation/index.tsx` |
| Protection | `apps/web/src/components/auth/ProtectedRoute.tsx` ou `ProtectedSuperAdminRoute.tsx` |
