/**
 * Theme Types
 * TypeScript types for theme configuration
 */

export interface ThemeConfig {
  // Couleurs principales
  primary: string;
  secondary: string;
  danger: string;
  warning: string;
  info: string;

  // Typographie - Polices
  fontFamily: string;
  fontFamilyHeading: string;
  fontFamilySubheading: string;

  // Typographie - Couleurs de texte
  textHeading: string;
  textSubheading: string;
  textBody: string;
  textSecondary: string;
  textLink: string;

  // Couleurs d'erreur et validation
  errorColor: string;
  errorBg: string;
  successColor: string;
  successBg: string;

  // Style
  borderRadius: string;
}
