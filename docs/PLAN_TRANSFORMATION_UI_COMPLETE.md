# Plan Complet de Transformation UI - Style Dashboard V2 & Transaction Detail

## Vue d'ensemble

Ce document décrit le plan exhaustif pour appliquer le style moderne et minimaliste des pages de démo (`dashboard-v2`, `transaction-detail`, `transactions`, `documents`, `calendar`) à **TOUTE** la plateforme ImmoAssist.

## Analyse Complète des Styles de Référence

### Pages de Référence

1. **Dashboard V2** (`/demo/dashboard-v2`)
   - Style minimaliste avec cards arrondies
   - Typographie légère (font-light)
   - Grid layout 12 colonnes

2. **Transaction Detail** (`/demo/transaction-detail`)
   - Progress bar horizontale avec steps
   - Tabs modernes avec indicateur
   - Cards avec séparateurs
   - Timeline d'activité

3. **Transactions Board** (`/demo/transactions`)
   - Vue Kanban avec colonnes
   - Cards de transaction avec avatars
   - Labels colorés

4. **Documents** (`/demo/documents`)
   - Hero section avec gradient
   - Calendar intégré
   - Liste de documents avec statuts

5. **Calendar** (`/demo/calendar`)
   - Agenda du jour
   - Calendar grid
   - Invitations

## Système de Design Unifié

### 1. Typographie Complète (SYSTÈME COMPLET)

#### Hiérarchie Typographique Complète

```typescript
// ===== HERO TITLES (Pages principales) =====
'text-4xl font-light'      // 36px, weight 300 - Ex: "Document Management"
'text-3xl font-light'      // 30px, weight 300 - Ex: "Good morning, John!", "Transactions Board"
'text-2xl font-semibold'   // 24px, weight 600 - Ex: "Transaction Details"

// ===== PAGE TITLES =====
'text-3xl font-light'      // 30px, weight 300 - Ex: Titres de page principaux
'text-2xl font-semibold'   // 24px, weight 600 - Ex: "Transaction Details"
'text-xl font-semibold'     // 20px, weight 600 - Ex: "Real Estate" (Header)
'text-lg font-normal'       // 18px, weight 400 - Ex: "Before/After" (Menu Demo)

// ===== SECTION TITLES =====
'text-lg font-semibold'     // 18px, weight 600 - Ex: "Property details", "Transaction progress"
'text-base font-semibold'   // 16px, weight 600 - Ex: "Current step: Inspection"
'text-sm font-semibold'     // 14px, weight 600 - Ex: "Client", "Agent", "Main Account"

// ===== CARD TITLES & LABELS =====
'text-sm font-semibold'     // 14px, weight 600 - Ex: "Main Account"
'text-sm font-medium'       // 14px, weight 500 - Ex: "John Doe", "Dashboard" (menu actif)
'text-sm font-normal'       // 14px, weight 400 - Ex: Descriptions dans cards
'text-sm font-light'        // 14px, weight 300 - Ex: "Transactions" (menu inactif)

// ===== VALUES & NUMBERS =====
'text-5xl font-light'       // 48px, weight 300 - Ex: Grands nombres (dates importantes)
'text-3xl font-semibold'    // 30px, weight 600 - Ex: "13 Days"
'text-2xl font-semibold'    // 24px, weight 600 - Ex: "$ 485.0K", "19" (stats)
'text-lg font-semibold'     // 18px, weight 600 - Ex: "$ 8,145.20", "**** 2719"

// ===== BODY TEXT =====
'text-sm font-medium'       // 14px, weight 500 - Ex: Texte principal, boutons
'text-sm font-normal'       // 14px, weight 400 - Ex: Descriptions, contenu
'text-sm font-light'        // 14px, weight 300 - Ex: Items menu inactifs
'text-xs font-medium'       // 12px, weight 500 - Ex: Badges, labels petits
'text-xs font-normal'       // 12px, weight 400 - Ex: Métadonnées
'text-xs font-light'        // 12px, weight 300 - Ex: Labels très secondaires

// ===== SUBTITLES & SECONDARY TEXT =====
'text-xl font-light'        // 20px, weight 300 - Ex: "Just ask me anything!"
'text-sm text-gray-500'     // 14px, gray - Ex: "Dashboard" (sous-titre)
'text-xs text-gray-500'     // 12px, gray - Ex: Labels, métadonnées
'text-xs text-gray-400'     // 12px, gray light - Ex: Dates secondaires, texte très secondaire

// ===== MENU NAVIGATION =====
// Items actifs
'text-sm font-medium'       // 14px, weight 500 - Ex: "Dashboard" (menu actif)

// Items inactifs
'text-sm font-light'        // 14px, weight 300 - Ex: "Transactions" (menu inactif)
'text-gray-600'            // Couleur pour items inactifs

// ===== BOUTONS =====
'text-sm font-medium'       // 14px, weight 500 - TOUJOURS pour boutons

// ===== FORMULAIRES =====
'text-sm font-medium'       // 14px, weight 500 - Labels de champs
'text-sm font-normal'       // 14px, weight 400 - Valeurs dans inputs
'text-xs text-gray-500'     // 12px, gray - Messages d'aide, erreurs
```

#### Règles Typographiques

1. **Font-Light (300)** : Utilisé pour :
   - Grands titres de page (`text-3xl`, `text-4xl`)
   - Items de menu inactifs
   - Sous-titres élégants
   - Grands nombres (dates importantes)

2. **Font-Normal (400)** : Utilisé pour :
   - Headings dans certaines sections (`text-lg font-normal`)
   - Descriptions et contenu normal
   - Métadonnées

3. **Font-Medium (500)** : Utilisé pour :
   - **TOUS les boutons** (`text-sm font-medium`)
   - Items de menu actifs
   - Texte principal dans cards
   - Labels de formulaires

4. **Font-Semibold (600)** : Utilisé pour :
   - Titres de sections (`text-lg font-semibold`)
   - Valeurs importantes (prix, nombres)
   - Titres de cards (`text-sm font-semibold`)

5. **Font-Bold (700)** : Utilisé pour :
   - Logo text (`font-bold text-lg`)
   - Accents très importants (rare)

### 2. Couleurs Complètes

#### Palette Principale

```typescript
// Backgrounds
'bg-gray-100'              // Fond principal (#F3F4F6)
'bg-white'                 // Cards (#FFFFFF)
'bg-gray-50'               // Inputs, hover states (#F9FAFB)
'bg-black'                 // Boutons noirs, logo (#000000)

// Text Colors
'text-gray-900'            // Texte principal (#111827)
'text-gray-600'            // Texte secondaire (#4B5563)
'text-gray-500'            // Texte tertiaire (#6B7280)
'text-gray-400'            // Texte quaternaire (#9CA3AF)
'text-white'               // Texte sur fond sombre

// Accent Colors
'bg-blue-500'              // Bleu primaire (#3B82F6)
'bg-blue-600'              // Bleu primaire hover (#2563EB)
'bg-blue-100'              // Fond bleu clair (#DBEAFE)
'text-blue-600'            // Texte bleu (#2563EB)
'text-blue-700'            // Texte bleu foncé (#1D4ED8)

'bg-green-500'             // Vert succès (#10B981)
'bg-green-600'             // Vert succès hover (#059669)
'bg-green-100'             // Fond vert clair (#D1FAE5)
'text-green-600'           // Texte vert (#059669)
'text-green-700'           // Texte vert foncé (#047857)

// Status Colors
'bg-red-100 text-red-600'  // Urgent, Error
'bg-amber-100 text-amber-600' // Warning, Pending
'bg-purple-100 text-purple-600' // Special
'bg-teal-100 text-teal-600' // Info
'bg-indigo-100 text-indigo-600' // Analysis

// Borders
'border-gray-100'           // Bordures subtiles (#F3F4F6)
'border-gray-200'          // Bordures visibles (#E5E7EB)
'border-blue-100'          // Bordures accent (#DBEAFE)
```

#### Gradients

```typescript
// Primary Gradients
'bg-gradient-to-r from-blue-500 to-blue-600'
'bg-gradient-to-r from-blue-500 to-green-500'
'bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500' // Hero sections

// Background Gradients
'bg-gradient-to-br from-blue-50 to-blue-100'
'bg-gradient-to-t from-blue-500 to-blue-400' // Chart bars
```

### 3. Border Radius Système

```typescript
'rounded-3xl'    // 24px - Cards principales, containers majeurs
'rounded-2xl'    // 16px - Boutons, inputs, cards secondaires, tabs
'rounded-xl'     // 12px - Petits éléments, badges (rare)
'rounded-full'   // 9999px - Boutons icon, avatars, badges circulaires
```

### 4. Espacements Système

#### Padding

```typescript
'p-10'           // 40px - Padding page (rare)
'p-8'            // 32px - Padding cards importantes, conteneur page
'p-6'            // 24px - Padding cards standard
'p-4'            // 16px - Padding réduit
'p-2.5'          // 10px - Padding très réduit (boutons icon)

// Padding spécifiques
'px-6 py-4'      // Inputs (24px horizontal, 16px vertical)
'px-4 py-2'      // Petits boutons (16px horizontal, 8px vertical)
'px-3 py-1.5'    // Badges (12px horizontal, 6px vertical)
```

#### Marges

```typescript
'mb-10'          // 40px - Marge très grande (sections majeures)
'mb-8'           // 32px - Marge grande (sections)
'mb-6'           // 24px - Marge moyenne (sections)
'mb-4'           // 16px - Marge standard (éléments)
'mb-2'           // 8px - Marge petite (labels)
```

#### Gaps

```typescript
'gap-8'          // 32px - Gap très grand (sections)
'gap-6'          // 24px - Gap entre cards, grid
'gap-4'          // 16px - Gap entre éléments
'gap-3'          // 12px - Gap réduit
'gap-2'          // 8px - Gap très réduit
'gap-1'          // 4px - Gap minimal
```

### 5. Ombres Système

```typescript
'shadow-sm'      // Ombre légère (cards par défaut)
'shadow-md'      // Ombre moyenne (hover cards)
'shadow-lg'      // Ombre grande (hover boutons importants)
'shadow-xl'      // Ombre très grande (modals, dropdowns)
'shadow-2xl'     // Ombre énorme (rare)

// Ombres colorées
'shadow-lg shadow-blue-500/30'  // Ombre bleue
'shadow-lg shadow-green-200'    // Ombre verte
```

### 6. Transitions Système

```typescript
'transition-shadow'           // Pour les ombres
'transition-colors'           // Pour les couleurs
'transition-all duration-200' // Transition générale (200ms)
'transition-all duration-300' // Transition lente (300ms)
'transition-transform duration-300' // Pour les transforms
```

## Patterns de Composants Identifiés

### Pattern 0: Menu/Sidebar Navigation (Menu Demo)

```typescript
// Structure Menu Item
<div className="space-y-2">
  {/* Item Actif */}
  <div className="flex items-center gap-4 px-5 py-3.5 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/30">
    <Icon className="w-5 h-5" />
    <span className="text-sm font-medium">Dashboard</span>
  </div>
  
  {/* Item Inactif */}
  <div className="flex items-center gap-4 px-5 py-3.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200">
    <Icon className="w-5 h-5 text-gray-400" />
    <span className="text-sm font-light">Transactions</span>
  </div>
</div>

// Sidebar Container
<div className="bg-white rounded-xl p-6 shadow-sm">
  {/* Menu items */}
</div>
```

**Caractéristiques Menu** :
- **Items actifs** : `bg-blue-500 text-white font-medium shadow-md shadow-blue-500/30`
- **Items inactifs** : `text-gray-600 font-light hover:bg-gray-50`
- **Spacing** : `gap-4` entre icon et texte, `px-5 py-3.5` pour padding
- **Border radius** : `rounded-xl` (12px)
- **Transitions** : `transition-all duration-200`
- **Sidebar** : `bg-white rounded-xl p-6 shadow-sm`

### Pattern 1: Progress Bar Horizontale (Transaction Detail)

```typescript
// Structure
<div className="bg-white rounded-3xl p-8 shadow-sm">
  <div className="relative mb-12">
    {/* Ligne de progression */}
    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
    <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500" style={{ width: 'X%' }}></div>
    
    {/* Steps */}
    <div className="relative flex justify-between">
      {steps.map(step => (
        <div className="flex flex-col items-center" style={{ width: 'X%' }}>
          {/* Circle */}
          <div className={`w-10 h-10 rounded-full ${
            step.status === 'completed' ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
            step.status === 'in_progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100' :
            'bg-white border-2 border-gray-200 text-gray-400'
          }`}>
            {/* Icon */}
          </div>
          {/* Labels */}
          <div className="mt-4 text-center">
            <p className="text-xs font-medium mb-1">{step.title}</p>
            <p className="text-xs text-gray-400">{step.date}</p>
            <p className="text-xs text-gray-500 mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
  
  {/* Current Step Details */}
  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
    {/* Contenu étape actuelle */}
  </div>
</div>
```

### Pattern 2: Tabs Modernes (Transaction Detail)

```typescript
// Structure
<div className="bg-white rounded-3xl shadow-sm overflow-hidden">
  {/* Tabs Header */}
  <div className="border-b border-gray-200">
    <div className="flex">
      {tabs.map(tab => (
        <button className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
          activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <Icon className="w-4 h-4" />
            {tab.label}
          </div>
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
          )}
        </button>
      ))}
    </div>
  </div>
  
  {/* Tab Content */}
  <div className="p-8">
    {/* Contenu */}
  </div>
</div>
```

### Pattern 3: Cards avec Informations (Transaction Detail)

```typescript
// Property/Client/Agent Info Card
<div className="bg-gray-50 rounded-2xl p-6">
  <h3 className="text-sm font-semibold text-gray-900 mb-4">Client</h3>
  <div className="flex items-center gap-4 mb-4">
    <img src={avatar} className="w-12 h-12 rounded-full" />
    <div>
      <p className="text-sm font-medium text-gray-900">{name}</p>
      <p className="text-xs text-gray-500">{role}</p>
    </div>
  </div>
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Mail className="w-4 h-4" />
      {email}
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Phone className="w-4 h-4" />
      {phone}
    </div>
  </div>
  <div className="flex gap-2 mt-4">
    <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
      <MessageSquare className="w-4 h-4 inline mr-1" />
      Message
    </button>
    <button className="flex-1 px-3 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
      <Phone className="w-4 h-4 inline mr-1" />
      Call
    </button>
  </div>
</div>
```

### Pattern 4: Document List Item

```typescript
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
      <FileText className="w-6 h-6 text-blue-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
      <p className="text-xs text-gray-500">
        {doc.type} • {doc.size} • Uploaded {doc.uploadedAt}
      </p>
    </div>
  </div>
  <div className="flex items-center gap-3">
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
      doc.status === 'signed' ? 'bg-green-100 text-green-700' :
      doc.status === 'approved' ? 'bg-blue-100 text-blue-700' :
      'bg-gray-100 text-gray-600'
    }`}>
      {doc.status}
    </span>
    <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
      <Download className="w-4 h-4 text-gray-600" />
    </button>
  </div>
</div>
```

### Pattern 5: Activity Timeline Item

```typescript
<div className="flex gap-4">
  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
    <Icon className="w-5 h-5 text-gray-600" />
  </div>
  <div className="flex-1 bg-gray-50 rounded-2xl p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium text-gray-900">
        {user} <span className="font-normal text-gray-600">{action}</span>
      </p>
      <p className="text-xs text-gray-500">{timestamp}</p>
    </div>
    <p className="text-sm text-gray-700">{content}</p>
  </div>
</div>
```

### Pattern 6: Hero Section avec Gradient (Documents)

```typescript
<div className="bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 px-10 py-16">
  <div className="max-w-4xl">
    <h1 className="text-4xl font-light text-white mb-4">
      Document Management
    </h1>
    <p className="text-lg font-light text-white/90 mb-8">
      Manage all your real estate documents in one place
    </p>
    
    {/* Search Bar */}
    <div className="relative">
      <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
      <input
        type="text"
        className="w-full pl-16 pr-6 py-5 bg-white rounded-2xl shadow-lg text-base font-light text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </div>
  </div>
</div>
```

### Pattern 7: Kanban Column (Transactions Board)

```typescript
<div className="flex-shrink-0 w-80">
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    {/* Column Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
          {count}
        </span>
      </div>
      <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>
    </div>
    
    {/* Cards */}
    <div className="space-y-4">
      {cards.map(card => (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          {/* Card content */}
        </div>
      ))}
    </div>
  </div>
</div>
```

## Plan de Transformation Complet

### Phase 1 : Foundation & Design System (Semaine 1)

#### 1.1 Configuration Tailwind
**Fichiers** :
- `apps/web/tailwind.config.ts`

**Modifications** :
- Ajouter toutes les tailles de police avec font-weight appropriés
- Ajouter border-radius système (rounded-3xl, rounded-2xl)
- Configurer les couleurs complètes
- Ajouter les transitions

#### 1.2 Theme Configuration
**Fichiers** :
- `apps/web/src/lib/theme/default-theme-config.ts`
- `backend/app/core/theme_defaults.py`

**Modifications** :
- Mettre à jour typographie complète
- Mettre à jour palette de couleurs
- Configurer border radius
- Configurer espacements

#### 1.3 Design Tokens
**Fichiers** :
- `apps/web/src/components/ui/tokens.ts`

**Modifications** :
- Créer tokens pour tous les styles dashboard-v2
- Tokens pour progress bars
- Tokens pour tabs
- Tokens pour cards variants

### Phase 2 : Composants UI de Base (Semaine 1-2)

#### 2.1 Button Component (TOUS LES VARIANTS)
**Fichier** : `apps/web/src/components/ui/Button.tsx`

**Transformations** :

**Variant Gradient (Primaire)** :
```typescript
className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-medium hover:shadow-lg transition-shadow"
```

**Variant Noir** :
```typescript
className="bg-black text-white rounded-full py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
```

**Variant Blanc/Secondaire** :
```typescript
className="bg-white text-gray-700 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
// ou
className="bg-gray-100 text-gray-900 rounded-full py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
```

**Variant Petit (Icon)** :
```typescript
className="p-2.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
```

**Variant Rounded-xl (Dans cards)** :
```typescript
className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
```

**Caractéristiques** :
- Typographie : `text-sm font-medium` (toujours)
- Border radius : `rounded-2xl` (16px) pour boutons standards, `rounded-xl` (12px) dans cards, `rounded-full` pour boutons icon/noir
- Shadows : `shadow-sm` par défaut, `hover:shadow-lg` pour gradients
- Transitions : `transition-shadow` ou `transition-colors`

#### 2.2 Card Component
**Fichier** : `apps/web/src/components/ui/Card.tsx`

**Transformations** :
- Border radius : `rounded-3xl` par défaut
- Shadow : `shadow-sm` avec `hover:shadow-md`
- Padding : `p-6` ou `p-8` selon contexte
- Variants pour différents usages

#### 2.3 Input Component
**Fichier** : `apps/web/src/components/ui/Input.tsx`

**Transformations** :
- Border radius : `rounded-2xl`
- Background : `bg-gray-50`
- Padding : `px-6 py-4`
- Focus ring : `focus:ring-2 focus:ring-blue-500`

#### 2.4 Badge Component
**Fichier** : `apps/web/src/components/ui/Badge.tsx`

**Transformations** :
- Border radius : `rounded-full`
- Padding : `px-3 py-1.5`
- Text size : `text-xs`
- Variants colorés avec bg-*-100 text-*-600

#### 2.5 Tabs Component
**Fichier** : `apps/web/src/components/ui/Tabs.tsx`

**Transformations** :
- Style moderne avec indicateur en bas
- Border radius : `rounded-3xl` pour container
- Active state : `text-blue-600` avec ligne bleue
- Padding : `px-6 py-4`

#### 2.6 Select, Textarea, Checkbox, Radio
**Transformations** :
- Même style que Input (rounded-2xl, bg-gray-50)
- Focus rings cohérents

### Phase 3 : Composants Spécialisés (Semaine 2)

#### 3.1 Progress Bar / Stepper
**Fichiers** :
- `apps/web/src/components/ui/Progress.tsx`
- `apps/web/src/components/ui/Stepper.tsx`
- `apps/web/src/components/transactions/StatusStepper.tsx`

**Transformations** :
- Style horizontal avec gradient
- Steps avec cercles colorés
- Shadows sur steps actifs
- Ring sur step in_progress

#### 3.2 Table Component
**Fichier** : `apps/web/src/components/ui/Table.tsx`

**Transformations** :
- Container : `bg-white rounded-3xl shadow-sm`
- Header : `bg-gray-50` avec `text-sm font-semibold`
- Rows : `hover:bg-gray-50 rounded-2xl`
- Padding cells : `px-6 py-4`

#### 3.3 StatsCard Component
**Fichier** : `apps/web/src/components/ui/StatsCard.tsx`

**Transformations** :
- Style dashboard-v2 complet
- Séparateurs avec `border-t border-gray-100`
- Typographie avec font-light pour grands nombres

#### 3.4 DataTable Component
**Fichier** : `apps/web/src/components/ui/DataTableEnhanced.tsx`

**Transformations** :
- Appliquer style Table
- Filters avec style dashboard-v2
- Pagination avec style moderne

### Phase 4 : Composants de Layout (Semaine 2-3)

#### 4.1 Header Component
**Fichier** : `apps/web/src/components/layout/Header.tsx`

**Transformations** :
- Logo : `bg-black rounded-full w-14 h-14`
- Titre : `text-xl font-semibold text-gray-900`
- Sous-titre : `text-sm text-gray-500`
- Boutons actions : `p-2.5 bg-white rounded-full shadow-sm`

#### 4.2 Sidebar Component (CRITIQUE - Menu Demo Style)
**Fichiers** :
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/components/ui/Sidebar.tsx`

**Transformations** :
- **Container** : `bg-white rounded-xl p-6 shadow-sm`
- **Items actifs** : 
  - `bg-blue-500 text-white font-medium`
  - `rounded-xl shadow-md shadow-blue-500/30`
  - `px-5 py-3.5 gap-4`
- **Items inactifs** :
  - `text-gray-600 font-light`
  - `hover:bg-gray-50 rounded-xl`
  - `transition-all duration-200`
  - `px-5 py-3.5 gap-4`
- **Icons** : `w-5 h-5` avec `text-gray-400` pour inactifs
- **Spacing** : `space-y-2` entre items
- **Pas de bordures** : Utiliser seulement shadows

#### 4.3 PageHeader Component
**Fichier** : `apps/web/src/components/layout/PageHeader.tsx`

**Transformations** :
- Titre : `text-3xl font-light` ou `text-2xl font-semibold`
- Sous-titre : `text-xl font-light text-gray-400` ou `text-sm text-gray-500`
- Actions : Boutons avec style dashboard-v2

#### 4.4 DashboardLayout Component
**Fichier** : `apps/web/src/components/layout/DashboardLayout.tsx`

**Transformations** :
- Conteneur : `min-h-screen bg-gray-100 p-8`
- Max width : `max-w-[1400px] mx-auto`
- Grid : `grid grid-cols-12 gap-6`

### Phase 5 : Composants Transactions (Semaine 3)

#### 5.1 TransactionSummaryCard
**Fichier** : `apps/web/src/components/transactions/TransactionSummaryCard.tsx`

**Transformations** :
- Style card dashboard-v2
- Typographie adaptée
- Layout avec grid

#### 5.2 TransactionTimeline
**Fichier** : `apps/web/src/components/transactions/TransactionTimeline.tsx`

**Transformations** :
- Progress bar horizontale style transaction-detail
- Steps avec cercles colorés
- Current step highlight avec bg-blue-50

#### 5.3 TransactionContactsCard
**Fichier** : `apps/web/src/components/transactions/TransactionContactsCard.tsx`

**Transformations** :
- Cards avec `bg-gray-50 rounded-2xl`
- Avatars circulaires
- Boutons Message/Call style dashboard-v2

#### 5.4 TransactionsPipelineView
**Fichier** : `apps/web/src/components/transactions/TransactionsPipelineView.tsx`

**Transformations** :
- Colonnes Kanban style transactions board
- Cards avec border et shadow
- Labels colorés avec rounded-full

#### 5.5 TransactionActionsPanel
**Fichier** : `apps/web/src/components/transactions/TransactionActionsPanel.tsx`

**Transformations** :
- Panel avec style dashboard-v2
- Boutons avec variants appropriés

### Phase 6 : Pages Principales (Semaine 3-4)

#### 6.1 Dashboard Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/page.tsx`

**Transformations** :
- Appliquer layout dashboard-v2
- Grid 12 colonnes
- Cards avec rounded-3xl
- Stats cards style dashboard-v2

#### 6.2 Transactions List Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/transactions/page.tsx`

**Transformations** :
- Header avec style dashboard-v2
- Liste ou pipeline view
- Cards de transaction

#### 6.3 Transaction Detail Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/transactions/[id]/page.tsx`

**Transformations** :
- **CRITIQUE** : Doit être identique à `/demo/transaction-detail`
- Progress bar horizontale
- Tabs modernes
- Cards avec séparateurs
- Timeline d'activité
- Layout exact de la page de démo

#### 6.4 Calendar Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/modules/calendrier/page.tsx`

**Transformations** :
- Style calendar demo
- Agenda du jour
- Calendar grid
- Cards avec rounded-2xl

#### 6.5 Documents Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/modules/documents/page.tsx`

**Transformations** :
- Hero section avec gradient (si applicable)
- Liste de documents style transaction-detail
- Cards avec statuts colorés

#### 6.6 Contacts Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/modules/reseau/page.tsx`

**Transformations** :
- Cards de contact style transaction-detail
- Layout moderne
- Boutons d'action

### Phase 7 : Composants Formulaires (Semaine 4)

#### 7.1 TransactionForm
**Fichier** : `apps/web/src/components/transactions/TransactionForm.tsx`

**Transformations** :
- Tous les inputs avec style dashboard-v2
- Sections avec cards rounded-3xl
- Boutons avec variants appropriés

#### 7.2 Tous les Formulaires
**Transformations** :
- Appliquer style dashboard-v2 partout
- Groupes de champs avec cards
- Validation avec style moderne

### Phase 8 : Composants Spécialisés Avancés (Semaine 4)

#### 8.1 KanbanBoard
**Fichier** : `apps/web/src/components/ui/KanbanBoard.tsx`

**Transformations** :
- Colonnes style transactions board
- Cards avec border et shadow
- Drag & drop avec style moderne

#### 8.2 Calendar Component
**Fichier** : `apps/web/src/components/ui/Calendar.tsx`

**Transformations** :
- Grid calendar style demo
- Days avec rounded-full
- Today highlight avec shadow

#### 8.3 Charts
**Fichier** : `apps/web/src/components/ui/Chart.tsx`

**Transformations** :
- Style dashboard-v2
- Gradients pour bars
- Typographie adaptée

#### 8.4 Modals & Dialogs
**Fichiers** :
- `apps/web/src/components/ui/Dialog.tsx`
- `apps/web/src/components/ui/Modal.tsx`

**Transformations** :
- Border radius : `rounded-3xl`
- Shadows : `shadow-xl`
- Padding : `p-8`

### Phase 9 : Autres Pages (Semaine 4-5)

#### 9.1 Settings Pages
**Transformations** :
- Layout avec cards
- Formulaires style dashboard-v2
- Sections avec séparateurs

#### 9.2 Admin Pages
**Transformations** :
- Tables style moderne
- Cards pour stats
- Formulaires cohérents

#### 9.3 Profile Pages
**Transformations** :
- Cards avec avatars
- Formulaires style dashboard-v2
- Layout moderne

### Phase 10 : Tests & Ajustements (Semaine 5)

#### 10.1 Tests Visuels
- Vérifier cohérence sur toutes les pages
- Comparer avec pages de démo
- Ajuster espacements si nécessaire

#### 10.2 Tests Responsive
- Mobile : Réduire padding (p-8 → p-4)
- Tablet : Ajuster grid
- Desktop : Vérifier max-width

#### 10.3 Tests Accessibilité
- Contraste WCAG AA
- Focus states visibles
- Navigation clavier

## Checklist Complète par Composant

### Composants UI de Base
- [ ] Button - Tous les variants dashboard-v2
- [ ] Card - rounded-3xl, shadow-sm, padding adapté
- [ ] Input - rounded-2xl, bg-gray-50, px-6 py-4
- [ ] Textarea - Même style que Input
- [ ] Select - Même style que Input
- [ ] Checkbox - Style moderne
- [ ] Radio - Style moderne
- [ ] Badge - rounded-full, variants colorés
- [ ] Tabs - Style transaction-detail
- [ ] Alert - Style moderne
- [ ] Toast - Style moderne

### Composants de Layout
- [ ] Header - Logo noir, titre/sous-titre, actions
- [ ] Sidebar - bg-white, items rounded-2xl
- [ ] PageHeader - Typographie dashboard-v2
- [ ] DashboardLayout - Grid 12 colonnes
- [ ] Footer - Style moderne

### Composants Spécialisés
- [ ] Progress - Gradient, rounded
- [ ] Stepper - Horizontal avec cercles colorés
- [ ] Table - rounded-3xl container, hover rows
- [ ] StatsCard - Style dashboard-v2 complet
- [ ] DataTable - Style Table + filters
- [ ] KanbanBoard - Colonnes style transactions board
- [ ] Calendar - Grid style demo
- [ ] Chart - Gradients, typographie

### Composants Transactions
- [ ] TransactionSummaryCard - Style dashboard-v2
- [ ] TransactionTimeline - Progress bar horizontale
- [ ] TransactionContactsCard - Cards bg-gray-50
- [ ] TransactionsPipelineView - Kanban style
- [ ] TransactionActionsPanel - Panel moderne
- [ ] TransactionForm - Tous les champs style dashboard-v2

### Pages
- [ ] Dashboard - Layout dashboard-v2 exact
- [ ] Transactions List - Header + liste/pipeline
- [ ] **Transaction Detail - IDENTIQUE à /demo/transaction-detail**
- [ ] Calendar - Style calendar demo
- [ ] Documents - Style documents demo
- [ ] Contacts - Cards style transaction-detail
- [ ] Settings - Formulaires style dashboard-v2
- [ ] Profile - Cards avec avatars

## Priorités Critiques

### Priorité CRITIQUE (Do First)
1. **Transaction Detail Page** - Doit être **EXACTEMENT** comme `/demo/transaction-detail`
2. Foundation (Tailwind config, theme)
3. Button, Card, Input (composants les plus utilisés)
4. Header, PageHeader (visible partout)

### Priorité Haute
1. Progress Bar / Stepper (pour transaction detail)
2. Tabs (pour transaction detail)
3. Table (utilisé partout)
4. TransactionsPipelineView (page principale)

### Priorité Moyenne
1. Autres composants UI
2. Autres pages
3. Formulaires

### Priorité Basse
1. Optimisations
2. Polish final
3. Animations avancées

## Guide de Migration Transaction Detail

La page Transaction Detail doit être **EXACTEMENT** identique à `/demo/transaction-detail`. 

### Éléments Critiques à Reproduire

1. **Header avec boutons**
   - Titre : `text-2xl font-semibold`
   - Bouton Edit : `bg-white rounded-2xl shadow-sm`
   - Bouton Send Update : `bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl`

2. **Progress Bar Horizontale**
   - Container : `bg-white rounded-3xl p-8 shadow-sm`
   - Ligne de progression : `h-0.5 bg-gradient-to-r from-green-500 to-blue-500`
   - Steps : Cercles `w-10 h-10` avec états (completed, in_progress, pending)
   - Current step : Ring `ring-4 ring-blue-100`
   - Labels : `text-xs font-medium` avec dates

3. **Current Step Card**
   - Background : `bg-blue-50 rounded-2xl p-6 border border-blue-100`
   - Icon : `w-12 h-12 bg-blue-500 rounded-2xl`
   - Boutons : `rounded-xl` (pas rounded-2xl)

4. **Tabs**
   - Container : `bg-white rounded-3xl shadow-sm overflow-hidden`
   - Tab buttons : `px-6 py-4 text-sm font-medium`
   - Active indicator : `h-0.5 bg-blue-500` en bas
   - Content : `p-8`

5. **Overview Tab Content**
   - Grid : `grid-cols-2 gap-6`
   - Property cards : `bg-gray-50 rounded-2xl p-6`
   - Stats cards : `bg-gray-50 rounded-2xl p-4` avec icons

6. **Documents Tab**
   - List items : `bg-gray-50 rounded-2xl p-4 hover:bg-gray-100`
   - Status badges : `rounded-full` avec couleurs
   - Icons : `w-12 h-12 bg-blue-100 rounded-xl`

7. **Activity Tab**
   - Timeline items : `bg-gray-50 rounded-2xl p-4`
   - Avatars : `w-10 h-10 bg-gray-100 rounded-full`
   - Comment input : `bg-gray-50 rounded-2xl p-4`

8. **Photos Tab**
   - Grid : `grid-cols-2 gap-6`
   - Images : `rounded-2xl` avec hover effects

## Notes Importantes

1. **Transaction Detail est CRITIQUE** - Doit être identique à la démo
2. **Cohérence** - Même style partout pour expérience unifiée
3. **Progression** - Migrer page par page pour éviter casser tout
4. **Tests** - Tester chaque page après migration
5. **Responsive** - Adapter pour mobile (padding réduit)

## Timeline Révisée

- **Semaine 1** : Foundation + Composants UI de base + Transaction Detail (CRITIQUE)
- **Semaine 2** : Composants spécialisés + Layout + Autres pages transactions
- **Semaine 3** : Pages principales (Calendar, Documents, Contacts)
- **Semaine 4** : Formulaires + Pages secondaires
- **Semaine 5** : Tests, ajustements, polish final

## Métriques de Succès

- ✅ Transaction Detail identique à `/demo/transaction-detail`
- ✅ Dashboard identique à `/demo/dashboard-v2`
- ✅ 100% des composants UI transformés
- ✅ Cohérence visuelle sur toutes les pages
- ✅ Tests responsive passés
- ✅ Accessibilité WCAG AA maintenue
