# 🎯 Exemples SaaS - Documentation

## Vue d'ensemble

Les exemples SaaS démontrent l'utilisation des composants UI dans des scénarios réels d'applications SaaS. Ils servent de référence pour construire vos propres pages.

## 📁 Pages Disponibles

### 1. Dashboard (`/examples/dashboard`)

Dashboard complet avec statistiques, graphiques et tableaux de données.

#### Fonctionnalités

- ✅ **StatsCards** - Cartes de statistiques avec tendances
- ✅ **Graphiques** - Graphiques en ligne, barres et aires
- ✅ **DataTable** - Tableau de données avec tri et pagination
- ✅ **Command Palette** - Palette de commandes ⌘K
- ✅ **Filtres** - Filtres avancés pour les données

#### Composants Utilisés

```tsx
import { StatsCard, Chart, DataTable, CommandPalette } from '@/components/ui';
```

#### Exemple d'Utilisation

```tsx
<StatsCard
  title="Utilisateurs Actifs"
  value="1,234"
  change={{ value: 12, type: 'increase', period: 'ce mois' }}
  icon={<UsersIcon />}
/>

<Chart
  type="line"
  data={chartData}
  options={chartOptions}
/>
```

### 2. Settings (`/examples/settings`)

Page de paramètres avec navigation par onglets et formulaires.

#### Fonctionnalités

- ✅ **Navigation par Onglets** - Tabs pour organiser les sections
- ✅ **Formulaires** - Formulaires avec validation
- ✅ **ThemeManager** - Intégration du gestionnaire de thème
- ✅ **Sauvegarde** - Gestion de la sauvegarde des paramètres

#### Composants Utilisés

```tsx
import { Tabs, Form, FormField, Input, Button, ThemeManager } from '@/components/ui';
```

#### Exemple d'Utilisation

```tsx
<Tabs defaultValue="profile">
  <TabList>
    <Tab value="profile">Profil</Tab>
    <Tab value="security">Sécurité</Tab>
    <Tab value="theme">Thème</Tab>
  </TabList>

  <TabPanels>
    <TabPanel value="profile">
      <Form onSubmit={handleSubmit}>
        <FormField name="name" label="Nom">
          <Input />
        </FormField>
      </Form>
    </TabPanel>
  </TabPanels>
</Tabs>
```

### 3. Onboarding (`/examples/onboarding`)

Flow d'onboarding multi-étapes avec formulaire progressif.

#### Fonctionnalités

- ✅ **Stepper** - Indicateur de progression
- ✅ **Formulaires Multi-Étapes** - Formulaires progressifs
- ✅ **Validation** - Validation par étape
- ✅ **Navigation** - Boutons Précédent/Suivant

#### Composants Utilisés

```tsx
import { Stepper, Form, FormField, Input, Button } from '@/components/ui';
```

#### Exemple d'Utilisation

```tsx
<Stepper
  steps={[
    { label: 'Informations', completed: true },
    { label: 'Préférences', completed: false },
    { label: 'Confirmation', completed: false },
  ]}
  currentStep={currentStep}
/>

<Form onSubmit={handleNext}>
  {/* Champs du formulaire */}
</Form>
```

## 🎨 Personnalisation

### Utiliser les Exemples comme Base

1. **Copier la structure** :

   ```bash
   cp -r apps/web/src/app/examples/dashboard apps/web/src/app/my-dashboard
   ```

2. **Adapter les données** :

   ```tsx
   // Remplacer les données mockées par vos propres données
   const stats = useStats(); // Votre hook
   ```

3. **Personnaliser le style** :
   ```tsx
   // Utiliser les classes de thème
   <div className="bg-primary-50 text-heading">Contenu personnalisé</div>
   ```

## 🔧 Intégration avec l'API

### Exemple avec API

```tsx
'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/ui';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await api.get('/stats');
      setStats(response.data);
    };

    fetchStats();
  }, []);

  if (!stats) return <Loading />;

  return (
    <div>
      <StatsCard title="Utilisateurs" value={stats.users} change={stats.usersChange} />
    </div>
  );
}
```

## 📚 Composants Recommandés par Page

### Dashboard

- `StatsCard` - Statistiques
- `Chart` - Graphiques
- `DataTable` - Tableaux
- `CommandPalette` - Recherche rapide
- `FilterBar` - Filtres

### Settings

- `Tabs` - Navigation
- `Form` / `FormField` - Formulaires
- `Input` / `Select` / `Switch` - Champs
- `Button` - Actions
- `ThemeManager` - Personnalisation

### Onboarding

- `Stepper` - Progression
- `Form` - Formulaires
- `Input` / `Checkbox` / `Radio` - Champs
- `Button` - Navigation

## 🎯 Bonnes Pratiques

### 1. Gestion d'État

```tsx
// Utiliser des hooks personnalisés
const { data, loading, error } = useDashboardData();

if (loading) return <Loading />;
if (error) return <ErrorDisplay error={error} />;

return <DashboardContent data={data} />;
```

### 2. Validation

```tsx
// Utiliser Form avec validation
<Form onSubmit={handleSubmit} validationSchema={settingsSchema}>
  <FormField name="email" label="Email">
    <Input type="email" />
  </FormField>
</Form>
```

### 3. Accessibilité

```tsx
// Toujours inclure les labels et ARIA
<FormField name="name" label="Nom" required>
  <Input aria-label="Nom" aria-required="true" />
</FormField>
```

## 📖 Ressources

- [Documentation API](../components/docs/API.md)
- [Guide de Thème](../../components/theme/README.md)
- [Composants UI](../../components/ui/README.md)

---

**Note** : Les exemples sont conçus pour être modifiés et adaptés à vos besoins spécifiques.
