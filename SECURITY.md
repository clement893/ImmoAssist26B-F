# 🔒 Guide de Sécurité

Ce document décrit les pratiques de sécurité pour ce template et comment les maintenir.

## 🎯 Vue d'Ensemble

Ce template implémente plusieurs mesures de sécurité:

- ✅ **JWT avec httpOnly cookies** - Protection contre XSS
- ✅ **RBAC** (Role-Based Access Control) - Contrôle d'accès basé sur les rôles
- ✅ **MFA** (Multi-Factor Authentication) - Authentification à deux facteurs
- ✅ **CSP** (Content Security Policy) - Protection contre les injections
- ✅ **Input Sanitization** - Nettoyage des entrées utilisateur
- ✅ **Rate Limiting** - Protection contre les attaques par force brute
- ✅ **CORS** - Configuration stricte des origines autorisées

## 🔐 Gestion des Secrets

### Génération de Secrets

**⚠️ IMPORTANT**: Ne jamais utiliser de secrets par défaut en production!

```bash
# Générer tous les secrets nécessaires
node scripts/generate-secrets.js

# Sauvegarder dans un fichier (ne pas commiter!)
node scripts/generate-secrets.js --output .env.secrets
```

### Secrets Requis

#### Backend
- `SECRET_KEY` - Clé secrète principale (min 32 caractères)
  ```bash
  openssl rand -hex 32
  ```

#### Frontend
- `NEXTAUTH_SECRET` - Secret pour NextAuth (min 32 caractères)
  ```bash
  openssl rand -base64 32
  ```
- `JWT_SECRET` - Secret pour JWT (min 32 caractères)
  ```bash
  openssl rand -hex 32
  ```

#### Base de Données
- `POSTGRES_PASSWORD` - Mot de passe PostgreSQL (min 16 caractères)
  ```bash
  openssl rand -base64 24
  ```

### Stockage des Secrets

1. **Développement Local**
   - Utiliser des fichiers `.env` (dans `.gitignore`)
   - Ne jamais commiter les fichiers `.env`

2. **Production**
   - Utiliser un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Variables d'environnement dans la plateforme de déploiement
   - Rotation régulière des secrets

## 🛡️ Bonnes Pratiques

### 1. Variables d'Environnement

✅ **À FAIRE**:
- Utiliser des variables d'environnement pour tous les secrets
- Valider les variables au démarrage
- Utiliser des valeurs par défaut sécurisées uniquement en développement

❌ **À ÉVITER**:
- Hardcoder des secrets dans le code
- Commiter des fichiers `.env`
- Utiliser les mêmes secrets en développement et production

### 2. Authentification

✅ **À FAIRE**:
- Utiliser des tokens JWT avec expiration courte
- Implémenter le refresh token
- Activer MFA pour les comptes admin
- Utiliser httpOnly cookies pour les tokens

❌ **À ÉVITER**:
- Stocker les tokens dans localStorage
- Tokens sans expiration
- Mots de passe faibles

### 3. Validation des Entrées

✅ **À FAIRE**:
- Valider toutes les entrées utilisateur
- Sanitizer le HTML avec DOMPurify
- Utiliser des schémas de validation (Zod, Pydantic)

❌ **À ÉVITER**:
- Faire confiance aux entrées utilisateur
- Utiliser `innerHTML` sans sanitization
- Évaluer du code utilisateur (`eval`, `Function`)

### 4. Base de Données

✅ **À FAIRE**:
- Utiliser des requêtes paramétrées (prévention SQL injection)
- Limiter les privilèges de l'utilisateur DB
- Chiffrer les données sensibles
- Faire des backups réguliers

❌ **À ÉVITER**:
- Requêtes SQL concaténées
- Comptes DB avec privilèges élevés
- Données sensibles non chiffrées

### 5. API et CORS

✅ **À FAIRE**:
- Configurer CORS avec des origines spécifiques
- Implémenter rate limiting
- Valider les headers de requête
- Utiliser HTTPS en production

❌ **À ÉVITER**:
- CORS ouvert (`*`)
- Pas de rate limiting
- HTTP en production

## 🔍 Audit de Sécurité

### Scripts Disponibles

```bash
# Scan de sécurité complet
pnpm security:scan

# Audit des dépendances
pnpm security:audit

# Vérification complète
pnpm security:check
```

### Checklist de Sécurité

Avant chaque déploiement, vérifier:

- [ ] Tous les secrets sont dans des variables d'environnement
- [ ] Aucun secret hardcodé dans le code
- [ ] Fichiers `.env` dans `.gitignore`
- [ ] Secrets générés de manière sécurisée
- [ ] HTTPS configuré en production
- [ ] Headers de sécurité configurés
- [ ] CSP configuré correctement
- [ ] CORS configuré avec des origines spécifiques
- [ ] Rate limiting activé
- [ ] MFA activé pour les comptes admin
- [ ] Logging des tentatives d'accès suspectes
- [ ] Backup de la base de données configuré
- [ ] Rotation des secrets planifiée

## 🚨 Réponse aux Incidents

### En Cas de Compromission

1. **Isoler** le système compromis
2. **Changer** tous les secrets immédiatement
3. **Analyser** les logs pour identifier la source
4. **Notifier** les utilisateurs affectés
5. **Documenter** l'incident et les mesures prises

### Contacts

- **Sécurité**: security@example.com
- **Support**: support@example.com

## 📚 Ressources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

### Outils

- [Snyk](https://snyk.io/) - Scan de vulnérabilités
- [OWASP ZAP](https://www.zaproxy.org/) - Test de pénétration
- [Burp Suite](https://portswigger.net/burp) - Test de sécurité web

## 🔄 Mises à Jour de Sécurité

### Dépendances

```bash
# Vérifier les vulnérabilités
pnpm audit

# Mettre à jour les dépendances
pnpm update

# Mettre à jour les dépendances de sécurité
pnpm audit fix
```

### Rotation des Secrets

Les secrets doivent être rotés:

- **Tous les 90 jours** en production
- **Immédiatement** en cas de compromission
- **Après chaque changement** de personnel ayant accès

## ✅ Checklist de Production

Avant de déployer en production:

- [ ] Tous les secrets générés avec `scripts/generate-secrets.js`
- [ ] Variables d'environnement configurées dans la plateforme
- [ ] HTTPS activé et certificats valides
- [ ] Headers de sécurité configurés
- [ ] CSP configuré et testé
- [ ] CORS configuré avec origines spécifiques
- [ ] Rate limiting activé
- [ ] MFA activé pour les admins
- [ ] Monitoring et alertes configurés
- [ ] Backups configurés et testés
- [ ] Plan de réponse aux incidents documenté

---

**Dernière mise à jour**: 2025-01-27
