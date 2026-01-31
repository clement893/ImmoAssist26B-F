# Guide d'Utilisation des Nouveaux Composants UI

Ce guide présente des exemples pratiques d'utilisation des nouveaux composants créés lors du UI revamp.

---

## 📦 Composants Disponibles

### Core Components (Refondus)
- `Card` - Cartes modernes avec variants
- `Button` - Boutons avec styles modernes
- `Badge` - Tags colorés arrondis
- `Sidebar` - Navigation sombre moderne
- `DataTable` - Tableaux modernes avec pagination

### Specialized Components (Nouveaux)
- `StatsCard` - Statistiques avec tendances
- `ProgressRing` - Progress circulaire animé
- `ActivityChart` - Graphiques en barres interactifs
- `MetricCard` - Métriques avec sous-métriques
- `WidgetGrid` - Layout modulaire flexible

---

## 🎯 StatsCard Component

### Usage de Base

```tsx
import { StatsCard } from '@/components/ui';

<StatsCard
  title="Total Activity"
  value="64%"
  icon={<Activity className="w-5 h-5" />}
/>
```

### Avec Tendances

```tsx
<StatsCard
  title="Growth"
  value="+12%"
  trend="+12%"
  trendDirection="up"
  icon={<TrendingUp className="w-5 h-5" />}
  variant="success"
/>
```

### Variants Disponibles

```tsx
// Default
<StatsCard variant="default" ... />

// Primary
<StatsCard variant="primary" ... />

// Success
<StatsCard variant="success" ... />

// Warning
<StatsCard variant="warning" ... />

// Error
<StatsCard variant="error" ... />
```

### Exemple Complet

```tsx
import { StatsCard } from '@/components/ui';
import { Activity, TrendingUp, Users, DollarSign } from 'lucide-react';

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatsCard
    title="Total Activity"
    value="64%"
    trend="+12%"
    trendDirection="up"
    icon={<Activity className="w-5 h-5" />}
    variant="primary"
  />
  <StatsCard
    title="Users"
    value="1,234"
    trend="+5%"
    trendDirection="up"
    icon={<Users className="w-5 h-5" />}
    variant="success"
  />
  <StatsCard
    title="Revenue"
    value="$12,345"
    trend="-2%"
    trendDirection="down"
    icon={<DollarSign className="w-5 h-5" />}
    variant="warning"
  />
</div>
```

---

## 📊 MetricCard Component

### Usage de Base

```tsx
import { MetricCard } from '@/components/ui';

<MetricCard
  title="Total Income"
  value="$23,194.80"
  subtitle="Last 30 days"
/>
```

### Avec Sous-métriques

```tsx
<MetricCard
  title="Total Income"
  value="$23,194.80"
  subtitle="Last 30 days"
  subMetrics={[
    { label: 'Weekly', value: '+12%', trend: 'up' },
    { label: 'Monthly', value: '+8%', trend: 'up' },
  ]}
  trend="up"
  icon={<DollarSign className="w-5 h-5" />}
/>
```

### Variants Disponibles

```tsx
<MetricCard variant="default" ... />
<MetricCard variant="primary" ... />
<MetricCard variant="success" ... />
<MetricCard variant="warning" ... />
<MetricCard variant="error" ... />
```

### Exemple Complet

```tsx
import { MetricCard } from '@/components/ui';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <MetricCard
    title="Total Income"
    value="$23,194.80"
    subtitle="Last 30 days"
    subMetrics={[
      { label: 'Weekly', value: '+12%', trend: 'up' },
    ]}
    trend="up"
    icon={<DollarSign className="w-5 h-5" />}
    variant="success"
  />
  <MetricCard
    title="Active Users"
    value="1,234"
    subtitle="Currently online"
    subMetrics={[
      { label: 'New today', value: '45', trend: 'up' },
    ]}
    trend="up"
    icon={<Users className="w-5 h-5" />}
    variant="primary"
  />
</div>
```

---

## 📈 ActivityChart Component

### Usage de Base

```tsx
import { ActivityChart } from '@/components/ui';

const data = [
  { day: 'Mon', value: 4.2 },
  { day: 'Tue', value: 3.5 },
  { day: 'Wed', value: 5.1 },
  { day: 'Thu', value: 4.8 },
  { day: 'Fri', value: 6.2 },
  { day: 'Sat', value: 3.9 },
  { day: 'Sun', value: 2.5 },
];

<ActivityChart data={data} />
```

### Avec Variants

```tsx
<ActivityChart
  data={data}
  variant="primary"
  height={200}
  showTooltips={true}
/>
```

### Variants Disponibles

```tsx
<ActivityChart variant="primary" ... />
<ActivityChart variant="success" ... />
<ActivityChart variant="warning" ... />
<ActivityChart variant="error" ... />
<ActivityChart variant="info" ... />
```

### Exemple Complet

```tsx
import { ActivityChart } from '@/components/ui';
import { Card } from '@/components/ui';

<Card title="Weekly Activity">
  <ActivityChart
    data={[
      { day: 'Mon', value: 4.2, label: '4.2 hours' },
      { day: 'Tue', value: 3.5, label: '3.5 hours' },
      { day: 'Wed', value: 5.1, label: '5.1 hours' },
      { day: 'Thu', value: 4.8, label: '4.8 hours' },
      { day: 'Fri', value: 6.2, label: '6.2 hours' },
      { day: 'Sat', value: 3.9, label: '3.9 hours' },
      { day: 'Sun', value: 2.5, label: '2.5 hours' },
    ]}
    variant="primary"
    height={200}
    showTooltips={true}
  />
</Card>
```

---

## 🔄 ProgressRing Component

### Usage de Base

```tsx
import { ProgressRing } from '@/components/ui';

<ProgressRing value={64} />
```

### Avec Label et Variants

```tsx
<ProgressRing
  value={64}
  size="lg"
  variant="primary"
  label="Weekly activity"
  subtitle="64% complete"
/>
```

### Variants et Tailles

```tsx
// Variants
<ProgressRing variant="primary" ... />
<ProgressRing variant="success" ... />
<ProgressRing variant="warning" ... />
<ProgressRing variant="error" ... />

// Tailles
<ProgressRing size="sm" ... />   // 64px
<ProgressRing size="md" ... />   // 96px
<ProgressRing size="lg" ... />   // 128px
```

### Exemple Complet

```tsx
import { ProgressRing } from '@/components/ui';
import { Card } from '@/components/ui';

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>
    <ProgressRing
      value={75}
      size="lg"
      variant="primary"
      label="Project Progress"
      subtitle="75% complete"
    />
  </Card>
  <Card>
    <ProgressRing
      value={50}
      size="lg"
      variant="success"
      label="Tasks Completed"
      subtitle="50% done"
    />
  </Card>
  <Card>
    <ProgressRing
      value={90}
      size="lg"
      variant="warning"
      label="Performance"
      subtitle="90% optimal"
    />
  </Card>
</div>
```

---

## 🎨 WidgetGrid Component

### Usage de Base

```tsx
import { WidgetGrid } from '@/components/ui';

<WidgetGrid columns={{ sm: 1, md: 2, lg: 3 }} gap={6}>
  <WidgetGrid.Item size="md">
    <Card>Widget 1</Card>
  </WidgetGrid.Item>
  <WidgetGrid.Item size="md">
    <Card>Widget 2</Card>
  </WidgetGrid.Item>
  <WidgetGrid.Item size="lg">
    <Card>Widget 3 (larger)</Card>
  </WidgetGrid.Item>
</WidgetGrid>
```

### Tailles Disponibles

```tsx
<WidgetGrid.Item size="sm" ... />   // 1 colonne
<WidgetGrid.Item size="md" ... />   // 2 colonnes (md), 1 colonne (sm)
<WidgetGrid.Item size="lg" ... />   // 3 colonnes (lg), 2 colonnes (md), 1 colonne (sm)
<WidgetGrid.Item size="xl" ... />   // 4 colonnes (xl), 3 colonnes (lg), etc.
<WidgetGrid.Item size="full" ... /> // Toute la largeur
```

### Exemple Complet - Dashboard Layout

```tsx
import { WidgetGrid, StatsCard, MetricCard, ActivityChart } from '@/components/ui';
import { Activity, TrendingUp, Users } from 'lucide-react';

<WidgetGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={6}>
  {/* Stats Cards */}
  <WidgetGrid.Item size="md">
    <StatsCard
      title="Activity"
      value="64%"
      trend="+12%"
      trendDirection="up"
      icon={<Activity className="w-5 h-5" />}
    />
  </WidgetGrid.Item>
  <WidgetGrid.Item size="md">
    <StatsCard
      title="Users"
      value="1,234"
      trend="+5%"
      trendDirection="up"
      icon={<Users className="w-5 h-5" />}
    />
  </WidgetGrid.Item>
  
  {/* Large Widget */}
  <WidgetGrid.Item size="lg">
    <MetricCard
      title="Total Revenue"
      value="$23,194.80"
      subMetrics={[
        { label: 'Weekly', value: '+12%', trend: 'up' },
      ]}
      trend="up"
      icon={<TrendingUp className="w-5 h-5" />}
    />
  </WidgetGrid.Item>
  
  {/* Full Width Widget */}
  <WidgetGrid.Item size="full">
    <Card title="Activity Chart">
      <ActivityChart data={chartData} />
    </Card>
  </WidgetGrid.Item>
</WidgetGrid>
```

---

## 🎴 Card Component - Nouveaux Variants

### Variants Disponibles

```tsx
// Default - Fond blanc avec bordure
<Card variant="default">Content</Card>

// Elevated - Ombre plus prononcée
<Card variant="elevated">Content</Card>

// Outlined - Bordure visible, fond transparent
<Card variant="outlined">Content</Card>

// Gradient - Fond dégradé
<Card variant="gradient">Content</Card>
```

### Avec Hover Effect

```tsx
<Card variant="elevated" hover onClick={() => handleClick()}>
  Clickable card with hover effect
</Card>
```

### Exemple Complet

```tsx
import { Card } from '@/components/ui';

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card variant="default" title="Default Card">
    Standard card with border
  </Card>
  
  <Card variant="elevated" title="Elevated Card" hover>
    Card with shadow and hover effect
  </Card>
  
  <Card variant="gradient" title="Gradient Card">
    Card with gradient background
  </Card>
</div>
```

---

## 🔘 Button Component - Nouveaux Variants

### Variants Disponibles

```tsx
// Primary (défaut)
<Button variant="primary">Primary</Button>

// Gradient
<Button variant="gradient">Gradient</Button>

// Soft
<Button variant="soft">Soft</Button>

// Ghost
<Button variant="ghost">Ghost</Button>

// Outline
<Button variant="outline">Outline</Button>
```

### Exemple Complet

```tsx
import { Button } from '@/components/ui';

<div className="flex gap-4">
  <Button variant="primary">Primary</Button>
  <Button variant="gradient">Gradient</Button>
  <Button variant="soft">Soft</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="outline">Outline</Button>
</div>
```

---

## 📋 Exemple Complet - Page Dashboard

```tsx
'use client';

import { StatsCard, MetricCard, WidgetGrid, Card, ActivityChart } from '@/components/ui';
import { Activity, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const chartData = [
    { day: 'Mon', value: 4.2 },
    { day: 'Tue', value: 3.5 },
    { day: 'Wed', value: 5.1 },
    { day: 'Thu', value: 4.8 },
    { day: 'Fri', value: 6.2 },
    { day: 'Sat', value: 3.9 },
    { day: 'Sun', value: 2.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <WidgetGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={6}>
        <WidgetGrid.Item size="md">
          <StatsCard
            title="Total Activity"
            value="64%"
            trend="+12%"
            trendDirection="up"
            icon={<Activity className="w-5 h-5" />}
            variant="primary"
          />
        </WidgetGrid.Item>
        <WidgetGrid.Item size="md">
          <StatsCard
            title="Users"
            value="1,234"
            trend="+5%"
            trendDirection="up"
            icon={<Users className="w-5 h-5" />}
            variant="success"
          />
        </WidgetGrid.Item>
        <WidgetGrid.Item size="md">
          <StatsCard
            title="Revenue"
            value="$12,345"
            trend="-2%"
            trendDirection="down"
            icon={<DollarSign className="w-5 h-5" />}
            variant="warning"
          />
        </WidgetGrid.Item>
        <WidgetGrid.Item size="md">
          <StatsCard
            title="Growth"
            value="+12%"
            trend="+12%"
            trendDirection="up"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="success"
          />
        </WidgetGrid.Item>
      </WidgetGrid>

      {/* Metrics and Chart */}
      <WidgetGrid columns={{ sm: 1, md: 2 }} gap={6}>
        <WidgetGrid.Item size="md">
          <MetricCard
            title="Total Income"
            value="$23,194.80"
            subtitle="Last 30 days"
            subMetrics={[
              { label: 'Weekly', value: '+12%', trend: 'up' },
              { label: 'Monthly', value: '+8%', trend: 'up' },
            ]}
            trend="up"
            icon={<DollarSign className="w-5 h-5" />}
            variant="success"
          />
        </WidgetGrid.Item>
        <WidgetGrid.Item size="md">
          <Card variant="elevated" title="Weekly Activity">
            <ActivityChart
              data={chartData}
              variant="primary"
              height={200}
              showTooltips={true}
            />
          </Card>
        </WidgetGrid.Item>
      </WidgetGrid>
    </div>
  );
}
```

---

## 🎨 Bonnes Pratiques

### 1. Utiliser WidgetGrid pour les Layouts

✅ **Bon :**
```tsx
<WidgetGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={6}>
  <WidgetGrid.Item size="md">...</WidgetGrid.Item>
</WidgetGrid>
```

❌ **Éviter :**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div>...</div>
</div>
```

### 2. Utiliser StatsCard pour les Statistiques

✅ **Bon :**
```tsx
<StatsCard
  title="Users"
  value="1,234"
  trend="+5%"
  trendDirection="up"
  icon={<Users className="w-5 h-5" />}
/>
```

❌ **Éviter :**
```tsx
<Card>
  <div>
    <p>Users</p>
    <p>1,234</p>
  </div>
</Card>
```

### 3. Utiliser MetricCard pour les Métriques Détaillées

✅ **Bon :**
```tsx
<MetricCard
  title="Revenue"
  value="$23,194.80"
  subMetrics={[
    { label: 'Weekly', value: '+12%', trend: 'up' },
  ]}
  trend="up"
/>
```

❌ **Éviter :**
```tsx
<Card>
  <h3>Revenue</h3>
  <p>$23,194.80</p>
  <p>Weekly: +12%</p>
</Card>
```

### 4. Variants Cohérents

✅ **Bon :**
```tsx
<StatsCard variant="success" ... />  // Pour les valeurs positives
<StatsCard variant="error" ... />    // Pour les valeurs négatives
<StatsCard variant="primary" ... />  // Pour les valeurs neutres
```

---

## 📚 Ressources

- **Plan de Refonte :** `docs/UI_GLOBAL_REVAMP_PLAN.md`
- **Résumé de Complétion :** `docs/UI_REVAMP_COMPLETION_SUMMARY.md`
- **Composants :** `apps/web/src/components/ui/`

---

**Dernière mise à jour :** 2025-01-31
