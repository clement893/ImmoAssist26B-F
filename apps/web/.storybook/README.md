# 📚 Storybook - Guide Complet

## Vue d'ensemble

Storybook est un environnement de développement pour les composants UI. Il permet de développer, tester et documenter les composants de manière isolée.

## 🚀 Démarrage Rapide

### Installation

Storybook est déjà configuré dans le projet. Les dépendances sont installées avec :

```bash
pnpm install
```

### Lancer Storybook

```bash
cd apps/web
pnpm storybook
```

Storybook sera accessible sur **http://localhost:6006**

### Build de Production

```bash
cd apps/web
pnpm build-storybook
```

Le build sera généré dans le dossier `storybook-static/`.

## 📁 Structure

```
apps/web/
├── .storybook/
│   ├── main.ts          # Configuration principale
│   └── preview.tsx      # Configuration preview
└── src/
    └── components/
        └── ui/
            ├── Button.tsx
            ├── Button.stories.tsx  # Stories pour Button
            └── ...
```

## ✍️ Créer une Story

### Exemple Basique

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Bouton',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Bouton Secondaire',
  },
};
```

### Exemple avec Contrôles

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Bouton',
  },
};
```

## 🎨 Configuration

### main.ts

```typescript
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-docs',
    '@storybook/addon-a11y', // Accessibilité
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
};

export default config;
```

### preview.tsx

```typescript
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

## 🔌 Addons Disponibles

### Addons Essentiels

- **@storybook/addon-essentials** - Ensemble d'addons essentiels
- **@storybook/addon-links** - Navigation entre stories
- **@storybook/addon-interactions** - Tests d'interactions
- **@storybook/addon-docs** - Documentation automatique
- **@storybook/addon-a11y** - Tests d'accessibilité

### Utilisation des Addons

#### Tests d'Accessibilité (a11y)

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

export default meta;
```

#### Tests d'Interactions

```tsx
import { expect, userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Clickable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);
    await expect(button).toHaveTextContent('Cliqué');
  },
};
```

## 📖 Documentation MDX

### Créer une Documentation MDX

```mdx
// Button.mdx
import { Meta, Story } from '@storybook/blocks';
import \* as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button Component

Le composant Button permet de créer des boutons avec différents variants.

## Variants

<Story of={ButtonStories.Primary} />
<Story of={ButtonStories.Secondary} />
```

## 🎯 Bonnes Pratiques

### Nommage des Stories

- Utiliser des noms descriptifs : `Primary`, `WithIcon`, `Disabled`
- Organiser par catégorie : `UI/Button`, `Forms/Input`
- Utiliser des titres hiérarchiques : `UI/Button/Variants/Primary`

### Structure des Stories

```tsx
// 1. Meta configuration
const meta: Meta<typeof Component> = {
  title: 'Category/Component',
  component: Component,
  tags: ['autodocs'],
};

// 2. Export default
export default meta;

// 3. Type Story
type Story = StoryObj<typeof meta>;

// 4. Stories individuelles
export const Default: Story = {
  args: {
    // props
  },
};
```

### Tests dans les Stories

```tsx
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Tests d'interaction
    await userEvent.click(button);
    await expect(button).toBeDisabled();
  },
};
```

## 🔧 Intégration avec Next.js

### Configuration Next.js

Storybook utilise `@storybook/nextjs` qui configure automatiquement :

- Support des imports Next.js (`@/components`, etc.)
- Support des images (`next/image`)
- Support des polices (`next/font`)
- Support du CSS global

### Utiliser les Contextes Next.js

```tsx
// preview.tsx
import { ThemeProvider } from '../src/contexts/ThemeContext';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};
```

## 📊 Visual Testing

### Snapshot Testing

```tsx
import { expect } from '@storybook/test';
import { within } from '@storybook/test';

export const Snapshot: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await expect(button).toMatchSnapshot();
  },
};
```

## 🚀 Déploiement

### Déployer sur Chromatic

```bash
# Installer Chromatic
pnpm add -D chromatic

# Publier
npx chromatic --project-token=your-token
```

### Déployer sur Netlify/Vercel

```bash
# Build
pnpm build-storybook

# Déployer le dossier storybook-static/
```

## 📚 Ressources

- [Documentation Storybook](https://storybook.js.org/docs)
- [Addons Storybook](https://storybook.js.org/addons)
- [Testing avec Storybook](https://storybook.js.org/docs/writing-tests)

---

**Note** : Consultez les stories existantes dans `src/components/ui/` pour des exemples complets.
