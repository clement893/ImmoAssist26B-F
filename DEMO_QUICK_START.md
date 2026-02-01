# Guide de Démarrage Rapide - Pages Démo

## Installation

Les pages démo sont déjà intégrées dans le projet ImmoAssist26B-F. Aucune installation supplémentaire n'est requise.

## Démarrage

### 1. Installer les dépendances (si ce n'est pas déjà fait)

```bash
pnpm install
```

### 2. Configurer les variables d'environnement

Assurez-vous que les fichiers `.env` sont configurés :

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

### 3. Démarrer le serveur de développement

```bash
pnpm dev
```

Le serveur démarrera sur `http://localhost:3000`

### 4. Accéder aux pages démo

Ouvrez votre navigateur et accédez à :

```
http://localhost:3000/en/demo
```

ou

```
http://localhost:3000/fr/demo
```

Vous serez automatiquement redirigé vers le dashboard.

## Navigation

Une fois sur les pages démo, utilisez la navigation latérale pour accéder aux différentes pages :

- **Dashboard** : `/demo/dashboard` - Vue d'ensemble avec statistiques et calendrier
- **Transactions** : `/demo/transactions` - Tableau Kanban pour gérer les transactions
- **Calendar** : `/demo/calendar` - Gestion du calendrier et des rendez-vous
- **Documents** : `/demo/documents` - Gestion des documents et vérifications

## Structure des URLs

Les pages démo suivent la structure de routing de Next.js :

```
/[locale]/demo/
├── /dashboard
├── /transactions
├── /calendar
└── /documents
```

Le paramètre `[locale]` peut être `en` ou `fr` selon la langue configurée.

## Personnalisation

### Modifier les couleurs

Les couleurs sont définies avec Tailwind CSS. Pour les modifier, éditez les classes dans les fichiers de page :

```tsx
// Exemple : Changer la couleur primaire
className="bg-indigo-600" // Remplacer par bg-blue-600, bg-purple-600, etc.
```

### Ajouter des données

Les pages utilisent actuellement des données mockées. Pour connecter à l'API :

1. Créer les hooks API dans `apps/web/src/lib/api/`
2. Remplacer les données mockées par des appels API
3. Ajouter la gestion des états de chargement et d'erreur

### Ajouter des animations

Pour ajouter des animations avec Framer Motion :

```bash
pnpm add framer-motion
```

Puis dans vos composants :

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Votre contenu */}
</motion.div>
```

## Dépannage

### Erreur : Module not found

Si vous rencontrez des erreurs de modules manquants, assurez-vous que toutes les dépendances sont installées :

```bash
pnpm install
```

### Erreur : Cannot find module '@/components/...'

Vérifiez que le fichier `tsconfig.json` contient les alias de chemin corrects :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./apps/web/src/*"]
    }
  }
}
```

### Les pages ne s'affichent pas correctement

1. Vérifiez que le serveur de développement est bien démarré
2. Effacez le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
3. Vérifiez la console du navigateur pour les erreurs

### Erreur de routing

Si vous obtenez une erreur 404, assurez-vous que :
- Le paramètre `[locale]` est bien présent dans l'URL
- Les fichiers de page sont dans le bon dossier `apps/web/src/app/[locale]/demo/`

## Prochaines étapes

Une fois les pages démo fonctionnelles, vous pouvez :

1. **Connecter à l'API** : Remplacer les données mockées par de vraies données
2. **Ajouter des fonctionnalités** : Drag & drop, filtres avancés, recherche en temps réel
3. **Améliorer le responsive** : Optimiser pour mobile et tablette
4. **Ajouter des tests** : Tests unitaires et E2E avec Vitest et Playwright
5. **Déployer** : Déployer sur Vercel, Railway ou votre plateforme préférée

## Support

Pour toute question ou problème :

1. Consultez la documentation complète dans `DEMO_PAGES_README.md`
2. Consultez l'architecture dans `DEMO_PAGES_ARCHITECTURE.md`
3. Vérifiez les issues GitHub du projet
4. Contactez l'équipe de développement

## Ressources

- [Documentation Next.js 16](https://nextjs.org/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation TypeScript](https://www.typescriptlang.org/docs)
- [Lucide Icons](https://lucide.dev)
