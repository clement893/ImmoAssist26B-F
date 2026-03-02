# Plan : Léa connectée aux formulaires et guide documents

**Objectif :** Que l’IA (Léa) guide l’utilisateur avec les **documents et formulaires** de la plateforme : savoir quels formulaires existent, lesquels sont requis ou recommandés pour une transaction, leur état (brouillon / complété / signé), et proposer la prochaine étape (ouvrir un formulaire, le compléter, ou en créer un nouveau).

**Contexte conversation exportée :** L’utilisateur demande à « développer une promesse d’achat », « ouvrir un projet OACIQ avec un formulaire » et « créer le formulaire avec les informations de base ». Léa doit pouvoir créer le bon formulaire sur la **bonne transaction** (ex. Bordeaux) et guider vers l’onglet Formulaires avec des instructions claires.

### Implémentation (mars 2026) – Création formulaires OACIQ par Léa

- **Détection d’intention élargie** : `_wants_to_create_oaciq_form_for_transaction` reconnaît désormais « formulaire de province d’achats oacq » (typo pour promesse d’achat) et « province » + « achat » + « oacq/oaciq ».
- **Confirmation dédiée** : lorsque le backend crée une soumission OACIQ (PA, etc.), Léa renvoie systématiquement une confirmation claire au lieu de laisser le LLM répondre « je ne peux pas » :
  - **Streaming** (`/chat/stream`) : retour anticipé avec le message de confirmation (comme pour la création de transaction).
  - **Non-stream intégré** (`/chat`) : retour direct avec le message de confirmation, sans appeler le LLM.
  - **Agent externe** : si les actions plateforme ont créé un formulaire OACIQ, le backend renvoie le message de confirmation dédié au lieu du générique « Les informations ont été mises à jour ».
- **Message utilisateur** : nom du formulaire, transaction concernée et prochaine étape (Transactions → ouvrir cette transaction → onglet Formulaires OACIQ).

---

## 1. État actuel

### 1.1 Ce qui existe déjà

| Élément | Détail |
|--------|--------|
| **Formulaires OACIQ** | Modèle `Form` (code PA, ROI, CQ, etc.), `FormSubmission` (lien `transaction_id`, statut draft/completed/signed). |
| **API formulaires** | `GET/POST /transactions/{id}/forms`, `GET /oaciq/forms`, soumissions par transaction. |
| **Léa → formulaire** | `maybe_create_oaciq_form_submission_from_lea` : détecte « promesse d’achat » / « formulaire PA », crée une soumission PA sur une transaction (dernière ou par ref). |
| **Contexte Léa** | `get_lea_user_context` injecte pour la **dernière** transaction : « X formulaire(s) OACIQ (dont Y en brouillon). Codes : PA, … ». |
| **Front** | `TransactionFormsTab` : liste des formulaires OACIQ, soumissions par transaction, création de soumission, statuts (Brouillon / Complété / Signé). |
| **Capacités** | `modify_oaciq_forms` = « Léa peut créer ou modifier des soumissions » ; `access_oaciq_forms` = « À venir ». |

### 1.2 Limites actuelles

- Léa ne connaît pas la **liste des formulaires OACIQ disponibles** (noms, codes, catégories obligatoire/recommandé) pour les citer ou recommander.
- Le **guidage par type de transaction** (achat vs vente) n’existe pas : quels formulaires sont typiquement requis (ex. PA pour achat, DIA, etc.).
- Pas de **lien direct** (deep link) depuis la conversation vers une transaction ou un formulaire donné.
- La **transaction cible** peut être mauvaise : « transaction sur Bordeaux » vs « dernière transaction » (#36) → il faut cibler la transaction par adresse ou ref.
- Léa ne dit pas explicitement **quelle est la prochaine étape document** (ex. « Complétez le formulaire PA en brouillon » ou « Passez à la déclaration d’intention d’achat »).

---

## 2. Expérience cible (Léa guide documents)

- L’utilisateur dit : *« Je veux faire la promesse d’achat sur la transaction de Bordeaux »*  
  → Léa : identifie la transaction (Bordeaux), crée la soumission PA si besoin, et répond : *« J’ai créé le formulaire Promesse d’achat (PA) pour la transaction 2646 rue de Bordeaux. Vous pouvez le compléter ici : [lien ou instruction] Transactions → [transaction] → onglet Formulaires OACIQ → PA. »*

- L’utilisateur : *« Quels documents me manquent pour cette transaction ? »*  
  → Léa : s’appuie sur le contexte (formulaires existants + statuts) et sur une règle métier (ex. achat → PA recommandé, vente → DIA, etc.) et répond : *« Pour cette transaction d’achat vous avez déjà un PA en brouillon. Il reste à le compléter et à le faire signer. Les autres formulaires recommandés sont : … »*

- L’utilisateur : *« Ouvre le formulaire PA »*  
  → Léa : même transaction cible, création ou réutilisation du PA, et réponse avec **lien direct** vers la fiche formulaire (si l’app expose une URL du type `/transactions/{id}/forms/{submission_id}` ou `/formulaires-oaciq/PA/fill?transaction=…`).

- **Préremplissage (optionnel, phase ultérieure)** : quand Léa crée un PA, préremplir les champs connus (adresse, vendeurs, acheteurs, prix) depuis la transaction.

---

## 3. Architecture proposée

### 3.1 Contexte injecté à Léa (Données plateforme)

- **Déjà fait :** Pour la dernière transaction : liste des formulaires OACIQ liés (codes + statuts : brouillon / complété / signé).
- **À ajouter :**
  - **Référentiel formulaires OACIQ** (une fois par contexte ou mis en cache) : liste des codes disponibles avec libellé et catégorie (obligatoire / recommandé), ex. `PA - Promesse d’achat (recommandé)`, `DIA - Déclaration d’intention (obligatoire pour …)`.
  - Pour **chaque** transaction listée (ou au moins la dernière + celle « de Bordeaux » si identifiée) : résumé des formulaires (codes + statuts), ex. `PA : brouillon, DIA : absent`.
  - **Transaction « cible »** : si l’utilisateur a parlé d’une transaction (Bordeaux, #35, etc.), indiquer clairement dans le contexte : « Transaction sur laquelle l’utilisateur travaille : 2646 rue de Bordeaux (#35). »

### 3.2 Actions backend (run_lea_actions)

- **Déjà fait :** Création d’une soumission OACIQ (PA par défaut) sur une transaction (ref ou dernière).
- **À renforcer :**
  - **Ciblage de la transaction** : quand le message ou le dernier message fait référence à une adresse (Bordeaux, Sherbrooke) ou un numéro de dossier, utiliser `get_user_transaction_by_ref` / `get_user_transaction_by_address_hint` pour la création de formulaire et pour tout guidage.
  - **Création de formulaire** : toujours utiliser cette transaction cible (pas la « dernière » si le contexte indique une autre).
  - **Message d’action** : inclure le libellé du formulaire, la transaction cible (adresse ou #), et la **prochaine étape** : « Ouvrez la transaction X → onglet Formulaires OACIQ → formulaire PA pour compléter les champs. »

### 3.3 Prompt système et capacités

- **Prompt :**
  - Règles pour le **guidage documents** : « Tu peux indiquer quels formulaires OACIQ sont en brouillon, complétés ou signés pour la transaction. Tu peux proposer la prochaine étape : compléter le formulaire X, en créer un nouveau (PA, DIA, etc.), ou aller dans Transactions → [transaction] → Formulaires OACIQ. »
  - Quand une action a créé un formulaire : « Indique clairement le nom du formulaire, la transaction concernée et où aller (Transactions → [transaction] → onglet Formulaires OACIQ). »
- **Capacités :**
  - `access_oaciq_forms` : passer de « À venir » à « Léa peut lister les formulaires OACIQ disponibles et l’état des formulaires (brouillon/complété/signé) pour vos transactions. »
  - Garder `modify_oaciq_forms` avec précision : création de soumissions (PA, etc.) et guidage vers la plateforme pour compléter.

### 3.4 Front-end (optionnel mais utile)

- **Deep link** : URL stable pour « ouvrir la transaction X, onglet Formulaires, formulaire Y » (ex. `/dashboard/transactions/35?tab=forms` ou `/dashboard/transactions/35/forms/PA`). Léa pourra les citer dans sa réponse si on les expose (phase 2).
- **Pas de changement obligatoire** pour la phase 1 : Léa peut guider en texte (« Allez dans Transactions → [nom/adresse] → onglet Formulaires OACIQ »).

---

## 4. Phases d’implémentation

### Phase 1 – Contexte et ciblage (prioritaire)

**But :** Que Léa sache quels formulaires existent par transaction, quelle transaction est concernée (Bordeaux, etc.), et réponde sans créer de nouvelle transaction à côté.

| # | Tâche | Détail |
|---|--------|--------|
| 1.1 | Ciblage transaction par adresse/ref | Dans `maybe_create_oaciq_form_submission_from_lea` et `run_lea_actions`, utiliser systématiquement `_extract_address_hint_from_message` + `get_user_transaction_by_address_hint` (et ref) pour choisir la transaction avant de créer un formulaire. Si l’utilisateur dit « sur la transaction de Bordeaux » ou « sur celle de Bordeaux », ne pas utiliser uniquement la dernière transaction. **À faire :** étendre `_extract_address_hint_from_message` pour reconnaître « pour la transaction de X », « sur la transaction de X », et (optionnel) utiliser le dernier message assistant quand il vient de nommer une transaction (ex. « La transaction sur la rue de Bordeaux est … ») pour en déduire la transaction cible. |
| 1.2 | Contexte : formulaires par transaction | Dans `get_lea_user_context`, pour la (ou les) transaction(s) listée(s), garder et enrichir le bloc OACIQ : codes + statuts (brouillon/complété/signé) par formulaire. Option : pour la transaction « la plus récente » + celle identifiée par adresse si différente, afficher les deux. |
| 1.3 | Référentiel formulaires OACIQ (léger) | Exposer à Léa une liste courte des formulaires disponibles : requête `select(Form.code, Form.name, Form.category).where(Form.code.isnot(None))` (ou cache). L’injecter une fois dans le contexte (ex. « Formulaires OACIQ disponibles : PA – Promesse d’achat, DIA – …, catégorie obligatoire/recommandé »). |
| 1.4 | Instructions dans l’action « formulaire créé » | Après création d’une soumission PA (ou autre), renvoyer une ligne d’action du type : « Indique à l’utilisateur : formulaire [nom] créé pour la transaction [ref/adresse]. Prochaine étape : aller dans Transactions → ouvrir cette transaction → onglet Formulaires OACIQ → compléter le formulaire [code]. » |

**Livrable :** Léa crée le formulaire sur la **bonne** transaction (Bordeaux) et guide en clair vers l’onglet Formulaires.

### Phase 2 – Guidage explicite (documents / prochaine étape)

**But :** Répondre à « quels documents me manquent ? » et « quelle est la prochaine étape ? ».

| # | Tâche | Détail |
|---|--------|--------|
| 2.1 | Règles métier (simplifiées) | Définir une table ou constante : par type de transaction (achat / vente), quels codes sont « typiquement recommandés » (ex. achat → PA, vente → DIA). Pas besoin de règles complexes au début. |
| 2.2 | Contexte « prochaine étape document » | À partir des soumissions de la transaction cible + règles, calculer une phrase du type : « Formulaires : PA en brouillon (à compléter), DIA non créé (recommandé pour vente). » L’injecter dans le bloc Données plateforme ou dans une ligne dédiée. |
| 2.3 | Prompt | Ajouter au prompt : « Si l’utilisateur demande quels documents ou formulaires sont à faire, base-toi sur le bloc Données plateforme (formulaires OACIQ par transaction) et indique ce qui est en brouillon, complété, signé, et ce qu’il reste à faire ou à créer. » |

**Livrable :** Léa peut dire quels formulaires sont en brouillon/complétés et proposer la prochaine étape (compléter X, créer Y).

### Phase 3 – Liens et UX

**But :** Réduire la friction (copier-coller, navigation manuelle).

| # | Tâche | Détail |
|---|--------|--------|
| 3.1 | URLs stables | S’assurer que le front expose des URLs claires pour transaction + onglet Formulaires (ex. `/dashboard/transactions/[id]?tab=forms` ou `.../forms`). Documenter ces URLs dans le backend ou dans une config. |
| 3.2 | Citer le lien dans la réponse | Si une action a créé un formulaire, inclure dans le texte d’action le lien (ou le chemin) explicite vers cette transaction + onglet formulaires. Option : endpoint backend qui retourne l’URL du formulaire pour une transaction + code (pour affichage dans l’UI Léa). |
| 3.3 | (Optionnel) Bouton « Ouvrir le formulaire » | Dans l’UI de la conversation Léa, si la dernière action est « formulaire PA créé pour transaction #35 », afficher un bouton « Ouvrir le formulaire » qui mène à l’URL ci-dessus. |

**Livrable :** L’utilisateur peut cliquer pour aller directement au formulaire.

### Phase 4 – Préremplissage (optionnel)

**But :** Formulaire créé par Léa déjà rempli avec les infos de la transaction.

| # | Tâche | Détail |
|---|--------|--------|
| 4.1 | Schéma de préremplissage | Par code (PA, etc.), définir le mapping champs formulaire ↔ champs transaction (adresse, vendeurs, acheteurs, prix, date de promesse, etc.). |
| 4.2 | Préremplir à la création | Lors de `maybe_create_oaciq_form_submission_from_lea`, après création de la `FormSubmission`, construire un `data` initial à partir de la transaction et du mapping, puis mettre à jour la soumission (et une version si besoin). |
| 4.3 | Cohérence | S’assurer que le formulaire prérempli reste éditable et que les validations OACIQ (compliance_rules) restent appliquées à l’enregistrement. |

**Livrable :** Nouveau PA créé par Léa avec adresse, parties et prix déjà renseignés.

---

## 5. Synthèse des fichiers à toucher

| Phase | Fichiers / zones |
|-------|-------------------|
| 1 | `backend/app/api/v1/endpoints/lea.py` : `get_lea_user_context` (référentiel + formulaires par tx), `maybe_create_oaciq_form_submission_from_lea` (ciblage tx par adresse/ref), texte d’action « formulaire créé ». |
| 2 | `lea.py` : règles métier (constantes ou mini-service), contexte « prochaine étape », prompt système. |
| 3 | `lea.py` : génération ou retour d’URL dans l’action ; front : `LeaConversationView` ou composant de message (bouton lien). Routes transaction/forms déjà existantes. |
| 4 | `lea.py` : préremplissage dans création soumission ; schéma PA (ou service dédié). |

---

## 6. Ordre recommandé

1. **Phase 1** (ciblage transaction + contexte formulaires + message d’action clair) pour corriger le cas « promesse d’achat sur Bordeaux » et éviter la création sur la mauvaise transaction.
2. **Phase 2** (guidage documents / prochaine étape) pour répondre à « quels documents me manquent » et « quelle est la prochaine étape ».
3. **Phase 3** (liens) pour améliorer l’UX.
4. **Phase 4** (préremplissage) si la valeur métier le justifie.

---

## 7. Critères de succès

- L’utilisateur dit « je veux faire la promesse d’achat sur la transaction de Bordeaux » → Léa crée le PA sur **cette** transaction (pas #36 par défaut) et indique où aller (Transactions → Bordeaux → Formulaires OACIQ → PA).
- L’utilisateur demande « quels documents me manquent pour cette transaction ? » → Léa répond en s’appuyant sur les formulaires existants (brouillon/complété/signé) et sur les formulaires recommandés.
- Les réponses de Léa mentionnent explicitement **formulaire** + **transaction** + **prochaine étape** (compléter, signer, ou créer un autre formulaire).

Ce document sert de **plan de référence** pour l’implémentation ; chaque phase peut être détaillée en tâches techniques (branches, PR) au moment du développement.
