# Tests des Composants UI

## Installation des dépendances

Pour exécuter les tests, assurez-vous d'avoir installé toutes les dépendances :

```bash
pnpm install
```

Si `@testing-library/user-event` n'est pas installé, ajoutez-le :

```bash
pnpm add -D @testing-library/user-event
```

## Exécution des tests

```bash
# Lancer tous les tests
pnpm test

# Lancer les tests en mode watch
pnpm test --watch

# Lancer les tests avec UI
pnpm test:ui

# Lancer les tests avec couverture
pnpm test --coverage
```

## Structure des tests

Chaque composant a son propre fichier de test dans `__tests__/` :

- `Button.test.tsx` - Tests pour le composant Button
- `Badge.test.tsx` - Tests pour le composant Badge
- `Alert.test.tsx` - Tests pour le composant Alert
- `Input.test.tsx` - Tests pour le composant Input

## Écriture de nouveaux tests

Lors de l'ajout d'un nouveau composant, créez un fichier de test correspondant :

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent>Test</MyComponent>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Bonnes pratiques

1. **Tester les cas d'usage principaux** : variants, tailles, états
2. **Tester les interactions** : clics, changements de valeur
3. **Tester l'accessibilité** : attributs ARIA, navigation clavier
4. **Tester les props** : validation des props requises/optionnelles
5. **Tester le dark mode** : classes CSS pour le dark mode
