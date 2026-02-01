/**
 * Types communs pour les composants UI
 * Ce fichier définit les types de base utilisés par tous les composants
 * pour assurer la cohérence et la réutilisabilité.
 */

import { ReactNode, HTMLAttributes } from 'react';

/**
 * Variants de couleur communs pour les composants
 * Utilisés par Alert, Badge, et autres composants de feedback
 */
export type ColorVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Variants pour les Alertes (sans 'default', utilise 'info' à la place)
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Variants de style pour les boutons
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'error';

/**
 * Tailles communes pour les composants (Revamp UI - Tailles étendues)
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Props de base communes à tous les composants
 */
export interface BaseComponentProps extends HTMLAttributes<HTMLElement> {
  /** Classes CSS supplémentaires */
  className?: string;
  /** Contenu enfant */
  children?: ReactNode;
}

/**
 * Props pour les composants avec variants de couleur
 */
export interface ColorVariantProps {
  /** Variant de couleur du composant */
  variant?: ColorVariant;
}

/**
 * Props pour les composants avec taille
 */
export interface SizeProps {
  /** Taille du composant */
  size?: Size;
}

/**
 * Props pour les composants avec label
 */
export interface LabelProps {
  /** Label du composant */
  label?: string;
}

/**
 * Props pour les composants avec état d'erreur
 */
export interface ErrorProps {
  /** Message d'erreur à afficher */
  error?: string;
  /** Texte d'aide supplémentaire */
  helperText?: string;
}

/**
 * Props pour les composants avec icône
 */
export interface IconProps {
  /** Icône à afficher à gauche */
  leftIcon?: ReactNode;
  /** Icône à afficher à droite */
  rightIcon?: ReactNode;
  /** Icône personnalisée */
  icon?: ReactNode;
}

/**
 * Props pour les composants avec état de chargement
 */
export interface LoadingProps {
  /** Indique si le composant est en état de chargement */
  loading?: boolean;
}

/**
 * Props pour les composants avec état désactivé
 */
export interface DisabledProps {
  /** Indique si le composant est désactivé */
  disabled?: boolean;
}

/**
 * Props pour les composants avec largeur complète
 */
export interface FullWidthProps {
  /** Indique si le composant doit prendre toute la largeur disponible */
  fullWidth?: boolean;
}

/**
 * Props pour les composants avec titre
 */
export interface TitleProps {
  /** Titre du composant */
  title?: string;
}

/**
 * Props pour les composants avec action de fermeture
 */
export interface ClosableProps {
  /** Callback appelé lors de la fermeture */
  onClose?: () => void;
}

/**
 * Mapping des couleurs pour les variants
 * Utilisé pour générer les classes Tailwind de manière cohérente
 */
export const colorVariantMap: Record<
  ColorVariant,
  {
    bg: string;
    text: string;
    border: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
  }
> = {
  default: {
    bg: 'bg-muted',
    text: 'text-foreground',
    border: 'border-border',
    darkBg: 'dark:bg-muted',
    darkText: 'dark:text-foreground',
    darkBorder: 'dark:border-border',
  },
  success: {
    bg: 'bg-success-50',
    text: 'text-success-800',
    border: 'border-success-200',
    darkBg: 'dark:bg-success-900/30',
    darkText: 'dark:text-success-300',
    darkBorder: 'dark:border-success-700',
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-800',
    border: 'border-warning-200',
    darkBg: 'dark:bg-warning-900/30',
    darkText: 'dark:text-warning-300',
    darkBorder: 'dark:border-warning-700',
  },
  error: {
    bg: 'bg-error-50',
    text: 'text-error-800',
    border: 'border-error-200',
    darkBg: 'dark:bg-error-900/30',
    darkText: 'dark:text-error-300',
    darkBorder: 'dark:border-error-700',
  },
  info: {
    bg: 'bg-info-50',
    text: 'text-info-800',
    border: 'border-info-200',
    darkBg: 'dark:bg-info-900/30',
    darkText: 'dark:text-info-300',
    darkBorder: 'dark:border-info-700',
  },
};

/**
 * Mapping des tailles pour les composants (Revamp UI)
 */
export const sizeMap: Record<
  Size,
  {
    padding: string;
    text: string;
  }
> = {
  xs: {
    padding: 'px-3 py-1.5',
    text: 'text-xs',
  },
  sm: {
    padding: 'px-4 py-2',
    text: 'text-sm',
  },
  md: {
    padding: 'px-6 py-3',
    text: 'text-sm',
  },
  lg: {
    padding: 'px-8 py-4',
    text: 'text-base',
  },
  xl: {
    padding: 'px-10 py-5',
    text: 'text-lg',
  },
};
