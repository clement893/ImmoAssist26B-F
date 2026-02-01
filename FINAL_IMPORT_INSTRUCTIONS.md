# Instructions finales pour l'importation OACIQ

## Statut actuel

✅ **Préparation terminée** :
- Script d'importation créé : `backend/scripts/import_oaciq_forms.py`
- Données préparées : `/home/ubuntu/oaciq_api_import_payload.json` (62 formulaires)
- Dépendances installées dans le sandbox
- PDF archivés : `/home/ubuntu/Formulaires_OACIQ_PDF.zip` (110 PDF)

⚠️ **Reste à faire** :
- Obtenir le DATABASE_URL de production Railway
- Exécuter le script d'importation
- Vérifier l'importation
- Commit et push du script vers GitHub

## Option 1 : Exécution locale avec DATABASE_URL Railway (Recommandé)

### Étape 1 : Obtenir le DATABASE_URL

1. Aller sur Railway : https://railway.app
2. Sélectionner le projet `ImmoAssist26B-F`
3. Cliquer sur le service PostgreSQL
4. Copier la variable `DATABASE_URL`

### Étape 2 : Exécuter le script

```bash
# Dans le sandbox ou localement
cd /home/ubuntu/ImmoAssist26B-F/backend

# Définir DATABASE_URL (remplacer par la vraie valeur)
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/DATABASE"

# Exécuter le script
python3 scripts/import_oaciq_forms.py
```

### Sortie attendue

```
🚀 Importation des formulaires OACIQ...
📁 Lecture du fichier: /home/ubuntu/oaciq_api_import_payload.json
✅ 62 formulaires chargés
🔄 Mode: Mise à jour
🔌 Connexion à la base de données...

🔄 Traitement des formulaires...

  [1/62] ACD - Annexe – Copropriété divise – Curateur public... ✅ Créé
  [2/62] ACI - Annexe – Copropriété indvise – Curateur public... ✅ Créé
  ...
  [62/62] VID - Vérification d'identité... ✅ Créé

💾 Modifications enregistrées dans la base de données

📊 Résumé:
  - Formulaires créés: 62
  - Formulaires mis à jour: 0
  - Erreurs: 0
  - Total traité: 62

📈 Par catégorie:
  - curateur_public: 6
  - obligatoire: 27
  - recommandé: 29

✅ Importation terminée avec succès!
```

## Option 2 : Exécution via Railway CLI

### Prérequis

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Lier au projet
cd /home/ubuntu/ImmoAssist26B-F
railway link
```

### Exécution

```bash
# Exécuter le script dans l'environnement Railway
railway run python3 backend/scripts/import_oaciq_forms.py
```

## Option 3 : Déployer et exécuter sur Railway

### Étape 1 : Commit et push du script

```bash
cd /home/ubuntu/ImmoAssist26B-F

# Ajouter les fichiers
git add backend/scripts/import_oaciq_forms.py
git add backend/scripts/__init__.py
git add CURSOR_INSTRUCTIONS_OACIQ_IMPORT.md
git add FINAL_IMPORT_INSTRUCTIONS.md

# Commit
git commit -m "feat: Add OACIQ forms import script"

# Push
git push origin main
```

### Étape 2 : Exécuter sur Railway

1. Aller sur Railway Dashboard
2. Ouvrir un terminal dans le service backend
3. Exécuter :
```bash
python3 backend/scripts/import_oaciq_forms.py
```

## Vérification post-importation

### Via psql (si accès direct à la DB)

```sql
-- Compter les formulaires
SELECT COUNT(*) as total FROM forms WHERE code IS NOT NULL;
-- Devrait retourner: 62

-- Par catégorie
SELECT category, COUNT(*) as count
FROM forms
WHERE code IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- Vérifier quelques formulaires
SELECT code, name, category, pdf_url
FROM forms
WHERE code IN ('PA', 'CCV', 'DR', 'DV', 'AF', 'AR')
ORDER BY code;
```

### Via l'API

```bash
# Obtenir un token d'API d'abord
export API_TOKEN="YOUR_TOKEN"

# Compter les formulaires
curl -X GET 'https://immoassist26b-f-production.up.railway.app/api/v1/oaciq/forms' \
  -H "Authorization: Bearer $API_TOKEN" | jq 'length'

# Par catégorie
curl -X GET 'https://immoassist26b-f-production.up.railway.app/api/v1/oaciq/forms?category=obligatoire' \
  -H "Authorization: Bearer $API_TOKEN" | jq 'length'
```

### Via l'interface web

1. Accéder à : https://immoassist26b-f-production.up.railway.app/fr/dashboard/modules/formulaire/oaciq
2. Vérifier que les 62 formulaires sont listés
3. Tester les filtres par catégorie
4. Vérifier qu'on peut voir les détails de chaque formulaire

## Upload des PDF (étape suivante)

Une fois l'importation terminée, uploader les PDF :

### Option A : Vers S3

```bash
# Extraire le ZIP
unzip /home/ubuntu/Formulaires_OACIQ_PDF.zip -d /tmp/

# Upload vers S3 (remplacer YOUR_BUCKET)
aws s3 cp /tmp/formulaires_oaciq_pdf/ s3://YOUR_BUCKET/formulaires_oaciq_pdf/ --recursive

# Mettre à jour les URLs dans la base de données
# Créer un script SQL ou utiliser l'API pour mettre à jour les pdf_url
```

### Option B : Dans le projet (public folder)

```bash
# Extraire dans le dossier public du frontend
unzip /home/ubuntu/Formulaires_OACIQ_PDF.zip -d /home/ubuntu/ImmoAssist26B-F/apps/web/public/

# Commit et push
cd /home/ubuntu/ImmoAssist26B-F
git add apps/web/public/formulaires_oaciq_pdf/
git commit -m "feat: Add OACIQ PDF forms"
git push origin main

# Les PDF seront accessibles via:
# https://immoassist26b-f-production.up.railway.app/formulaires_oaciq_pdf/francais/PA.pdf
# https://immoassist26b-f-production.up.railway.app/formulaires_oaciq_pdf/anglais/PP.pdf
```

## Résolution de problèmes

### Erreur : DATABASE_URL non défini

```bash
# Vérifier que la variable est définie
echo $DATABASE_URL

# Si vide, la définir avec la vraie valeur depuis Railway
export DATABASE_URL="postgresql://..."
```

### Erreur : Module not found

```bash
# Installer les dépendances
cd /home/ubuntu/ImmoAssist26B-F/backend
pip3 install -r requirements.txt
```

### Erreur : Connection refused

- Vérifier que DATABASE_URL pointe vers la bonne base de données
- Vérifier que la base de données est accessible depuis votre IP
- Utiliser Railway CLI pour exécuter dans l'environnement Railway

### Erreur : Table 'forms' doesn't exist

- Vérifier que les migrations sont à jour
- Exécuter les migrations si nécessaire

## Commande rapide (tout-en-un)

```bash
# 1. Obtenir DATABASE_URL depuis Railway Dashboard
# 2. Exécuter cette commande (remplacer DATABASE_URL)

cd /home/ubuntu/ImmoAssist26B-F/backend && \
export DATABASE_URL="postgresql://..." && \
python3 scripts/import_oaciq_forms.py && \
echo "✅ Importation terminée!"
```

## Fichiers créés

- ✅ `backend/scripts/import_oaciq_forms.py` - Script d'importation
- ✅ `backend/scripts/__init__.py` - Init du package
- ✅ `CURSOR_INSTRUCTIONS_OACIQ_IMPORT.md` - Instructions pour Cursor
- ✅ `FINAL_IMPORT_INSTRUCTIONS.md` - Ce document

## Prochaines étapes après l'importation

1. ✅ Vérifier que les 62 formulaires sont importés
2. ✅ Tester l'accès via l'API
3. ✅ Tester l'interface web
4. 📤 Upload des PDF vers S3 ou public folder
5. 🔄 Mettre à jour les pdf_url dans la base de données
6. 🧪 Tester le téléchargement des PDF
7. 📝 Documenter le processus pour les futures mises à jour

## Support

Pour toute question :
1. Vérifier les logs du script
2. Vérifier la connexion à la base de données
3. Consulter la documentation Railway
4. Tester avec une base de données locale d'abord

---

**Date** : 1er février 2026
**Statut** : Prêt pour exécution (nécessite DATABASE_URL)
**Formulaires** : 62 prêts à importer
**PDF** : 110 prêts à uploader
