# Guide Pratique de Migration - Style Dashboard V2 & Transaction Detail

Ce guide fournit des exemples concrets de transformation pour chaque type de composant, incluant tous les patterns des pages de démo (dashboard-v2, transaction-detail, transactions, documents, calendar).

## Table des Matières

1. [Composants UI de Base](#composants-ui-de-base)
2. [Composants de Layout](#composants-de-layout)
3. [Composants de Formulaire](#composants-de-formulaire)
4. [Composants de Données](#composants-de-données)
5. [Pages](#pages)

## Composants UI de Base

### Menu/Sidebar Navigation (CRITIQUE - Menu Demo Style)

#### Avant
```tsx
<div className="space-y-2">
  <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-l-4 border-indigo-600 rounded">
    <Icon className="w-5 h-5 text-indigo-600" />
    <span className="text-sm font-semibold text-indigo-700">Dashboard</span>
  </div>
  <div className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded">
    <Icon className="w-5 h-5 text-gray-400" />
    <span className="text-sm font-medium">Transactions</span>
  </div>
</div>
```

#### Après (Style Menu Demo)
```tsx
<div className="bg-white rounded-xl p-6 shadow-sm">
  <div className="space-y-2">
    {/* Item Actif */}
    <div className="flex items-center gap-4 px-5 py-3.5 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/30">
      <LayoutDashboard className="w-5 h-5" />
      <span className="text-sm font-medium">Dashboard</span>
    </div>
    
    {/* Item Inactif */}
    <div className="flex items-center gap-4 px-5 py-3.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200">
      <Repeat className="w-5 h-5 text-gray-400" />
      <span className="text-sm font-light">Transactions</span>
    </div>
    
    {/* Item Inactif */}
    <div className="flex items-center gap-4 px-5 py-3.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200">
      <Calendar className="w-5 h-5 text-gray-400" />
      <span className="text-sm font-light">Calendar</span>
    </div>
  </div>
</div>
```

#### Caractéristiques Menu
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
- **Icons** : `w-5 h-5` avec `text-gray-400` pour inactifs, `text-white` pour actifs
- **Spacing** : `space-y-2` entre items, `gap-4` entre icon et texte
- **Pas de bordures** : Utiliser seulement shadows

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

#### Variants Dashboard V2 Complets (7 Types)

```tsx
// 1. Bouton primaire gradient (Actions principales)
<Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-medium hover:shadow-lg transition-shadow">
  Action principale
</Button>

// 2. Bouton primaire solide (Dans cards)
<Button className="bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors px-4 py-2">
  View Details
</Button>

// 3. Bouton secondaire blanc (Header, actions secondaires)
<Button className="bg-white text-gray-700 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm px-4 py-2">
  Edit
</Button>

// 4. Bouton secondaire gris (Actions alternatives)
<Button className="bg-gray-100 text-gray-900 rounded-full py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors">
  Action secondaire
</Button>

// 5. Bouton noir (Actions importantes)
<Button className="bg-black text-white rounded-full py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">
  Action importante
</Button>

// 6. Bouton icon petit (Header, actions rapides)
<Button className="p-2.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
  <Icon className="w-4 h-4 text-gray-600" />
</Button>

// 7. Bouton avec icon inline
<Button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
  <Send className="w-4 h-4 inline mr-2" />
  Send Update
</Button>
```

#### Règles Boutons
- **Typographie** : TOUJOURS `text-sm font-medium`
- **Border radius** : 
  - `rounded-2xl` (16px) pour boutons standards
  - `rounded-xl` (12px) pour boutons dans cards
  - `rounded-full` pour boutons icon/noir/secondaires
- **Shadows** : 
  - `shadow-sm` par défaut
  - `hover:shadow-lg` pour gradients
  - `shadow-md shadow-blue-500/30` pour items menu actifs
- **Transitions** : `transition-shadow` ou `transition-colors`

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

## Patterns Spéciaux - Transaction Detail

### Progress Bar Horizontale avec Steps (CRITIQUE pour Transaction Detail)

```tsx
<div className="bg-white rounded-3xl p-8 shadow-sm">
  <div className="flex items-center justify-between mb-8">
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Transaction progress</h2>
      <p className="text-sm text-gray-500">Track all steps from initial contact to closing</p>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-500 mb-1">Expected closing</p>
      <p className="text-lg font-semibold text-gray-900">2024-03-15</p>
    </div>
  </div>

  {/* Progress Bar */}
  <div className="relative mb-12">
    {/* Background line */}
    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
    {/* Progress line */}
    <div
      className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
      style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
    ></div>

    {/* Steps */}
    <div className="relative flex justify-between">
      {steps.map((step) => (
        <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              step.status === 'completed'
                ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                : step.status === 'in_progress'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100'
                : 'bg-white border-2 border-gray-200 text-gray-400'
            }`}
          >
            {step.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : step.status === 'in_progress' ? (
              <Clock className="w-5 h-5" />
            ) : (
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p
              className={`text-xs font-medium mb-1 ${
                step.status === 'completed' || step.status === 'in_progress'
                  ? 'text-gray-900'
                  : 'text-gray-400'
              }`}
            >
              {step.title}
            </p>
            <p className="text-xs text-gray-400">{step.date}</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[100px]">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Current Step Details */}
  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
        <Clock className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Current step: Inspection</h3>
        <p className="text-sm text-gray-600 mb-3">
          Home inspection scheduled for February 1st at 10:00 AM. Inspector will check all major systems and provide a detailed report.
        </p>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
            View Details
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Reschedule
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Tabs Modernes avec Indicateur (Transaction Detail)

```tsx
<div className="bg-white rounded-3xl shadow-sm overflow-hidden">
  {/* Tabs Header */}
  <div className="border-b border-gray-200">
    <div className="flex">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon className="w-4 h-4" />
              {tab.label}
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        );
      })}
    </div>
  </div>

  {/* Tab Content */}
  <div className="p-8">
    {/* Contenu du tab actif */}
  </div>
</div>
```

### Card Contact/Agent (Transaction Detail)

```tsx
<div className="bg-gray-50 rounded-2xl p-6">
  <h3 className="text-sm font-semibold text-gray-900 mb-4">Client</h3>
  <div className="flex items-center gap-4 mb-4">
    <img
      src={client.avatar}
      alt={client.name}
      className="w-12 h-12 rounded-full"
    />
    <div>
      <p className="text-sm font-medium text-gray-900">{client.name}</p>
      <p className="text-xs text-gray-500">Buyer</p>
    </div>
  </div>
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Mail className="w-4 h-4" />
      {client.email}
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Phone className="w-4 h-4" />
      {client.phone}
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

### Document List Item (Transaction Detail)

```tsx
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
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        doc.status === 'signed'
          ? 'bg-green-100 text-green-700'
          : doc.status === 'approved'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {doc.status}
    </span>
    <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
      <Download className="w-4 h-4 text-gray-600" />
    </button>
  </div>
</div>
```

### Activity Timeline Item (Transaction Detail)

```tsx
<div className="flex gap-4">
  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
    {activity.type === 'comment' && <MessageSquare className="w-5 h-5 text-gray-600" />}
    {activity.type === 'document' && <FileText className="w-5 h-5 text-gray-600" />}
    {activity.type === 'status' && <CheckCircle2 className="w-5 h-5 text-gray-600" />}
    {activity.type === 'meeting' && <Calendar className="w-5 h-5 text-gray-600" />}
  </div>
  <div className="flex-1 bg-gray-50 rounded-2xl p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium text-gray-900">
        {activity.user} <span className="font-normal text-gray-600">{activity.action}</span>
      </p>
      <p className="text-xs text-gray-500">{activity.timestamp}</p>
    </div>
    <p className="text-sm text-gray-700">{activity.content}</p>
  </div>
</div>
```

### Comment Input Box (Transaction Detail)

```tsx
<div className="bg-gray-50 rounded-2xl p-4">
  <textarea
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
    placeholder="Add a comment..."
    className="w-full px-4 py-3 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none resize-none"
    rows={3}
  />
  <div className="flex items-center justify-between mt-3">
    <div className="flex items-center gap-2">
      <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
        <Paperclip className="w-4 h-4 text-gray-600" />
      </button>
      <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
        <ImageIcon className="w-4 h-4 text-gray-600" />
      </button>
    </div>
    <button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
      <Send className="w-4 h-4 inline mr-2" />
      Post Comment
    </button>
  </div>
</div>
```

## Patterns Spéciaux - Autres

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
