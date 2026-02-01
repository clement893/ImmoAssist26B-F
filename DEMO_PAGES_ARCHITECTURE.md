# Architecture des Pages Démo - ImmoAssist26B-F

## Vue d'ensemble

Ce document décrit l'architecture des pages démo créées pour présenter les fonctionnalités clés d'ImmoAssist26B-F avec un design moderne et épuré.

## Principes de Design

### Inspirations visuelles
- **Upthrom** : Interface épurée avec hero banner, calendrier intégré, espaces blancs généreux
- **Project Management Board** : Tableau Kanban avec colonnes, cartes visuelles, fond dégradé doux
- **Task Manager** : Design minimaliste, navigation latérale claire, widgets organisés
- **Video Buddy** : Interface accueillante, calendrier central, actions rapides visibles

### Orientations design appliquées
1. **Espaces blancs généreux** : Respiration visuelle, pas de surcharge
2. **Couleurs douces** : Palette professionnelle avec accents subtils
3. **Ombres légères** : Profondeur sans lourdeur
4. **Coins arrondis** : Interface moderne et accueillante
5. **Typographie claire** : Hiérarchie visuelle forte
6. **Navigation intuitive** : Menu latéral minimaliste et organisé

## Structure des Pages Démo

### 1. Dashboard Principal (`/demo/dashboard`)
**Inspiration** : Video Buddy + Task Manager

**Composants clés** :
- Header personnalisé avec salutation et date
- Grille de statistiques avec icônes colorées
- Calendrier intégré avec événements du jour
- Section "Actions rapides" avec boutons visuels
- Widgets "Invitations" et "Insights"
- Navigation latérale épurée

**Couleurs** :
- Fond : Blanc/Gris très clair
- Accents : Bleu (#4F46E5), Vert (#10B981), Orange (#F59E0B)
- Texte : Gris foncé (#1F2937)

### 2. Gestion des Transactions (`/demo/transactions`)
**Inspiration** : Project Management Board

**Composants clés** :
- Tableau Kanban à 4 colonnes (Non démarré, En cours, Conditionnel, Conclu)
- Cartes de transaction avec :
  - Image de propriété
  - Titre et adresse
  - Tags de statut colorés
  - Avatars des participants
  - Indicateurs de progression
- Bouton "Ajouter une transaction" flottant
- Filtres et recherche en haut

**Colonnes** :
1. **Non démarré** : Gris clair
2. **En cours** : Bleu clair
3. **Conditionnel** : Orange clair
4. **Conclu** : Vert clair

### 3. Calendrier & Rendez-vous (`/demo/calendar`)
**Inspiration** : Video Buddy

**Composants clés** :
- Message de bienvenue personnalisé
- Agenda du jour avec liste de rendez-vous
- Boutons d'action pour chaque rendez-vous (Reschedule, Change attendance)
- Calendrier mensuel interactif
- Section "Invitations" avec boutons RSVP
- Statistiques de réunions (Insights)
- Actions rapides : Start/Join/Schedule meeting

**Layout** :
- Colonne gauche : Navigation
- Colonne centrale : Agenda et calendrier
- Colonne droite : Actions et insights

### 4. Gestion des Documents (`/demo/documents`)
**Inspiration** : Upthrom

**Composants clés** :
- Hero banner avec image d'arrière-plan (énergie verte/immobilier)
- Barre de recherche proéminente
- Filtres par catégorie (tabs horizontaux)
- Liste de documents avec :
  - Icônes de type de document
  - Statut de vérification (New, Verification awaited)
  - Dates importantes
  - Actions rapides
- Calendrier pour sélection de dates
- Sidebar avec filtres avancés

**Sections** :
1. **Hero** : Recherche et contexte visuel
2. **Navigation** : Tabs pour catégories
3. **Liste** : Documents avec détails
4. **Sidebar** : Filtres et calendrier

## Stack Technique

### Technologies utilisées
- **Next.js 16** : App Router avec Server Components
- **React 19** : Dernières fonctionnalités
- **TypeScript** : Type safety strict
- **Tailwind CSS** : Styling utility-first
- **Lucide React** : Icônes modernes

### Composants réutilisables
- `Card` : Conteneur de base avec variants
- `Button` : Boutons avec variants (primary, outline, ghost)
- `Badge` : Tags de statut colorés
- `Avatar` : Photos de profil avec fallback
- `Calendar` : Composant calendrier interactif
- `StatsCard` : Cartes de statistiques
- `KanbanColumn` : Colonnes pour le board
- `DocumentCard` : Cartes de documents

## Palette de Couleurs

### Couleurs principales
```css
--primary: #4F46E5 (Indigo)
--success: #10B981 (Green)
--warning: #F59E0B (Amber)
--danger: #EF4444 (Red)
--neutral: #6B7280 (Gray)
```

### Couleurs de fond
```css
--bg-primary: #FFFFFF
--bg-secondary: #F9FAFB
--bg-tertiary: #F3F4F6
```

### Dégradés
```css
--gradient-pink: linear-gradient(135deg, #FFF1F2 0%, #FECDD3 100%)
--gradient-blue: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)
--gradient-green: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)
```

## Organisation des Fichiers

```
apps/web/src/app/[locale]/demo/
├── layout.tsx                 # Layout commun avec navigation
├── dashboard/
│   └── page.tsx              # Dashboard principal
├── transactions/
│   └── page.tsx              # Board Kanban
├── calendar/
│   └── page.tsx              # Calendrier et rendez-vous
└── documents/
    └── page.tsx              # Gestion des documents

apps/web/src/components/demo/
├── DemoNav.tsx               # Navigation latérale
├── DashboardStats.tsx        # Statistiques dashboard
├── KanbanBoard.tsx           # Board de transactions
├── CalendarWidget.tsx        # Widget calendrier
├── DocumentList.tsx          # Liste de documents
└── QuickActions.tsx          # Actions rapides
```

## Responsive Design

### Breakpoints
- **Mobile** : < 640px (1 colonne)
- **Tablet** : 640px - 1024px (2 colonnes)
- **Desktop** : > 1024px (3-4 colonnes)

### Adaptations
- Navigation : Hamburger menu sur mobile
- Grilles : Colonnes réduites sur mobile
- Sidebar : Drawer sur mobile
- Calendrier : Vue compacte sur mobile

## Accessibilité

- Contraste WCAG AA minimum
- Navigation au clavier complète
- ARIA labels sur tous les éléments interactifs
- Focus visible sur tous les éléments
- Textes alternatifs sur les images

## Performance

- Server Components par défaut
- Images optimisées avec next/image
- Lazy loading des composants lourds
- Memoization des composants statiques
- Code splitting automatique

## Prochaines Étapes

1. ✅ Créer la structure des dossiers
2. ✅ Développer les composants réutilisables
3. ✅ Implémenter les 4 pages démo
4. ⏳ Ajouter les animations et transitions
5. ⏳ Tests responsive sur tous les devices
6. ⏳ Validation accessibilité
