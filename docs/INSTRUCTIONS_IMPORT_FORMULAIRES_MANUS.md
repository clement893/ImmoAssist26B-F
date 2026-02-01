# Instructions pour l'Agent AI Manus - Importation des Formulaires OACIQ

## 📋 Vue d'ensemble

Cette tâche consiste à importer les 49 formulaires OACIQ depuis la base de données Railway vers la base de données locale du projet ImmoAssist.

## 🎯 Objectif

Importer tous les formulaires OACIQ existants dans Railway vers la base de données locale, en préservant toutes les données (code, nom, catégorie, PDF URL, champs extraits, etc.).

## 📝 Étapes à suivre

### 1. Préparation de l'environnement

```bash
# Se placer dans le dossier backend
cd backend

# Vérifier que les variables d'environnement sont configurées
# DATABASE_URL doit pointer vers votre base locale
# RAILWAY_DB_URL doit pointer vers Railway (ou utiliser la valeur par défaut dans le script)
```

### 2. Vérification des connexions

Avant de lancer l'importation, vérifiez que :

- ✅ La base de données locale est accessible
- ✅ La connexion à Railway est possible (credentials dans le script ou via variable d'environnement)
- ✅ Les tables `forms` existent dans les deux bases

### 3. Exécution du script d'importation

```bash
# Option 1 : Exécution directe avec Python
python scripts/import_oaciq_forms_from_railway.py

# Option 2 : Avec les variables d'environnement personnalisées
RAILWAY_DB_URL="postgresql://user:pass@host:port/db" \
DATABASE_URL="postgresql+asyncpg://user:pass@localhost/dbname" \
python scripts/import_oaciq_forms_from_railway.py
```

### 4. Vérification des résultats

Le script affichera :
- ✅ Le nombre de formulaires trouvés dans Railway
- ✅ Le nombre de formulaires importés (nouveaux)
- ✅ Le nombre de formulaires mis à jour (existants)
- ✅ Le nombre de formulaires ignorés (erreurs)
- ⚠️ Les erreurs rencontrées (si applicable)

### 5. Vérification dans la base de données

Après l'importation, vérifiez que les formulaires sont bien présents :

```sql
-- Compter le nombre de formulaires OACIQ
SELECT COUNT(*) FROM forms WHERE code IS NOT NULL;

-- Voir les formulaires par catégorie
SELECT category, COUNT(*) 
FROM forms 
WHERE code IS NOT NULL 
GROUP BY category;

-- Voir quelques exemples
SELECT code, name, category 
FROM forms 
WHERE code IS NOT NULL 
ORDER BY code 
LIMIT 10;
```

## 🔧 Configuration

### Variables d'environnement

Le script utilise ces variables (avec valeurs par défaut) :

- `RAILWAY_DB_URL` : URL de connexion à Railway PostgreSQL
  - Par défaut : `postgresql://postgres:knOTGbtTMRlrFNqFvmAIsNszFYfwHfyq@gondola.proxy.rlwy.net:57882/railway`
  
- `DATABASE_URL` : URL de connexion à la base locale
  - Format attendu : `postgresql+asyncpg://user:password@host:port/dbname`

### Structure attendue dans Railway

Le script s'attend à trouver dans Railway une table `forms` avec ces colonnes :
- `id` (INTEGER)
- `code` (VARCHAR) - Code du formulaire (ex: "PA", "CCVE")
- `name` (TEXT) - Nom complet du formulaire
- `category` (VARCHAR) - Catégorie ("obligatoire", "recommandé", "curateur_public")
- `pdf_url` (TEXT) - URL du PDF officiel
- `fields` (JSONB) - Structure des champs extraits
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 📊 Résultat attendu

Après l'exécution réussie, vous devriez avoir :

- ✅ **49 formulaires** importés dans la base locale
- ✅ Tous les codes uniques préservés
- ✅ Les catégories correctement assignées
- ✅ Les URLs PDF préservées
- ✅ Les champs extraits (si disponibles) préservés

## ⚠️ Gestion des erreurs

### Erreurs courantes

1. **Erreur de connexion à Railway**
   ```
   Solution : Vérifier les credentials Railway dans RAILWAY_DB_URL
   ```

2. **Erreur de connexion à la base locale**
   ```
   Solution : Vérifier DATABASE_URL et que la base existe
   ```

3. **Table forms n'existe pas**
   ```
   Solution : Exécuter les migrations Alembic (alembic upgrade head)
   ```

4. **Violation de contrainte unique (code)**
   ```
   Solution : Le script gère automatiquement en mettant à jour les existants
   ```

## 🔄 Réexécution

Le script est **idempotent** : vous pouvez le réexécuter plusieurs fois sans problème.
- Les formulaires existants seront mis à jour
- Les nouveaux seront ajoutés
- Les doublons sont évités grâce à la contrainte unique sur `code`

## 📝 Notes importantes

1. **Sauvegarde** : Faites une sauvegarde de votre base locale avant l'importation si vous avez des données importantes.

2. **Performance** : L'importation de 49 formulaires devrait prendre moins d'une minute.

3. **Logs** : Tous les logs sont affichés dans la console avec des emojis pour faciliter le suivi.

4. **Rollback** : En cas d'erreur, le script fait un rollback de la transaction en cours, mais les formulaires déjà importés restent dans la base.

## ✅ Checklist de validation

Après l'importation, vérifiez :

- [ ] Le nombre total de formulaires correspond (49)
- [ ] Les catégories sont correctes (28 obligatoires, 15 recommandés, 6 curateur public)
- [ ] Les codes sont uniques et corrects
- [ ] Les URLs PDF sont préservées
- [ ] Les champs extraits (si présents) sont préservés
- [ ] Aucune erreur dans les logs

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs détaillés dans la console
2. Vérifiez la connexion aux bases de données
3. Vérifiez que les migrations sont à jour
4. Consultez la section "Gestion des erreurs" ci-dessus

---

**Date de création** : 2026-01-31  
**Dernière mise à jour** : 2026-01-31  
**Version du script** : 1.0.0
