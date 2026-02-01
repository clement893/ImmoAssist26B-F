# Pages Démo - ImmoAssist26B-F

## Vue d'ensemble

Ce dossier contient des pages démo créées pour présenter les fonctionnalités clés d'ImmoAssist26B-F avec un design moderne et épuré, inspiré des meilleures pratiques UI/UX actuelles.

## Pages créées

### 1. Dashboard (`/demo/dashboard`)
**Inspiration** : Video Buddy + Modern Task Manager

Page d'accueil personnalisée avec :
- Message de bienvenue personnalisé avec date
- 4 cartes de statistiques principales (Transactions, Clients, Propriétés, Revenus)
- Agenda du jour avec liste de rendez-vous
- Calendrier mensuel interactif
- Section "Quick Actions" avec boutons d'action rapide
- Widget "Invitations" avec boutons RSVP
- Widget "Insights" avec statistiques de réunions

**Caractéristiques design** :
- Fond dégradé doux (slate-50 → blue-50 → indigo-50)
- Cartes avec ombres subtiles et anneaux colorés
- Espaces blancs généreux
- Typographie claire et hiérarchisée
- Couleurs vives pour les accents (bleu, vert, violet, ambre)

### 2. Gestion des Transactions (`/demo/transactions`)
**Inspiration** : Project Management Board (Kanban)

Tableau Kanban pour gérer les transactions immobilières :
- 4 colonnes : Not Ready, To Do, In Progress, Completed
- Cartes de transaction avec :
  - Placeholder pour image de propriété
  - Titre et description
  - Tags de statut colorés
  - Compteurs de commentaires et pièces jointes
  - Avatars des participants
- Barre de recherche et filtres
- Bouton "Add Task" flottant

**Caractéristiques design** :
- Layout en grille responsive (1-4 colonnes selon la taille d'écran)
- Cartes avec hover effects (ombre et anneau)
- Couleurs douces pour les colonnes
- Avatars empilés avec anneaux blancs
- Tags colorés pour les labels

### 3. Calendrier & Rendez-vous (`/demo/calendar`)
**Inspiration** : Video Buddy

Interface de gestion de calendrier et réunions :
- Message de bienvenue avec date complète
- Agenda du jour avec rendez-vous détaillés
- Boutons d'action pour chaque rendez-vous
- Calendrier mensuel avec jour actuel mis en évidence
- Section "Quick Actions" avec 3 boutons principaux
- Widget "Invitations" avec avatars colorés
- Widget "Insights" avec statistiques

**Caractéristiques design** :
- Layout 2/3 + 1/3 (contenu principal + sidebar)
- Carte gradient pour les actions rapides
- Calendrier avec jour actuel en indigo
- Avatars circulaires colorés
- Boutons avec états hover bien définis

### 4. Gestion des Documents (`/demo/documents`)
**Inspiration** : Upthrom (interface énergie verte)

Interface de gestion documentaire :
- Hero section avec fond dégradé vert/teal/cyan
- Barre de recherche proéminente
- Tabs horizontaux pour filtrer par catégorie
- Liste de documents avec :
  - Icônes de type
  - Badges de statut colorés
  - Dates et métadonnées
  - Actions au hover (voir, télécharger, plus)
- Sidebar avec filtres et calendrier
- Légende du calendrier

**Caractéristiques design** :
- Hero section immersive avec pattern de fond
- Dégradé émeraude/teal/cyan
- Liste de documents épurée
- Actions révélées au hover
- Calendrier compact avec légende
- Filtres dropdown stylisés

## Structure des fichiers

```
apps/web/src/app/[locale]/demo/
├── layout.tsx                 # Layout commun avec navigation latérale
├── page.tsx                   # Redirection vers dashboard
├── dashboard/
│   └── page.tsx              # Page dashboard
├── transactions/
│   └── page.tsx              # Page Kanban
├── calendar/
│   └── page.tsx              # Page calendrier
└── documents/
    └── page.tsx              # Page documents
```

## Navigation

La navigation latérale fixe permet d'accéder rapidement à toutes les pages :
- Logo et titre en haut
- 4 liens de navigation avec icônes
- Indicateur visuel de page active
- Boutons Settings et Log out en bas

## Palette de couleurs

### Couleurs principales
- **Indigo** : #4F46E5 (primary, boutons, accents)
- **Blue** : #3B82F6 (statistiques, badges)
- **Green** : #10B981 (succès, positif)
- **Amber** : #F59E0B (warning, en attente)
- **Purple** : #8B5CF6 (accents secondaires)
- **Pink** : #EC4899 (accents tertiaires)

### Couleurs de fond
- **Slate-50** : #F8FAFC (fond principal)
- **White** : #FFFFFF (cartes et conteneurs)
- **Gradient** : from-slate-50 via-blue-50 to-indigo-50

### Couleurs de texte
- **Slate-900** : #0F172A (titres)
- **Slate-700** : #334155 (texte principal)
- **Slate-600** : #475569 (texte secondaire)
- **Slate-400** : #94A3B8 (texte désactivé)

## Composants réutilisables

Les pages utilisent des patterns de composants cohérents :

### Cartes
```tsx
className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
```

### Boutons primaires
```tsx
className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
```

### Boutons secondaires
```tsx
className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
```

### Badges de statut
```tsx
className="rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700"
```

### Avatars
```tsx
className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white"
```

## Responsive Design

Toutes les pages sont responsive avec des breakpoints Tailwind :
- **Mobile** : 1 colonne, navigation hamburger (à implémenter)
- **Tablet** : 2 colonnes, navigation visible
- **Desktop** : 3-4 colonnes, layout complet

Classes utilisées :
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- `lg:col-span-2`
- `space-y-6 lg:space-y-0 lg:gap-8`

## Accessibilité

Les pages respectent les bonnes pratiques d'accessibilité :
- Contraste de couleurs WCAG AA
- Navigation au clavier
- ARIA labels (à compléter)
- Focus visible sur les éléments interactifs
- Textes alternatifs (à ajouter pour les images)

## Performance

Optimisations appliquées :
- Composants client (`'use client'`) uniquement quand nécessaire
- Pas d'images lourdes (placeholders pour la démo)
- CSS utility-first avec Tailwind (pas de CSS custom)
- Pas de dépendances externes lourdes

## Prochaines étapes

Pour améliorer les pages démo :

1. **Animations** : Ajouter des transitions et animations avec Framer Motion
2. **Images réelles** : Remplacer les placeholders par de vraies images de propriétés
3. **Données dynamiques** : Connecter à l'API backend
4. **Interactions** : Ajouter les fonctionnalités de drag & drop pour le Kanban
5. **Mobile** : Améliorer la navigation mobile avec un drawer
6. **Tests** : Ajouter des tests unitaires et E2E
7. **Accessibilité** : Compléter les ARIA labels et tester avec un lecteur d'écran

## Utilisation

Pour accéder aux pages démo :

1. Démarrer le serveur de développement :
```bash
pnpm dev
```

2. Naviguer vers :
```
http://localhost:3000/[locale]/demo
```

Les pages seront automatiquement redirigées vers `/demo/dashboard`.

## Notes techniques

- **Next.js 16** : App Router avec Server Components
- **React 19** : Dernières fonctionnalités
- **TypeScript** : Type safety strict
- **Tailwind CSS** : Styling utility-first
- **Lucide React** : Icônes modernes et légères

Les pages sont créées en mode client (`'use client'`) pour permettre l'interactivité (state, événements). Pour une version production, certaines parties pourraient être converties en Server Components pour améliorer les performances.
