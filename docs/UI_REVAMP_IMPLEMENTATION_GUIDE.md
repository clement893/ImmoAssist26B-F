# 🛠️ Guide d'Implémentation - Revamp UI

**Complément au plan de revamp UI**  
**Date:** 31 Janvier 2026

---

## 📋 Table des Matières

1. [Configuration Initiale](#configuration-initiale)
2. [Exemples de Code](#exemples-de-code)
3. [Migration Step-by-Step](#migration-step-by-step)
4. [Troubleshooting](#troubleshooting)

---

## ⚙️ Configuration Initiale

### 1. Mise à jour de `tailwind.config.js`

```javascript
// apps/web/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // Nouveau système d'ombres
      boxShadow: {
        // Ombres subtiles
        'subtle-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'subtle-md': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'subtle-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.08)',
        
        // Ombres standard (pour cards)
        'standard-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'standard-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'standard-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
        'standard-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.06)',
        
        // Ombres colorées
        'colored-primary': '0 4px 14px 0 rgba(37, 99, 235, 0.15)',
        'colored-secondary': '0 4px 14px 0 rgba(99, 102, 241, 0.15)',
        'colored-success': '0 4px 14px 0 rgba(4, 120, 87, 0.15)',
        'colored-warning': '0 4px 14px 0 rgba(180, 83, 9, 0.15)',
        'colored-error': '0 4px 14px 0 rgba(220, 38, 38, 0.15)',
        
        // Ombres hover
        'hover-sm': '0 8px 16px -4px rgba(0, 0, 0, 0.12)',
        'hover-md': '0 12px 24px -6px rgba(0, 0, 0, 0.15)',
        'hover-lg': '0 16px 32px -8px rgba(0, 0, 0, 0.18)',
        
        // Ombres glassmorphism
        'glass-sm': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        
        // Ombres internes
        'inner-sm': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-md': 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.1)',
      },
      
      // Border radius étendus
      borderRadius: {
        'card': '16px',
        'card-lg': '20px',
      },
      
      // Transitions personnalisées
      transitionDuration: {
        'card': '200ms',
        'sidebar': '300ms',
      },
      
      // Backdrop blur pour glassmorphism
      backdropBlur: {
        'glass': '12px',
        'glass-lg': '16px',
      },
    },
  },
  plugins: [
    // Plugins existants...
  ],
};
```

### 2. Mise à jour de `tokens.ts`

```typescript
// apps/web/src/components/ui/tokens.ts

// ... code existant ...

/** 
 * Nouveau système d'ombres multi-niveaux
 */
export const shadowSystem = {
  // Ombres subtiles (pour éléments légers)
  subtle: {
    sm: 'var(--shadow-subtle-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.03))',
    md: 'var(--shadow-subtle-md, 0 2px 4px 0 rgba(0, 0, 0, 0.05))',
    lg: 'var(--shadow-subtle-lg, 0 4px 8px 0 rgba(0, 0, 0, 0.08))',
  },
  
  // Ombres standard (pour cards)
  standard: {
    sm: 'var(--shadow-standard-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04))',
    md: 'var(--shadow-standard-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
    lg: 'var(--shadow-standard-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.08))',
    xl: 'var(--shadow-standard-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.06))',
  },
  
  // Ombres colorées (pour éléments interactifs)
  colored: {
    primary: 'var(--shadow-colored-primary, 0 4px 14px 0 rgba(37, 99, 235, 0.15))',
    secondary: 'var(--shadow-colored-secondary, 0 4px 14px 0 rgba(99, 102, 241, 0.15))',
    success: 'var(--shadow-colored-success, 0 4px 14px 0 rgba(4, 120, 87, 0.15))',
    warning: 'var(--shadow-colored-warning, 0 4px 14px 0 rgba(180, 83, 9, 0.15))',
    error: 'var(--shadow-colored-error, 0 4px 14px 0 rgba(220, 38, 38, 0.15))',
  },
  
  // Ombres pour hover states
  hover: {
    sm: 'var(--shadow-hover-sm, 0 8px 16px -4px rgba(0, 0, 0, 0.12))',
    md: 'var(--shadow-hover-md, 0 12px 24px -6px rgba(0, 0, 0, 0.15))',
    lg: 'var(--shadow-hover-lg, 0 16px 32px -8px rgba(0, 0, 0, 0.18))',
  },
  
  // Ombres pour glassmorphism
  glass: {
    sm: 'var(--shadow-glass-sm, 0 8px 32px 0 rgba(31, 38, 135, 0.15))',
    md: 'var(--shadow-glass-md, 0 8px 32px 0 rgba(31, 38, 135, 0.2))',
    lg: 'var(--shadow-glass-lg, 0 8px 32px 0 rgba(31, 38, 135, 0.25))',
  },
  
  // Ombres internes (pour effets de profondeur)
  inner: {
    sm: 'var(--shadow-inner-sm, inset 0 2px 4px 0 rgba(0, 0, 0, 0.06))',
    md: 'var(--shadow-inner-md, inset 0 2px 8px 0 rgba(0, 0, 0, 0.1))',
  },
} as const;

// Helper pour obtenir une ombre
export function getShadow(
  category: keyof typeof shadowSystem,
  size: string
): string {
  const categoryShadows = shadowSystem[category] as Record<string, string>;
  return categoryShadows[size] || categoryShadows.md || '';
}
```

### 3. CSS Global pour les Animations

```css
/* apps/web/src/app/globals.css */

/* Animations pour cards */
@keyframes cardLift {
  from {
    transform: translateY(0);
    box-shadow: var(--shadow-standard-md);
  }
  to {
    transform: translateY(-4px);
    box-shadow: var(--shadow-standard-xl);
  }
}

@keyframes cardGlow {
  from {
    box-shadow: var(--shadow-standard-md);
  }
  to {
    box-shadow: var(--shadow-colored-primary);
  }
}

@keyframes cardScale {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.02);
  }
}

/* Animations pour sidebar */
@keyframes sidebarSlideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes itemHighlight {
  from {
    background-color: transparent;
  }
  to {
    background-color: var(--color-primary-100);
  }
}

/* Classes utilitaires */
.card-lift {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.card-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-standard-lg);
}

.card-glow:hover {
  box-shadow: var(--shadow-colored-primary);
  transition: box-shadow 200ms ease-out;
}

.card-scale:hover {
  transform: scale(1.02);
  transition: transform 200ms ease-out;
}
```

---

## 💻 Exemples de Code

### 1. Card Component Révisé

```typescript
// apps/web/src/components/ui/Card.tsx

'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { useGlobalTheme } from '@/lib/theme/global-theme-provider';

export type CardVariant = 
  | 'elevated'      // Par défaut - ombre standard
  | 'floating'      // Ombre prononcée, effet flottant
  | 'glass'         // Glassmorphism
  | 'bordered'      // Avec bordure d'accent
  | 'gradient'      // Background gradient
  | 'image'         // Card avec image header
  | 'minimal';      // Sans ombre, bordure subtile

export type CardElevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type CardHoverEffect = 'lift' | 'glow' | 'scale' | 'none';
export type AccentBorderPosition = 'left' | 'top' | 'right' | 'bottom' | 'none';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  variant?: CardVariant;
  elevation?: CardElevation;
  hover?: boolean;
  hoverEffect?: CardHoverEffect;
  onClick?: () => void;
  padding?: boolean;
  accentBorder?: AccentBorderPosition;
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | string;
  imageHeader?: string;
  glassIntensity?: 'light' | 'medium' | 'strong';
}

// Styles des variants
const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-white dark:bg-neutral-900 rounded-2xl shadow-standard-md border border-neutral-200 dark:border-neutral-800',
  floating: 'bg-white dark:bg-neutral-900 rounded-[20px] shadow-standard-lg border-0',
  glass: 'bg-white/70 dark:bg-neutral-900/70 backdrop-blur-glass border border-white/30 dark:border-neutral-800/50 rounded-2xl shadow-glass-md',
  bordered: 'bg-white dark:bg-neutral-900 rounded-2xl shadow-standard-sm',
  gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 rounded-2xl shadow-standard-md border border-primary-200 dark:border-primary-800',
  image: 'bg-white dark:bg-neutral-900 rounded-2xl shadow-standard-lg overflow-hidden',
  minimal: 'bg-transparent dark:bg-transparent rounded-xl border border-neutral-200 dark:border-neutral-800',
};

// Styles des effets hover
const hoverEffectStyles: Record<CardHoverEffect, string> = {
  lift: 'hover:shadow-standard-lg hover:-translate-y-0.5',
  glow: 'hover:shadow-colored-primary',
  scale: 'hover:scale-[1.02]',
  none: '',
};

// Styles des bordures d'accent
const accentBorderStyles: Record<AccentBorderPosition, string> = {
  left: 'border-l-4',
  top: 'border-t-4',
  right: 'border-r-4',
  bottom: 'border-b-4',
  none: '',
};

// Couleurs d'accent
const accentColors: Record<string, string> = {
  primary: 'border-l-primary-500',
  secondary: 'border-l-secondary-500',
  success: 'border-l-success-500',
  warning: 'border-l-warning-500',
  error: 'border-l-error-500',
};

export default function Card({
  children,
  title,
  subtitle,
  header,
  footer,
  actions,
  className,
  variant = 'elevated',
  elevation = 'md',
  hover = false,
  hoverEffect = 'lift',
  onClick,
  padding = true,
  accentBorder = 'none',
  accentColor = 'primary',
  imageHeader,
  glassIntensity = 'medium',
  ...props
}: CardProps) {
  const { theme } = useGlobalTheme();
  const cardFooter = footer || actions;
  
  // Déterminer l'intensité du glassmorphism
  const glassBgOpacity = {
    light: 'bg-white/50 dark:bg-neutral-900/50',
    medium: 'bg-white/70 dark:bg-neutral-900/70',
    strong: 'bg-white/90 dark:bg-neutral-900/90',
  }[glassIntensity];
  
  // Appliquer le style glass si nécessaire
  const glassStyle = variant === 'glass' ? glassBgOpacity : '';
  
  // Déterminer la couleur de bordure d'accent
  const accentBorderColor = accentColors[accentColor] || `border-l-[${accentColor}]`;
  const accentBorderClass = accentBorder !== 'none' 
    ? `${accentBorderStyles[accentBorder]} ${accentBorderColor}`
    : '';
  
  // Déterminer l'effet hover
  const hoverClass = (hover || onClick) && hoverEffect !== 'none'
    ? hoverEffectStyles[hoverEffect]
    : '';
  
  return (
    <div
      className={clsx(
        variantStyles[variant],
        glassStyle,
        accentBorderClass,
        'transition-all duration-200 ease-out',
        hoverClass,
        onClick && 'cursor-pointer active:scale-[0.98]',
        onClick && 'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
        'w-full',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {/* Image Header */}
      {imageHeader && variant === 'image' && (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={imageHeader} 
            alt={title || 'Card header'} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {(title || subtitle) && (
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {title && <h3 className="text-xl font-semibold">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm opacity-90">{subtitle}</p>}
            </div>
          )}
        </div>
      )}
      
      {/* Header (si pas d'image header) */}
      {!imageHeader && (title || subtitle || header) && (
        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          {header || (
            <>
              {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>}
            </>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={clsx(padding && 'p-6')}>
        {children}
      </div>
      
      {/* Footer */}
      {cardFooter && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4">
          {cardFooter}
        </div>
      )}
    </div>
  );
}
```

### 2. Sidebar Component Révisé (Variant Modern)

```typescript
// apps/web/src/components/ui/Sidebar.tsx

'use client';

import { ReactNode, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { ChevronRight, ChevronDown, Search, X, Home, LogOut } from 'lucide-react';
import Input from './Input';

// ... interfaces existantes ...

export type SidebarVariant = 
  | 'modern'        // Fond blanc, icônes circulaires
  | 'colored'       // Fond coloré sombre
  | 'minimal'       // Fond gris clair, compact
  | 'floating';     // Sidebar flottante avec ombre

interface SidebarProps {
  items: SidebarItem[];
  currentPath?: string;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: { name?: string; email?: string } | null;
  showSearch?: boolean;
  variant?: SidebarVariant;
  notificationsComponent?: ReactNode;
  onHomeClick?: () => void;
  themeToggleComponent?: ReactNode;
  onLogoutClick?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

// Styles des variants
const variantStyles: Record<SidebarVariant, {
  container: string;
  item: {
    base: string;
    active: string;
    inactive: string;
    icon: string;
  };
}> = {
  modern: {
    container: 'bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800',
    item: {
      base: 'px-4 py-2.5 rounded-xl transition-all duration-200',
      active: 'bg-primary-600 text-white shadow-colored-primary',
      inactive: 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
      icon: 'w-10 h-10 rounded-full flex items-center justify-center transition-all',
    },
  },
  colored: {
    container: 'bg-slate-800 dark:bg-slate-900',
    item: {
      base: 'px-4 py-2.5 rounded-xl transition-all duration-200',
      active: 'bg-white/10 text-white',
      inactive: 'text-neutral-300 hover:bg-white/5',
      icon: 'w-10 h-10 rounded-full flex items-center justify-center transition-all',
    },
  },
  minimal: {
    container: 'bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800',
    item: {
      base: 'px-3 py-2 rounded-lg transition-all duration-200',
      active: 'bg-white dark:bg-neutral-800 border-l-4 border-l-primary-500 text-primary-600 dark:text-primary-400',
      inactive: 'text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800',
      icon: 'w-8 h-8 flex items-center justify-center transition-all',
    },
  },
  floating: {
    container: 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-glass rounded-r-2xl shadow-standard-lg border-r border-neutral-200 dark:border-neutral-800',
    item: {
      base: 'px-4 py-2.5 rounded-xl transition-all duration-200',
      active: 'bg-primary-600/10 text-primary-600 dark:text-primary-400 border-l-2 border-l-primary-500',
      inactive: 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
      icon: 'w-10 h-10 rounded-full flex items-center justify-center transition-all',
    },
  },
};

export default function Sidebar({
  items,
  currentPath,
  className,
  collapsed = false,
  onToggleCollapse,
  user,
  showSearch = false,
  variant = 'modern',
  notificationsComponent,
  onHomeClick,
  themeToggleComponent,
  onLogoutClick,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const activePath = currentPath || pathname;
  
  const styles = variantStyles[variant];
  
  // ... reste de la logique existante ...
  
  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 flex flex-col transition-all duration-300',
        styles.container,
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Header avec recherche */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        {showSearch && !collapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border-neutral-200 dark:border-neutral-800"
            />
          </div>
        )}
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredItems.map((item) => renderItem(item))}
      </nav>
      
      {/* Footer avec user et logout */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        {user && !collapsed && (
          <div className="mb-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
          </div>
        )}
        {onLogoutClick && (
          <button
            onClick={onLogoutClick}
            className={clsx(
              'w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200',
              'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
```

### 3. Exemple d'Utilisation

```tsx
// Exemple d'utilisation des nouveaux composants

import Card from '@/components/ui/Card';
import Sidebar from '@/components/ui/Sidebar';

// Card Elevated (par défaut)
<Card 
  title="Titre de la card" 
  subtitle="Sous-titre"
  variant="elevated"
  hover
  hoverEffect="lift"
>
  Contenu de la card
</Card>

// Card Glassmorphism
<Card 
  title="Card Glass" 
  variant="glass"
  glassIntensity="medium"
  hover
>
  Contenu avec effet glassmorphism
</Card>

// Card avec bordure d'accent
<Card 
  title="Card avec accent" 
  variant="bordered"
  accentBorder="left"
  accentColor="primary"
>
  Contenu avec bordure colorée
</Card>

// Card avec image header
<Card 
  title="Card avec image" 
  variant="image"
  imageHeader="/path/to/image.jpg"
  hover
>
  Contenu en bas de la card
</Card>

// Sidebar Modern
<Sidebar
  items={sidebarItems}
  variant="modern"
  showSearch
  collapsed={false}
/>
```

---

## 🔄 Migration Step-by-Step

### Étape 1 : Préparation

```bash
# Créer une branche pour le revamp
git checkout -b feature/ui-revamp

# Installer les dépendances si nécessaire
pnpm install
```

### Étape 2 : Mise à jour de Tailwind Config

1. Ouvrir `apps/web/tailwind.config.js`
2. Ajouter les nouvelles ombres (voir Configuration Initiale)
3. Tester avec `pnpm dev`

### Étape 3 : Mise à jour de tokens.ts

1. Ouvrir `apps/web/src/components/ui/tokens.ts`
2. Ajouter le nouveau système d'ombres
3. Exporter les helpers

### Étape 4 : Refactoriser Card.tsx

1. Sauvegarder l'ancien fichier
2. Implémenter le nouveau composant avec tous les variants
3. Tester chaque variant
4. Mettre à jour la documentation

### Étape 5 : Refactoriser Sidebar.tsx

1. Sauvegarder l'ancien fichier
2. Implémenter les nouveaux variants
3. Ajouter la recherche intégrée
4. Tester chaque variant

### Étape 6 : Migration Progressive

1. Commencer par une page de test
2. Migrer les cards une par une
3. Tester à chaque étape
4. Obtenir des retours

---

## 🐛 Troubleshooting

### Problème : Les ombres ne s'affichent pas

**Solution :**
- Vérifier que Tailwind a été recompilé
- Vérifier que les classes CSS sont bien générées
- Vérifier la configuration de Tailwind

### Problème : Glassmorphism ne fonctionne pas

**Solution :**
- Vérifier le support de `backdrop-filter` dans le navigateur
- Ajouter `-webkit-backdrop-filter` pour Safari
- Vérifier que `backdrop-blur` est bien configuré dans Tailwind

### Problème : Les animations sont saccadées

**Solution :**
- Utiliser `will-change` pour les éléments animés
- Utiliser `transform` et `opacity` plutôt que `top/left`
- Activer l'accélération matérielle avec `translateZ(0)`

### Problème : Performance dégradée

**Solution :**
- Limiter le nombre d'éléments avec glassmorphism
- Utiliser `contain` CSS pour isoler les repaints
- Lazy load les images dans les ImageCards

---

## 📚 Ressources Additionnelles

- [Tailwind CSS Shadows](https://tailwindcss.com/docs/box-shadow)
- [CSS Backdrop Filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Framer Motion](https://www.framer.com/motion/) pour animations avancées
- [CSS Animations Performance](https://web.dev/animations-guide/)

---

**Document créé le :** 31 Janvier 2026  
**Dernière mise à jour :** 31 Janvier 2026
