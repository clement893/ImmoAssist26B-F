# Variables CSS du Thème

**Dernière mise à jour :** 2025-01-27  
**Version :** 1.0

Ce document liste toutes les variables CSS générées par le système de thème et explique comment les utiliser dans vos composants.

---

## 📋 Table des Matières

1. [Couleurs](#couleurs)
2. [Typographie](#typographie)
3. [Border Radius](#border-radius)
4. [Effets](#effets)
5. [Couleurs de Statut](#couleurs-de-statut)
6. [Couleurs de Graphiques](#couleurs-de-graphiques)
7. [Mapping avec Classes Tailwind](#mapping-avec-classes-tailwind)
8. [Exemples d'Utilisation](#exemples-dutilisation)
9. [Bonnes Pratiques](#bonnes-pratiques)
10. [Anti-patterns](#anti-patterns)

---

## 🎨 Couleurs

### Primary (Couleur Principale)

**Variables CSS :**

- `--color-primary-50` à `--color-primary-950` (nuances de 50 à 950)
- `--color-primary-rgb` (valeurs RGB pour opacité, format: `r, g, b`)

**Classes Tailwind :**

- `bg-primary-50` à `bg-primary-950`
- `text-primary-50` à `text-primary-950`
- `border-primary-50` à `border-primary-950`

**Exemple d'utilisation :**

```tsx
// Classe Tailwind (recommandé)
<div className="bg-primary-500 text-white">Primary Button</div>

// Variable CSS directe (si besoin de plus de contrôle)
<div style={{ backgroundColor: 'var(--color-primary-500)' }}>Primary</div>

// Avec opacité (utiliser RGB)
<div style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.5)' }}>Semi-transparent</div>
```

### Secondary (Couleur Secondaire)

**Variables CSS :**

- `--color-secondary-50` à `--color-secondary-950`
- `--color-secondary-rgb`

**Classes Tailwind :**

- `bg-secondary-50` à `bg-secondary-950`
- `text-secondary-50` à `text-secondary-950`
- `border-secondary-50` à `border-secondary-950`

**Note :** Si `success_color` n'est pas défini, les couleurs success utilisent les couleurs secondary par défaut.

### Danger (Couleur de Danger)

**Variables CSS :**

- `--color-danger-50` à `--color-danger-950`
- `--color-danger-rgb`

**Classes Tailwind :**

- `bg-danger-50` à `bg-danger-950`
- `text-danger-50` à `text-danger-950`
- `border-danger-50` à `border-danger-950`

**Note :** Les couleurs `error` sont des alias de `danger` (même valeurs).

### Warning (Couleur d'Avertissement)

**Variables CSS :**

- `--color-warning-50` à `--color-warning-950`
- `--color-warning-rgb`

**Classes Tailwind :**

- `bg-warning-50` à `bg-warning-950`
- `text-warning-50` à `text-warning-950`
- `border-warning-50` à `border-warning-950`

### Info (Couleur d'Information)

**Variables CSS :**

- `--color-info-50` à `--color-info-950`

**Classes Tailwind :**

- `bg-info-50` à `bg-info-950`
- `text-info-50` à `text-info-950`
- `border-info-50` à `border-info-950`

### Success (Couleur de Succès)

**Variables CSS :**

- `--color-success-50` à `--color-success-950`
- `--color-success-rgb`

**Classes Tailwind :**

- `bg-success-50` à `bg-success-950`
- `text-success-50` à `text-success-950`
- `border-success-50` à `border-success-950`

**Note :** Par défaut, utilise les couleurs `secondary` si `success_color` n'est pas défini explicitement.

### Error (Couleur d'Erreur)

**Variables CSS :**

- `--color-error-50` à `--color-error-950`
- `--color-error-rgb`

**Note :** Les couleurs `error` sont des alias de `danger` (même valeurs).

### Couleurs de Fond et Texte

**Variables CSS :**

- `--color-background` : Couleur de fond principale
- `--color-foreground` : Couleur de texte principale
- `--color-muted` : Couleur de fond atténuée
- `--color-muted-foreground` : Couleur de texte atténuée
- `--color-border` : Couleur des bordures
- `--color-input` : Couleur de fond des inputs
- `--color-ring` : Couleur du ring de focus

**Exemple d'utilisation :**

```tsx
// Classe Tailwind (si disponible)
<div className="bg-[var(--color-background)] text-[var(--color-foreground)]">

// Variable CSS directe
<div style={{
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-foreground)',
  borderColor: 'var(--color-border)'
}}>
```

---

## 📝 Typographie

### Familles de Polices

**Variables CSS :**

- `--font-family` : Police principale (sans-serif)
- `--font-family-heading` : Police pour les titres
- `--font-family-subheading` : Police pour les sous-titres

**Classes Tailwind :**

- `font-sans` : Utilise `--font-family`
- `font-heading` : Utilise `--font-family-heading`
- `font-subheading` : Utilise `--font-family-subheading`

**Exemple d'utilisation :**

```tsx
// Classe Tailwind (recommandé)
<h1 className="font-heading">Titre</h1>
<p className="font-sans">Texte</p>

// Variable CSS directe
<h1 style={{ fontFamily: 'var(--font-family-heading)' }}>Titre</h1>
```

**Note :** Les polices sont chargées dynamiquement depuis `font_url` ou `typography.fontUrl` si configuré.

---

## 🔲 Border Radius

**Variables CSS :**

- `--border-radius` : Rayon de bordure par défaut

**Classes Tailwind :**

- `rounded` : Utilise `--border-radius` (via `borderRadius.DEFAULT`)

**Exemple d'utilisation :**

```tsx
// Classe Tailwind (recommandé)
<div className="rounded">Contenu arrondi</div>

// Variable CSS directe
<div style={{ borderRadius: 'var(--border-radius)' }}>Contenu arrondi</div>
```

---

## ✨ Effets

### Glassmorphism

**Variables CSS :**

- `--glassmorphism-backdrop` : Effet de flou et saturation (ex: `blur(10px) saturate(180%)`)
- `--glassmorphism-opacity` : Opacité du fond (ex: `0.1`)
- `--glassmorphism-border-opacity` : Opacité de la bordure (ex: `0.2`)

**Format avancé (nouveau) :**

- `--glassmorphism-card-background`
- `--glassmorphism-card-backdrop-blur`
- `--glassmorphism-card-border`
- `--glassmorphism-panel-background`
- `--glassmorphism-panel-backdrop-blur`
- `--glassmorphism-panel-border`
- `--glassmorphism-overlay-background`
- `--glassmorphism-overlay-backdrop-blur`

**Exemple d'utilisation :**

```tsx
<div
  style={{
    backdropFilter: "var(--glassmorphism-backdrop)",
    backgroundColor: "rgba(255, 255, 255, var(--glassmorphism-opacity))",
    border: `1px solid rgba(255, 255, 255, var(--glassmorphism-border-opacity))`,
  }}
>
  Glassmorphism Card
</div>
```

### Ombres (Shadows)

**Variables CSS :**

- `--shadow-sm` : Ombre petite
- `--shadow-md` : Ombre moyenne
- `--shadow-lg` : Ombre grande
- `--shadow-xl` : Ombre très grande

**Classes Tailwind :**

- `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` (si mappées dans Tailwind)

**Exemple d'utilisation :**

```tsx
// Variable CSS directe
<div style={{ boxShadow: "var(--shadow-md)" }}>Card avec ombre</div>
```

### Dégradés (Gradients)

**Variables CSS :**

- `--gradient-direction` : Direction du dégradé (ex: `to-br`)
- `--gradient-intensity` : Intensité du dégradé (ex: `0.3`)

**Exemple d'utilisation :**

```tsx
<div
  style={{
    background: `linear-gradient(var(--gradient-direction), 
    rgba(var(--color-primary-rgb), var(--gradient-intensity)), 
    rgba(var(--color-secondary-rgb), var(--gradient-intensity)))`,
  }}
>
  Gradient Background
</div>
```

### Effets Personnalisés

Les effets personnalisés sont convertis en variables CSS avec le format :

- `--effect-{effectName}-{propertyName}`

**Exemple :** Si vous avez un effet `neon` avec `color: '#00ff00'` et `intensity: 'high'` :

- `--effect-neon-color`
- `--effect-neon-intensity`

---

## 🏷️ Couleurs de Statut

**Variables CSS :**

- `--color-status-todo` : Couleur pour statut "À faire" (alias de `--color-primary-500`)
- `--color-status-in-progress` : Couleur pour statut "En cours" (alias de `--color-warning-500`)
- `--color-status-done` : Couleur pour statut "Terminé" (alias de `--color-secondary-500`)
- `--color-status-error` : Couleur pour statut "Erreur" (alias de `--color-danger-500`)

**Exemple d'utilisation :**

```tsx
<span style={{ color: 'var(--color-status-todo)' }}>À faire</span>
<span style={{ color: 'var(--color-status-in-progress)' }}>En cours</span>
<span style={{ color: 'var(--color-status-done)' }}>Terminé</span>
```

---

## 📊 Couleurs de Graphiques

**Variables CSS :**

- `--color-chart-default` : Couleur par défaut pour les graphiques (alias de `--color-primary-500`)
- `--color-chart-success` : Couleur de succès pour graphiques (alias de `--color-secondary-500`)
- `--color-chart-warning` : Couleur d'avertissement pour graphiques (alias de `--color-warning-500`)
- `--color-chart-danger` : Couleur de danger pour graphiques (alias de `--color-danger-500`)

**Exemple d'utilisation :**

```tsx
// Pour les bibliothèques de graphiques
const chartColors = [
  "var(--color-chart-default)",
  "var(--color-chart-success)",
  "var(--color-chart-warning)",
  "var(--color-chart-danger)",
];
```

---

## 🔗 Mapping avec Classes Tailwind

### Couleurs

| Variable CSS            | Classe Tailwind                          | Usage              |
| ----------------------- | ---------------------------------------- | ------------------ |
| `--color-primary-500`   | `bg-primary-500`, `text-primary-500`     | Couleur principale |
| `--color-secondary-500` | `bg-secondary-500`, `text-secondary-500` | Couleur secondaire |
| `--color-danger-500`    | `bg-danger-500`, `text-danger-500`       | Danger/Erreur      |
| `--color-warning-500`   | `bg-warning-500`, `text-warning-500`     | Avertissement      |
| `--color-info-500`      | `bg-info-500`, `text-info-500`           | Information        |
| `--color-success-500`   | `bg-success-500`, `text-success-500`     | Succès             |

### Typographie

| Variable CSS               | Classe Tailwind   | Usage                  |
| -------------------------- | ----------------- | ---------------------- |
| `--font-family`            | `font-sans`       | Police principale      |
| `--font-family-heading`    | `font-heading`    | Police des titres      |
| `--font-family-subheading` | `font-subheading` | Police des sous-titres |

### Border Radius

| Variable CSS      | Classe Tailwind | Usage            |
| ----------------- | --------------- | ---------------- |
| `--border-radius` | `rounded`       | Rayon par défaut |

---

## 💡 Exemples d'Utilisation

### Exemple 1 : Bouton avec Couleur du Thème

```tsx
// ✅ BON : Utiliser les classes Tailwind
<button className="bg-primary-500 hover:bg-primary-600 text-white rounded">
  Cliquez-moi
</button>

// ✅ BON : Utiliser les variables CSS directement si besoin de plus de contrôle
<button
  className="text-white rounded"
  style={{
    backgroundColor: 'var(--color-primary-500)',
    '--hover-bg': 'var(--color-primary-600)'
  }}
>
  Cliquez-moi
</button>
```

### Exemple 2 : Card avec Couleurs du Thème

```tsx
// ✅ BON : Utiliser les classes Tailwind
<Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  Contenu
</Card>

// ✅ MEILLEUR : Utiliser les variables CSS du thème
<div
  className="rounded shadow-md"
  style={{
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-foreground)',
    borderColor: 'var(--color-border)'
  }}
>
  Contenu
</div>
```

### Exemple 3 : Graphique avec Couleurs du Thème

```tsx
// ✅ BON : Utiliser les variables CSS pour les graphiques
const chartData = {
  datasets: [
    {
      backgroundColor: [
        "var(--color-chart-default)",
        "var(--color-chart-success)",
        "var(--color-chart-warning)",
        "var(--color-chart-danger)",
      ],
    },
  ],
};
```

### Exemple 4 : Texte avec Opacité

```tsx
// ✅ BON : Utiliser RGB pour opacité
<div
  style={{
    color: "rgba(var(--color-primary-rgb), 0.7)",
  }}
>
  Texte semi-transparent
</div>
```

---

## ✅ Bonnes Pratiques

### 1. Préférer les Classes Tailwind

**✅ BON :**

```tsx
<div className="bg-primary-500 text-white rounded">Contenu</div>
```

**⚠️ ACCEPTABLE (si besoin de plus de contrôle) :**

```tsx
<div style={{ backgroundColor: "var(--color-primary-500)" }}>Contenu</div>
```

### 2. Utiliser les Nuances Appropriées

**✅ BON :**

```tsx
// Fond clair avec texte sombre
<div className="bg-primary-50 text-primary-900">Contenu</div>

// Fond sombre avec texte clair
<div className="bg-primary-900 text-primary-50">Contenu</div>
```

### 3. Utiliser RGB pour Opacité

**✅ BON :**

```tsx
<div
  style={{
    backgroundColor: "rgba(var(--color-primary-rgb), 0.1)",
  }}
>
  Fond semi-transparent
</div>
```

**❌ ÉVITER :**

```tsx
// Ne pas utiliser opacity sur l'élément entier
<div style={{
  backgroundColor: 'var(--color-primary-500)',
  opacity: 0.5  // ❌ Affecte tout le contenu
}}>
```

### 4. Utiliser les Variables de Statut

**✅ BON :**

```tsx
<span style={{ color: "var(--color-status-todo)" }}>À faire</span>
```

**❌ ÉVITER :**

```tsx
<span className="text-primary-500">À faire</span> // ❌ Pas sémantique
```

---

## ❌ Anti-patterns

### 1. Ne Pas Utiliser de Couleurs Hardcodées

**❌ MAUVAIS :**

```tsx
<div style={{ backgroundColor: '#2563eb' }}>Contenu</div>
<div className="bg-[#2563eb]">Contenu</div>
```

**✅ BON :**

```tsx
<div className="bg-primary-500">Contenu</div>
<div style={{ backgroundColor: 'var(--color-primary-500)' }}>Contenu</div>
```

### 2. Ne Pas Ignorer le Thème

**❌ MAUVAIS :**

```tsx
// Couleurs qui ne changent pas avec le thème
<div className="bg-blue-500 text-white">Contenu</div>
```

**✅ BON :**

```tsx
// Couleurs qui s'adaptent au thème
<div className="bg-primary-500 text-white">Contenu</div>
```

### 3. Ne Pas Mélanger les Syntaxes

**❌ MAUVAIS :**

```tsx
<div className="bg-primary-500" style={{ color: "#ffffff" }}>
  Mélange de classes Tailwind et couleurs hardcodées
</div>
```

**✅ BON :**

```tsx
<div className="bg-primary-500 text-white">
  Utilisation cohérente des classes Tailwind
</div>
```

### 4. Ne Pas Utiliser les Classes Tailwind Non Mappées

**❌ MAUVAIS :**

```tsx
// Si --color-custom n'existe pas dans Tailwind config
<div className="bg-custom-500">Contenu</div>
```

**✅ BON :**

```tsx
// Utiliser directement la variable CSS
<div style={{ backgroundColor: "var(--color-custom-500)" }}>Contenu</div>
```

---

## 🔍 Vérification des Variables

### Dans le Navigateur (DevTools)

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Elements"
3. Sélectionner `<html>` ou `:root`
4. Voir les variables CSS dans le panneau "Styles"

### Programmatiquement

```typescript
// Obtenir la valeur d'une variable CSS
const primaryColor = getComputedStyle(
  document.documentElement,
).getPropertyValue("--color-primary-500");

console.log("Primary color:", primaryColor);
```

---

## 📚 Références

- [Guide de Validation des Thèmes](./THEME_VALIDATION_GUIDE.md)
- [Audit de l'Application du Thème](./THEME_APPLICATION_AUDIT.md)
- [Plan de Correction par Batches](./THEME_FIX_BATCH_PLAN.md)

---

## 🔄 Mises à Jour

| Date       | Version | Changements                  |
| ---------- | ------- | ---------------------------- |
| 2025-01-27 | 1.0     | Documentation initiale créée |

---

**Note :** Cette documentation est maintenue à jour avec le système de thème. Si vous découvrez de nouvelles variables CSS ou des changements, veuillez mettre à jour ce document.
