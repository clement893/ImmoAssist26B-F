# Instructions pour Cursor : Importation des formulaires OACIQ

## Objectif

Créer et exécuter un script Python pour importer 62 formulaires OACIQ dans la base de données via le modèle SQLAlchemy existant.

## Contexte

- **Fichier de données** : `/home/ubuntu/oaciq_api_import_payload.json` (62 formulaires formatés)
- **Modèle existant** : `backend/app/models/form.py` - classe `Form`
- **Base de données** : PostgreSQL (connexion via DATABASE_URL dans les variables d'environnement)

## Modèle Form existant

Le modèle `Form` dans `backend/app/models/form.py` contient les champs suivants pour les formulaires OACIQ :

```python
class Form(Base):
    __tablename__ = "forms"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    fields = Column(JSON, nullable=False)  # Form field configurations
    
    # OACIQ-specific fields
    code = Column(String(20), unique=True, nullable=True, index=True)
    category = Column(String(50), nullable=True, index=True)
    pdf_url = Column(Text, nullable=True)
    
    # Ownership
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    transaction_id = Column(Integer, ForeignKey("real_estate_transactions.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

## Format des données source

Le fichier `/home/ubuntu/oaciq_api_import_payload.json` contient :

```json
{
  "overwrite_existing": true,
  "forms": [
    {
      "code": "PA",
      "name": "Promesse d'achat – Immeuble résidentiel",
      "name_en": "Promise to Purchase – Residential Immovable",
      "name_fr": "Promesse d'achat – Immeuble résidentiel",
      "category": "obligatoire",
      "pdf_url": "https://www.oaciq.com/...",
      "web_url": "https://www.oaciq.com/fr/...",
      "objective": "Document utilisé pour formaliser l'intention d'achat..."
    }
    // ... 61 autres formulaires
  ]
}
```

## Tâche à accomplir

### 1. Créer le script d'importation

**Emplacement** : `backend/scripts/import_oaciq_forms.py`

**Fonctionnalités requises** :

1. **Lire le fichier JSON** : `/home/ubuntu/oaciq_api_import_payload.json`

2. **Se connecter à la base de données** :
   - Utiliser `DATABASE_URL` des variables d'environnement
   - Utiliser SQLAlchemy async (comme dans le reste du projet)
   - Importer les modèles depuis `backend/app/models/form.py`

3. **Pour chaque formulaire** :
   - Vérifier si un formulaire avec le même `code` existe déjà
   - Si `overwrite_existing` est `true` et le formulaire existe :
     - Mettre à jour le formulaire existant
   - Si le formulaire n'existe pas :
     - Créer un nouveau formulaire
   
4. **Mapping des champs** :
   - `code` → `Form.code`
   - `name_fr` → `Form.name`
   - `objective` → `Form.description`
   - `category` → `Form.category`
   - `pdf_url` → `Form.pdf_url`
   - `fields` → `Form.fields` (créer un objet JSON vide `{}` par défaut)
   - `user_id` → `None` (formulaires système)
   - `transaction_id` → `None`

5. **Logging et statistiques** :
   - Afficher le nombre de formulaires créés
   - Afficher le nombre de formulaires mis à jour
   - Afficher les erreurs éventuelles
   - Afficher un résumé par catégorie

6. **Gestion des erreurs** :
   - Utiliser des transactions pour garantir l'intégrité
   - Rollback en cas d'erreur
   - Afficher des messages d'erreur clairs

### 2. Structure du script

Le script doit :

1. Être exécutable avec : `python backend/scripts/import_oaciq_forms.py`
2. Utiliser `asyncio` pour la connexion async à la base de données
3. Utiliser le même système de configuration que le reste du backend
4. Afficher une barre de progression ou des logs pour chaque formulaire traité

### 3. Exemple de sortie attendue

```
🚀 Importation des formulaires OACIQ...
📁 Lecture du fichier: /home/ubuntu/oaciq_api_import_payload.json
✅ 62 formulaires chargés

🔄 Traitement des formulaires...
  [1/62] PA - Promesse d'achat – Immeuble résidentiel... ✅ Créé
  [2/62] CCV - Contrat de courtage exclusif – Vente... ✅ Créé
  [3/62] DR - Déboursés et rétribution du courtier... ✅ Créé
  ...
  [62/62] AS - Avis et suivi de réalisation de conditions... ✅ Créé

📊 Résumé:
  - Formulaires créés: 62
  - Formulaires mis à jour: 0
  - Erreurs: 0

📈 Par catégorie:
  - obligatoire: 27
  - recommandé: 29
  - curateur_public: 6

✅ Importation terminée avec succès!
```

### 4. Vérification post-importation

Après l'exécution du script, vérifier que :

1. Les 62 formulaires sont bien dans la table `forms`
2. Les codes sont uniques
3. Les catégories sont correctes
4. Les champs `created_at` et `updated_at` sont remplis

**Requête SQL de vérification** :

```sql
-- Compter les formulaires par catégorie
SELECT category, COUNT(*) as count
FROM forms
WHERE code IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- Vérifier quelques formulaires spécifiques
SELECT code, name, category, pdf_url
FROM forms
WHERE code IN ('PA', 'CCV', 'DR', 'DV')
ORDER BY code;

-- Compter le total
SELECT COUNT(*) as total
FROM forms
WHERE code IS NOT NULL;
```

## Dépendances

Le script doit utiliser les dépendances déjà présentes dans le projet :

- `sqlalchemy` (async)
- `asyncpg` (driver PostgreSQL async)
- `python-dotenv` (pour charger les variables d'environnement)
- Modèles existants dans `backend/app/models/`

## Variables d'environnement

Le script doit lire `DATABASE_URL` depuis :
1. Les variables d'environnement système
2. Ou le fichier `backend/.env` si présent
3. Ou les variables d'environnement Railway si déployé

## Exécution

Une fois le script créé :

```bash
# Se placer dans le dossier backend
cd /home/ubuntu/ImmoAssist26B-F/backend

# Exécuter le script
python scripts/import_oaciq_forms.py
```

## Notes importantes

1. **Ne pas créer de duplicatas** : Utiliser `code` comme clé unique
2. **Respecter le schéma** : Tous les champs doivent correspondre au modèle SQLAlchemy
3. **Transactions** : Utiliser des transactions pour garantir l'intégrité
4. **Logs clairs** : Afficher des messages pour suivre la progression
5. **Gestion d'erreurs** : Capturer et afficher les erreurs de manière claire

## Fichiers à créer/modifier

1. **Créer** : `backend/scripts/import_oaciq_forms.py` (script principal)
2. **Créer** : `backend/scripts/__init__.py` (si n'existe pas)

## Résultat attendu

Après l'exécution du script :

- ✅ 62 formulaires OACIQ importés dans la base de données
- ✅ Tous les champs correctement remplis
- ✅ Codes uniques et indexés
- ✅ Catégories correctes (obligatoire, recommandé, curateur_public)
- ✅ Timestamps créés automatiquement
- ✅ Aucune erreur

## Support

Si des erreurs surviennent :

1. Vérifier que `DATABASE_URL` est correctement configuré
2. Vérifier que la table `forms` existe dans la base de données
3. Vérifier que les migrations sont à jour
4. Consulter les logs pour identifier l'erreur spécifique

---

**Priorité** : Haute
**Complexité** : Moyenne
**Temps estimé** : 15-30 minutes
