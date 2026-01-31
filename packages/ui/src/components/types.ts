/**
 * Types communs pour les composants UI
 */

import { ReactNode, HTMLAttributes } from 'react';

/**
 * Variants de couleur communs pour les composants
 */
export type ColorVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Variants pour les Alertes
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Variants de style pour les boutons
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'error';

/**
 * Tailles communes pour les composants
 */
export type Size = 'sm' | 'md' | 'lg';

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
 * Mapping des tailles pour les composants
 */
export const sizeMap: Record<
  Size,
  {
    padding: string;
    text: string;
  }
> = {
  sm: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
  },
  md: {
    padding: 'px-4 py-2',
    text: 'text-base',
  },
  lg: {
    padding: 'px-6 py-3',
    text: 'text-lg',
  },
};
