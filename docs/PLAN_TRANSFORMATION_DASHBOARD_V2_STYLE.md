# Plan de Transformation - Style Dashboard V2

## Vue d'ensemble

Ce document décrit le plan complet pour appliquer le style du dashboard-v2 (`/demo/dashboard-v2`) à l'ensemble du site ImmoAssist. Le style se caractérise par une approche minimaliste, moderne et élégante avec des bordures très arrondies, des espacements généreux et une typographie légère.

## Analyse du Style Dashboard V2

### Caractéristiques principales

#### 1. Typographie
- **Titres principaux** : `text-3xl font-light` (30px, font-weight 300)
- **Sous-titres** : `text-xl font-light` (20px, font-weight 300)
- **Titres de section** : `text-lg font-semibold` (18px, font-weight 600)
- **Texte principal** : `text-sm font-medium` (14px, font-weight 500)
- **Texte secondaire** : `text-xs text-gray-500` (12px, couleur grise)
- **Grands nombres** : `text-5xl font-light` (48px, font-weight 300)
- **Nombres moyens** : `text-2xl font-semibold` (24px, font-weight 600)
- **Nombres petits** : `text-lg font-semibold` (18px, font-weight 600)

#### 2. Couleurs
- **Fond principal** : `bg-gray-100` (#F3F4F6)
- **Cards** : `bg-white` (#FFFFFF)
- **Texte principal** : `text-gray-900` (#111827)
- **Texte secondaire** : `text-gray-500` (#6B7280)
- **Texte tertiaire** : `text-gray-400` (#9CA3AF)
- **Boutons primaires** : Gradients `from-blue-500 to-blue-600` ou `from-blue-500 to-green-500`
- **Boutons secondaires** : `bg-gray-100 text-gray-900`
- **Boutons noirs** : `bg-black text-white`
- **Bordures** : `border-gray-100` (#F3F4F6)

#### 3. Bordures arrondies
- **Cards principales** : `rounded-3xl` (24px)
- **Boutons moyens** : `rounded-2xl` (16px)
- **Boutons circulaires** : `rounded-full`
- **Inputs** : `rounded-2xl` (16px)
- **Petits éléments** : `rounded-full` (boutons icon)

#### 4. Espacements
- **Padding cards** : `p-6` (24px) ou `p-8` (32px)
- **Gap entre éléments** : `gap-4` (16px), `gap-6` (24px)
- **Marges verticales** : `mb-2` (8px), `mb-4` (16px), `mb-6` (24px), `mb-8` (32px)
- **Espacement vertical** : `space-y-6` (24px entre enfants)
- **Padding conteneur** : `p-8` (32px)

#### 5. Ombres
- **Cards** : `shadow-sm` (ombre légère)
- **Hover cards** : `hover:shadow-md` (ombre moyenne)
- **Boutons hover** : `hover:shadow-lg` (ombre grande)

#### 6. Layout
- **Conteneur principal** : `max-w-[1400px] mx-auto`
- **Grid system** : `grid-cols-12` avec `col-span-3`, `col-span-6`, `col-span-12`
- **Gap grid** : `gap-6` (24px)

#### 7. Transitions
- **Toutes les interactions** : `transition-all duration-200` ou `transition-shadow`
- **Hover smooth** : `hover:bg-gray-100`, `hover:bg-gray-200`

## Plan de Transformation par Composant

### Phase 1 : Système de Design Foundation

#### 1.1 Typographie
**Fichiers à modifier** :
- `apps/web/src/lib/theme/default-theme-config.ts`
- `apps/web/tailwind.config.ts`
- `apps/web/src/components/ui/tokens.ts`

**Modifications** :
```typescript
// Ajouter dans tailwind.config.ts
fontSize: {
  // Dashboard V2 Style
  '5xl': ['48px', { lineHeight: '56px', fontWeight: '300' }], // font-light
  '3xl': ['30px', { lineHeight: '36px', fontWeight: '300' }], // font-light
  '2xl': ['24px', { lineHeight: '32px', fontWeight: '600' }], // font-semibold
  'xl': ['20px', { lineHeight: '28px', fontWeight: '300' }], // font-light
  'lg': ['18px', { lineHeight: '26px', fontWeight: '600' }], // font-semibold
  'base': ['16px', { lineHeight: '24px', fontWeight: '400' }],
  'sm': ['14px', { lineHeight: '20px', fontWeight: '500' }], // font-medium
  'xs': ['12px', { lineHeight: '16px', fontWeight: '400' }],
}

// Ajouter font-weight light
fontWeight: {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

#### 1.2 Couleurs
**Fichiers à modifier** :
- `apps/web/src/lib/theme/default-theme-config.ts`

**Modifications** :
```typescript
colors: {
  background: '#F3F4F6', // bg-gray-100
  foreground: '#111827', // text-gray-900
  card: '#FFFFFF',
  cardForeground: '#111827',
  muted: '#6B7280', // text-gray-500
  mutedForeground: '#9CA3AF', // text-gray-400
  // ... autres couleurs
}
```

#### 1.3 Border Radius
**Fichiers à modifier** :
- `apps/web/tailwind.config.ts`

**Modifications** :
```typescript
borderRadius: {
  '3xl': '24px', // Pour les cards principales
  '2xl': '16px', // Pour les boutons et inputs
  'xl': '12px',
  'lg': '8px',
  'md': '6px',
  'sm': '4px',
  'full': '9999px',
}
```

### Phase 2 : Composants UI de Base

#### 2.1 Button Component
**Fichier** : `apps/web/src/components/ui/Button.tsx`

**Modifications** :
- Changer `rounded-xl` → `rounded-2xl` pour les boutons standards
- Ajouter variant `rounded-full` pour les boutons icon
- Modifier les gradients pour correspondre au style dashboard-v2
- Ajouter `font-light` pour les grands boutons
- Ajuster les shadows : `shadow-sm` → `hover:shadow-md`

**Styles cibles** :
```typescript
// Bouton primaire gradient
'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-medium hover:shadow-lg'

// Bouton secondaire
'bg-gray-100 text-gray-900 rounded-full py-2.5 text-sm font-medium hover:bg-gray-200'

// Bouton noir
'bg-black text-white rounded-full py-2.5 text-sm font-medium hover:bg-gray-800'
```

#### 2.2 Card Component
**Fichier** : `apps/web/src/components/ui/Card.tsx`

**Modifications** :
- Changer `rounded-2xl` → `rounded-3xl` pour les cards principales
- Modifier shadow : `shadow-sm` par défaut
- Ajouter `hover:shadow-md` pour les cards interactives
- Ajuster padding : `p-6` ou `p-8` selon le contexte
- Background : `bg-white` avec `bg-gray-100` pour le conteneur parent

**Styles cibles** :
```typescript
'bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow'
```

#### 2.3 Input Component
**Fichier** : `apps/web/src/components/ui/Input.tsx`

**Modifications** :
- Border radius : `rounded-2xl`
- Background : `bg-gray-50`
- Padding : `px-6 py-4`
- Focus ring : `focus:ring-2 focus:ring-blue-500`
- Text size : `text-sm`

**Styles cibles** :
```typescript
'px-6 py-4 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none'
```

#### 2.4 Badge Component
**Fichier** : `apps/web/src/components/ui/Badge.tsx`

**Modifications** :
- Border radius : `rounded-full` pour les badges
- Padding : `px-3 py-1.5`
- Text size : `text-xs`
- Background : `bg-gray-50` ou `bg-blue-500` selon le variant

**Styles cibles** :
```typescript
'text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full'
'text-xs bg-blue-500 text-white px-3 py-1 rounded-full'
```

### Phase 3 : Composants de Layout

#### 3.1 Header Component
**Fichier** : `apps/web/src/components/layout/Header.tsx`

**Modifications** :
- Logo : `bg-black rounded-full w-14 h-14` avec texte blanc
- Titre : `text-xl font-semibold text-gray-900`
- Sous-titre : `text-sm text-gray-500`
- Boutons actions : `p-2.5 bg-white rounded-full shadow-sm hover:shadow-md`
- User profile : `bg-white rounded-full px-4 py-2 shadow-sm`

**Styles cibles** :
```typescript
// Logo
'bg-black rounded-full w-14 h-14 flex items-center justify-center'
'text-white font-bold text-lg'

// User profile
'flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm'
```

#### 3.2 Sidebar Component
**Fichier** : `apps/web/src/components/layout/Sidebar.tsx`

**Modifications** :
- Background : `bg-white`
- Border radius : `rounded-3xl` pour les sections
- Padding : `p-6`
- Shadow : `shadow-sm`
- Items : `rounded-2xl` avec hover `bg-gray-50`

#### 3.3 PageHeader Component
**Fichier** : `apps/web/src/components/layout/PageHeader.tsx`

**Modifications** :
- Titre : `text-3xl font-light text-gray-900`
- Sous-titre : `text-xl text-gray-400 font-light`
- Espacement : `mb-8`

### Phase 4 : Composants Spécialisés

#### 4.1 StatsCard Component
**Fichier** : `apps/web/src/components/ui/StatsCard.tsx`

**Modifications** :
- Card style : `bg-white rounded-3xl p-6 shadow-sm`
- Titre : `text-xs text-gray-500 mb-2`
- Valeur : `text-2xl font-semibold text-gray-900`
- Séparateur : `pt-4 border-t border-gray-100`

#### 4.2 Table Component
**Fichier** : `apps/web/src/components/ui/Table.tsx`

**Modifications** :
- Container : `bg-white rounded-3xl shadow-sm`
- Header : `text-sm font-semibold text-gray-900`
- Rows : `hover:bg-gray-50 rounded-2xl`
- Padding cells : `px-6 py-4`

#### 4.3 Form Components
**Fichiers** :
- `apps/web/src/components/ui/Select.tsx`
- `apps/web/src/components/ui/Textarea.tsx`
- `apps/web/src/components/ui/Checkbox.tsx`
- `apps/web/src/components/ui/Radio.tsx`

**Modifications** :
- Border radius : `rounded-2xl`
- Background : `bg-gray-50`
- Focus : `focus:ring-2 focus:ring-blue-500`

### Phase 5 : Pages Principales

#### 5.1 Dashboard Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/page.tsx`

**Modifications** :
- Conteneur : `min-h-screen bg-gray-100 p-8`
- Max width : `max-w-[1400px] mx-auto`
- Grid : `grid grid-cols-12 gap-6`
- Cards : Appliquer le style dashboard-v2

#### 5.2 Transactions Page
**Fichier** : `apps/web/src/app/[locale]/dashboard/transactions/page.tsx`

**Modifications** :
- Appliquer le même style de layout
- Cards de transaction : `rounded-3xl`
- Boutons d'action : `rounded-full` ou `rounded-2xl`

#### 5.3 Autres Pages
- Calendar
- Documents
- Contacts
- Settings

**Modifications** :
- Appliquer systématiquement le style dashboard-v2
- Utiliser les composants modifiés

### Phase 6 : Thème Global

#### 6.1 Global Styles
**Fichier** : `apps/web/src/app/globals.css`

**Modifications** :
- Ajouter les variables CSS pour le nouveau style
- Définir les couleurs de base
- Configurer les transitions globales

#### 6.2 Theme Configuration
**Fichier** : `apps/web/src/lib/theme/default-theme-config.ts`

**Modifications** :
- Mettre à jour la configuration de thème par défaut
- Ajouter les nouvelles valeurs de typographie
- Configurer les nouveaux border radius
- Mettre à jour les couleurs

## Checklist de Transformation

### Étape 1 : Foundation (Priorité Haute)
- [ ] Modifier `tailwind.config.ts` pour ajouter les nouvelles tailles de police et border radius
- [ ] Mettre à jour `default-theme-config.ts` avec les nouvelles couleurs
- [ ] Créer un fichier de tokens pour le style dashboard-v2
- [ ] Mettre à jour `globals.css` avec les nouvelles variables CSS

### Étape 2 : Composants UI de Base (Priorité Haute)
- [ ] Transformer `Button.tsx` avec les nouveaux styles
- [ ] Transformer `Card.tsx` avec `rounded-3xl` et nouvelles shadows
- [ ] Transformer `Input.tsx` avec `rounded-2xl` et `bg-gray-50`
- [ ] Transformer `Badge.tsx` avec `rounded-full`
- [ ] Transformer `Select.tsx`, `Textarea.tsx`, `Checkbox.tsx`, `Radio.tsx`

### Étape 3 : Composants de Layout (Priorité Moyenne)
- [ ] Transformer `Header.tsx` avec le nouveau style
- [ ] Transformer `Sidebar.tsx` avec les nouvelles bordures
- [ ] Transformer `PageHeader.tsx` avec la nouvelle typographie
- [ ] Transformer `DashboardLayout.tsx`

### Étape 4 : Composants Spécialisés (Priorité Moyenne)
- [ ] Transformer `StatsCard.tsx`
- [ ] Transformer `Table.tsx`
- [ ] Transformer `DataTableEnhanced.tsx`
- [ ] Transformer tous les composants de formulaire

### Étape 5 : Pages (Priorité Basse)
- [ ] Transformer la page Dashboard principale
- [ ] Transformer la page Transactions
- [ ] Transformer la page Calendar
- [ ] Transformer la page Documents
- [ ] Transformer toutes les autres pages

### Étape 6 : Tests et Ajustements (Priorité Haute)
- [ ] Tester tous les composants transformés
- [ ] Vérifier la cohérence visuelle
- [ ] Ajuster les espacements si nécessaire
- [ ] Vérifier la responsivité mobile
- [ ] Tester le dark mode (si applicable)

## Guide de Migration par Composant

### Pattern de Migration Standard

Pour chaque composant, suivre ce pattern :

1. **Identifier les classes à changer** :
   - `rounded-xl` → `rounded-2xl` ou `rounded-3xl`
   - `shadow-md` → `shadow-sm` avec `hover:shadow-md`
   - `text-base` → `text-sm`
   - `font-normal` → `font-light` ou `font-medium` selon le contexte

2. **Appliquer les nouvelles couleurs** :
   - Background cards : `bg-white`
   - Background conteneur : `bg-gray-100`
   - Texte principal : `text-gray-900`
   - Texte secondaire : `text-gray-500`

3. **Ajuster les espacements** :
   - Padding cards : `p-6` ou `p-8`
   - Gap : `gap-4` ou `gap-6`
   - Marges : `mb-4`, `mb-6`, `mb-8`

4. **Ajouter les transitions** :
   - `transition-shadow` pour les shadows
   - `transition-colors` pour les couleurs
   - `transition-all duration-200` pour les animations

## Exemples de Code

### Exemple 1 : Card Transformée

**Avant** :
```tsx
<Card className="rounded-xl shadow-md p-4">
  <h3 className="text-lg font-bold">Titre</h3>
  <p className="text-base text-gray-600">Contenu</p>
</Card>
```

**Après** :
```tsx
<Card className="rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6">
  <h3 className="text-lg font-semibold text-gray-900">Titre</h3>
  <p className="text-sm text-gray-500">Contenu</p>
</Card>
```

### Exemple 2 : Button Transformé

**Avant** :
```tsx
<Button variant="primary" className="rounded-lg">
  Cliquer
</Button>
```

**Après** :
```tsx
<Button variant="primary" className="rounded-2xl text-sm font-medium shadow-sm hover:shadow-md">
  Cliquer
</Button>
```

### Exemple 3 : Input Transformé

**Avant** :
```tsx
<Input className="rounded-lg border" />
```

**Après** :
```tsx
<Input className="rounded-2xl bg-gray-50 border-none px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500" />
```

## Notes Importantes

1. **Cohérence** : Appliquer le même style partout pour maintenir la cohérence visuelle
2. **Accessibilité** : Conserver les contrastes WCAG AA minimum
3. **Performance** : Les transitions doivent être fluides mais pas trop lourdes
4. **Responsivité** : Adapter les espacements pour mobile (réduire padding et gap)
5. **Dark Mode** : Prévoir les adaptations pour le dark mode si nécessaire

## Timeline Suggérée

- **Semaine 1** : Foundation + Composants UI de base
- **Semaine 2** : Composants de Layout + Composants spécialisés
- **Semaine 3** : Pages principales
- **Semaine 4** : Tests, ajustements et finalisation

## Ressources

- [Dashboard V2 Source](https://immoassist26b-f-production.up.railway.app/demo/dashboard-v2)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design Tokens Reference](./THEME_CREATION_GUIDE.md)
