# Guide d'Accessibilité des Composants UI

Ce document décrit les pratiques d'accessibilité implémentées dans les composants UI.

## 🎯 Standards Respectés

- **WCAG 2.1 Level AA** - Conformité aux standards d'accessibilité web
- **ARIA** - Attributs ARIA appropriés
- **Navigation clavier** - Support complet du clavier
- **Screen readers** - Compatibilité avec les lecteurs d'écran

## ✅ Composants Accessibles

### Button

- ✅ Focus visible avec `focus:ring-2`
- ✅ Support clavier (Enter/Espace)
- ✅ Attributs ARIA appropriés
- ✅ États disabled gérés

### Input

- ✅ Labels associés avec `htmlFor`
- ✅ Messages d'erreur avec `role="alert"` et `aria-live`
- ✅ `aria-invalid` pour les erreurs
- ✅ `aria-describedby` pour helper text
- ✅ `aria-required` pour champs requis

### Modal

- ✅ `role="dialog"` et `aria-modal="true"`
- ✅ `aria-labelledby` pour le titre
- ✅ `aria-describedby` pour la description
- ✅ Fermeture avec Escape
- ✅ Focus trap (focus reste dans la modal)
- ✅ Bouton de fermeture avec `aria-label`

### DataTable

- ✅ `role="table"` et `aria-label`
- ✅ `aria-sort` pour les colonnes triables
- ✅ Navigation clavier sur les lignes
- ✅ Support Enter/Espace pour les lignes cliquables

### Form

- ✅ Labels associés
- ✅ Messages d'erreur accessibles
- ✅ Validation avec feedback visuel et textuel

### Pagination

- ✅ Navigation clavier (flèches, Tab)
- ✅ `aria-label` pour la navigation
- ✅ États disabled visibles

### Dropdown

- ✅ Navigation clavier (flèches, Enter, Escape)
- ✅ Focus management
- ✅ Fermeture automatique

### Accordion

- ✅ `aria-expanded` pour l'état
- ✅ Navigation clavier
- ✅ Headers avec `role="button"`

## ⌨️ Navigation Clavier

### Raccourcis Standards

- **Tab** : Naviguer vers l'élément suivant
- **Shift+Tab** : Naviguer vers l'élément précédent
- **Enter/Espace** : Activer un bouton ou élément interactif
- **Escape** : Fermer modals, dropdowns
- **Flèches** : Navigation dans les listes, tables, pagination

### Implémentation

Tous les composants interactifs supportent la navigation clavier :

```tsx
// Exemple : Ligne de table cliquable
<TableRow
  onClick={handleClick}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Row details"
>
```

## 🎨 Focus Visible

Tous les composants ont un focus visible :

```css
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

## 📝 Attributs ARIA

### Labels

- Utiliser `aria-label` pour les éléments sans texte visible
- Utiliser `aria-labelledby` pour référencer un label existant

### Descriptions

- Utiliser `aria-describedby` pour les helper texts et erreurs

### États

- `aria-invalid="true"` pour les champs en erreur
- `aria-required="true"` pour les champs requis
- `aria-expanded` pour les éléments expansibles
- `aria-disabled` pour les éléments désactivés

### Rôles

- `role="button"` pour les éléments cliquables non-boutons
- `role="dialog"` pour les modals
- `role="alert"` pour les messages d'erreur
- `role="table"` pour les tables

## 🧪 Tests d'Accessibilité

### Storybook

- Addon `@storybook/addon-a11y` configuré
- Tests automatiques dans les stories

### Playwright

- Tests E2E avec vérification accessibilité
- Navigation clavier testée

## 📚 Ressources

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
