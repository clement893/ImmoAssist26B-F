# Dashboard V2 Style Tokens - Référence Complète

Ce document contient tous les tokens de style utilisés dans le dashboard-v2 pour faciliter la migration.

## Typographie

### Tailles de Police

```typescript
// Grands titres (Hero)
'text-5xl font-light'      // 48px, font-weight 300 - Ex: Dates importantes
'text-3xl font-light'      // 30px, font-weight 300 - Ex: "Hey, Need help? 👋"
'text-2xl font-semibold'   // 24px, font-weight 600 - Ex: Montants, statistiques
'text-xl font-light'        // 20px, font-weight 300 - Ex: Sous-titres
'text-lg font-semibold'    // 18px, font-weight 600 - Ex: Titres de section
'text-sm font-medium'       // 14px, font-weight 500 - Ex: Texte principal
'text-xs text-gray-500'     // 12px, couleur grise - Ex: Labels, métadonnées
```

### Hiérarchie Typographique

```typescript
// Page Title
className="text-xl font-semibold text-gray-900"

// Page Subtitle
className="text-sm text-gray-500"

// Section Title
className="text-lg font-semibold text-gray-900"

// Section Subtitle
className="text-xs text-gray-500"

// Card Title
className="text-sm font-medium text-gray-900"

// Card Value (Numbers)
className="text-2xl font-semibold text-gray-900"

// Card Label
className="text-xs text-gray-500 mb-2"

// Button Text
className="text-sm font-medium"

// Input Text
className="text-sm text-gray-900"
```

## Couleurs

### Palette Principale

```typescript
// Backgrounds
'bg-gray-100'    // Fond principal de page (#F3F4F6)
'bg-white'       // Fond des cards (#FFFFFF)
'bg-gray-50'     // Fond des inputs, hover states (#F9FAFB)
'bg-black'       // Boutons noirs, logo (#000000)

// Text Colors
'text-gray-900'  // Texte principal (#111827)
'text-gray-500'  // Texte secondaire (#6B7280)
'text-gray-400'  // Texte tertiaire (#9CA3AF)
'text-white'     // Texte sur fond sombre (#FFFFFF)

// Accent Colors
'bg-blue-500'    // Bleu primaire (#3B82F6)
'bg-blue-600'    // Bleu primaire hover (#2563EB)
'bg-green-500'   // Vert succès (#10B981)
'bg-green-600'   // Vert succès hover (#059669)

// Borders
'border-gray-100' // Bordures subtiles (#F3F4F6)
'border-gray-200' // Bordures plus visibles (#E5E7EB)
```

### Gradients

```typescript
// Gradient Primary (Bleu)
'bg-gradient-to-r from-blue-500 to-blue-600'

// Gradient Success (Bleu-Vert)
'bg-gradient-to-r from-blue-500 to-green-500'

// Gradient Background (Subtle)
'bg-gradient-to-br from-blue-50 to-blue-100'
```

## Border Radius

```typescript
'rounded-3xl'    // 24px - Cards principales
'rounded-2xl'     // 16px - Boutons, inputs, éléments moyens
'rounded-xl'     // 12px - Éléments plus petits (rare)
'rounded-full'   // 9999px - Boutons icon, badges circulaires
```

## Espacements

### Padding

```typescript
'p-8'            // 32px - Padding généreux (cards importantes)
'p-6'            // 24px - Padding standard (cards)
'p-4'            // 16px - Padding réduit
'p-2.5'          // 10px - Padding très réduit (boutons icon)
'px-6 py-4'      // Horizontal 24px, Vertical 16px (inputs)
'px-4 py-2'      // Horizontal 16px, Vertical 8px (petits éléments)
'px-3 py-1.5'    // Horizontal 12px, Vertical 6px (badges)
```

### Marges

```typescript
'mb-8'           // 32px - Marge grande (sections)
'mb-6'           // 24px - Marge moyenne (sections)
'mb-4'           // 16px - Marge standard (éléments)
'mb-2'           // 8px - Marge petite (labels)
```

### Gaps

```typescript
'gap-6'          // 24px - Gap entre cards
'gap-4'          // 16px - Gap entre éléments
'gap-3'          // 12px - Gap réduit
'gap-2'          // 8px - Gap très réduit
'gap-1'          // 4px - Gap minimal
```

### Espacement Vertical

```typescript
'space-y-6'      // 24px entre enfants verticaux
'space-y-4'      // 16px entre enfants verticaux
```

## Ombres

```typescript
'shadow-sm'      // Ombre légère (cards par défaut)
'shadow-md'      // Ombre moyenne (hover cards)
'shadow-lg'      // Ombre grande (hover boutons importants)
```

## Transitions

```typescript
'transition-shadow'           // Transition pour les ombres
'transition-colors'           // Transition pour les couleurs
'transition-all duration-200' // Transition générale (200ms)
```

## Layout

### Conteneurs

```typescript
// Page Container
'min-h-screen bg-gray-100 p-8'

// Content Container
'max-w-[1400px] mx-auto'

// Grid Container
'grid grid-cols-12 gap-6'

// Column Spans
'col-span-3'     // Colonne gauche (25%)
'col-span-6'     // Colonne centrale (50%)
'col-span-12'    // Pleine largeur (100%)
```

## Composants Complets

### Card Standard

```typescript
className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
```

### Card avec Header

```typescript
<div className="bg-white rounded-3xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-semibold text-gray-900">Titre</h3>
    <button className="text-xs text-gray-500">Action ▾</button>
  </div>
  {/* Contenu */}
</div>
```

### Card avec Séparateur

```typescript
<div className="bg-white rounded-3xl p-6 shadow-sm">
  {/* Contenu principal */}
  <div className="pt-4 border-t border-gray-100">
    {/* Contenu séparé */}
  </div>
</div>
```

### Bouton Primaire Gradient

```typescript
className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
```

### Bouton Secondaire

```typescript
className="flex-1 bg-gray-100 text-gray-900 rounded-full py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
```

### Bouton Noir

```typescript
className="flex-1 bg-black text-white rounded-full py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
```

### Bouton Icon Circulaire

```typescript
className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
```

### Input

```typescript
className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
```

### Badge

```typescript
// Badge standard
className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full"

// Badge coloré
className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full"
```

### User Profile Card

```typescript
className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm"
```

### Logo

```typescript
className="bg-black rounded-full w-14 h-14 flex items-center justify-center"
// Avec texte
<span className="text-white font-bold text-lg">IA</span>
```

## Patterns de Layout

### Header Pattern

```typescript
<div className="flex items-center justify-between mb-8">
  <div className="flex items-center gap-4">
    {/* Logo */}
    <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center">
      <span className="text-white font-bold text-lg">IA</span>
    </div>
    {/* Titre */}
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Titre</h1>
      <p className="text-sm text-gray-500">Sous-titre</p>
    </div>
  </div>
  {/* Actions */}
  <div className="flex items-center gap-4">
    {/* Boutons */}
  </div>
</div>
```

### Stats Card Pattern

```typescript
<div className="bg-white rounded-3xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    {/* Icon ou action */}
    <button className="p-2 bg-gray-50 rounded-full">
      <Icon className="w-4 h-4 text-gray-700" />
    </button>
    {/* Label optionnel */}
    <span className="text-xs text-gray-500">Label ▾</span>
  </div>
  {/* Label */}
  <p className="text-xs text-gray-500 mb-2">Total income</p>
  {/* Valeur */}
  <p className="text-2xl font-semibold text-gray-900 mb-4">$ 485.0K</p>
  {/* Séparateur et info additionnelle */}
  <div className="pt-4 border-t border-gray-100">
    <p className="text-xs text-gray-500 mb-2">Total paid</p>
    <p className="text-lg font-semibold text-gray-900">$ 8,145.20</p>
  </div>
</div>
```

### Activity Item Pattern

```typescript
<div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
  {/* Icon */}
  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
    <Icon className="w-5 h-5 text-blue-600" />
  </div>
  {/* Contenu */}
  <div className="flex-1">
    <p className="text-sm font-medium text-gray-900">Titre</p>
    <p className="text-xs text-gray-500">Description</p>
  </div>
  {/* Métadonnées */}
  <div className="text-right">
    <p className="text-xs text-gray-500">Temps</p>
  </div>
</div>
```

## Responsive Breakpoints

Le style dashboard-v2 utilise principalement :
- Desktop : Layout en grid 12 colonnes
- Mobile : Stack vertical avec `col-span-12`

Pour mobile, réduire :
- Padding : `p-8` → `p-4`
- Gap : `gap-6` → `gap-4`
- Text sizes : Conserver mais ajuster si nécessaire

## Dark Mode (Si applicable)

Pour le dark mode, adapter :
- `bg-white` → `bg-gray-900` ou `bg-neutral-900`
- `bg-gray-100` → `bg-gray-950` ou `bg-neutral-950`
- `text-gray-900` → `text-gray-100`
- `text-gray-500` → `text-gray-400`
- `border-gray-100` → `border-gray-800`

## Checklist de Migration par Composant

Pour chaque composant à migrer :

- [ ] Border radius adapté (`rounded-3xl` pour cards, `rounded-2xl` pour boutons)
- [ ] Typographie mise à jour (font-light pour grands titres, font-semibold pour valeurs)
- [ ] Couleurs adaptées (gray-900 pour texte principal, gray-500 pour secondaire)
- [ ] Espacements ajustés (p-6 ou p-8 pour cards, gap-6 pour grid)
- [ ] Ombres appliquées (shadow-sm avec hover:shadow-md)
- [ ] Transitions ajoutées (transition-shadow, transition-colors)
- [ ] Responsive vérifié (mobile avec padding réduit)
