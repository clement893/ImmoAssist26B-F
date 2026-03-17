# Guide de configuration Cloudflare R2 pour ImmoAssist

Ce guide explique comment connecter un **bucket R2 de Cloudflare** à l'application pour le stockage des fichiers (photos, documents). R2 est compatible avec l’API S3 : le backend utilise déjà boto3, il suffit de configurer l’endpoint et les identifiants.

## Prérequis

- Un compte [Cloudflare](https://dash.cloudflare.com)
- Le backend utilise déjà `backend/app/services/s3_service.py` (S3-compatible)

---

## Étape 1 : Créer un bucket R2

1. Connectez-vous au **Tableau de bord Cloudflare**.
2. Dans le menu de gauche, allez dans **R2 Object Storage**.
3. Cliquez sur **Create bucket**.
4. Choisissez un **nom de bucket** (ex. `immoassist-files`).
5. Sélectionnez une **région** (ex. Europe).
6. Cliquez sur **Create bucket**.

---

## Étape 2 : Créer des identifiants API R2

R2 utilise des **API Tokens** (Access Key + Secret) au format S3.

1. Dans **R2**, onglet **Overview** ou **Manage R2 API Tokens**.
2. Cliquez sur **Create API token** (ou **Manage R2 API Tokens** → **Create API token**).
3. Donnez un nom (ex. `immoassist-backend`).
4. Permissions : **Object Read & Write** (pour le bucket utilisé).
5. Limitez au bucket concerné si vous voulez restreindre l’accès.
6. Cliquez sur **Create API Token**.
7. **Important** : copiez immédiatement :
   - **Access Key ID** (équivalent `AWS_ACCESS_KEY_ID`)
   - **Secret Access Key** (équivalent `AWS_SECRET_ACCESS_KEY`)  
   Le secret ne sera plus affiché ensuite.

---

## Étape 3 : Récupérer l’Account ID Cloudflare

L’endpoint R2 dépend de votre **Account ID** :

1. Dans le tableau de bord Cloudflare, ouvrez n’importe quel site (ou la page d’accueil du compte).
2. Dans la barre latérale droite (ou en bas de la page), trouvez **Account ID**.
3. L’endpoint R2 sera :  
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

Exemple : si l’Account ID est `abc123def456`, l’endpoint est  
`https://abc123def456.r2.cloudflarestorage.com`.

---

## Étape 4 : Variables d’environnement

Dans le fichier **backend** (`.env` à la racine ou dans `backend/`), ajoutez ou modifiez :

```bash
# Cloudflare R2 (S3-compatible)
AWS_ACCESS_KEY_ID=<votre_r2_access_key_id>
AWS_SECRET_ACCESS_KEY=<votre_r2_secret_access_key>
AWS_REGION=auto
AWS_S3_BUCKET=<nom_du_bucket_r2>
AWS_S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Remplacez :

- `<votre_r2_access_key_id>` : Access Key ID de l’API token R2
- `<votre_r2_secret_access_key>` : Secret Access Key de l’API token R2
- `<nom_du_bucket_r2>` : nom du bucket créé à l’étape 1
- `<ACCOUNT_ID>` : Account ID Cloudflare (étape 3)

**Exemple :**

```bash
AWS_ACCESS_KEY_ID=a1b2c3d4e5f6...
AWS_SECRET_ACCESS_KEY=xyz789...
AWS_REGION=auto
AWS_S3_BUCKET=immoassist-files
AWS_S3_ENDPOINT_URL=https://abc123def456.r2.cloudflarestorage.com
```

Note : `AWS_REGION=auto` est recommandé pour R2 (obligatoire pour boto3, R2 n’utilise pas la région au sens AWS).

---

Le backend accepte aussi les variables **R2_*** : `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT_URL` (pratique sur Railway).

---

## Étape 5 : Tester la connexion R2

### Option A : Script de test (recommandé)

Depuis la racine du projet :

```bash
cd backend
python scripts/test_s3_connection.py
```

Le script utilise les variables d’environnement (y compris `AWS_S3_ENDPOINT_URL`). Il vérifie :

- Présence des variables
- Connexion au stockage (R2 via endpoint S3)
- Accès au bucket
- Écriture (fichier test) et suppression

En cas d’erreur, le message indique généralement une clé manquante, un mauvais endpoint ou un nom de bucket incorrect.

### Option B : Health check API

Avec le backend démarré :

```bash
curl http://localhost:8000/api/health/s3
```

Réponse attendue (exemple) : `configured: true` et des tests (bucket_access, upload, presigned_url, delete) à succès.

### Option C : Test manuel dans l’app

1. Redémarrer le backend après modification du `.env`.
2. Dans l’application, utiliser une fonction qui uploade un fichier (ex. photo dans une transaction, ou outil admin “S3 Upload”).
3. Vérifier que le fichier apparaît dans le bucket R2 (Cloudflare Dashboard → R2 → votre bucket).

---

## Résumé des variables pour R2

| Variable                 | Obligatoire | Description                                      |
|--------------------------|------------|--------------------------------------------------|
| `AWS_ACCESS_KEY_ID`      | Oui        | Access Key ID du token R2                        |
| `AWS_SECRET_ACCESS_KEY`  | Oui        | Secret Access Key du token R2                    |
| `AWS_S3_BUCKET`         | Oui        | Nom du bucket R2                                |
| `AWS_S3_ENDPOINT_URL`   | Oui pour R2 | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `AWS_REGION`            | Recommandé | `auto` pour R2                                  |

---

## Dépannage

### Erreur "S3 client not configured"

- Vérifiez que `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` et `AWS_S3_ENDPOINT_URL` sont bien définis dans l’environnement du backend (fichier `.env` chargé au démarrage).

### Erreur "Bucket not found" / 404

- Vérifiez le nom du bucket (`AWS_S3_BUCKET`) et qu’il existe bien dans le compte Cloudflare (R2).
- Vérifiez que l’API token a les droits sur ce bucket.

### Erreur "InvalidAccessKeyId" / "SignatureDoesNotMatch"

- Vérifiez que vous avez copié l’Access Key ID et le Secret Access Key du **token R2** (pas un token API Cloudflare classique).
- Recréez un API token R2 si besoin.

### Les URLs des fichiers ne s’ouvrent pas

- L’app utilise des **URLs présignées** (expiration 7 jours max). Si une URL a expiré, l’app doit régénérer l’URL (rafraîchir la page ou recharger la ressource).
- Vérifiez que le health check S3 indique le succès de l’étape "presigned_url".

### Domaine public R2 (optionnel)

- Par défaut, les accès se font via URLs présignées (pas de domaine public).
- Si vous activez un **domaine public** ou un **custom domain** sur le bucket R2, vous pourrez adapter le code pour servir des URLs directes au lieu de présignées (hors scope de ce guide).

---

## Sécurité

- Ne commitez **jamais** les clés dans Git. Utilisez uniquement des variables d’environnement (ou un gestionnaire de secrets).
- Limitez les permissions du token R2 au strict nécessaire (lecture/écriture sur le bucket utilisé).
- En production, utilisez des variables d’environnement fournies par la plateforme (Railway, etc.).

---

## Références

- [Cloudflare R2 – Get started (S3 API)](https://developers.cloudflare.com/r2/get-started/s3/)
- [Cloudflare R2 – boto3 example](https://developers.cloudflare.com/r2/examples/aws/boto3/)
- [Documentation S3 ImmoAssist](./S3_SETUP_GUIDE.md) (DigitalOcean Spaces, AWS S3)
