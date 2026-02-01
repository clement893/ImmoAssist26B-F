# Prompt pour Agent AI Manus - Importation Formulaires OACIQ

## 🎯 Tâche principale

Importer les 49 formulaires OACIQ depuis la base de données Railway vers la base de données locale du projet ImmoAssist.

## 📋 Instructions détaillées

### Contexte
Le projet ImmoAssist nécessite l'importation de tous les formulaires OACIQ depuis une base Railway existante vers la base locale. Ces formulaires sont essentiels pour le système de gestion des formulaires immobiliers.

### Objectif
1. Se connecter à la base Railway PostgreSQL
2. Récupérer tous les formulaires OACIQ (table `forms` où `code IS NOT NULL`)
3. Les importer dans la base locale en préservant toutes les données
4. Gérer les doublons (mise à jour si existe, insertion si nouveau)

### Fichiers à utiliser
- Script principal : `backend/scripts/import_oaciq_forms_from_railway.py`
- Documentation : `docs/INSTRUCTIONS_IMPORT_FORMULAIRES_MANUS.md`

### Commandes à exécuter

```bash
# 1. Se placer dans le dossier backend
cd backend

# 2. Vérifier l'environnement Python
python --version  # Doit être Python 3.9+

# 3. Installer les dépendances si nécessaire
pip install sqlalchemy asyncpg psycopg2-binary

# 4. Configurer les variables d'environnement (si nécessaire)
export DATABASE_URL="postgresql+asyncpg://user:password@localhost/dbname"
export RAILWAY_DB_URL="postgresql://postgres:knOTGbtTMRlrFNqFvmAIsNszFYfwHfyq@gondola.proxy.rlwy.net:57882/railway"

# 5. Exécuter le script d'importation
python scripts/import_oaciq_forms_from_railway.py
```

### Résultat attendu

Le script doit afficher :
```
📥 Début de l'importation des formulaires OACIQ depuis Railway
🔍 Connexion à Railway PostgreSQL...
✅ 49 formulaires trouvés dans Railway

   ✅ [PA] Promesse d'achat... - IMPORTÉ
   ✅ [CCVE] Contrat d'exclusivité... - IMPORTÉ
   ...
   
📊 Résumé de l'importation:
   - Nouveaux formulaires importés: 49
   - Formulaires mis à jour: 0
   - Formulaires ignorés (erreurs): 0
   - Total traité: 49

✅ Importation terminée
```

### Vérifications post-importation

Après l'exécution, vérifier dans la base de données :

```sql
-- Compter les formulaires
SELECT COUNT(*) FROM forms WHERE code IS NOT NULL;
-- Attendu: 49

-- Vérifier par catégorie
SELECT category, COUNT(*) 
FROM forms 
WHERE code IS NOT NULL 
GROUP BY category;
-- Attendu: 
-- obligatoire: 28
-- recommandé: 15
-- curateur_public: 6
```

### Points d'attention

1. **Connexions** : Vérifier que les deux bases sont accessibles avant de lancer
2. **Doublons** : Le script gère automatiquement les doublons (mise à jour)
3. **Erreurs** : En cas d'erreur, le script affiche les détails et continue avec les autres formulaires
4. **Idempotence** : Le script peut être réexécuté plusieurs fois sans problème

### En cas d'erreur

Si une erreur survient :
1. Lire le message d'erreur complet dans les logs
2. Vérifier les connexions aux bases de données
3. Vérifier que les tables existent (migrations Alembic)
4. Consulter `docs/INSTRUCTIONS_IMPORT_FORMULAIRES_MANUS.md` pour plus de détails

### Critères de succès

✅ Le script s'exécute sans erreur  
✅ 49 formulaires sont importés  
✅ Tous les codes sont uniques  
✅ Les catégories sont correctes  
✅ Les URLs PDF sont préservées  
✅ Les champs extraits (si présents) sont préservés  

---

**Note** : Ce script est conçu pour être exécuté par un agent AI. Il inclut une gestion d'erreurs robuste et des logs détaillés pour faciliter le débogage.
