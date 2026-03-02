# Guide de Configuration S3 pour ImmoAssist

Ce guide vous explique comment configurer un bucket S3 (ou DigitalOcean Spaces) pour stocker les fichiers de l'application.

> **Cloudflare R2** : pour connecter un bucket **R2**, suivez le guide dédié : [Guide de configuration R2 (Cloudflare)](./R2_SETUP_GUIDE.md).

## Options disponibles

### Option 1 : DigitalOcean Spaces (Recommandé - Plus simple et moins cher)

DigitalOcean Spaces est compatible S3 et offre :
- 250 GB de stockage inclus avec le plan de base
- Interface simple
- Tarification transparente
- CDN intégré

### Option 2 : AWS S3

Amazon S3 est la solution originale :
- Plus de fonctionnalités avancées
- Plus complexe à configurer
- Tarification variable selon l'utilisation

---

## Configuration DigitalOcean Spaces

### Étape 1 : Créer un compte DigitalOcean

1. Allez sur [https://www.digitalocean.com](https://www.digitalocean.com)
2. Créez un compte ou connectez-vous
3. Ajoutez une méthode de paiement

### Étape 2 : Créer un Space

1. Dans le tableau de bord DigitalOcean, cliquez sur **"Spaces"** dans le menu de gauche
2. Cliquez sur **"Create a Space"**
3. Configurez votre Space :
   - **Datacenter region** : Choisissez la région la plus proche (ex: `nyc3`, `ams3`, `sgp1`)
   - **CDN** : Activez le CDN pour de meilleures performances (recommandé)
   - **Name** : Choisissez un nom unique (ex: `immoassist-files`)
   - **File listing** : Désactivez pour la sécurité (recommandé)
4. Cliquez sur **"Create a Space"**

### Étape 3 : Créer une clé API

1. Allez dans **"API"** dans le menu de gauche
2. Cliquez sur **"Spaces Keys"**
3. Cliquez sur **"Generate New Key"**
4. Donnez un nom à votre clé (ex: `immoassist-backend`)
5. **IMPORTANT** : Copiez immédiatement :
   - **Access Key** (commence par une longue chaîne)
   - **Secret Key** (vous ne pourrez plus la voir après)
6. Stockez ces clés en sécurité

### Étape 4 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` ou dans Railway :

```bash
# DigitalOcean Spaces Configuration
AWS_ACCESS_KEY_ID=votre_access_key_ici
AWS_SECRET_ACCESS_KEY=votre_secret_key_ici
AWS_REGION=nyc3  # Remplacez par votre région
AWS_S3_BUCKET=votre-space-name  # Le nom de votre Space
AWS_S3_ENDPOINT_URL=https://votre-region.digitaloceanspaces.com
```

**Exemple concret :**
```bash
AWS_ACCESS_KEY_ID=DO00ABCDEF1234567890
AWS_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCDEF
AWS_REGION=nyc3
AWS_S3_BUCKET=immoassist-files
AWS_S3_ENDPOINT_URL=https://nyc3.digitaloceanspaces.com
```

### Étape 5 : Tester la configuration

1. Redémarrez votre application backend
2. Essayez d'uploader une photo dans une transaction
3. Vérifiez que l'image s'affiche correctement

---

## Configuration AWS S3

### Étape 1 : Créer un compte AWS

1. Allez sur [https://aws.amazon.com](https://aws.amazon.com)
2. Créez un compte AWS
3. Configurez la facturation

### Étape 2 : Créer un bucket S3

1. Connectez-vous à la [Console AWS](https://console.aws.amazon.com)
2. Recherchez "S3" dans la barre de recherche
3. Cliquez sur **"Create bucket"**
4. Configurez votre bucket :
   - **Bucket name** : Choisissez un nom unique globalement (ex: `immoassist-files-prod`)
   - **AWS Region** : Choisissez la région la plus proche
   - **Block Public Access** : Laissez activé pour la sécurité
   - **Versioning** : Optionnel
   - **Encryption** : Recommandé (AES-256)
5. Cliquez sur **"Create bucket"**

### Étape 3 : Créer un utilisateur IAM

1. Allez dans **IAM** (Identity and Access Management)
2. Cliquez sur **"Users"** puis **"Add users"**
3. Nommez l'utilisateur (ex: `immoassist-s3-user`)
4. Sélectionnez **"Programmatic access"**
5. Cliquez sur **"Next: Permissions"**
6. Sélectionnez **"Attach existing policies directly"**
7. Recherchez et sélectionnez **"AmazonS3FullAccess"** (ou créez une politique plus restrictive)
8. Cliquez sur **"Next"** puis **"Create user"**
9. **IMPORTANT** : Copiez immédiatement :
   - **Access Key ID**
   - **Secret Access Key** (vous ne pourrez plus la voir)

### Étape 4 : Configurer les variables d'environnement

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=votre_access_key_id
AWS_SECRET_ACCESS_KEY=votre_secret_access_key
AWS_REGION=us-east-1  # Votre région AWS
AWS_S3_BUCKET=votre-bucket-name
# AWS_S3_ENDPOINT_URL n'est pas nécessaire pour AWS S3 standard
```

---

## Configuration dans Railway

### Méthode 1 : Via l'interface Railway

1. Allez sur votre projet Railway
2. Sélectionnez le service **Backend**
3. Allez dans l'onglet **"Variables"**
4. Ajoutez chaque variable d'environnement :
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`
   - `AWS_S3_ENDPOINT_URL` (si DigitalOcean Spaces)
5. Cliquez sur **"Deploy"** pour redémarrer le service

### Méthode 2 : Via Railway CLI

```bash
railway variables set AWS_ACCESS_KEY_ID=votre_key
railway variables set AWS_SECRET_ACCESS_KEY=votre_secret
railway variables set AWS_REGION=nyc3
railway variables set AWS_S3_BUCKET=votre-bucket-name
railway variables set AWS_S3_ENDPOINT_URL=https://nyc3.digitaloceanspaces.com
```

---

## Vérification de la configuration

### Test manuel

1. Redémarrez votre backend
2. Essayez d'uploader une photo dans une transaction
3. Vérifiez les logs pour voir s'il y a des erreurs

### Test via l'API

```bash
# Vérifier que S3 est configuré
curl https://votre-backend.railway.app/api/v1/health
```

---

## Notes importantes

### URLs présignées

- Les URLs présignées expirent après **7 jours maximum** (limite S3)
- L'application régénère automatiquement les URLs quand nécessaire
- Pour les fichiers publics, considérez utiliser un CDN ou rendre le bucket public (non recommandé pour la sécurité)

### Sécurité

- **Ne commitez jamais** vos clés API dans Git
- Utilisez des variables d'environnement
- Limitez les permissions IAM au strict nécessaire
- Activez le chiffrement des fichiers dans S3

### Coûts

**DigitalOcean Spaces :**
- 250 GB inclus : Gratuit
- Au-delà : $5/TB/mois
- Transfert sortant : 1 TB/mois inclus

**AWS S3 :**
- Stockage : ~$0.023/GB/mois
- Requêtes : ~$0.0004 pour 1000 requêtes
- Transfert sortant : Variable selon la région

---

## Dépannage

### Erreur : "AuthorizationQueryParametersError"

**Cause** : L'expiration de l'URL présignée dépasse 7 jours.

**Solution** : Vérifiez que votre code utilise `expiration=604800` (7 jours) maximum.

### Erreur : "Access Denied"

**Cause** : Les clés API n'ont pas les bonnes permissions.

**Solution** : Vérifiez que votre utilisateur IAM a les permissions S3 nécessaires.

### Erreur : "Bucket not found"

**Cause** : Le nom du bucket est incorrect ou la région ne correspond pas.

**Solution** : Vérifiez `AWS_S3_BUCKET` et `AWS_REGION` dans vos variables d'environnement.

### Les photos ne s'affichent pas

**Causes possibles :**
1. L'URL présignée a expiré (régénération nécessaire)
2. Le bucket n'est pas accessible publiquement (normal pour la sécurité)
3. Les CORS ne sont pas configurés correctement

**Solution** : Vérifiez les logs du backend et utilisez l'endpoint de régénération d'URL.

---

## Support

Pour plus d'aide :
- [Documentation DigitalOcean Spaces](https://docs.digitalocean.com/products/spaces/)
- [Documentation AWS S3](https://docs.aws.amazon.com/s3/)
- [Documentation boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
