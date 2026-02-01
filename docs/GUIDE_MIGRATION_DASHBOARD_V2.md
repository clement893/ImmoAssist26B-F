# Guide Pratique de Migration - Style Dashboard V2

Ce guide fournit des exemples concrets de transformation pour chaque type de composant.

## Table des Matières

1. [Composants UI de Base](#composants-ui-de-base)
2. [Composants de Layout](#composants-de-layout)
3. [Composants de Formulaire](#composants-de-formulaire)
4. [Composants de Données](#composants-de-données)
5. [Pages](#pages)

## Composants UI de Base

### Button

#### Avant
```tsx
<Button variant="primary" size="md">
  Cliquer
</Button>
```

#### Après
```tsx
<Button 
  variant="primary" 
  className="rounded-2xl text-sm font-medium shadow-sm hover:shadow-md"
>
  Cliquer
</Button>
```

#### Variants Dashboard V2

```tsx
// Bouton primaire gradient
<Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-medium hover:shadow-lg transition-shadow">
  Action principale
</Button>

// Bouton secondaire
<Button className="bg-gray-100 text-gray-900 rounded-full py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors">
  Action secondaire
</Button>

// Bouton noir
<Button className="bg-black text-white rounded-full py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">
  Action importante
</Button>

// Bouton icon circulaire
<Button className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
  <Icon className="w-5 h-5 text-gray-700" />
</Button>
```

### Card

#### Avant
```tsx
<Card title="Titre" className="rounded-xl shadow-md p-4">
  <p>Contenu</p>
</Card>
```

#### Après
```tsx
<Card 
  title="Titre" 
  className="rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6"
>
  <p className="text-sm text-gray-500">Contenu</p>
</Card>
```

#### Card avec Header Personnalisé

```tsx
<div className="bg-white rounded-3xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-semibold text-gray-900">Titre</h3>
    <button className="text-xs text-gray-500">Action ▾</button>
  </div>
  <div className="space-y-4">
    {/* Contenu */}
  </div>
</div>
```

#### Card avec Séparateur

```tsx
<div className="bg-white rounded-3xl p-6 shadow-sm">
  <p className="text-xs text-gray-500 mb-2">Label</p>
  <p className="text-2xl font-semibold text-gray-900 mb-4">Valeur</p>
  <div className="pt-4 border-t border-gray-100">
    <p className="text-xs text-gray-500 mb-2">Sous-label</p>
    <p className="text-lg font-semibold text-gray-900">Sous-valeur</p>
  </div>
</div>
```

### Badge

#### Avant
```tsx
<Badge variant="default">Nouveau</Badge>
```

#### Après
```tsx
<Badge className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full">
  Nouveau
</Badge>
```

#### Badge Coloré

```tsx
<span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full">
  2023
</span>
```

## Composants de Layout

### Header

#### Avant
```tsx
<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      <Link href="/" className="text-xl font-bold">
        Logo
      </Link>
    </div>
  </div>
</header>
```

#### Après
```tsx
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
  <div className="max-w-[1400px] mx-auto px-8">
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center gap-4">
        <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center">
          <span className="text-white font-bold text-lg">IA</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Real Estate</h1>
          <p className="text-sm text-gray-500">Dashboard</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
          <Plus className="w-5 h-5 text-gray-700" />
        </button>
        {/* User profile */}
      </div>
    </div>
  </div>
</header>
```

### Page Header

#### Avant
```tsx
<div className="mb-6">
  <h1 className="text-2xl font-bold">Titre de Page</h1>
  <p className="text-gray-600">Description</p>
</div>
```

#### Après
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-light text-gray-900 mb-2">
    Titre de Page
  </h1>
  <p className="text-xl text-gray-400 font-light">Description</p>
</div>
```

### Container Principal

#### Avant
```tsx
<div className="container mx-auto px-4 py-8">
  {/* Contenu */}
</div>
```

#### Après
```tsx
<div className="min-h-screen bg-gray-100 p-8">
  <div className="max-w-[1400px] mx-auto">
    {/* Contenu */}
  </div>
</div>
```

## Composants de Formulaire

### Input

#### Avant
```tsx
<Input 
  type="text" 
  placeholder="Entrez votre texte"
  className="rounded-lg border"
/>
```

#### Après
```tsx
<Input 
  type="text" 
  placeholder="Entrez votre texte"
  className="px-6 py-4 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
/>
```

### Input avec Icon

```tsx
<div className="flex items-center gap-3">
  <input
    type="text"
    className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
    placeholder="Type your question..."
  />
  <button className="p-4 rounded-2xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
    <Mic className="w-5 h-5" />
  </button>
</div>
```

### Select

#### Avant
```tsx
<Select className="rounded-lg">
  <option>Option 1</option>
</Select>
```

#### Après
```tsx
<Select className="px-6 py-4 bg-gray-50 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none">
  <option>Option 1</option>
</Select>
```

### Textarea

#### Avant
```tsx
<Textarea className="rounded-lg" />
```

#### Après
```tsx
<Textarea className="px-6 py-4 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none" />
```

## Composants de Données

### Stats Card

#### Avant
```tsx
<StatsCard 
  title="Revenus"
  value="$50,000"
  className="rounded-lg"
/>
```

#### Après
```tsx
<div className="bg-white rounded-3xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <button className="p-2 bg-gray-50 rounded-full">
      <Icon className="w-4 h-4 text-gray-700" />
    </button>
    <span className="text-xs text-gray-500">Weekly ▾</span>
  </div>
  <p className="text-xs text-gray-500 mb-2">Total income</p>
  <p className="text-2xl font-semibold text-gray-900 mb-4">$ 50.0K</p>
  <div className="pt-4 border-t border-gray-100">
    <p className="text-xs text-gray-500 mb-2">Total paid</p>
    <p className="text-lg font-semibold text-gray-900">$ 8,145.20</p>
  </div>
</div>
```

### Table

#### Avant
```tsx
<Table>
  <thead>
    <tr>
      <th>Colonne 1</th>
    </tr>
  </thead>
</Table>
```

#### Après
```tsx
<div className="bg-white rounded-3xl shadow-sm overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
          Colonne 1
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-900">Donnée</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Activity Item

```tsx
<div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
    <Clock className="w-5 h-5 text-blue-600" />
  </div>
  <div className="flex-1">
    <p className="text-sm font-medium text-gray-900">Titre de l'activité</p>
    <p className="text-xs text-gray-500">Description</p>
  </div>
  <div className="text-right">
    <p className="text-xs text-gray-500">Il y a 2h</p>
  </div>
</div>
```

## Pages

### Page Dashboard

#### Structure Complète

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center">
              <span className="text-white font-bold text-lg">IA</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Vue d'ensemble</p>
            </div>
          </div>
          {/* Actions */}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-3 space-y-6">
            {/* Cards */}
          </div>

          {/* Middle Column */}
          <div className="col-span-6 space-y-6">
            {/* Main Content */}
          </div>

          {/* Right Column */}
          <div className="col-span-3 space-y-6">
            {/* Sidebar Content */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Page avec Liste

```tsx
<div className="min-h-screen bg-gray-100 p-8">
  <div className="max-w-[1400px] mx-auto">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-light text-gray-900 mb-2">Transactions</h1>
      <p className="text-xl text-gray-400 font-light">Gérez vos transactions</p>
    </div>

    {/* Content */}
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      {/* Liste ou tableau */}
    </div>
  </div>
</div>
```

## Patterns Spéciaux

### Gradient Button avec Icon

```tsx
<button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2">
  Show my Tasks
  <ArrowUpRight className="w-4 h-4" />
</button>
```

### Filter Pills

```tsx
<div className="flex items-center gap-2">
  <button className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
    Team ×
  </button>
  <button className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
    Insights ×
  </button>
</div>
```

### Circular Progress Indicator

```tsx
<div className="relative w-32 h-32 mx-auto">
  <svg className="transform -rotate-90 w-32 h-32">
    <circle
      cx="64"
      cy="64"
      r="56"
      stroke="#f3f4f6"
      strokeWidth="8"
      fill="none"
    />
    <circle
      cx="64"
      cy="64"
      r="56"
      stroke="#3b82f6"
      strokeWidth="8"
      fill="none"
      strokeDasharray={`${2 * Math.PI * 56 * 0.36} ${2 * Math.PI * 56}`}
      className="transition-all duration-500"
    />
  </svg>
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center">
      <p className="text-2xl font-semibold text-gray-900">36%</p>
      <p className="text-xs text-gray-500">Growth rate</p>
    </div>
  </div>
</div>
```

### Chart Bars

```tsx
<div className="h-16 flex items-end gap-1">
  {[40, 60, 30, 70, 50, 80, 45, 90, 55, 75, 65, 85].map((height, i) => (
    <div
      key={i}
      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
      style={{ height: `${height}%` }}
    />
  ))}
</div>
```

## Checklist de Migration

Pour chaque composant migré, vérifier :

- [ ] Border radius correct (`rounded-3xl` pour cards, `rounded-2xl` pour boutons)
- [ ] Typographie adaptée (font-light pour grands titres)
- [ ] Couleurs cohérentes (gray-900, gray-500, gray-400)
- [ ] Espacements généreux (p-6 ou p-8, gap-6)
- [ ] Ombres subtiles (shadow-sm avec hover:shadow-md)
- [ ] Transitions fluides (transition-shadow, transition-colors)
- [ ] Responsive testé (mobile avec padding réduit)
- [ ] Accessibilité maintenue (contrastes WCAG AA)

## Outils de Migration

### Find & Replace Patterns

```bash
# Border radius
rounded-xl → rounded-2xl (boutons)
rounded-lg → rounded-2xl (inputs)
rounded-md → rounded-2xl

# Shadows
shadow-md → shadow-sm
shadow-lg → shadow-md (hover)

# Padding
p-4 → p-6 (cards)
p-3 → p-4 (petits éléments)

# Text sizes
text-base → text-sm
text-lg → text-lg font-semibold (titres)
```

### Script de Migration (Exemple)

```typescript
// Migration automatique des classes (à adapter selon besoins)
const migrateClasses = (className: string) => {
  return className
    .replace(/rounded-xl/g, 'rounded-2xl')
    .replace(/rounded-lg/g, 'rounded-2xl')
    .replace(/shadow-md/g, 'shadow-sm')
    .replace(/p-4/g, 'p-6')
    .replace(/text-base/g, 'text-sm');
};
```

## Notes Finales

1. **Cohérence** : Maintenir le même style partout
2. **Progression** : Migrer composant par composant
3. **Tests** : Tester chaque composant après migration
4. **Documentation** : Documenter les changements majeurs
5. **Feedback** : Recueillir les retours utilisateurs
