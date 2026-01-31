# 🎨 Système de Thème - Documentation Complète

## Vue d'ensemble

Le système de thème permet de personnaliser dynamiquement les couleurs, polices et styles de l'ensemble de l'application en temps réel. Toutes les modifications sont persistées dans `localStorage` et appliquées via des variables CSS.

## 🚀 Utilisation Rapide

### ThemeManager Component

Le composant `ThemeManager` est intégré dans la page `/components/theme` et permet de modifier le thème global.

```tsx
import ThemeManager from '@/components/theme/ThemeManager';

<ThemeManager />;
```

## 🎨 Configuration du Thème

### Interface ThemeConfig

```typescript
interface ThemeConfig {
  // Couleurs principales
  primary: string; // Couleur principale
  secondary: string; // Couleur secondaire
  danger: string; // Couleur de danger
  warning: string; // Couleur d'avertissement
  info: string; // Couleur d'information

  // Typographie - Polices
  fontFamily: string; // Police par défaut
  fontFamilyHeading: string; // Police pour les titres
  fontFamilySubheading: string; // Police pour les sous-titres

  // Typographie - Couleurs de texte
  textHeading: string; // Couleur des titres
  textSubheading: string; // Couleur des sous-titres
  textBody: string; // Couleur du texte principal
  textSecondary: string; // Couleur du texte secondaire
  textLink: string; // Couleur des liens

  // Couleurs d'erreur et validation
  errorColor: string; // Couleur d'erreur
  errorBg: string; // Fond d'erreur
  successColor: string; // Couleur de succès
  successBg: string; // Fond de succès

  // Style
  borderRadius: string; // Rayon des bordures
}
```

## 🎯 Presets de Thème

### Presets Disponibles

#### 1. Default

Thème par défaut avec des couleurs bleues et vertes.

```typescript
{
  primary: '#3B82F6',      // blue-500
  secondary: '#10B981',    // green-500
  fontFamily: 'Inter',
  borderRadius: '0.5rem',
}
```

#### 2. Modern

Thème moderne avec des couleurs indigo/violet et police Poppins pour les titres.

```typescript
{
  primary: '#6366F1',       // indigo-500
  secondary: '#8B5CF6',    // violet-500
  fontFamily: 'Inter',
  fontFamilyHeading: 'Poppins',
  borderRadius: '0.75rem',
}
```

#### 3. Corporate

Thème professionnel avec des couleurs bleues foncées et police Roboto.

```typescript
{
  primary: '#1E40AF',       // blue-800
  secondary: '#059669',    // emerald-600
  fontFamily: 'Roboto',
  borderRadius: '0.25rem',
}
```

#### 4. Vibrant

Thème vibrant avec des couleurs roses/ambre et police Poppins.

```typescript
{
  primary: '#EC4899',       // pink-500
  secondary: '#F59E0B',     // amber-500
  fontFamily: 'Poppins',
  borderRadius: '1rem',
}
```

#### 5. Minimal

Thème minimaliste avec noir et gris.

```typescript
{
  primary: '#000000',
  secondary: '#6B7280',
  fontFamily: 'Inter',
  borderRadius: '0.25rem',
}
```

### Utiliser un Preset

```tsx
import ThemeManager from '@/components/theme/ThemeManager';

// Dans ThemeManager, cliquer sur un bouton de preset
// ou utiliser programmatiquement :

const applyPreset = (presetName: 'default' | 'modern' | 'corporate' | 'vibrant' | 'minimal') => {
  const preset = themePresets[presetName];
  // Le ThemeManager applique automatiquement le preset
};
```

## 🔧 Variables CSS

Le système utilise des variables CSS pour appliquer le thème :

### Couleurs Principales

```css
:root {
  --color-primary-50: /* Nuance la plus claire */ --color-primary-100: --color-primary-200:
    --color-primary-300: --color-primary-400: --color-primary-500: /* Couleur principale */
    --color-primary-600: --color-primary-700: --color-primary-800: --color-primary-900:
    /* Nuance la plus foncée */
    /* Même structure pour secondary, danger, warning, info */;
}
```

### Typographie

```css
:root {
  --font-family: /* Police par défaut */ --font-family-heading: /* Police pour les titres */
    --font-family-subheading: /* Police pour les sous-titres */
    --color-text-heading: /* Couleur des titres */
    --color-text-subheading: /* Couleur des sous-titres */
    --color-text-body: /* Couleur du texte principal */
    --color-text-secondary: /* Couleur du texte secondaire */
    --color-text-link: /* Couleur des liens */;
}
```

### Couleurs d'État

```css
:root {
  --color-error: /* Couleur d'erreur */ --color-error-bg: /* Fond d'erreur */
    --color-success: /* Couleur de succès */ --color-success-bg: /* Fond de succès */;
}
```

## 📝 Utilisation dans les Composants

### Classes Tailwind

Les composants utilisent les classes Tailwind mappées aux variables CSS :

```tsx
// Couleur principale
<button className="bg-primary-500 text-white">
  Bouton
</button>

// Texte avec couleur de thème
<h1 className="text-heading font-heading">
  Titre
</h1>

// Couleur d'erreur
<div className="text-error bg-error-bg">
  Message d'erreur
</div>
```

### Classes Disponibles

#### Couleurs

- `bg-primary-{50-900}` - Fond couleur principale
- `text-primary-{50-900}` - Texte couleur principale
- `border-primary-{50-900}` - Bordure couleur principale
- (Même structure pour `secondary`, `danger`, `warning`, `info`)

#### Typographie

- `font-heading` - Police pour les titres
- `font-subheading` - Police pour les sous-titres
- `text-heading` - Couleur des titres
- `text-subheading` - Couleur des sous-titres
- `text-body` - Couleur du texte principal
- `text-secondary` - Couleur du texte secondaire
- `text-link` - Couleur des liens

#### États

- `text-error` - Couleur d'erreur
- `bg-error-bg` - Fond d'erreur
- `text-success` - Couleur de succès
- `bg-success-bg` - Fond de succès

## 💾 Persistance

Le thème est automatiquement sauvegardé dans `localStorage` avec la clé `theme-config`. Au chargement de la page, le thème est restauré automatiquement.

```typescript
// Sauvegarde automatique
localStorage.setItem('theme-config', JSON.stringify(themeConfig));

// Restauration automatique
const savedTheme = localStorage.getItem('theme-config');
if (savedTheme) {
  const theme = JSON.parse(savedTheme);
  applyTheme(theme);
}
```

## 🎨 Personnalisation Avancée

### Créer un Preset Personnalisé

```typescript
const customPreset: ThemeConfig = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  danger: '#FF4757',
  warning: '#FFA502',
  info: '#3742FA',
  fontFamily: 'Montserrat',
  fontFamilyHeading: 'Montserrat',
  fontFamilySubheading: 'Montserrat',
  textHeading: '#2C3E50',
  textSubheading: '#34495E',
  textBody: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLink: '#3498DB',
  errorColor: '#E74C3C',
  errorBg: '#FADBD8',
  successColor: '#27AE60',
  successBg: '#D5F4E6',
  borderRadius: '0.5rem',
};

// Ajouter au themePresets
themePresets.custom = customPreset;
```

### Génération Automatique des Nuances

Le système génère automatiquement 9 nuances (50-900) pour chaque couleur principale en utilisant la fonction `hexToRgb` et des calculs de luminosité.

```typescript
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function applyColorShades(colorName: string, hex: string) {
  const rgb = hexToRgb(hex);
  // Génération des nuances 50-900
  for (let i = 50; i <= 900; i += 100) {
    const shade = calculateShade(rgb, i);
    document.documentElement.style.setProperty(`--color-${colorName}-${i}`, shade);
  }
}
```

## 🔄 Migration des Composants

Pour migrer un composant vers le système de thème :

### Avant (Couleurs hardcodées)

```tsx
<div className="bg-blue-500 text-white">Contenu</div>
```

### Après (Variables CSS)

```tsx
<div className="bg-primary-500 text-white">Contenu</div>
```

### Composants Migrés

- ✅ `Toast` - Utilise `bg-success-bg` et `text-success`
- ✅ `KanbanBoard` - Utilise `bg-error-bg` et `text-error` pour les priorités
- ✅ `Calendar` - Utilise `bg-primary-50` et `text-primary-600`
- ✅ `CRUDModal` - Utilise `bg-error-bg` et `text-error` pour le mode suppression

## 📚 Exemples

### Exemple Complet

```tsx
'use client';

import { useState } from 'react';
import ThemeManager from '@/components/theme/ThemeManager';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ThemePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-heading font-heading text-3xl mb-6">Personnalisation du Thème</h1>

      <Card className="p-6 mb-6">
        <p className="text-body mb-4">
          Modifiez les couleurs et polices ci-dessous pour voir les changements s'appliquer
          instantanément sur toute l'application.
        </p>

        <ThemeManager />
      </Card>

      <Card className="p-6">
        <h2 className="text-heading font-heading text-xl mb-4">Aperçu des Composants</h2>

        <div className="space-y-4">
          <Button variant="primary">Bouton Principal</Button>
          <Button variant="secondary">Bouton Secondaire</Button>
          <Button variant="danger">Bouton Danger</Button>
        </div>
      </Card>
    </div>
  );
}
```

## 🐛 Dépannage

### Le thème ne s'applique pas

1. Vérifier que les variables CSS sont définies dans `globals.css`
2. Vérifier que les classes Tailwind sont configurées dans `tailwind.config.js`
3. Vérifier la console pour les erreurs JavaScript

### Les couleurs ne changent pas

1. Vérifier que le composant utilise les classes de thème (pas de couleurs hardcodées)
2. Vérifier que `localStorage` n'est pas bloqué
3. Vider le cache du navigateur

### Les polices ne changent pas

1. Vérifier que les polices sont chargées (Google Fonts, etc.)
2. Vérifier que les classes `font-heading` et `font-subheading` sont utilisées
3. Vérifier la configuration dans `globals.css`

## 📖 Ressources

- [Documentation API](../app/components/docs/API.md)
- [Guide d'Accessibilité](../ui/ACCESSIBILITY.md)
- [Page de Démonstration](/components/theme)

---

**Note** : Le système de thème est en constante évolution. Consultez le [CHANGELOG](../ui/CHANGELOG.md) pour les dernières mises à jour.
