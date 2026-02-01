# Guide d'Installation des Typographies Modernes

## Vue d'ensemble

Ce guide vous explique comment installer et configurer des typographies modernes pour ImmoAssist26B-F. Nous allons utiliser **Inter** et **Plus Jakarta Sans**, deux polices très populaires pour les interfaces modernes.

## Typographies recommandées

### 1. Inter (Police principale)
- **Usage** : Corps de texte, UI, navigation
- **Caractéristiques** : Excellente lisibilité, optimisée pour les écrans, support complet des caractères
- **Poids disponibles** : 100-900

### 2. Plus Jakarta Sans (Police d'accent)
- **Usage** : Titres, headings, éléments importants
- **Caractéristiques** : Moderne, géométrique, friendly
- **Poids disponibles** : 200-800

## Méthode 1 : Installation via Google Fonts (Recommandée)

### Étape 1 : Modifier le fichier `app/layout.tsx`

Ajoutez les imports de Google Fonts en haut du fichier :

\`\`\`typescript
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});
\`\`\`

### Étape 2 : Appliquer les polices au HTML

Dans le composant `RootLayout`, ajoutez les classes :

\`\`\`typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
\`\`\`

### Étape 3 : Configurer Tailwind CSS

Modifiez `tailwind.config.ts` pour ajouter les polices :

\`\`\`typescript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'var(--font-inter)', 'sans-serif'],
      },
    },
  },
};
\`\`\`

## Méthode 2 : Installation via Fontsource (Alternative)

### Étape 1 : Installer les packages

\`\`\`bash
pnpm add @fontsource/inter @fontsource/plus-jakarta-sans
\`\`\`

### Étape 2 : Importer dans `app/layout.tsx`

\`\`\`typescript
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import '@fontsource/plus-jakarta-sans/300.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
\`\`\`

### Étape 3 : Configurer Tailwind CSS

\`\`\`typescript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
};
\`\`\`

## Utilisation dans les composants

### Classes Tailwind disponibles

Après configuration, vous pouvez utiliser :

\`\`\`tsx
// Police par défaut (Inter)
<p className="font-sans">Texte normal</p>

// Police d'affichage (Plus Jakarta Sans)
<h1 className="font-display">Titre principal</h1>

// Poids de police
<p className="font-light">Texte léger (300)</p>
<p className="font-normal">Texte normal (400)</p>
<p className="font-medium">Texte medium (500)</p>
<p className="font-semibold">Texte semi-bold (600)</p>
<p className="font-bold">Texte bold (700)</p>
<p className="font-extrabold">Texte extra-bold (800)</p>
\`\`\`

### Exemples d'utilisation

\`\`\`tsx
// Titre de page
<h1 className="font-display text-4xl font-bold text-gray-900">
  Welcome to ImmoAssist
</h1>

// Sous-titre
<h2 className="font-display text-2xl font-semibold text-gray-800">
  Your Dashboard
</h2>

// Corps de texte
<p className="font-sans text-base font-normal text-gray-600">
  This is a paragraph with regular text.
</p>

// Texte léger
<p className="font-sans text-sm font-light text-gray-500">
  Secondary information
</p>

// Bouton
<button className="font-sans text-sm font-medium">
  Click me
</button>
\`\`\`

## Bonnes pratiques

### Hiérarchie typographique

\`\`\`tsx
// H1 - Titres principaux
<h1 className="font-display text-4xl font-bold">Main Title</h1>

// H2 - Sous-titres
<h2 className="font-display text-3xl font-semibold">Section Title</h2>

// H3 - Titres de cartes
<h3 className="font-display text-xl font-semibold">Card Title</h3>

// Body - Texte normal
<p className="font-sans text-base font-normal">Regular text</p>

// Caption - Texte secondaire
<p className="font-sans text-sm font-light">Secondary text</p>

// Label - Étiquettes
<label className="font-sans text-xs font-medium uppercase tracking-wide">
  Label
</label>
\`\`\`

### Poids recommandés par contexte

| Contexte | Police | Poids | Classe Tailwind |
|----------|--------|-------|-----------------|
| Titres principaux | Plus Jakarta Sans | 700-800 | `font-display font-bold` |
| Sous-titres | Plus Jakarta Sans | 600 | `font-display font-semibold` |
| Titres de cartes | Plus Jakarta Sans | 600 | `font-display font-semibold` |
| Corps de texte | Inter | 400 | `font-sans font-normal` |
| Texte secondaire | Inter | 300 | `font-sans font-light` |
| Boutons | Inter | 500 | `font-sans font-medium` |
| Labels | Inter | 500 | `font-sans font-medium` |
| Navigation | Inter | 400-500 | `font-sans font-normal` |

## Configuration avancée

### Variables CSS personnalisées

Ajoutez dans `globals.css` :

\`\`\`css
:root {
  --font-inter: 'Inter', system-ui, sans-serif;
  --font-plus-jakarta: 'Plus Jakarta Sans', 'Inter', sans-serif;
  
  /* Tailles de police */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
\`\`\`

### Responsive Typography

\`\`\`tsx
<h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Title
</h1>

<p className="font-sans text-sm md:text-base lg:text-lg font-normal">
  Responsive paragraph
</p>
\`\`\`

## Vérification de l'installation

### Test visuel

Créez une page de test :

\`\`\`tsx
export default function TypographyTest() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2">Inter + Plus Jakarta Sans</h1>
        <p className="font-sans text-base font-light text-gray-600">
          Typography test page
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-3xl font-bold">Headings (Plus Jakarta Sans)</h2>
        <h1 className="font-display text-4xl font-bold">Heading 1 - Bold</h1>
        <h2 className="font-display text-3xl font-semibold">Heading 2 - Semibold</h2>
        <h3 className="font-display text-2xl font-semibold">Heading 3 - Semibold</h3>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-3xl font-bold">Body Text (Inter)</h2>
        <p className="font-sans text-base font-normal">
          This is regular body text with normal weight (400).
        </p>
        <p className="font-sans text-base font-light">
          This is light body text with light weight (300).
        </p>
        <p className="font-sans text-sm font-light text-gray-500">
          This is secondary text with light weight.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-3xl font-bold">Buttons</h2>
        <button className="font-sans text-sm font-medium px-6 py-3 bg-blue-500 text-white rounded-xl">
          Primary Button
        </button>
      </div>
    </div>
  );
}
\`\`\`

## Troubleshooting

### Les polices ne se chargent pas

1. Vérifiez que les imports sont corrects dans `layout.tsx`
2. Assurez-vous que les variables CSS sont bien définies
3. Redémarrez le serveur de développement : `pnpm dev`
4. Videz le cache du navigateur

### Les polices semblent différentes

1. Vérifiez que `display: 'swap'` est bien configuré
2. Assurez-vous que les poids corrects sont importés
3. Vérifiez la configuration Tailwind

### Performance

- Limitez les poids importés aux poids réellement utilisés
- Utilisez `display: 'swap'` pour éviter le FOIT (Flash of Invisible Text)
- Préchargez les polices critiques si nécessaire

## Résumé des commandes

\`\`\`bash
# Si vous utilisez Fontsource
pnpm add @fontsource/inter @fontsource/plus-jakarta-sans

# Redémarrer le serveur
pnpm dev

# Build de production
pnpm build
\`\`\`

## Ressources

- [Inter sur Google Fonts](https://fonts.google.com/specimen/Inter)
- [Plus Jakarta Sans sur Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Tailwind CSS Typography](https://tailwindcss.com/docs/font-family)

---

**Note** : La méthode Google Fonts (Méthode 1) est recommandée car elle est optimisée par Next.js et offre de meilleures performances.
