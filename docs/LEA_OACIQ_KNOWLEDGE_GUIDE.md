# Guide : Donner une base de connaissance OACIQ à Léa

Ce guide explique comment faire en sorte que **Léa** connaisse les formulaires OACIQ « par cœur » pour accompagner vos utilisateurs (courtiers, particuliers) de façon précise et conforme.

---

## 1. Ce qui a été mis en place

### 1.1 Fichier de connaissance statique

- **Fichier** : `docs/oaciq/LEA_KNOWLEDGE_OACIQ.md`
- **Rôle** : Texte chargé dans le **prompt système** de Léa à chaque conversation (chat et vocal). Léa le reçoit comme une « base de connaissance » sur les formulaires OACIQ.
- **Contenu type** :
  - Rôle de l’OACIQ et catégories (obligatoire, recommandé, curateur public)
  - Pour chaque formulaire important : **code**, **nom**, **quand l’utiliser**, **infos clés**, **conseils**
  - Ordre logique typique (ex. CP → PA → autres)
  - Règles pour Léa (toujours indiquer le code, ne pas inventer de formulaire, etc.)

Vous pouvez **enrichir et maintenir** ce fichier (ajout de formulaires, précisions OACIQ, bonnes pratiques) : tout changement est pris en compte au prochain message envoyé à Léa.

### 1.2 Contexte « Données plateforme » enrichi

- **Où** : `get_lea_user_context()` dans `backend/app/api/v1/endpoints/lea.py`
- **Quoi** : La liste des **formulaires OACIQ disponibles** envoyée à Léa inclut maintenant, pour chaque formulaire :
  - Code, nom, catégorie
  - **Objectif** du formulaire, lorsqu’il est renseigné en base (champ `fields.metadata.objective` ou `description`)

Léa voit donc en temps réel le catalogue de formulaires de votre plateforme et leur objectif, en plus du fichier de connaissance statique.

### 1.3 Injection dans le prompt

- **Où** : Même fichier `lea.py`, dans les flux **stream**, **chat non-stream** et **chat vocal**.
- **Comment** : Avant le bloc « Informations actuelles de l’utilisateur (plateforme) », on ajoute :
  - Un bloc **« Base de connaissance formulaires OACIQ »** contenant le contenu de `docs/oaciq/LEA_KNOWLEDGE_OACIQ.md` (si le fichier existe et n’est pas vide).

Résultat : Léa a toujours accès à cette base OACIQ + les données plateforme (transactions, formulaires disponibles avec objectifs).

---

## 2. Bonnes pratiques pour une base de connaissance de qualité

### 2.1 Tenir à jour `docs/oaciq/LEA_KNOWLEDGE_OACIQ.md`

- **Formulaires principaux** : Pour chaque formulaire important (PA, DIA, CP, CCVE, etc.), garder une section avec :
  - **Quand l’utiliser** (situation type, moment dans la transaction)
  - **Infos clés** (champs importants, acteurs)
  - **Conseils** (pièges à éviter, ordre par rapport aux autres formulaires)
- **Alignement OACIQ** : Vous pouvez vous baser sur les descriptions officielles (site OACIQ, PDF, guides) et les résumer dans ce fichier pour que Léa réponde en cohérence avec la réglementation.
- **Ordre et enchaînement** : Documenter l’ordre logique (ex. contrat de courtage avant promesse d’achat) aide Léa à proposer la « prochaine étape ».

### 2.2 Renseigner les objectifs en base de données

- Lors de l’**import** des formulaires OACIQ (API ou script), renseigner le champ **objectif** (ex. `objective` dans le payload d’import), qui est stocké dans `Form.fields.metadata.objective`.
- Ainsi, même sans tout détailler dans le fichier markdown, Léa reçoit pour chaque formulaire au moins un objectif court dans le bloc « Formulaires OACIQ disponibles ».

### 2.3 Éviter les doublons et contradictions

- Le fichier `LEA_KNOWLEDGE_OACIQ.md` sert pour le **détail** et les **règles** (quand utiliser, conseils).
- La base de données sert pour le **catalogue à jour** (codes, noms, catégories, objectifs).
- Éviter de mettre dans le fichier des listes exhaustives de formulaires qui changent souvent : privilégier la liste issue de la base et réserver le fichier aux explications et bonnes pratiques.

---

## 3. Options avancées (hors scope actuel)

- **RAG (vectorisation)** : Pour de très gros volumes (ex. textes complets de guides OACIQ, nombreux PDF), on pourrait ajouter un moteur RAG (embeddings + base vectorielle) et injecter uniquement les passages pertinents. Pour une soixantaine de formulaires et des descriptions synthétiques, le fichier markdown + contexte DB suffit en général.
- **Outils (tools)** : Léa pourrait avoir un outil du type « rechercher un formulaire OACIQ par code ou par mot-clé » qui interroge la base ; utile si le nombre de formulaires ou de champs devient trop grand pour tout mettre dans le prompt.
- **Paramétrage par tenant** : Si demain chaque organisation a sa propre liste ou ses propres règles OACIQ, on peut prévoir un fichier de connaissance par tenant ou des règles injectées depuis la base.

---

## 4. Résumé

| Élément | Rôle |
|--------|------|
| `docs/oaciq/LEA_KNOWLEDGE_OACIQ.md` | Base de connaissance « par cœur » : quand utiliser chaque formulaire, conseils, ordre logique. À maintenir et enrichir. |
| Contexte « Formulaires OACIQ disponibles » | Catalogue temps réel (code, nom, catégorie, objectif) depuis la base. |
| Prompt système Léa | Contient le fichier OACIQ + le contexte plateforme à chaque message. |

En complétant et mettant à jour `docs/oaciq/LEA_KNOWLEDGE_OACIQ.md` et en renseignant les objectifs des formulaires en base, vous donnez à Léa une base de connaissance OACIQ de qualité pour accompagner vos utilisateurs.
