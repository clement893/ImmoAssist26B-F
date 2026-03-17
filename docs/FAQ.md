# ❓ FAQ - Questions Fréquentes

Questions fréquemment posées par les utilisateurs du template.

---

## 🚀 Installation et Configuration

### Q: Comment installer le template ?

**R:** Voir le [Guide de Démarrage Rapide](./QUICK_START.md) pour une installation en 5 minutes.

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
pnpm setup
pnpm install
```

### Q: Le script `pnpm setup` ne fonctionne pas

**R:** Vérifiez que :

- Node.js 20.x ou supérieur est installé
- pnpm 9.x ou supérieur est installé (`npm install -g pnpm`)
- Vous êtes dans le répertoire racine du projet

### Q: Comment générer les secrets manuellement ?

**R:**

```bash
# SECRET_KEY (Backend)
python -c 'import secrets; print(secrets.token_urlsafe(32))'

# NEXTAUTH_SECRET (Frontend)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ Base de Données

### Q: Comment créer la base de données ?

**R:**

```bash
createdb nom_de_votre_db
cd backend
alembic upgrade head
```

### Q: Erreur "Database connection failed"

**R:** Vérifiez :

1. PostgreSQL est démarré
2. La variable `DATABASE_URL` dans `.env` est correcte
3. La base de données existe

```bash
# Tester la connexion
psql $DATABASE_URL
```

### Q: Comment réinitialiser la base de données ?

**R:**

```bash
cd backend
alembic downgrade base
alembic upgrade head
```

---

## 🔧 Développement

### Q: Comment ajouter un nouveau composant ?

**R:**

```bash
pnpm generate:component NomComposant
```

### Q: Comment ajouter une nouvelle page ?

**R:**

```bash
pnpm generate:page nom-page
```

### Q: Comment ajouter une route API ?

**R:**

```bash
pnpm generate:api nom-route
```

### Q: Le hot reload ne fonctionne pas

**R:**

1. Vérifiez que les fichiers sont sauvegardés
2. Redémarrez le serveur de développement
3. Vérifiez les erreurs dans la console

---

## 🐛 Problèmes Courants

### Q: "Module not found" après installation

**R:**

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Q: Erreur TypeScript après clonage

**R:**

```bash
pnpm type-check
# Si erreurs, réinstaller les dépendances
pnpm install
```

### Q: Port déjà utilisé

**R:** Changez les ports dans `.env` :

```env
FRONTEND_URL=http://localhost:3001
PORT=8001
```

### Q: Build échoue en production

**R:**

1. Vérifiez toutes les variables d'environnement
2. Vérifiez que `NODE_ENV=production`
3. Vérifiez les logs d'erreur

---

## 🔐 Sécurité

### Q: Est-ce que je peux commiter les fichiers .env ?

**R:** ❌ **NON !** Les fichiers `.env` sont dans `.gitignore` pour une raison. Ne les commitez jamais.

### Q: Comment sécuriser les secrets en production ?

**R:**

1. Utilisez des variables d'environnement sur votre plateforme de déploiement
2. Ne stockez jamais les secrets dans le code
3. Régénérez les secrets si compromis

### Q: Le SECRET_KEY est-il assez sécurisé ?

**R:** Le script `setup` génère automatiquement un secret de 32 caractères. En production, utilisez au moins 32 caractères aléatoires.

---

## 📦 Déploiement

### Q: Comment déployer sur Vercel ?

**R:** Voir [Guide de Déploiement](./DEPLOYMENT.md)

1. Connecter votre dépôt GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Q: Comment déployer sur Railway ?

**R:**

1. Connecter votre dépôt GitHub
2. Ajouter PostgreSQL et Redis
3. Configurer les variables d'environnement
4. Déployer

### Q: Le déploiement échoue

**R:**

1. Vérifiez les logs de build
2. Vérifiez toutes les variables d'environnement
3. Vérifiez que la base de données est accessible

---

## 🎨 Personnalisation

### Q: Comment changer le nom du projet ?

**R:**

```bash
pnpm rename
```

### Q: Comment personnaliser le thème ?

**R:** Voir [Guide de Personnalisation](./CUSTOMIZATION.md)

### Q: Comment supprimer les exemples ?

**R:**

```bash
rm -rf apps/web/src/app/examples
```

---

## 🧪 Tests

### Q: Comment exécuter les tests ?

**R:**

```bash
# Tous les tests
pnpm test

# Tests frontend uniquement
pnpm test:web

# Tests backend uniquement
pnpm test:backend

# Avec couverture
pnpm test:coverage
```

### Q: Les tests échouent

**R:**

1. Vérifiez que la base de données de test est configurée
2. Vérifiez les variables d'environnement de test
3. Vérifiez les logs d'erreur

---

## 📚 Documentation

### Q: Où trouver la documentation complète ?

**R:** Tous les guides sont dans le dossier `docs/` :

- [Guide de Démarrage](./GETTING_STARTED.md)
- [Utilisation du Template](./TEMPLATE_USAGE.md)
- [Guide de Migration](./MIGRATION_GUIDE.md)
- [Guide de Déploiement](./DEPLOYMENT.md)

### Q: Comment contribuer au template ?

**R:** Voir [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 🆘 Support

### Q: Où obtenir de l'aide ?

**R:**

- **Issues GitHub** : [Ouvrir une issue](https://github.com/your-username/your-repo-name/issues)
- **Discussions** : [GitHub Discussions](https://github.com/your-username/your-repo-name/discussions)
- **Documentation** : Voir le dossier `docs/`

### Q: Comment signaler un bug ?

**R:** Utilisez le template d'issue GitHub ou ouvrez une [nouvelle issue](https://github.com/your-username/your-repo-name/issues/new).

---

**D'autres questions ?** Ouvrez une [discussion](https://github.com/your-username/your-repo-name/discussions) !
