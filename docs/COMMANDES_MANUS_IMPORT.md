# Commandes pour Agent AI Manus - Importation Formulaires

## 🚀 Commandes à exécuter dans l'ordre

### 1. Navigation vers le dossier backend
```bash
cd backend
```

### 2. Vérification de l'environnement Python
```bash
python --version
```
**Résultat attendu** : Python 3.9 ou supérieur

### 3. Installation des dépendances (si nécessaire)
```bash
pip install sqlalchemy asyncpg psycopg2-binary
```

### 4. Configuration des variables d'environnement
```bash
# Optionnel : Si vous avez besoin de changer l'URL Railway
export RAILWAY_DB_URL="postgresql://user:password@host:port/dbname"

# La DATABASE_URL est déjà configurée dans .env ou settings
```

### 5. Exécution du script d'importation
```bash
python scripts/import_oaciq_forms_from_railway.py
```

### 6. Vérification des résultats
```bash
# Le script affichera automatiquement un résumé
# Vérifiez que vous voyez :
# ✅ 49 formulaires trouvés
# ✅ Importation réussie
```

## 📊 Vérification dans la base de données (optionnel)

Si vous avez accès à la base de données, vous pouvez vérifier :

```sql
-- Compter les formulaires OACIQ
SELECT COUNT(*) FROM forms WHERE code IS NOT NULL;

-- Voir les formulaires par catégorie
SELECT category, COUNT(*) 
FROM forms 
WHERE code IS NOT NULL 
GROUP BY category
ORDER BY category;

-- Lister les 10 premiers formulaires
SELECT code, name, category 
FROM forms 
WHERE code IS NOT NULL 
ORDER BY code 
LIMIT 10;
```

## ✅ Critères de succès

Le script est réussi si :
- ✅ Aucune erreur dans la console
- ✅ Message "✅ Importation terminée" affiché
- ✅ 49 formulaires traités (importés ou mis à jour)
- ✅ Résumé affiché avec les statistiques

## ⚠️ En cas d'erreur

Si une erreur survient :
1. **Erreur de connexion** : Vérifier les credentials Railway
2. **Erreur de table** : Exécuter `alembic upgrade head` pour créer les tables
3. **Erreur de dépendances** : Réinstaller avec `pip install -r requirements.txt`

## 📝 Notes

- Le script est **idempotent** : vous pouvez le réexécuter plusieurs fois
- Les formulaires existants seront **mis à jour**, pas dupliqués
- Les nouveaux formulaires seront **ajoutés**
- Les erreurs sur un formulaire n'empêchent pas l'importation des autres
