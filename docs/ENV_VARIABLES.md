# 🔐 Documentation des Variables d'Environnement

Documentation complète de toutes les variables d'environnement utilisées dans le projet.

---

## 📋 Backend (.env)

### Configuration Générale

| Variable       | Description               | Requis | Défaut        | Exemple                                |
| -------------- | ------------------------- | ------ | ------------- | -------------------------------------- |
| `ENVIRONMENT`  | Environnement d'exécution | Non    | `development` | `production`, `development`, `staging` |
| `PROJECT_NAME` | Nom du projet             | Non    | `API`         | `MyApp`                                |

### Base de Données

| Variable          | Description                              | Requis | Défaut | Exemple                                                |
| ----------------- | ---------------------------------------- | ------ | ------ | ------------------------------------------------------ |
| `DATABASE_URL`    | URL de connexion PostgreSQL              | ✅ Oui | -      | `postgresql+asyncpg://user:pass@localhost:5432/dbname` |
| `DB_POOL_SIZE`    | Taille du pool de connexions             | Non    | `10`   | `20`                                                   |
| `DB_MAX_OVERFLOW` | Nombre max de connexions supplémentaires | Non    | `20`   | `30`                                                   |

### Sécurité

| Variable                      | Description                              | Requis | Défaut                  | Exemple                   |
| ----------------------------- | ---------------------------------------- | ------ | ----------------------- | ------------------------- |
| `SECRET_KEY`                  | Clé secrète pour JWT (min 32 caractères) | ✅ Oui | -                       | Généré avec `pnpm setup`  |
| `FRONTEND_URL`                | URL du frontend                          | ✅ Oui | `http://localhost:3000` | `https://app.example.com` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiration du token d'accès              | Non    | `30`                    | `60`                      |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Expiration du refresh token              | Non    | `7`                     | `30`                      |

### OAuth

| Variable               | Description                | Requis | Défaut | Exemple                          |
| ---------------------- | -------------------------- | ------ | ------ | -------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID     | Non    | -      | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Non    | -      | `xxx`                            |

### Redis (Optionnel)

| Variable    | Description            | Requis | Défaut | Exemple                    |
| ----------- | ---------------------- | ------ | ------ | -------------------------- |
| `REDIS_URL` | URL de connexion Redis | Non    | -      | `redis://localhost:6379/0` |

### SendGrid Email

| Variable              | Description                 | Requis | Défaut            | Exemple               |
| --------------------- | --------------------------- | ------ | ----------------- | --------------------- |
| `SENDGRID_API_KEY`    | Clé API SendGrid            | Non    | -                 | `SG.xxx`              |
| `SENDGRID_FROM_EMAIL` | Email expéditeur par défaut | Non    | -                 | `noreply@example.com` |
| `SENDGRID_FROM_NAME`  | Nom expéditeur par défaut   | Non    | `${PROJECT_NAME}` | `MyApp`               |

### Stripe

| Variable                 | Description                      | Requis | Défaut | Exemple                        |
| ------------------------ | -------------------------------- | ------ | ------ | ------------------------------ |
| `STRIPE_SECRET_KEY`      | Clé secrète Stripe               | Non    | -      | `sk_test_xxx` ou `sk_live_xxx` |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe              | Non    | -      | `pk_test_xxx` ou `pk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET`  | Secret pour vérification webhook | Non    | -      | `whsec_xxx`                    |

---

## 📋 Frontend (.env.local)

### API Configuration

| Variable              | Description                   | Requis | Défaut                  | Exemple                   |
| --------------------- | ----------------------------- | ------ | ----------------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL` | URL de l'API backend          | ✅ Oui | `http://localhost:8000` | `https://api.example.com` |
| `NEXT_PUBLIC_APP_URL` | URL de l'application frontend | ✅ Oui | `http://localhost:3000` | `https://app.example.com` |

### NextAuth

| Variable          | Description                              | Requis | Défaut                  | Exemple                   |
| ----------------- | ---------------------------------------- | ------ | ----------------------- | ------------------------- |
| `NEXTAUTH_URL`    | URL de base pour NextAuth                | ✅ Oui | `http://localhost:3000` | `https://app.example.com` |
| `NEXTAUTH_SECRET` | Secret pour NextAuth (min 32 caractères) | ✅ Oui | -                       | Généré avec `pnpm setup`  |

### OAuth

| Variable                       | Description                     | Requis | Défaut | Exemple                          |
| ------------------------------ | ------------------------------- | ------ | ------ | -------------------------------- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID (public) | Non    | -      | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth Client Secret      | Non    | -      | `xxx`                            |

### Stripe (Frontend)

| Variable                             | Description         | Requis | Défaut | Exemple                        |
| ------------------------------------ | ------------------- | ------ | ------ | ------------------------------ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | Non    | -      | `pk_test_xxx` ou `pk_live_xxx` |

### GitHub (Optionnel)

| Variable                 | Description         | Requis | Défaut | Exemple                        |
| ------------------------ | ------------------- | ------ | ------ | ------------------------------ |
| `NEXT_PUBLIC_GITHUB_URL` | URL du dépôt GitHub | Non    | -      | `https://github.com/user/repo` |

---

## 🔒 Variables Critiques en Production

⚠️ **Ces variables DOIVENT être configurées en production :**

1. **SECRET_KEY** - Générer avec `python -c 'import secrets; print(secrets.token_urlsafe(32))'`
2. **NEXTAUTH_SECRET** - Générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
3. **DATABASE_URL** - URL de connexion PostgreSQL de production
4. **FRONTEND_URL** / **NEXT_PUBLIC_APP_URL** - URL de production du frontend
5. **NEXT_PUBLIC_API_URL** - URL de production de l'API

---

## ✅ Validation

Utiliser le script de validation :

```bash
# Valider toutes les variables
pnpm validate:env

# Valider uniquement le backend
pnpm validate:env:backend

# Valider uniquement le frontend
pnpm validate:env:frontend
```

---

## 📝 Notes

- Les variables `NEXT_PUBLIC_*` sont exposées au client et doivent être publiques
- Ne jamais commiter les fichiers `.env` ou `.env.local`
- Utiliser des secrets différents pour chaque environnement
- Régénérer les secrets si compromis

---

**Pour plus d'informations, voir [Guide de Sécurité](./SECURITY.md)**
