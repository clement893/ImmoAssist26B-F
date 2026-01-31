# 🔒 Guide de Sécurité

Bonnes pratiques de sécurité pour ce template full-stack.

> **📢 Recent Updates:** Security has been enhanced with improved type safety, better error handling, and comprehensive test coverage. See [TEMPLATE_UPDATES.md](../../TEMPLATE_UPDATES.md) for details.

## 📋 Table des Matières

- [Authentification](#authentification)
- [Autorisation](#autorisation)
- [Protection des Données](#protection-des-données)
- [Configuration](#configuration)
- [Déploiement](#déploiement)
- [Checklist](#checklist)

---

## 🔐 Authentification

### JWT Tokens

- ✅ Tokens d'accès : expiration 30 minutes
- ✅ Refresh tokens : expiration 5 jours
- ✅ Vérification du type de token
- ✅ Validation de la signature

### Mots de passe

- ✅ Hachage avec bcrypt
- ✅ Validation de la force du mot de passe
- ✅ Protection contre les attaques brute force (rate limiting)

### Bonnes Pratiques

```typescript
// ✅ Bon : Utiliser sessionStorage pour les tokens
sessionStorage.setItem("token", token);

// ❌ Mauvais : localStorage expose les tokens
localStorage.setItem("token", token);
```

---

## 🛡️ Autorisation

### Protection des Routes

- ✅ Vérification de l'authentification
- ✅ Vérification des permissions
- ✅ Protection des routes admin

### Exemple

```typescript
// Page protégée
if (!isAuthenticated()) {
  router.push("/auth/login");
  return null;
}

// Page admin
if (!user?.is_admin) {
  router.push("/dashboard");
  return null;
}
```

---

## 🔒 Protection des Données

### Validation

- ✅ Validation côté client (Zod)
- ✅ Validation côté serveur (Pydantic)
- ✅ Sanitization HTML (DOMPurify)

### Protection contre les Injections

- ✅ SQL : SQLAlchemy ORM (pas de requêtes brutes)
- ✅ XSS : DOMPurify pour le HTML
- ✅ CSRF : Protection avec tokens

### Exemple

```python
# ✅ Bon : Utiliser SQLAlchemy ORM
user = await db.execute(
    select(User).where(User.email == email)
)

# ❌ Mauvais : Requête SQL brute
query = f"SELECT * FROM users WHERE email = '{email}'"
```

---

## ⚙️ Configuration

### Variables d'Environnement

- ✅ Pas de secrets hardcodés
- ✅ Validation en production
- ✅ Fichiers .env dans .gitignore

### Secrets

```bash
# ✅ Générer un SECRET_KEY sécurisé
python -c 'import secrets; print(secrets.token_urlsafe(32))'
```

### Production

- ✅ SECRET_KEY minimum 32 caractères
- ✅ HTTPS forcé
- ✅ Headers de sécurité configurés
- ✅ CSP strict

---

## 🚀 Déploiement

### Checklist de Sécurité

- [ ] SECRET_KEY défini et sécurisé
- [ ] Variables d'environnement configurées
- [ ] HTTPS activé
- [ ] Headers de sécurité configurés
- [ ] CORS restreint
- [ ] Rate limiting activé
- [ ] Logging configuré (sans données sensibles)
- [ ] Backups configurés

---

## 📊 Monitoring

### Logs

- ✅ Pas de mots de passe dans les logs
- ✅ Pas de tokens dans les logs
- ✅ Sanitization des données sensibles

### Alertes

- ✅ Tentatives d'authentification échouées
- ✅ Rate limiting déclenché
- ✅ Erreurs critiques

---

## 🔍 Audit de Sécurité

Voir [Rapport d'Audit de Sécurité](./SECURITY_AUDIT_REPORT.md) pour un audit complet.

---

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
